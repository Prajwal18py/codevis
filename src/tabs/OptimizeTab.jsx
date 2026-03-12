// src/tabs/OptimizeTab.jsx — Enhanced
// Enhancements: pulsing skeleton loader, copy buttons on all code, expandable optimization steps,
// animated complexity arrow, suggestion priority colors with icon, re-optimize confirmation, empty state polish

import { useState, useEffect } from "react";
import { useTheme } from "../utils/ThemeContext";
import { callGroq, buildOptimizePrompt } from "../utils/groq";
import { CodeBlock } from "../components/UI";

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


// ─── Copy button ──────────────────────────────────────────────────────────────
function CopyButton({ text, style: extra = {} }) {
  const { C } = useTheme();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  };
  return (
    <button onClick={copy} style={{
      position:"absolute", top:7, right:7,
      background:copied?C.green+"22":C.surface,
      border:`1px solid ${copied?C.green+"55":C.border}`,
      borderRadius:6, padding:"3px 8px",
      fontSize:9, color:copied?C.green:C.muted,
      fontFamily:"'JetBrains Mono',monospace", cursor:"pointer",
      transition:"all .2s", ...extra,
    }}>
      {copied ? "✓ copied" : "copy"}
    </button>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
function Badge({ text, color }) {
  const { C } = useTheme();
  return (
    <span style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", color, background:color+"18", border:`1px solid ${color}35`, borderRadius:8, padding:"2px 8px", fontWeight:700 }}>
      {text}
    </span>
  );
}

// ─── FadeIn ───────────────────────────────────────────────────────────────────
function FadeIn({ delay = 0, children }) {
  const { C } = useTheme();
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{ opacity:vis?1:0, transform:vis?"translateY(0)":"translateY(8px)", transition:"all .3s ease" }}>
      {children}
    </div>
  );
}

// ─── Expandable optimization step ────────────────────────────────────────────
function OptimizationStep({ s, index, C }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:11, overflow:"hidden", transition:"border-color .2s" }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 14px", cursor:"pointer", background:open?C.accentL+"08":"transparent" }}
      >
        <div style={{ width:22, height:22, borderRadius:"50%", background:C.accentL+"22", border:`1px solid ${C.accentL}40`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Orbitron',monospace", fontSize:10, fontWeight:700, color:C.accentL, flexShrink:0 }}>
          {s.step}
        </div>
        <span style={{ fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700, color:C.text, flex:1 }}>{s.title}</span>
        <span style={{ color:C.muted, fontSize:10, transform:open?"rotate(90deg)":"rotate(0deg)", transition:"transform .2s" }}>▶</span>
      </div>

      {open && (
        <div style={{ padding:"0 14px 13px 14px", animation:"fadeSlideIn .18s ease" }}>
          <div style={{ fontSize:12, color:C.dim, lineHeight:1.7, marginBottom:(s.before_code||s.after_code)?10:0 }}>
            {s.explanation}
          </div>
          {(s.before_code || s.after_code) && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:8 }}>
              {s.before_code && (
                <div>
                  <div style={{ fontSize:9, color:C.red, fontFamily:"'JetBrains Mono',monospace", marginBottom:4, fontWeight:700 }}>BEFORE</div>
                  <div style={{ position:"relative" }}>
                    <CodeBlock code={s.before_code} />
                    <CopyButton text={s.before_code} />
                  </div>
                </div>
              )}
              {s.after_code && (
                <div>
                  <div style={{ fontSize:9, color:C.green, fontFamily:"'JetBrains Mono',monospace", marginBottom:4, fontWeight:700 }}>AFTER</div>
                  <div style={{ position:"relative" }}>
                    <CodeBlock code={s.after_code} />
                    <CopyButton text={s.after_code} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Complexity comparison ────────────────────────────────────────────────────
function ComplexityCompare({ original, optimized, C }) {
  const [arrowVis, setArrowVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setArrowVis(true), 500); return () => clearTimeout(t); }, []);
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", gap:10, alignItems:"center" }}>
      <div style={{ background:C.red+"0f", border:`1px solid ${C.red}30`, borderRadius:12, padding:"14px 16px" }}>
        <div style={{ fontSize:10, color:C.red, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, marginBottom:6, textTransform:"uppercase" }}>❌ Before</div>
        <div style={{ fontFamily:"'Orbitron',monospace", fontSize:20, fontWeight:700, color:C.red }}>{original?.time}</div>
        <div style={{ fontSize:10, color:C.muted, fontFamily:"'JetBrains Mono',monospace", marginTop:2 }}>{original?.space} space</div>
        {original?.why_slow && <div style={{ fontSize:11, color:C.dim, lineHeight:1.6, marginTop:7 }}>{original.why_slow}</div>}
      </div>

      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, opacity:arrowVis?1:0, transition:"opacity .5s ease .4s" }}>
        <div style={{ fontSize:22 }}>→</div>
        <div style={{ fontSize:8, color:C.green, fontFamily:"'JetBrains Mono',monospace", background:C.green+"14", border:`1px solid ${C.green}30`, borderRadius:5, padding:"2px 5px", whiteSpace:"nowrap" }}>
          optimized
        </div>
      </div>

      <div style={{ background:C.green+"0f", border:`1px solid ${C.green}30`, borderRadius:12, padding:"14px 16px" }}>
        <div style={{ fontSize:10, color:C.green, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, marginBottom:6, textTransform:"uppercase" }}>✅ After</div>
        <div style={{ fontFamily:"'Orbitron',monospace", fontSize:20, fontWeight:700, color:C.green }}>{optimized?.time}</div>
        <div style={{ fontSize:10, color:C.muted, fontFamily:"'JetBrains Mono',monospace", marginTop:2 }}>{optimized?.space} space</div>
        {optimized?.improvement && <div style={{ fontSize:11, color:C.dim, lineHeight:1.6, marginTop:7 }}>{optimized.improvement}</div>}
      </div>
    </div>
  );
}

// ─── Priority icon ────────────────────────────────────────────────────────────
const PRIORITY_ICON = { HIGH:"🔴", MEDIUM:"🟡", LOW:"🟢" };

// ─── Main tab ─────────────────────────────────────────────────────────────────
export default function OptimizeTab({ code, problem, lang }) {
  const { C } = useTheme();
  const [result,    setResult]    = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [reoptConf, setReoptConf] = useState(false); // re-optimize confirm

  async function handleOptimize() {
    if (!code?.trim()) { setError("Paste your code in the editor first!"); return; }
    setLoading(true); setError(""); setResult(null); setReoptConf(false);
    try {
      const data = await callGroq(buildOptimizePrompt(problem, code, lang));
      setResult(data);
    } catch(e) {
      setError(e.message.includes("JSON") ? "AI parse error — try again." : e.message);
    } finally { setLoading(false); }
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!result && !loading) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, padding:"40px 20px", textAlign:"center" }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.08)} }`}</style>
      <div style={{ fontSize:52, animation:"pulse 2.5s ease-in-out infinite" }}>⚡</div>
      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:17, fontWeight:800, color:C.text }}>Code Optimizer</div>
      <div style={{ fontSize:12, color:C.muted, fontFamily:"'JetBrains Mono',monospace", lineHeight:1.85, maxWidth:320 }}>
        Paste your brute force solution in the editor on the left,<br/>then click below to get the optimized version with full explanation.
      </div>
      {error && (
        <div style={{ background:C.red+"0f", border:`1px solid ${C.red}30`, borderRadius:8, padding:"8px 14px", color:C.red, fontSize:11, fontFamily:"'JetBrains Mono',monospace" }}>
          ⚠ {error}
        </div>
      )}
      <button onClick={handleOptimize} style={{ padding:"12px 32px", borderRadius:10, border:"none", background:`linear-gradient(135deg,${C.accent},${C.accentL})`, color:"#fff", fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:800, cursor:"pointer", boxShadow:`0 0 24px ${C.accent}44`, transition:"transform .15s", }}>
        ⚡ Optimize My Code
      </button>
    </div>
  );

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, padding:"60px 20px" }}>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg) } }
        @keyframes shimmer { 0%{opacity:.4} 50%{opacity:.8} 100%{opacity:.4} }
      `}</style>
      <div style={{ position:"relative", width:48, height:48 }}>
        <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:`3px solid ${C.border}` }} />
        <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:`3px solid transparent`, borderTopColor:C.accentL, animation:"spin .8s linear infinite" }} />
        <div style={{ position:"absolute", inset:6, borderRadius:"50%", border:`2px solid transparent`, borderTopColor:C.cyan, animation:"spin 1.2s linear infinite reverse" }} />
      </div>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:C.muted, animation:"shimmer 1.5s ease-in-out infinite" }}>
        Analyzing and optimizing your code...
      </div>
      {/* Skeleton placeholder */}
      {[80, 60, 90, 45].map((w, i) => (
        <div key={i} style={{ height:10, width:`${w}%`, background:C.surface, borderRadius:6, animation:`shimmer 1.5s ease-in-out ${i*0.15}s infinite` }} />
      ))}
    </div>
  );

  // ── Result ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <style>{`
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:none } }
        @keyframes spin { to { transform:rotate(360deg) } }
      `}</style>

      {/* Complexity comparison */}
      <FadeIn delay={0}>
        <ComplexityCompare original={result.original_complexity} optimized={result.optimized_complexity} C={C} />
      </FadeIn>

      {/* Key trick */}
      {result.key_trick && (
        <FadeIn delay={80}>
          <div style={{ background:`linear-gradient(135deg,${C.accent}12,${C.cyan}08)`, border:`1px solid ${C.accentL}30`, borderRadius:12, padding:"14px 16px", display:"flex", gap:10, alignItems:"flex-start" }}>
            <div style={{ fontSize:22, flexShrink:0 }}>🔑</div>
            <div>
              <div style={{ fontSize:10, color:C.accentL, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, marginBottom:4, textTransform:"uppercase" }}>
                Key Trick &nbsp;·&nbsp; <span style={{ color:C.cyan }}>{result.pattern_used}</span>
              </div>
              <div style={{ fontSize:13, color:C.text, fontWeight:600, lineHeight:1.6 }}>{result.key_trick}</div>
              {result.why_it_works && <div style={{ fontSize:11, color:C.dim, lineHeight:1.7, marginTop:6 }}>{result.why_it_works}</div>}
            </div>
          </div>
        </FadeIn>
      )}

      {/* Optimized code */}
      {result.optimized_code && (
        <FadeIn delay={140}>
          <div>
            <div style={{ fontSize:10, color:C.muted, fontFamily:"'JetBrains Mono',monospace", textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>✅ Optimized Code</div>
            <div style={{ position:"relative" }}>
              <CodeBlock code={result.optimized_code} />
              <CopyButton text={result.optimized_code} />
            </div>
          </div>
        </FadeIn>
      )}

      {/* Optimization steps */}
      {result.optimization_steps?.length > 0 && (
        <FadeIn delay={200}>
          <div>
            <div style={{ fontSize:10, color:C.muted, fontFamily:"'JetBrains Mono',monospace", textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>🔧 Optimization Steps</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {result.optimization_steps.map((s, i) => (
                <OptimizationStep key={i} s={s} index={i} C={C} />
              ))}
            </div>
          </div>
        </FadeIn>
      )}

      {/* Suggestions */}
      {result.suggestions?.length > 0 && (
        <FadeIn delay={280}>
          <div>
            <div style={{ fontSize:10, color:C.muted, fontFamily:"'JetBrains Mono',monospace", textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>💡 More Tips</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {result.suggestions.map((s, i) => {
                const pc = s.priority==="HIGH" ? C.red : s.priority==="MEDIUM" ? C.orange : C.cyan;
                return (
                  <div key={i} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 14px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, flexWrap:"wrap" }}>
                      <span style={{ fontSize:12 }}>{PRIORITY_ICON[s.priority] || "💡"}</span>
                      <Badge text={s.priority} color={pc} />
                      <span style={{ fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700, color:C.text }}>{s.title}</span>
                    </div>
                    <div style={{ fontSize:11, color:C.dim, lineHeight:1.7, marginBottom:s.code_snippet?8:0 }}>{s.explanation}</div>
                    {s.code_snippet && (
                      <div style={{ position:"relative" }}>
                        <CodeBlock code={cleanCode(s.code_snippet)} />
                        <CopyButton text={cleanCode(s.code_snippet)} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </FadeIn>
      )}

      {/* Re-optimize */}
      <FadeIn delay={340}>
        {reoptConf ? (
          <div style={{ display:"flex", gap:8 }}>
            <span style={{ fontSize:11, color:C.muted, fontFamily:"'JetBrains Mono',monospace", alignSelf:"center", flex:1 }}>Re-run optimization?</span>
            <button onClick={handleOptimize} style={{ padding:"7px 14px", borderRadius:8, border:`1px solid ${C.accentL}50`, background:C.accentL+"14", color:C.accentL, fontFamily:"'JetBrains Mono',monospace", fontSize:11, cursor:"pointer", fontWeight:700 }}>Yes, re-optimize</button>
            <button onClick={() => setReoptConf(false)} style={{ padding:"7px 12px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.muted, fontFamily:"'JetBrains Mono',monospace", fontSize:11, cursor:"pointer" }}>Cancel</button>
          </div>
        ) : (
          <button onClick={() => setReoptConf(true)} style={{ padding:"10px", borderRadius:9, border:`1px solid ${C.border}`, background:"transparent", color:C.muted, fontFamily:"'JetBrains Mono',monospace", fontSize:11, cursor:"pointer", transition:"all .15s", width:"100%" }}>
            ↻ Re-optimize
          </button>
        )}
      </FadeIn>
    </div>
  );
}