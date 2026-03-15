// src/pages/LoginPage.jsx — Enhanced
// Enhancements:
// - Dot-grid CSS background replacing plain blobs
// - Staggered entrance animation on each card section
// - Feature pills auto-scroll carousel (no click needed)
// - Social proof "X analyses today" ticker (synthetic)
// - Typewriter speed tuned, wider tagline pool
// - Google/GitHub buttons with micro-hover lift + glow
// - Login card glassmorphism subtle upgrade
// - Theme toggle with smooth icon fade
// - "Press Enter to continue with Google" hint on mount
// - Floating code snippets fade in progressively

import { useState, useEffect, useRef } from "react";
import { useTheme } from "../utils/ThemeContext";
import { signInWithGoogle, signInWithGitHub } from "../utils/supabase";

const CODE_SNIPPETS = [
  "vector<int> twoSum(vector<int>& nums, int target)",
  "def two_sum(nums: list, target: int) -> list[int]:",
  "class Shape { virtual double area() = 0; };",
  "class Circle : public Shape { double r; };",
  "unordered_map<int,int> mp;",
  "for(int i=0;i<n-1;i++) for(int j=0;j<n-i-1;j++)",
  "if target - num in seen: return [seen[target-num], i]",
  "dp[i] = max(dp[i-1] + nums[i], nums[i]);",
  "dp[i][j] = dp[i-1][j] + dp[i][j-1];",
  "priority_queue<pair<int,int>> pq;",
  "class Node { public: int val; Node* next; };",
  "int mid = left + (right - left) / 2;",
  "while(left <= right) { mid = (left+right)/2; }",
  "stack<int> st; for(auto c : s) st.push(c);",
  "return left == right ? nums[left] : merge(l,r);",
  "template<typename T> class ResultCache {};",
  "virtual ~Analyzer() {} // virtual destructor",
  "graph[u].push_back(v); graph[v].push_back(u);",
  "queue<int> q; q.push(src); visited[src]=true;",
  "def dfs(node, visited): visited.add(node)",
];

const TAGLINES = [
  "Debug your thinking, not just your code.",
  "Learn DSA like you actually understand it.",
  "Every algorithm has a story. Let AI tell yours.",
  "From brute force to optimal — one click.",
  "C++ or Python. Your choice. AI explains both.",
  "Turn confusion into clarity, one problem at a time.",
  "The best DSA tutor that never sleeps.",
];

const SNIPPET_POSITIONS = [
  { top: "4%",  left: "1%"   }, { top: "10%", right: "2%"  },
  { top: "20%", left: "0%"   }, { top: "32%", right: "1%"  },
  { top: "44%", left: "2%"   }, { top: "55%", right: "3%"  },
  { top: "66%", left: "1%"   }, { top: "76%", right: "2%"  },
  { top: "86%", left: "3%"   }, { bottom: "4%", left: "1%" },
  { top: "15%", left: "40%"  },
];

const FEATURES = [
  { icon: "🧩", label: "LeetCode AI",   color: "#f59e0b" },
  { icon: "🔷", label: "OOP Tutor",     color: "#06b6d4" },
  { icon: "📊", label: "Algo Viz",      color: "#a855f7" },
  { icon: "⚔️", label: "Race Mode",    color: "#f87171" },
  { icon: "🎯", label: "AI Quiz",       color: "#10b981" },
  { icon: "📥", label: "PDF Export",    color: "#2dd4bf" },
  { icon: "📚", label: "Cheat Sheets",  color: "#818cf8" },
  { icon: "🏆", label: "Streak Track",  color: "#f59e0b" },
];

// ─── Typewriter ───────────────────────────────────────────────────────────────
function Typewriter({ texts, color }) {
  const [displayed, setDisplayed] = useState("");
  const [textIdx,   setTextIdx]   = useState(0);
  const [charIdx,   setCharIdx]   = useState(0);
  const [deleting,  setDeleting]  = useState(false);
  const ref = useRef();

  useEffect(() => {
    const curr = texts[textIdx];
    ref.current = setTimeout(() => {
      if (!deleting) {
        if (charIdx < curr.length) { setDisplayed(curr.slice(0, charIdx + 1)); setCharIdx(c => c + 1); }
        else setTimeout(() => setDeleting(true), 2000);
      } else {
        if (charIdx > 0) { setDisplayed(curr.slice(0, charIdx - 1)); setCharIdx(c => c - 1); }
        else { setDeleting(false); setTextIdx(i => (i + 1) % texts.length); }
      }
    }, deleting ? 28 : 48);
    return () => clearTimeout(ref.current);
  }, [charIdx, deleting, textIdx, texts]);

  return (
    <span style={{ color: color }}>
      {displayed}<span style={{ animation: "blink 1s step-end infinite" }}>|</span>
    </span>
  );
}

// ─── FadeIn wrapper ───────────────────────────────────────────────────────────
function FadeIn({ delay = 0, children }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{ opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(14px)", transition: `opacity .5s ease, transform .5s ease` }}>
      {children}
    </div>
  );
}

// ─── Social proof ticker ──────────────────────────────────────────────────────
function SocialProof({ C }) {
  const [count] = useState(() => 38 + Math.floor(Math.random() * 14));
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), 1200); return () => clearTimeout(t); }, []);
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: vis ? 1 : 0, transition: "opacity .5s ease", marginBottom: 6 }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, boxShadow: `0 0 6px ${C.green}`, animation: "pulse 2s ease infinite" }} />
      <span style={{ fontSize: 10, color: C.dim, fontFamily: "'JetBrains Mono',monospace" }}>
        <span style={{ color: C.green, fontWeight: 700 }}>{count}</span> analyses generated today
      </span>
    </div>
  );
}

// ─── Login button ─────────────────────────────────────────────────────────────
function LoginBtn({ onClick, disabled, loading, icon, label, C, primary }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "13px 16px", borderRadius: 11,
        border: primary ? "none" : `1px solid ${C.border}`,
        background: primary
          ? hov ? `linear-gradient(135deg,${C.accentL},${C.cyan})` : `linear-gradient(135deg,${C.accent},${C.accentL})`
          : hov ? C.card + "ee" : C.card,
        color: primary ? "#fff" : C.text,
        fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        transition: "all .2s",
        transform: hov && !disabled ? "translateY(-1px)" : "none",
        boxShadow: primary && hov ? `0 6px 24px ${C.accent}55` : "none",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {loading ? (
        <><div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${primary ? "#fff" : C.accentL}`, borderTopColor: "transparent", animation: "spin .7s linear infinite" }} />Connecting...</>
      ) : (
        <>{icon}{label}</>
      )}
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const { C, isDark, toggle } = useTheme();
  const [loading, setLoading] = useState("");
  const [error,   setError]   = useState("");
  const [snippetVis, setSnippetVis] = useState([]);

  // Stagger snippet appearances
  useEffect(() => {
    CODE_SNIPPETS.forEach((_, i) => {
      setTimeout(() => setSnippetVis(v => [...v, i]), i * 180 + 400);
    });
  }, []);

  // Enter key → Google login
  useEffect(() => {
    const handler = (e) => { if (e.key === "Enter" && !loading) handleGoogle(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [loading]);

  async function handleGoogle() {
    setLoading("google"); setError("");
    try { await signInWithGoogle(); }
    catch(e) { setError(e.message); setLoading(""); }
  }
  async function handleGitHub() {
    setLoading("github"); setError("");
    try { await signInWithGitHub(); }
    catch(e) { setError(e.message); setLoading(""); }
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", position: "relative", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Syne:wght@700;800&family=Orbitron:wght@700&family=Inter:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes blink       { 50%{opacity:0} }
        @keyframes float       { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes pulse-ring  { 0%{transform:scale(.95);opacity:.7} 100%{transform:scale(1.15);opacity:0} }
        @keyframes spin        { to{transform:rotate(360deg)} }
        @keyframes pulse       { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.85)} }
        @keyframes pill-scroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @media(max-width:480px){
          .login-stats{grid-template-columns:1fr 1fr 1fr !important}
        }
      `}</style>

      {/* ── Dot grid background ── */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        backgroundImage: `radial-gradient(circle, ${C.accentL}15 1px, transparent 1px)`,
        backgroundSize: "32px 32px",
        maskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
        WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
      }} />

      {/* ── Glow blobs ── */}
      <div style={{ position: "fixed", top: "12%", left: "50%", transform: "translateX(-50%)", width: 600, height: 600, background: C.accent + "22", borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "8%", left: "10%", width: 320, height: 320, background: C.cyan + "18", borderRadius: "50%", filter: "blur(60px)", pointerEvents: "none" }} />

      {/* ── Floating code snippets ── */}
      {CODE_SNIPPETS.map((s, i) => (
        <div key={i} style={{ position: "fixed", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.accentL + "45", whiteSpace: "nowrap", pointerEvents: "none", userSelect: "none", animation: `float ${4 + i * 0.35}s ease-in-out infinite`, animationDelay: `${i * 0.25}s`, opacity: snippetVis.includes(i) ? 1 : 0, transition: "opacity .8s ease", ...SNIPPET_POSITIONS[i % SNIPPET_POSITIONS.length] }}>
          {s}
        </div>
      ))}

      {/* ── Theme toggle ── */}
      <button onClick={toggle} style={{ position: "fixed", top: 16, right: 16, width: 36, height: 36, borderRadius: 9, border: `1px solid ${C.border}`, background: C.surface, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, transition: "all .2s" }}>
        {isDark ? "☀️" : "🌙"}
      </button>

      {/* ── Content ── */}
      <div style={{ width: "100%", maxWidth: 440, zIndex: 10, display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Logo */}
        <FadeIn delay={0}>
          <div style={{ textAlign: "center" }}>
            <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <div style={{ position: "absolute", width: 80, height: 80, borderRadius: "50%", border: `2px solid ${C.accentL}30`, animation: "pulse-ring 2s ease-out infinite" }} />
              <div style={{ position: "absolute", width: 80, height: 80, borderRadius: "50%", border: `2px solid ${C.accentL}18`, animation: "pulse-ring 2s ease-out infinite", animationDelay: ".6s" }} />
              <div style={{ width: 60, height: 60, borderRadius: 16, background: `linear-gradient(135deg,${C.accent},${C.cyan})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, boxShadow: `0 0 40px ${C.accent}50` }}>⬡</div>
            </div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 36, fontWeight: 800, color: C.accentL, letterSpacing: 3, marginBottom: 6 }}>
              CODEVIS
            </div>
            <SocialProof C={C} />
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: C.dim, minHeight: 22 }}>
              <Typewriter texts={TAGLINES} color={C.accentL} />
            </div>
          </div>
        </FadeIn>

        {/* Feature pills — scrolling marquee */}
        <FadeIn delay={150}>
          <div style={{ overflow: "hidden", maskImage: "linear-gradient(90deg,transparent,black 8%,black 92%,transparent)" }}>
            <div style={{ display: "flex", gap: 8, animation: "pill-scroll 18s linear infinite", width: "max-content" }}>
              {[...FEATURES, ...FEATURES].map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, background: p.color + "0f", border: `1px solid ${p.color}30`, borderRadius: 20, padding: "5px 12px", flexShrink: 0 }}>
                  <span style={{ fontSize: 12 }}>{p.icon}</span>
                  <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: p.color, fontWeight: 700, whiteSpace: "nowrap" }}>{p.label}</span>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Stats */}
        <FadeIn delay={260}>
          <div className="login-stats" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {[
              { icon: "🤖", value: "AI",     label: "Powered"     },
              { icon: "🌐", value: "C++/Py", label: "Languages"   },
              { icon: "🌐", value: "OSS",    label: "Open Source" },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: "center", padding: "12px 8px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12 }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 16, fontWeight: 700, color: C.accentL, marginBottom: 2 }}>{s.value}</div>
                <div style={{ fontSize: 10, color: C.muted, fontFamily: "'JetBrains Mono',monospace" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* Login card */}
        <FadeIn delay={380}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, padding: "24px 24px", display: "flex", flexDirection: "column", gap: 12, boxShadow: `0 0 60px ${C.glow}, 0 4px 24px rgba(0,0,0,.18)`, backdropFilter: "blur(12px)" }}>
            <div style={{ textAlign: "center", marginBottom: 4 }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 4 }}>Get Started — It's Free</div>
              <div style={{ fontSize: 11, color: C.text, fontFamily: "'JetBrains Mono',monospace", lineHeight: 1.9, opacity: 0.85 }}>
                ⚔️ Battle friends · 🌳 Visualize algos · 🎯 AI Quiz
              </div>
            </div>

            <LoginBtn
              onClick={handleGoogle}
              disabled={!!loading}
              loading={loading === "google"}
              C={C}
              primary={true}
              icon={
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
              }
              label="Continue with Google"
            />

            <LoginBtn
              onClick={handleGitHub}
              disabled={!!loading}
              loading={loading === "github"}
              C={C}
              primary={false}
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill={C.text}>
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                </svg>
              }
              label="Continue with GitHub"
            />

            {error && (
              <div style={{ background: C.red + "0f", border: `1px solid ${C.red}35`, borderRadius: 8, padding: "9px 12px", color: C.red, fontSize: 11, fontFamily: "'JetBrains Mono',monospace", textAlign: "center" }}>
                ⚠ {error}
              </div>
            )}

            {/* Enter hint */}
            {!loading && (
              <div style={{ textAlign: "center", fontSize: 9, color: C.text, fontFamily: "'JetBrains Mono',monospace", opacity: 0.8 }}>
                Press <kbd style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 3, padding: "0 4px", fontSize: 9 }}>Enter</kbd> to continue with Google
              </div>
            )}

            <div style={{ textAlign: "center", fontSize: 10, color: C.text, fontFamily: "'JetBrains Mono',monospace", lineHeight: 1.8, borderTop: `1px solid ${C.border}`, paddingTop: 12, opacity: 0.85 }}>
              Analyze &nbsp;·&nbsp; Visualize &nbsp;·&nbsp; Conquer ⚔️
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}