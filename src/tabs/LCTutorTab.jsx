// src/tabs/LCTutorTab.jsx — Enhanced LeetCode Python-Tutor style explainer
// Enhancements: keyboard nav on stepper, progress ring, animated tab transitions,
// copy buttons on code, better empty states, approach expand animation, dry run highlight

import { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "../utils/ThemeContext";
import { Badge, DiffBadge, Section, CodeBlock } from "../components/UI";

// Strip AI-hallucinated HTML remnants like "kw"> from code strings
function cleanCode(str) {
  if (!str) return "";
  return str
    .replace(/<[^>]+>/g, "")
    .replace(/"[a-zA-Z-]+">/g, "")
    .replace(/class="[^"]*">/g, "")
    .replace(/&lt;[^&]*&gt;/g, "")
    .replace(/">/g, "");
}


// ─── Copy button ─────────────────────────────────────────────────────────────
function CopyButton({ text, style = {} }) {
  const { C } = useTheme();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  };
  return (
    <button onClick={copy} style={{
      position: "absolute", top: 7, right: 7,
      background: copied ? C.green + "22" : C.surface,
      border: `1px solid ${copied ? C.green + "55" : C.border}`,
      borderRadius: 6, padding: "3px 8px",
      fontSize: 9, color: copied ? C.green : C.muted,
      fontFamily: "'JetBrains Mono',monospace", cursor: "pointer",
      transition: "all .2s", ...style,
    }}>
      {copied ? "✓ copied" : "copy"}
    </button>
  );
}

// ─── Progress ring ────────────────────────────────────────────────────────────
function ProgressRing({ cur, total, size = 34, color }) {
  const { C } = useTheme();
  const r = size / 2 - 3;
  const circ = 2 * Math.PI * r;
  const pct = total > 1 ? cur / (total - 1) : 1;
  const col = color || C.accentL;
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={2.5} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={2.5}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: "stroke-dashoffset .35s ease", filter: `drop-shadow(0 0 3px ${col})` }} />
      <text x={size/2} y={size/2+4} textAnchor="middle" fontSize={9}
        fontFamily="JetBrains Mono" fill={col} fontWeight={700}>
        {cur+1}/{total}
      </text>
    </svg>
  );
}

// ─── Logic stepper ────────────────────────────────────────────────────────────
function LogicStepper({ steps }) {
  const { C } = useTheme();
  const [cur, setCur] = useState(0);
  const containerRef = useRef(null);

  const go = useCallback((dir) => {
    setCur(c => Math.max(0, Math.min(steps.length - 1, c + dir)));
  }, [steps.length]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); go(1); }
      if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   { e.preventDefault(); go(-1); }
      if (e.key === "Home") { e.preventDefault(); setCur(0); }
      if (e.key === "End")  { e.preventDefault(); setCur(steps.length - 1); }
    };
    el.addEventListener("keydown", handler);
    return () => el.removeEventListener("keydown", handler);
  }, [go, steps.length]);

  if (!steps?.length) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:160, gap:10 }}>
        <div style={{ fontSize:30, opacity:0.12 }}>🧠</div>
        <div style={{ color:C.muted, fontSize:12, fontFamily:"'JetBrains Mono',monospace" }}>No logic steps available.</div>
      </div>
    );
  }

  const s = steps[cur];

  return (
    <div ref={containerRef} tabIndex={0} style={{ outline:"none" }}>
      <style>{`@keyframes fadeSlideIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:none } }`}</style>

      {/* Dot nav + ring */}
      <div style={{ display:"flex", gap:5, marginBottom:12, flexWrap:"wrap", alignItems:"center" }}>
        {steps.map((_, i) => (
          <div key={i} onClick={() => setCur(i)} title={`Step ${i+1}`} style={{
            width:26, height:26, borderRadius:"50%",
            background: i===cur ? `linear-gradient(135deg,${C.accent},${C.cyan})` : i<cur ? C.green+"22" : C.surface,
            border:`1.5px solid ${i===cur ? C.accentL : i<cur ? C.green : C.border}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:10, fontWeight:700,
            color: i===cur ? "#fff" : i<cur ? C.green : C.muted,
            cursor:"pointer", transition:"all .2s",
            boxShadow: i===cur ? `0 0 10px ${C.accentL}55` : "none",
          }}>
            {i < cur ? "✓" : i+1}
          </div>
        ))}
        <div style={{ marginLeft:"auto" }}>
          <ProgressRing cur={cur} total={steps.length} />
        </div>
      </div>

      {/* Active step card */}
      <div key={cur} style={{ background:C.surface, borderRadius:12, border:`1px solid ${C.accentL}30`, padding:16, marginBottom:10, animation:"fadeSlideIn .22s ease" }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:800, color:C.accentL, marginBottom:10 }}>
          Step {s.step}: {s.title}
        </div>

        {s.code_line && (
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:9, color:C.cyan, fontFamily:"'JetBrains Mono',monospace", textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>📍 Code line</div>
            <div style={{ position:"relative" }}>
              <pre style={{ background:"#0a0a12", border:`1px solid ${C.cyan}35`, borderLeft:`3px solid ${C.cyan}`, borderRadius:8, padding:"8px 36px 8px 12px", fontSize:12, color:C.cyan, fontFamily:"'JetBrains Mono',monospace", margin:0, overflowX:"auto" }}>
                {cleanCode(s.code_line)}
              </pre>
              <CopyButton text={cleanCode(s.code_line)} />
            </div>
          </div>
        )}

        <div style={{ fontSize:13, color:C.text, lineHeight:1.8, marginBottom:s.analogy||s.what_changes?10:0 }}>
          {s.explanation}
        </div>

        {s.analogy && (
          <div style={{ background:C.orange+"0c", border:`1px solid ${C.orange}28`, borderRadius:8, padding:"8px 11px", marginBottom:s.what_changes?8:0, fontSize:12, color:C.orange, lineHeight:1.65 }}>
            🟠 <strong>Think of it like:</strong> {s.analogy}
          </div>
        )}

        {s.what_changes && (
          <div style={{ background:C.green+"0c", border:`1px solid ${C.green}25`, borderRadius:8, padding:"8px 11px", fontSize:12, color:C.green, lineHeight:1.65 }}>
            📦 <strong>What changes:</strong> {s.what_changes}
          </div>
        )}
      </div>

      {/* Nav */}
      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        <button onClick={() => go(-1)} disabled={cur===0} style={{ flex:1, padding:"7px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:cur===0?C.muted:C.text, cursor:cur===0?"not-allowed":"pointer", fontSize:12, transition:"all .15s" }}>← Prev</button>
        <span style={{ fontSize:10, color:C.dim, fontFamily:"'JetBrains Mono',monospace", whiteSpace:"nowrap" }}>↑↓ keys</span>
        <button onClick={() => go(1)} disabled={cur===steps.length-1} style={{ flex:1, padding:"7px", borderRadius:8, border:`1px solid ${C.accentL}50`, background:C.accentL+"12", color:cur===steps.length-1?C.muted:C.accentL, cursor:cur===steps.length-1?"not-allowed":"pointer", fontSize:12, fontWeight:700, transition:"all .15s" }}>Next →</button>
      </div>
    </div>
  );
}

// ─── Approach card ────────────────────────────────────────────────────────────
function ApproachCard({ ap, index }) {
  const { C } = useTheme();
  const [open, setOpen] = useState(false);
  const col = index === 0 ? C.red : C.green;
  return (
    <div style={{ background:C.surface, borderRadius:12, border:`1px solid ${col}28`, marginBottom:12, overflow:"hidden", transition:"border-color .2s" }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", cursor:"pointer", background:col+"08", transition:"background .15s" }}
      >
        <div style={{ width:24, height:24, borderRadius:"50%", background:col+"20", border:`1px solid ${col}50`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:col, fontWeight:800, flexShrink:0 }}>
          {index===0 ? "⊘" : "★"}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:800, color:col }}>{ap.name}</div>
        </div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          <Badge color={col} size={10}>Time: {ap.time}</Badge>
          <Badge color={col} size={10}>Space: {ap.space}</Badge>
        </div>
        <span style={{ color:C.muted, fontSize:10, transform:open?"rotate(90deg)":"rotate(0deg)", transition:"transform .2s", flexShrink:0 }}>▶</span>
      </div>

      {open && (
        <div style={{ padding:"14px", animation:"fadeSlideIn .18s ease" }}>
          <div style={{ fontSize:13, color:C.text, lineHeight:1.8, marginBottom:12 }}>{ap.plain_explanation}</div>

          {(ap.why_slow || ap.why_fast) && (
            <div style={{ background:col+"0c", border:`1px solid ${col}25`, borderRadius:8, padding:"8px 11px", marginBottom:12, fontSize:12, color:col, lineHeight:1.65 }}>
              {index===0 ? "🐢 Why slow: "+ap.why_slow : "⚡ Why fast: "+ap.why_fast}
            </div>
          )}

          {ap.code && (
            <div>
              <div style={{ fontSize:9, color:C.cyan, fontFamily:"'JetBrains Mono',monospace", textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>💻 Full C++ Code</div>
              <div style={{ position:"relative" }}>
                <CodeBlock code={ap.code} />
                <CopyButton text={ap.code} style={{ top:9, right:9 }} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────
export default function LCTutorTab({ result }) {
  const { C } = useTheme();
  const [tab, setTab] = useState("logic");

  if (!result) return null;

  const tabs = [
    { id:"logic",    label:"🧠 Logic Steps"    },
    { id:"approach", label:"💻 Code & Approach" },
    { id:"dryrun",   label:"▶ Dry Run"          },
    { id:"insights", label:"💡 Tips"            },
  ];

  const usedApproachCount = result.approaches?.length || 0;
  const dryRunCount = result.dry_run_steps?.length || 0;
  const insightCount = (result.key_insights?.length || 0) + (result.common_mistakes?.length || 0);

  const tabBadge = { approach: usedApproachCount, dryrun: dryRunCount, insights: insightCount };

  return (
    <div>
      <style>{`
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:none } }
        @keyframes tabFadeIn   { from { opacity:0; transform:translateX(6px) } to { opacity:1; transform:none } }
      `}</style>

      {/* Problem header */}
      <div style={{ background:C.surface, borderRadius:10, padding:"12px 14px", marginBottom:14, border:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:6 }}>
          <span style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:800, color:C.text }}>{result.problem_name}</span>
          {result.difficulty && <DiffBadge d={result.difficulty} />}
          {result.leetcode_pattern && <Badge color={C.orange}>{result.leetcode_pattern}</Badge>}
        </div>
        {result.topic_tags?.length > 0 && (
          <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
            {result.topic_tags.map((t, i) => <Badge key={i} color={C.blue} size={10}>{t}</Badge>)}
          </div>
        )}
      </div>

      {/* Core intuition */}
      {result.core_intuition && (
        <div style={{ background:C.accentL+"0c", border:`1px solid ${C.accentL}28`, borderRadius:10, padding:"12px 14px", marginBottom:14 }}>
          <div style={{ fontSize:10, color:C.accentL, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>💡 Core Intuition</div>
          <div style={{ fontSize:13, color:C.text, lineHeight:1.8 }}>{result.core_intuition}</div>
        </div>
      )}

      {/* Tab bar with count badges */}
      <div style={{ display:"flex", gap:3, background:C.surface, borderRadius:9, padding:3, border:`1px solid ${C.border}`, marginBottom:14 }}>
        {tabs.map(t => {
          const count = tabBadge[t.id];
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex:1, padding:"7px 4px", borderRadius:7, border:"none",
              background: tab===t.id ? C.card : "transparent",
              color: tab===t.id ? C.accentL : C.muted,
              fontFamily:"'JetBrains Mono',monospace", fontSize:10,
              cursor:"pointer", transition:"all .15s",
              fontWeight: tab===t.id ? 700 : 400,
              boxShadow: tab===t.id ? `0 1px 6px ${C.accentL}18` : "none",
              position:"relative",
            }}>
              {t.label}
              {count > 0 && tab !== t.id && (
                <span style={{ position:"absolute", top:3, right:3, width:14, height:14, borderRadius:"50%", background:C.accentL+"22", border:`1px solid ${C.accentL}40`, fontSize:8, color:C.accentL, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div key={tab} style={{ animation:"tabFadeIn .2s ease" }}>

        {/* Logic steps */}
        {tab==="logic" && (
          <div>
            <div style={{ fontSize:10, color:C.muted, fontFamily:"'JetBrains Mono',monospace", textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>Walk through the solution step by step</div>
            <LogicStepper steps={result.logic_steps} />
          </div>
        )}

        {/* Approaches */}
        {tab==="approach" && (
          <div>
            <div style={{ fontSize:10, color:C.muted, fontFamily:"'JetBrains Mono',monospace", textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>Brute force → Optimal</div>
            {result.approaches?.length > 0
              ? result.approaches.map((ap, i) => <ApproachCard key={i} ap={ap} index={i} />)
              : (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:140, gap:10 }}>
                  <div style={{ fontSize:28, opacity:0.12 }}>💻</div>
                  <div style={{ color:C.muted, fontSize:12, fontFamily:"'JetBrains Mono',monospace" }}>No approaches available.</div>
                </div>
              )
            }
          </div>
        )}

        {/* Dry run */}
        {tab==="dryrun" && (
          <div>
            <div style={{ fontSize:10, color:C.muted, fontFamily:"'JetBrains Mono',monospace", textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>Trace through with example values</div>
            {result.dry_run_steps?.length > 0 ? (
              result.dry_run_steps.map((s, i) => (
                <div key={i} style={{ display:"flex", gap:12, padding:"11px 13px", borderRadius:10, border:`1px solid ${C.border}`, background:C.surface, marginBottom:8, transition:"border-color .2s" }}>
                  <div style={{ width:24, height:24, borderRadius:"50%", background:C.accentL+"20", border:`1px solid ${C.accentL}50`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:C.accentL, flexShrink:0 }}>{i+1}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.text, fontWeight:700, marginBottom:4 }}>{s.title}</div>
                    <div style={{ fontSize:12, color:C.dim, lineHeight:1.65, marginBottom:s.code_line?6:0 }}>{s.description}</div>
                    {s.code_line && (
                      <div style={{ position:"relative" }}>
                        <pre style={{ background:"#0a0a12", borderRadius:6, padding:"5px 36px 5px 9px", fontSize:10, color:C.cyan, fontFamily:"'JetBrains Mono',monospace", margin:0, overflowX:"auto" }}>
                          {cleanCode(s.code_line)}
                        </pre>
                        <CopyButton text={cleanCode(s.code_line)} />
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:140, gap:10 }}>
                <div style={{ fontSize:28, opacity:0.12 }}>▶</div>
                <div style={{ color:C.muted, fontSize:12, fontFamily:"'JetBrains Mono',monospace" }}>No dry run steps available.</div>
              </div>
            )}
          </div>
        )}

        {/* Insights */}
        {tab==="insights" && (
          <div>
            {result.key_insights?.length > 0 && (
              <Section title="Key Insights" icon="◈" accent={C.cyan}>
                {result.key_insights.map((ins, i) => (
                  <div key={i} style={{ display:"flex", gap:7, marginBottom:8, fontSize:12, color:C.dim, lineHeight:1.65 }}>
                    <span style={{ color:C.cyan, flexShrink:0 }}>→</span>{ins}
                  </div>
                ))}
              </Section>
            )}
            {result.common_mistakes?.length > 0 && (
              <Section title="Common Mistakes" icon="⚠" accent={C.red}>
                {result.common_mistakes.map((m, i) => (
                  <div key={i} style={{ display:"flex", gap:7, marginBottom:8, fontSize:12, color:C.red+"cc", background:C.red+"08", padding:"6px 9px", borderRadius:7, lineHeight:1.65 }}>
                    <span style={{ flexShrink:0 }}>✕</span>{m}
                  </div>
                ))}
              </Section>
            )}
            {result.similar_problems?.length > 0 && (
              <div style={{ marginTop:8 }}>
                <div style={{ fontSize:10, color:C.muted, fontFamily:"'JetBrains Mono',monospace", textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>Similar Problems</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {result.similar_problems.map((p, i) => <Badge key={i} color={C.teal}>{p}</Badge>)}
                </div>
              </div>
            )}
            {insightCount === 0 && (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:140, gap:10 }}>
                <div style={{ fontSize:28, opacity:0.12 }}>💡</div>
                <div style={{ color:C.muted, fontSize:12, fontFamily:"'JetBrains Mono',monospace" }}>No tips available.</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}