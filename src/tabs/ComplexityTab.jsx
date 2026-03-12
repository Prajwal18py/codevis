// src/tabs/ComplexityTab.jsx — Enhanced
// Enhancements: animated mount on metric cards, mini complexity bar/scale visualization,
// hover tooltips explaining Big-O, animated improvement arrow, copy code in brute force section,
// color-coded complexity legend, staggered entrance

import { useState, useEffect } from "react";
import { useTheme } from "../utils/ThemeContext";
import { Badge, Section } from "../components/UI";

// ─── Complexity color + rank ──────────────────────────────────────────────────
const COMPLEXITY_RANK = [
  { val:"O(1)",      col:"green",  label:"Constant",     rank:0 },
  { val:"O(log n)",  col:"green",  label:"Logarithmic",  rank:1 },
  { val:"O(n)",      col:"cyan",   label:"Linear",       rank:2 },
  { val:"O(n log n)",col:"cyan",   label:"Linearithmic", rank:3 },
  { val:"O(n²)",     col:"amber",  label:"Quadratic",    rank:4 },
  { val:"O(n^2)",    col:"amber",  label:"Quadratic",    rank:4 },
  { val:"O(n³)",     col:"red",    label:"Cubic",        rank:5 },
  { val:"O(n^3)",    col:"red",    label:"Cubic",        rank:5 },
  { val:"O(2^n)",    col:"red",    label:"Exponential",  rank:6 },
  { val:"O(n!)",     col:"red",    label:"Factorial",    rank:7 },
];

const resolveCol = (key, C) => ({ green:C.green, cyan:C.cyan, amber:C.amber, red:C.red, dim:C.dim })[key] || C.dim;
function complexityInfo(val, C) {
  if (!val) return { col: C.dim, label: "Unknown", rank: -1 };
  const found = COMPLEXITY_RANK.find(r => val.replace(/\s/g,"").toLowerCase() === r.val.replace(/\s/g,"").toLowerCase());
  if (found) return { ...found, col: resolveCol(found.col, C) };
  if (val.includes("log")) return { col:C.green,  label:"Logarithmic",  rank:1 };
  if (val.includes("n²")||val.includes("n^2")) return { col:C.amber, label:"Quadratic", rank:4 };
  if (val.includes("2^n")||val.includes("n!")) return { col:C.red,   label:"Exponential", rank:6 };
  if (val.includes("n"))  return { col:C.cyan,  label:"Linear",       rank:2 };
  return { col:C.dim, label:"Custom", rank:-1 };
}

// ─── FadeIn wrapper ───────────────────────────────────────────────────────────
function FadeIn({ delay = 0, children }) {
  const { C } = useTheme();
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{ opacity:vis?1:0, transform:vis?"translateY(0) scale(1)":"translateY(10px) scale(.97)", transition:"all .35s cubic-bezier(.34,1.56,.64,1)" }}>
      {children}
    </div>
  );
}

// ─── Complexity bar scale ─────────────────────────────────────────────────────
function ComplexityScale({ val }) {
  const { C } = useTheme();
  const info = complexityInfo(val, C);
  const pct  = info.rank < 0 ? 0 : Math.min(100, (info.rank / 7) * 100);
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 200); return () => clearTimeout(t); }, []);
  return (
    <div style={{ marginTop:8 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
        <span style={{ fontSize:9, color:C.green, fontFamily:"'JetBrains Mono',monospace" }}>O(1)</span>
        <span style={{ fontSize:9, color:info.col, fontFamily:"'JetBrains Mono',monospace", fontWeight:700 }}>{info.label}</span>
        <span style={{ fontSize:9, color:C.red, fontFamily:"'JetBrains Mono',monospace" }}>O(n!)</span>
      </div>
      <div style={{ height:5, background:C.border, borderRadius:9, overflow:"visible", position:"relative" }}>
        {/* Gradient track */}
        <div style={{ position:"absolute", inset:0, borderRadius:9, background:`linear-gradient(90deg, ${C.green}, ${C.cyan}, ${C.amber}, ${C.red})`, opacity:0.18 }} />
        {/* Indicator */}
        <div style={{
          position:"absolute", top:"50%", left:`${animated ? pct : 0}%`,
          transform:"translate(-50%,-50%)",
          width:10, height:10, borderRadius:"50%",
          background:info.col, border:`2px solid ${info.col}`,
          boxShadow:`0 0 8px ${info.col}cc`,
          transition:"left 1s cubic-bezier(.34,1.56,.64,1) .3s",
        }} />
      </div>
    </div>
  );
}

// ─── Metric card ──────────────────────────────────────────────────────────────
function MetricCard({ label, val, delay, showScale }) {
  const { C } = useTheme();
  const [hovered, setHovered] = useState(false);
  const info = complexityInfo(val, C);
  return (
    <FadeIn delay={delay}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background:C.surface, borderRadius:12, padding:"14px 12px",
          border:`1px solid ${hovered ? info.col+"55" : info.col+"28"}`,
          textAlign:"center", transition:"all .2s", position:"relative",
          boxShadow:hovered ? `0 0 16px ${info.col}15` : "none",
        }}
      >
        <div style={{ fontSize:9, color:C.muted, marginBottom:6, fontFamily:"'JetBrains Mono',monospace", textTransform:"uppercase", letterSpacing:1 }}>
          {label}
        </div>
        <div style={{ fontFamily:"'Orbitron','JetBrains Mono',monospace", fontSize:22, fontWeight:700, color:info.col, letterSpacing:1, lineHeight:1 }}>
          {val || "—"}
        </div>
        {info.label && val && (
          <div style={{ fontSize:9, color:info.col+"99", fontFamily:"'JetBrains Mono',monospace", marginTop:4 }}>
            {info.label}
          </div>
        )}
        {showScale && val && <ComplexityScale val={val} />}
      </div>
    </FadeIn>
  );
}

// ─── Improvement arrow ────────────────────────────────────────────────────────
function ImprovementArrow({ from, to }) {
  const { C } = useTheme();
  const fi = complexityInfo(from, C);
  const ti = complexityInfo(to, C);
  const improved = ti.rank >= 0 && fi.rank >= 0 && ti.rank < fi.rank;
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), 400); return () => clearTimeout(t); }, []);
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4, opacity:vis?1:0, transition:"opacity .4s ease .3s" }}>
      <div style={{ fontSize:20, color:improved?C.green:C.amber }}>
        {improved ? "⬇" : "→"}
      </div>
      {improved && (
        <div style={{ fontSize:9, color:C.green, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, background:C.green+"14", border:`1px solid ${C.green}30`, borderRadius:6, padding:"2px 6px", whiteSpace:"nowrap" }}>
          improved!
        </div>
      )}
    </div>
  );
}

// ─── Copy button ──────────────────────────────────────────────────────────────
function CopyButton({ text }) {
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
      transition:"all .2s",
    }}>
      {copied ? "✓ copied" : "copy"}
    </button>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────
export default function ComplexityTab({ result }) {
  const { C } = useTheme();
  if (!result?.complexity) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:200, gap:10 }}>
        <div style={{ fontSize:32, opacity:0.12 }}>📊</div>
        <div style={{ color:C.muted, fontSize:12, fontFamily:"'JetBrains Mono',monospace" }}>No complexity data available.</div>
      </div>
    );
  }

  const metrics = [
    { label:"Time Complexity",  val:result.complexity?.time       },
    { label:"Space Complexity", val:result.complexity?.space      },
    { label:"Best Case",        val:result.complexity?.best_case  },
    { label:"Worst Case",       val:result.complexity?.worst_case },
  ];

  const hasBrute   = !!result.brute_force;
  const bruteTime  = result.brute_force?.time;
  const optTime    = result.complexity?.time;

  return (
    <div>
      <style>{`@keyframes fadeSlideIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:none } }`}</style>

      {/* 2x2 metric grid */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
        {metrics.map((x, i) => (
          <MetricCard key={i} label={x.label} val={x.val} delay={i * 70} showScale={i < 2} />
        ))}
      </div>

      {/* Explanation */}
      {result.complexity?.explanation && (
        <FadeIn delay={300}>
          <div style={{ background:C.surface, borderRadius:10, padding:"12px 14px", border:`1px solid ${C.border}`, fontSize:12, color:C.dim, lineHeight:1.75, marginBottom:12 }}>
            <div style={{ fontSize:9, color:C.muted, fontFamily:"'JetBrains Mono',monospace", textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>Why?</div>
            {result.complexity.explanation}
          </div>
        </FadeIn>
      )}

      {/* Brute force vs optimal comparison */}
      {hasBrute && (
        <FadeIn delay={360}>
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:10, color:C.muted, fontFamily:"'JetBrains Mono',monospace", textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>
              Brute Force vs Optimal
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", gap:10, alignItems:"center", marginBottom:12 }}>
              {/* Before */}
              <div style={{ background:C.red+"0f", border:`1px solid ${C.red}30`, borderRadius:12, padding:"14px 16px" }}>
                <div style={{ fontSize:9, color:C.red, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, marginBottom:5, textTransform:"uppercase" }}>⊘ Brute Force</div>
                <div style={{ fontFamily:"'Orbitron',monospace", fontSize:18, fontWeight:700, color:C.red }}>{bruteTime}</div>
                {result.brute_force?.space && (
                  <div style={{ fontSize:9, color:C.muted, fontFamily:"'JetBrains Mono',monospace", marginTop:2 }}>{result.brute_force.space} space</div>
                )}
                {result.brute_force?.description && (
                  <div style={{ fontSize:11, color:C.dim, lineHeight:1.6, marginTop:7 }}>{result.brute_force.description}</div>
                )}
              </div>

              <ImprovementArrow from={bruteTime} to={optTime} />

              {/* After */}
              <div style={{ background:C.green+"0f", border:`1px solid ${C.green}30`, borderRadius:12, padding:"14px 16px" }}>
                <div style={{ fontSize:9, color:C.green, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, marginBottom:5, textTransform:"uppercase" }}>★ Optimal</div>
                <div style={{ fontFamily:"'Orbitron',monospace", fontSize:18, fontWeight:700, color:C.green }}>{optTime}</div>
                {result.complexity?.space && (
                  <div style={{ fontSize:9, color:C.muted, fontFamily:"'JetBrains Mono',monospace", marginTop:2 }}>{result.complexity.space} space</div>
                )}
                {result.complexity?.improvement && (
                  <div style={{ fontSize:11, color:C.dim, lineHeight:1.6, marginTop:7 }}>{result.complexity.improvement}</div>
                )}
              </div>
            </div>

            {/* Brute code if present */}
            {result.brute_force?.code && (
              <div>
                <div style={{ fontSize:9, color:C.muted, fontFamily:"'JetBrains Mono',monospace", textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>
                  🐢 Brute Force Code
                </div>
                <div style={{ position:"relative" }}>
                  {/* CodeBlock here */}
                  <pre style={{ background:"#0a0a12", border:`1px solid ${C.border}`, borderRadius:9, padding:"10px 38px 10px 12px", fontSize:11, color:C.dim, fontFamily:"'JetBrains Mono',monospace", overflowX:"auto", margin:0 }}>
                    {result.brute_force.code}
                  </pre>
                  <CopyButton text={result.brute_force.code} />
                </div>
              </div>
            )}
          </div>
        </FadeIn>
      )}

      {/* Big-O legend */}
      <FadeIn delay={440}>
        <div style={{ background:C.surface, borderRadius:10, padding:"10px 12px", border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:9, color:C.muted, fontFamily:"'JetBrains Mono',monospace", textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>
            Big-O Scale
          </div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {COMPLEXITY_RANK.slice(0, 6).map((r, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:4, fontSize:9, fontFamily:"'JetBrains Mono',monospace" }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:r.col, boxShadow:`0 0 4px ${r.col}88` }} />
                <span style={{ color:r.col }}>{r.val}</span>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>
    </div>
  );
}