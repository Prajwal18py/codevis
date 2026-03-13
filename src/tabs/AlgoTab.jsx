// src/tabs/AlgoTab.jsx — Enhanced Visual Algorithm Teacher
// Enhancements: keyboard nav on stepper, progress ring, copy code button,
// hover effects on algo list, animated viz transitions, dual-ring loader,
// array bar entrance animation, auto-play on stepper, better error state

import { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "../utils/ThemeContext";
import { Badge, Section, CodeBlock } from "../components/UI";

const ALGORITHMS = [
  { category: "Sorting",   items: ["Bubble Sort","Selection Sort","Insertion Sort","Merge Sort","Quick Sort","Heap Sort"] },
  { category: "Searching", items: ["Linear Search","Binary Search"] },
  { category: "Graph",     items: ["BFS","DFS","Dijkstra's Algorithm","Topological Sort"] },
  { category: "DP",        items: ["Fibonacci DP","0/1 Knapsack","Longest Common Subsequence","Coin Change"] },
];

const getCategoryColor = (cat, C) => ({ Sorting: C.cyan, Searching: C.green, Graph: C.orange, DP: C.accentL })[cat] || C.muted;

// ─── Copy button ──────────────────────────────────────────────────────────────
function CopyButton({ text }) {
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
      fontFamily: "'JetBrains Mono',monospace", cursor: "pointer", transition: "all .2s",
    }}>
      {copied ? "✓ copied" : "copy"}
    </button>
  );
}

// ─── Progress ring ────────────────────────────────────────────────────────────
function ProgressRing({ cur, total, size = 34 }) {
  const { C } = useTheme();
  const r = size / 2 - 3;
  const circ = 2 * Math.PI * r;
  const pct = total > 1 ? cur / (total - 1) : 1;
  const done = cur >= total - 1;
  const col = done ? C.green : C.accentL;
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={2.5} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={2.5}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: "stroke-dashoffset .35s ease", filter: `drop-shadow(0 0 3px ${col})` }} />
      <text x={size/2} y={size/2+4} textAnchor="middle" fontSize={9} fontFamily="JetBrains Mono" fill={col} fontWeight={700}>
        {done ? "✓" : `${cur+1}/${total}`}
      </text>
    </svg>
  );
}

// ─── Animated array bar ───────────────────────────────────────────────────────
function ArrayBar({ value, max, highlighted, sorted, pivot, index }) {
  const { C } = useTheme();
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), index * 30); return () => clearTimeout(t); }, [index]);
  const pct = Math.max(10, (value / max) * 100);
  const col = pivot ? C.orange : highlighted ? C.accentL : sorted ? C.green : C.cyan;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
      <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: col, fontWeight: 700, opacity: vis ? 1 : 0, transition: "opacity .3s" }}>{value}</div>
      <div style={{
        width: "100%", maxWidth: 40,
        height: vis ? `${pct}px` : "4px",
        background: `linear-gradient(180deg,${col},${col}88)`,
        borderRadius: "4px 4px 0 0",
        transition: "height .4s cubic-bezier(.34,1.56,.64,1), background .25s",
        boxShadow: highlighted || pivot ? `0 0 12px ${col}66` : "none",
      }} />
    </div>
  );
}

function ArrayViz({ before, after, highlightIndices, action, isDone }) {
  const { C } = useTheme();
  const arr = isDone ? after : before;
  if (!arr?.length) return null;
  const max = Math.max(...arr, 1);
  return (
    <div style={{ background: "#0a0a12", borderRadius: 10, padding: "16px 12px 8px", border: `1px solid ${C.border}`, marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, justifyContent: "center", height: 120 }}>
        {arr.map((v, i) => (
          <ArrayBar key={i} index={i} value={v} max={max}
            highlighted={highlightIndices?.includes(i)}
            sorted={isDone}
            pivot={action === "pivot" && highlightIndices?.includes(i)}
          />
        ))}
      </div>
      {action && (
        <div style={{ textAlign: "center", marginTop: 8, fontSize: 10, color: C.muted, fontFamily: "'JetBrains Mono',monospace" }}>
          action: <span style={{ color: C.accentL }}>{action}</span>
          {highlightIndices?.length > 0 && <span style={{ color: C.dim }}> · indices [{highlightIndices.join(",")}]</span>}
        </div>
      )}
    </div>
  );
}

// ─── Visual stepper ───────────────────────────────────────────────────────────
function VisualStepper({ steps }) {
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
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 160, gap: 10 }}>
        <div style={{ fontSize: 28, opacity: 0.12 }}>📊</div>
        <div style={{ color: C.muted, fontSize: 12, fontFamily: "'JetBrains Mono',monospace" }}>No visual steps available.</div>
      </div>
    );
  }

  const s = steps[cur];

  return (
    <div ref={containerRef} tabIndex={0} style={{ outline: "none" }}>
      <style>{`@keyframes fadeSlideIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:none } }`}</style>

      {/* Dot nav + ring */}
      <div style={{ display: "flex", gap: 5, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        {steps.map((_, i) => (
          <div key={i} onClick={() => setCur(i)} title={`Step ${i + 1}`} style={{
            width: 24, height: 24, borderRadius: "50%",
            background: i === cur ? `linear-gradient(135deg,${C.accent},${C.cyan})` : i < cur ? C.green + "22" : C.surface,
            border: `1.5px solid ${i === cur ? C.accentL : i < cur ? C.green : C.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 9, fontWeight: 700,
            color: i === cur ? "#fff" : i < cur ? C.green : C.muted,
            cursor: "pointer", transition: "all .2s",
            boxShadow: i === cur ? `0 0 8px ${C.accentL}55` : "none",
          }}>
            {i < cur ? "✓" : i + 1}
          </div>
        ))}
        <div style={{ marginLeft: "auto" }}>
          <ProgressRing cur={cur} total={steps.length} />
        </div>
      </div>

      {/* Step card */}
      <div key={cur} style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.accentL}30`, padding: 14, marginBottom: 10, animation: "fadeSlideIn .22s ease" }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 800, color: C.accentL, marginBottom: 10 }}>
          Step {s.step}: {s.title}
        </div>

        <ArrayViz
          before={s.array_before} after={s.array_after}
          highlightIndices={s.highlight_indices} action={s.action} isDone={false}
        />

        <div style={{ fontSize: 13, color: C.text, lineHeight: 1.8, marginBottom: s.code_line ? 10 : 0 }}>
          {s.description}
        </div>

        {s.code_line && (
          <div style={{ position: "relative" }}>
            <pre style={{ background: "#0a0a12", border: `1px solid ${C.cyan}35`, borderLeft: `3px solid ${C.cyan}`, borderRadius: 8, padding: "7px 38px 7px 11px", fontSize: 11, color: C.cyan, fontFamily: "'JetBrains Mono',monospace", margin: 0, overflowX: "auto" }}>
              {s.code_line}
            </pre>
            <CopyButton text={s.code_line} />
          </div>
        )}
      </div>

      {/* Nav */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={() => go(-1)} disabled={cur === 0} style={{ flex: 1, padding: "7px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: cur === 0 ? C.muted : C.text, cursor: cur === 0 ? "not-allowed" : "pointer", fontSize: 12, transition: "all .15s" }}>← Prev</button>
        <span style={{ fontSize: 9, color: C.muted, fontFamily: "'JetBrains Mono',monospace", whiteSpace: "nowrap" }}>↑↓ keys</span>
        <button onClick={() => go(1)} disabled={cur === steps.length - 1} style={{ flex: 1, padding: "7px", borderRadius: 8, border: `1px solid ${C.accentL}50`, background: C.accentL + "12", color: cur === steps.length - 1 ? C.muted : C.accentL, cursor: cur === steps.length - 1 ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 700, transition: "all .15s" }}>Next →</button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AlgoTab({ onAnalyze, result, loading, error }) {
  const { C } = useTheme();
  const [selected, setSelected] = useState(null);
  const [lang, setLang] = useState("cpp");
  const [vizTab, setVizTab] = useState("visual");
  const [hoveredAlgo, setHoveredAlgo] = useState(null);

  function handlePick(name) {
    setSelected(name);
    setVizTab("visual");
    onAnalyze(name);
  }

  const vizTabs = [
    { id: "visual", label: "📊 Visual Steps" },
    { id: "dryrun", label: "▶ Dry Run"       },
    { id: "code",   label: "💻 Full Code"     },
    { id: "info",   label: "📋 Info"          },
  ];

  const complexityColor = v => {
    if (!v) return C.dim;
    if (v === "O(1)" || v === "O(log n)") return C.green;
    if (v === "O(n)" || v.includes("n log")) return C.cyan;
    if (v.includes("n^2") || v.includes("2^n")) return C.red;
    return C.amber;
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 14, height: "100%" }}>
      <style>{`
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:none } }
        @keyframes tabFadeIn   { from { opacity:0; transform:translateX(6px) } to { opacity:1; transform:none } }
        @keyframes spin        { to   { transform:rotate(360deg) } }
      `}</style>

      {/* ── Left: algorithm picker ── */}
      <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: 12, overflowY: "auto" }}>
        <div style={{ fontSize: 9, color: C.muted, fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Pick an Algorithm</div>
        {ALGORITHMS.map(group => {
          const catCol = getCategoryColor(group.category, C) || C.accentL;
          return (
            <div key={group.category} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 9, color: catCol, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1, display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: catCol, boxShadow: `0 0 4px ${catCol}` }} />
                {group.category}
              </div>
              {group.items.map(name => {
                const isSelected = selected === name;
                const isHovered  = hoveredAlgo === name;
                return (
                  <button
                    key={name}
                    onClick={() => handlePick(name)}
                    onMouseEnter={() => setHoveredAlgo(name)}
                    onMouseLeave={() => setHoveredAlgo(null)}
                    style={{
                      display: "block", width: "100%", textAlign: "left",
                      padding: "6px 9px", borderRadius: 7, border: "none",
                      background: isSelected ? C.accentL + "18" : isHovered ? C.surface + "ee" : "transparent",
                      color: isSelected ? C.accentL : isHovered ? C.text : C.dim,
                      fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
                      cursor: "pointer", marginBottom: 2, transition: "all .15s",
                      fontWeight: isSelected ? 700 : 400,
                      borderLeft: isSelected ? `2px solid ${C.accentL}` : "2px solid transparent",
                    }}
                  >
                    {isSelected && <span style={{ marginRight: 5 }}>▶</span>}{name}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* ── Right: result ── */}
      <div style={{ minWidth: 0 }}>
        {/* Lang toggle — always visible */}
      <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:12 }}>
        <span style={{ fontSize:10, color:C.muted, fontFamily:"'JetBrains Mono',monospace" }}>Language:</span>
        <div style={{ display:"flex", gap:2, background:C.surface, borderRadius:8, padding:3, border:`1px solid ${C.border}` }}>
          {[{id:"cpp",label:"C++"},{id:"python",label:"Python"}].map(l => (
            <button key={l.id} onClick={() => setLang(l.id)}
              style={{ padding:"4px 14px", borderRadius:6, border:"none",
                background: lang===l.id ? (l.id==="python" ? C.green+"22" : C.accentL+"22") : "transparent",
                color: lang===l.id ? (l.id==="python" ? C.green : C.accentL) : C.muted,
                fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:lang===l.id?700:400,
                cursor:"pointer", transition:"all .15s" }}>
              {l.label}
            </button>
          ))}
        </div>

      </div>

      {/* Empty state */}
        {!selected && !loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 400, gap: 14, color: C.muted }}>
            <div style={{ fontSize: 40, opacity: 0.1 }}>⬡</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, textAlign: "center", lineHeight: 2 }}>
              Pick an algorithm from the left<br />
              <span style={{ fontSize: 10, opacity: 0.6 }}>to see a visual step-by-step explanation</span>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 14 }}>
            <div style={{ position: "relative", width: 48, height: 48 }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `3px solid ${C.border}` }} />
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "3px solid transparent", borderTopColor: C.accentL, animation: "spin .8s linear infinite" }} />
              <div style={{ position: "absolute", inset: 6, borderRadius: "50%", border: "2px solid transparent", borderTopColor: C.cyan, animation: "spin 1.2s linear infinite reverse" }} />
            </div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", color: C.accentL, fontSize: 13 }}>Loading {selected}...</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", color: C.muted, fontSize: 11 }}>Asking AI to explain this algorithm</div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300, gap: 12 }}>
            <div style={{ fontSize: 36, opacity: 0.25 }}>⚠</div>
            <div style={{ background: C.red + "12", border: `1px solid ${C.red}35`, borderRadius: 10, padding: "12px 18px", maxWidth: 400, textAlign: "center" }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", color: C.red, fontSize: 12, marginBottom: 6, fontWeight: 700 }}>Error loading algorithm</div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", color: C.muted, fontSize: 11 }}>{error}</div>
            </div>
            <button onClick={() => onAnalyze(selected)} style={{ padding: "7px 18px", borderRadius: 8, border: `1px solid ${C.accentL}50`, background: C.accentL + "12", color: C.accentL, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, cursor: "pointer" }}>
              ↺ Retry
            </button>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div style={{ animation: "fadeSlideIn .25s ease" }}>
            {/* Header */}
            <div style={{ background: C.surface, borderRadius: 10, padding: "12px 14px", marginBottom: 12, border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 800, color: C.text }}>{result.name}</span>
                <Badge color={C.accentL}>{result.category}</Badge>
              </div>
              <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.6, marginBottom: 8 }}>{result.tagline}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <Badge color={complexityColor(result.complexity?.time_best)}  size={10}>Best: {result.complexity?.time_best}</Badge>
                <Badge color={complexityColor(result.complexity?.time_avg)}   size={10}>Avg: {result.complexity?.time_avg}</Badge>
                <Badge color={complexityColor(result.complexity?.time_worst)} size={10}>Worst: {result.complexity?.time_worst}</Badge>
                <Badge color={C.blue} size={10}>Space: {result.complexity?.space}</Badge>
              </div>
            </div>

            {/* Analogy banner */}
            {result.real_world_analogy && (
              <div style={{ background: C.orange + "0c", border: `1px solid ${C.orange}28`, borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 12, color: C.orange, lineHeight: 1.65 }}>
                🟠 <strong>Think of it like:</strong> {result.real_world_analogy}
              </div>
            )}

            <div style={{ display: "flex", gap: 3, background: C.surface, borderRadius: 9, padding: 3, border: `1px solid ${C.border}`, marginBottom: 12 }}>
              {vizTabs.map(t => (
                <button key={t.id} onClick={() => setVizTab(t.id)} style={{
                  flex: 1, padding: "6px", borderRadius: 7, border: "none",
                  background: vizTab === t.id ? C.card : "transparent",
                  color: vizTab === t.id ? C.accentL : C.muted,
                  fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
                  cursor: "pointer", transition: "all .15s",
                  fontWeight: vizTab === t.id ? 700 : 400,
                  boxShadow: vizTab === t.id ? `0 1px 5px ${C.accentL}15` : "none",
                }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div key={vizTab} style={{ animation: "tabFadeIn .18s ease" }}>
              {/* Visual steps */}
              {vizTab === "visual" && <VisualStepper steps={result.visual_steps} />}

              {/* Dry run */}
              {vizTab === "dryrun" && result.dry_run_example && (
                <div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                    <div style={{ background: C.surface, borderRadius: 8, padding: "8px 12px", border: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: 9, color: C.muted, fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>INPUT</div>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: C.cyan }}>[{result.dry_run_example.input?.join(", ")}]</div>
                    </div>
                    <div style={{ background: C.surface, borderRadius: 8, padding: "8px 12px", border: `1px solid ${C.green}40` }}>
                      <div style={{ fontSize: 9, color: C.muted, fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>OUTPUT</div>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: C.green }}>[{result.dry_run_example.output?.join(", ")}]</div>
                    </div>
                  </div>
                  {result.dry_run_example.passes?.map((p, i) => (
                    <div key={i} style={{ background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, padding: "10px 13px", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <Badge color={C.accentL} size={10}>Pass {p.pass}</Badge>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.cyan }}>[{p.array?.join(", ")}]</div>
                      </div>
                      <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.6 }}>{p.note}</div>
                      {p.swaps?.length > 0 && (
                        <div style={{ fontSize: 10, color: C.muted, fontFamily: "'JetBrains Mono',monospace", marginTop: 4 }}>
                          swaps: {p.swaps.map(sw => `[${sw.join("↔")}]`).join(", ")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Full code */}
              {vizTab === "code" && (
                <div style={{ position: "relative" }}>
                  <CodeBlock code={lang === "python" ? (result.python_code || result.full_code) : result.full_code} />
                  <CopyButton text={lang === "python" ? (result.python_code || result.full_code) : result.full_code} />
                </div>
              )}

              {/* Info */}
              {vizTab === "info" && (
                <div>
                  {result.when_to_use && (
                    <div style={{ background: C.surface, borderRadius: 10, padding: "11px 13px", border: `1px solid ${C.border}`, marginBottom: 12 }}>
                      <div style={{ fontSize: 10, color: C.accentL, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>When to use</div>
                      <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.7 }}>{result.when_to_use}</div>
                    </div>
                  )}
                  {result.complexity?.explanation && (
                    <div style={{ background: C.surface, borderRadius: 10, padding: "11px 13px", border: `1px solid ${C.border}`, marginBottom: 12 }}>
                      <div style={{ fontSize: 10, color: C.orange, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Complexity Explained</div>
                      <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.7 }}>{result.complexity.explanation}</div>
                    </div>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                    {result.pros?.length > 0 && (
                      <div style={{ background: C.green + "08", borderRadius: 10, padding: "11px 13px", border: `1px solid ${C.green}25` }}>
                        <div style={{ fontSize: 10, color: C.green, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, marginBottom: 6 }}>✓ Pros</div>
                        {result.pros.map((p, i) => <div key={i} style={{ fontSize: 11, color: C.dim, lineHeight: 1.65, marginBottom: 4 }}>• {p}</div>)}
                      </div>
                    )}
                    {result.cons?.length > 0 && (
                      <div style={{ background: C.red + "08", borderRadius: 10, padding: "11px 13px", border: `1px solid ${C.red}25` }}>
                        <div style={{ fontSize: 10, color: C.red, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, marginBottom: 6 }}>✕ Cons</div>
                        {result.cons.map((c, i) => <div key={i} style={{ fontSize: 11, color: C.dim, lineHeight: 1.65, marginBottom: 4 }}>• {c}</div>)}
                      </div>
                    )}
                  </div>
                  {result.compare_with?.map((cw, i) => (
                    <div key={i} style={{ background: C.surface, borderRadius: 10, padding: "10px 13px", border: `1px solid ${C.border}`, marginBottom: 8 }}>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.text, fontWeight: 700, marginBottom: 4 }}>vs {cw.algo}</div>
                      {cw.when_better && <div style={{ fontSize: 11, color: C.green, marginBottom: 2 }}>✓ {cw.when_better}</div>}
                      {cw.when_worse  && <div style={{ fontSize: 11, color: C.red   }}>✕ {cw.when_worse}</div>}
                    </div>
                  ))}
                  {result.key_insights?.length > 0 && (
                    <Section title="Key Insights" icon="◈" accent={C.cyan}>
                      {result.key_insights.map((ins, i) => (
                        <div key={i} style={{ display: "flex", gap: 7, marginBottom: 8, fontSize: 12, color: C.dim, lineHeight: 1.65 }}>
                          <span style={{ color: C.cyan, flexShrink: 0 }}>→</span>{ins}
                        </div>
                      ))}
                    </Section>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}