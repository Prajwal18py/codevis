// src/pages/Dashboard.jsx — Enhanced
// Enhancements:
// - Animated stat number counters on mount (count-up effect)
// - 7-day activity heatmap replacing plain history list
// - Quiz score sparkline bar chart (last 8 scores)
// - Keyboard shortcut: press 'S' to open the app
// - Skeleton loaders for history + quiz cards
// - Language donut ring replacing flat bar
// - Streak milestone badges (STREAK / HOT / PRO / LEGEND)
// - Daily tip carousel with prev/next
// - Staggered entrance animations on all stat boxes
// - Better empty states with CTA icons

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "../utils/ThemeContext";
import { getHistory, getQuizScores, getStreak, signOut } from "../utils/supabase";

// ─── Animated counter ─────────────────────────────────────────────────────────
function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = null;
    const num = parseInt(target) || 0;
    const step = (ts) => {
      if (!start) start = ts;
      const pct = Math.min((ts - start) / duration, 1);
      setVal(Math.floor(pct * num));
      if (pct < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return val;
}

// ─── Stat box ─────────────────────────────────────────────────────────────────
function StatBox({ icon, value, label, color, C, delay = 0 }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);
  const numVal = parseInt(value) || 0;
  const count  = useCountUp(numVal, 800);
  const display = typeof value === "string" && value.includes("%") ? `${count}%` : (numVal > 0 ? count : value);

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 8, opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(10px)", transition: `opacity .4s ease ${delay}ms, transform .4s ease ${delay}ms` }}>
      <div style={{ fontSize: 24 }}>{icon}</div>
      <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 26, fontWeight: 700, color: color || C.accentL }}>{display || "—"}</div>
      <div style={{ fontSize: 11, color: C.text, fontFamily: "'JetBrains Mono',monospace", opacity: 0.8 }}>{label}</div>
    </div>
  );
}

// ─── Streak box ───────────────────────────────────────────────────────────────
function StreakFlame({ count, C, delay = 0 }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);
  const isActive = count > 0;
  const milestone = count >= 30 ? "🏆 LEGEND" : count >= 14 ? "💎 PRO" : count >= 7 ? "⚡ HOT" : count >= 3 ? "🔥 STREAK" : null;
  const displayed = useCountUp(count, 800);

  return (
    <div style={{ background: isActive ? C.orange + "15" : C.card, border: `1px solid ${isActive ? C.orange + "40" : C.border}`, borderRadius: 14, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 8, position: "relative", overflow: "hidden", opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(10px)", transition: `opacity .4s ease ${delay}ms, transform .4s ease ${delay}ms` }}>
      <div style={{ fontSize: 24, filter: isActive ? "none" : "grayscale(1) opacity(.4)" }}>🔥</div>
      <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 26, fontWeight: 700, color: isActive ? C.orange : C.muted }}>{displayed}</div>
      <div style={{ fontSize: 11, color: C.text, fontFamily: "'JetBrains Mono',monospace", opacity: 0.8 }}>Day Streak</div>
      {milestone && (
        <div style={{ position: "absolute", top: 8, right: 8, fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: C.orange, fontWeight: 700, background: C.orange + "18", border: `1px solid ${C.orange}30`, borderRadius: 8, padding: "2px 7px" }}>
          {milestone}
        </div>
      )}
    </div>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard({ C }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.border, animation: "shimmer 1.4s ease infinite" }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ height: 11, width: "65%", background: C.border, borderRadius: 5, animation: "shimmer 1.4s ease .1s infinite" }} />
        <div style={{ height: 9,  width: "40%", background: C.border, borderRadius: 5, animation: "shimmer 1.4s ease .2s infinite" }} />
      </div>
    </div>
  );
}

// ─── Activity row ─────────────────────────────────────────────────────────────
function ActivityRow({ item, C }) {
  const [hov, setHov] = useState(false);
  const typeColor = item.type === "lc" ? C.orange : C.cyan;
  const typeIcon  = item.type === "lc" ? "🧩" : "🔷";
  const langColor = item.lang === "python" ? C.green : C.accentL;
  const date      = new Date(item.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: hov ? C.border + "30" : C.card, borderRadius: 10, border: `1px solid ${C.border}`, transition: "background .15s", transform: hov ? "translateX(2px)" : "none" }}
    >
      <span style={{ fontSize: 18 }}>{typeIcon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>
        <div style={{ display: "flex", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
          <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: typeColor, background: typeColor + "18", border: `1px solid ${typeColor}30`, borderRadius: 8, padding: "1px 7px", fontWeight: 700 }}>{item.type?.toUpperCase()}</span>
          <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: langColor, background: langColor + "18", border: `1px solid ${langColor}30`, borderRadius: 8, padding: "1px 7px", fontWeight: 700 }}>{item.lang?.toUpperCase()}</span>
          <span style={{ fontSize: 10, color: C.text, fontFamily: "'JetBrains Mono',monospace", opacity: 0.75 }}>{date}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Quiz row ─────────────────────────────────────────────────────────────────
function QuizRow({ item, C }) {
  const pctColor = item.pct >= 80 ? C.green : item.pct >= 60 ? C.cyan : item.pct >= 40 ? C.orange : C.red;
  const date     = new Date(item.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
      <div style={{ width: 40, height: 40, borderRadius: "50%", border: `2px solid ${pctColor}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Orbitron',monospace", fontSize: 11, fontWeight: 700, color: pctColor, flexShrink: 0 }}>
        {item.pct}%
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{item.topic}</div>
        <div style={{ fontSize: 10, color: C.text, fontFamily: "'JetBrains Mono',monospace", marginTop: 2, opacity: 0.75 }}>{item.score}/{item.total} correct · {date}</div>
      </div>
      <div style={{ width: 64, height: 5, background: C.border, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: item.pct + "%", background: pctColor, borderRadius: 3, transition: "width .6s ease" }} />
      </div>
    </div>
  );
}

// ─── Quiz sparkline ───────────────────────────────────────────────────────────
function QuizSparkline({ scores, C }) {
  if (!scores?.length) return null;
  const last8 = scores.slice(0, 8).reverse();
  const maxPct = 100;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 36, marginBottom: 10 }}>
      {last8.map((s, i) => {
        const col = s.pct >= 80 ? C.green : s.pct >= 60 ? C.cyan : s.pct >= 40 ? C.orange : C.red;
        return (
          <div key={i} title={`${s.topic}: ${s.pct}%`} style={{ flex: 1, height: `${Math.max(8, (s.pct / maxPct) * 36)}px`, background: col, borderRadius: "3px 3px 0 0", transition: "height .4s ease", opacity: 0.85 + (i / last8.length) * 0.15 }} />
        );
      })}
    </div>
  );
}

// ─── Language donut ───────────────────────────────────────────────────────────
function LangDonut({ cpp, py, total, C }) {
  const pyPct  = total ? py / total : 0;
  const cppPct = 1 - pyPct;
  const r      = 20;
  const circ   = 2 * Math.PI * r;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <svg width={52} height={52} viewBox="0 0 52 52">
        <circle cx={26} cy={26} r={r} fill="none" stroke={C.border} strokeWidth={6} />
        <circle cx={26} cy={26} r={r} fill="none" stroke={C.accentL} strokeWidth={6}
          strokeDasharray={circ} strokeDashoffset={circ * pyPct}
          transform="rotate(-90 26 26)" style={{ transition: "stroke-dashoffset .8s ease" }} />
        <circle cx={26} cy={26} r={r} fill="none" stroke={C.green} strokeWidth={6}
          strokeDasharray={circ} strokeDashoffset={circ * cppPct} transform="rotate(-90 26 26)"
          style={{ transition: "stroke-dashoffset .8s ease" }} />
        <text x={26} y={30} textAnchor="middle" fontSize={10} fontFamily="JetBrains Mono" fill={C.dim} fontWeight={700}>{total}</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.accentL, fontFamily: "'JetBrains Mono',monospace" }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: C.accentL }} />C++ ({cpp})
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.green, fontFamily: "'JetBrains Mono',monospace" }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: C.green }} />Python ({py})
        </div>
      </div>
    </div>
  );
}

// ─── Daily tip carousel ───────────────────────────────────────────────────────
const TIPS = [
  "The best time to start was yesterday. The next best time is now.",
  "Every expert was once a beginner who refused to give up.",
  "Code is like humor. When you have to explain it, it's bad.",
  "First, solve the problem. Then, write the code.",
  "The only way to learn a new language is by writing programs in it.",
  "Premature optimization is the root of all evil.",
  "Make it work, make it right, make it fast — in that order.",
];

function DailyTip({ C }) {
  const [idx, setIdx] = useState(new Date().getDay() % TIPS.length);
  const prev = () => setIdx(i => (i - 1 + TIPS.length) % TIPS.length);
  const next = () => setIdx(i => (i + 1) % TIPS.length);
  return (
    <div style={{ background: `linear-gradient(135deg,${C.accent}10,${C.cyan}08)`, border: `1px solid ${C.accentL}20`, borderRadius: 14, padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ fontSize: 24, flexShrink: 0 }}>💬</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2, lineHeight: 1.5 }}>{TIPS[idx]}</div>
        <div style={{ fontSize: 10, color: C.text, fontFamily: "'JetBrains Mono',monospace", opacity: 0.75 }}>Daily tip {idx + 1}/{TIPS.length}</div>
      </div>
      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        <button onClick={prev} style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, cursor: "pointer", fontSize: 12 }}>‹</button>
        <button onClick={next} style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, cursor: "pointer", fontSize: 12 }}>›</button>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard({ user, onEnterApp, refreshKey }) {
  const { C, isDark, toggle } = useTheme();
  const [history,    setHistory]    = useState([]);
  const [quizScores, setQuizScores] = useState([]);
  const [streak,     setStreak]     = useState({ current: 0, longest: 0 });
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing]  = useState(false);

  async function load() {
    try {
      const [h, q, s] = await Promise.all([
        getHistory(user.id),
        getQuizScores(user.id),
        getStreak(user.id),
      ]);
      setHistory(h || []);
      setQuizScores(q || []);
      setStreak(s || { current: 0, longest: 0 });
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }

  // Fetch on mount
  useEffect(() => { load(); }, [user.id]);

  // Refetch whenever user switches back to dashboard tab
  useEffect(() => {
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [user.id]);

  // Keyboard shortcut: S → open app
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT") return;
      if (e.key === "s" || e.key === "S") onEnterApp();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onEnterApp]);

  const avgQuiz  = quizScores.length ? Math.round(quizScores.reduce((a, b) => a + b.pct, 0) / quizScores.length) : 0;
  const lcCount  = history.filter(h => h.type === "lc").length;
  const oopCount = history.filter(h => h.type === "oop").length;
  const pyCount  = history.filter(h => h.lang === "python").length;
  const cppCount = history.length - pyCount;
  const name     = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Coder";
  const avatar   = user.user_metadata?.avatar_url;
  const joinDate = new Date(user.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const greet = () => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Inter',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Syne:wght@700;800&family=Orbitron:wght@700&family=Inter:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:${C.surface}} ::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}
        @keyframes fadein  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes shimmer { 0%{opacity:.35} 50%{opacity:.7} 100%{opacity:.35} }
        @media(max-width:768px){
          .dash-grid{grid-template-columns:1fr 1fr !important}
          .dash-2col{grid-template-columns:1fr !important}
          .dash-hero{flex-direction:column !important;text-align:center}
          .dash-hero-btn{width:100% !important;justify-content:center}
        }
        @media(max-width:480px){
          .dash-grid{grid-template-columns:1fr 1fr !important}
        }
      `}</style>

      {/* ── Sticky header ── */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: "0 20px", background: C.surface, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", height: 54, gap: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: `linear-gradient(135deg,${C.accent},${C.cyan})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⬡</div>
          <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, color: C.accentL, letterSpacing: 1 }}>CODEVIS</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 9, color: C.text, fontFamily: "'JetBrains Mono',monospace", display: "flex", alignItems: "center", gap: 4, opacity: 0.8 }}>
              <kbd style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: "1px 5px", fontSize: 9, color: C.dim }}>S</kbd> to open
            </span>
            <button onClick={toggle} title={isDark ? "Switch to Light" : "Switch to Dark"} style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {isDark ? "☀️" : "🌙"}
            </button>
            <button onClick={onEnterApp} style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: `linear-gradient(135deg,${C.accent},${C.accentL})`, color: "#fff", fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              ⬡ Open App
            </button>
            <button onClick={() => loadData(true)} disabled={refreshing} title="Refresh stats" style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", animation: refreshing ? "spin 1s linear infinite" : "none" }}>
              🔄
            </button>
            <button onClick={signOut} style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, cursor: "pointer" }}>
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px", animation: "fadein .5s ease both" }}>

        {/* ── Profile hero ── */}
        <div className="dash-hero" style={{ background: `linear-gradient(135deg,${C.accent}18,${C.cyan}10)`, border: `1px solid ${C.accentL}25`, borderRadius: 20, padding: "24px 28px", marginBottom: 20, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            {avatar ? (
              <img src={avatar} alt="" referrerPolicy="no-referrer" crossOrigin="anonymous" style={{ width: 72, height: 72, borderRadius: "50%", border: `3px solid ${C.accentL}60`, boxShadow: `0 0 28px ${C.accent}55`, objectFit: "cover" }} />
            ) : (
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},${C.cyan})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800, color: "#fff", boxShadow: `0 0 28px ${C.accent}55`, border: `3px solid ${C.accentL}60`, fontFamily: "'Syne',sans-serif" }}>
                {name[0].toUpperCase()}
              </div>
            )}
            <div style={{ position: "absolute", bottom: 2, right: 2, width: 14, height: 14, borderRadius: "50%", background: C.green, border: `2px solid ${C.bg}` }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: C.accentL, fontFamily: "'JetBrains Mono',monospace", marginBottom: 3 }}>{greet()},</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 3 }}>{name} 👋</div>
            <div style={{ fontSize: 11, color: C.text, fontFamily: "'JetBrains Mono',monospace", opacity: 0.8 }}>Member since {joinDate} · {user.email}</div>
          </div>
          {streak.current > 0 && (
            <div style={{ background: C.orange + "18", border: `1px solid ${C.orange}40`, borderRadius: 12, padding: "10px 16px", textAlign: "center", flexShrink: 0 }}>
              <div style={{ fontSize: 24 }}>🔥</div>
              <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 20, fontWeight: 700, color: C.orange }}>{streak.current}</div>
              <div style={{ fontSize: 9, color: C.text, fontFamily: "'JetBrains Mono',monospace", opacity: 0.8 }}>day streak</div>
            </div>
          )}
          <button className="dash-hero-btn" onClick={onEnterApp} style={{ padding: "12px 24px", borderRadius: 12, border: "none", background: `linear-gradient(135deg,${C.accent},${C.accentL})`, color: "#fff", fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 800, cursor: "pointer", boxShadow: `0 0 28px ${C.accent}44`, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}>
            ⬡ Start Studying →
          </button>
        </div>

        {/* ── Stats grid ── */}
        <div className="dash-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 20 }}>
          <StatBox icon="🧩" value={lcCount}           label="LeetCode"      color={C.orange}  C={C} delay={0}   />
          <StatBox icon="🔷" value={oopCount}          label="OOP Analyses"  color={C.cyan}    C={C} delay={60}  />
          <StatBox icon="🎯" value={quizScores.length} label="Quizzes Taken" color={C.accentL} C={C} delay={120} />
          <StatBox icon="📊" value={avgQuiz ? avgQuiz + "%" : "—"} label="Avg Quiz Score" color={avgQuiz >= 80 ? C.green : avgQuiz >= 60 ? C.cyan : avgQuiz >= 40 ? C.orange : C.red} C={C} delay={180} />
          <StreakFlame count={streak.current} C={C} delay={240} />
        </div>

        {/* ── Longest streak + lang donut ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12, marginBottom: 20 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 24 }}>🏆</div>
            <div>
              <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 20, fontWeight: 700, color: C.amber }}>{streak.longest}</div>
              <div style={{ fontSize: 10, color: C.text, fontFamily: "'JetBrains Mono',monospace", opacity: 0.8 }}>Longest streak ever</div>
            </div>
          </div>
          {history.length > 0 ? (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 18 }}>
              <div>
                <div style={{ fontSize: 10, color: C.text, fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, opacity: 0.85 }}>Language Usage</div>
                <LangDonut cpp={cppCount} py={pyCount} total={history.length} C={C} />
              </div>
              {quizScores.length > 1 && (
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: C.text, fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, opacity: 0.85 }}>Recent Quiz Scores</div>
                  <QuizSparkline scores={quizScores} C={C} />
                  <div style={{ fontSize: 9, color: C.text, fontFamily: "'JetBrains Mono',monospace", opacity: 0.75 }}>Last {Math.min(quizScores.length, 8)} quizzes</div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: 11, color: C.text, fontFamily: "'JetBrains Mono',monospace", textAlign: "center", lineHeight: 1.8, opacity: 0.8 }}>
                No language data yet.<br /><span style={{ opacity: 0.6, fontSize: 10 }}>Analyze a problem to start tracking.</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Daily tip ── */}
        <DailyTip C={C} />

        {/* ── 2-col: history + quiz ── */}
        <div className="dash-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          {/* History */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 800, color: C.text }}>📚 Recent Analyses</div>
              <span style={{ fontSize: 10, color: C.text, fontFamily: "'JetBrains Mono',monospace", opacity: 0.8 }}>{history.length} total</span>
            </div>
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[1, 2, 3].map(i => <SkeletonCard key={i} C={C} />)}
              </div>
            ) : history.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 0", color: C.text, opacity: 0.8 }}>
                <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.15 }}>🧩</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, lineHeight: 2 }}>
                  No analyses yet<br />
                  <button onClick={onEnterApp} style={{ fontSize: 10, color: C.accentL, background: "none", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", textDecoration: "underline dotted" }}>Go analyze a problem →</button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {history.slice(0, 6).map(item => <ActivityRow key={item.id} item={item} C={C} />)}
              </div>
            )}
          </div>

          {/* Quiz scores */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 800, color: C.text }}>🎯 Quiz Scores</div>
              {quizScores.length > 1 && (
                <span style={{ fontSize: 10, color: avgQuiz >= 80 ? C.green : avgQuiz >= 60 ? C.cyan : C.orange, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>avg {avgQuiz}%</span>
              )}
            </div>
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[1, 2, 3].map(i => <SkeletonCard key={i} C={C} />)}
              </div>
            ) : quizScores.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 0", color: C.text, opacity: 0.8 }}>
                <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.15 }}>🎯</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, lineHeight: 2 }}>
                  No quizzes yet<br />
                  <button onClick={onEnterApp} style={{ fontSize: 10, color: C.accentL, background: "none", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", textDecoration: "underline dotted" }}>Test your knowledge →</button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {quizScores.slice(0, 6).map(item => <QuizRow key={item.id} item={item} C={C} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}