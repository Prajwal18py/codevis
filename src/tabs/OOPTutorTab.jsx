// src/tabs/OOPTutorTab.jsx — Enhanced OOP Python-Tutor style
// Enhancements: keyboard nav, animated tab transitions, progress ring on stepper,
// collapsible concept cards, copy snippet, better empty states, subtle pulse on active step

import { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "../utils/ThemeContext";
import { Section, CodeBlock } from "../components/UI";

const OOP_META = [
  { key:"encapsulation",     label:"Encapsulation",                 icon:"🔒" },
  { key:"abstraction",       label:"Abstraction",                   icon:"🎭" },
  { key:"inheritance",       label:"Inheritance",                   icon:"🧬" },
  { key:"polymorphism",      label:"Polymorphism",                  icon:"🔄" },
  { key:"templates",         label:"Templates / Generics",          icon:"📐" },
  { key:"abstract_classes",  label:"Abstract Classes",              icon:"⬡"  },
  { key:"virtual_functions", label:"Virtual Functions",             icon:"◆"  },
  { key:"composition",       label:"Composition",                   icon:"🧩" },
  { key:"constructor_init",  label:"Constructor Initializer Lists", icon:"⚙"  },
  { key:"method_overriding", label:"Method Overriding",             icon:"↺"  },
];

// ─── Copy button ────────────────────────────────────────────────────────────
function CopyButton({ text }) {
  const { C } = useTheme();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };
  return (
    <button onClick={copy} style={{
      position: "absolute", top: 7, right: 7,
      background: copied ? C.green + "22" : C.surface,
      border: `1px solid ${copied ? C.green + "55" : C.border}`,
      borderRadius: 6, padding: "3px 8px",
      fontSize: 9, color: copied ? C.green : C.muted,
      fontFamily: "'JetBrains Mono',monospace", cursor: "pointer",
      transition: "all .2s",
    }}>
      {copied ? "✓ copied" : "copy"}
    </button>
  );
}

// ─── Progress ring ───────────────────────────────────────────────────────────
function ProgressRing({ cur, total, size = 34 }) {
  const { C } = useTheme();
  const r = (size / 2) - 3;
  const circ = 2 * Math.PI * r;
  const pct = total > 1 ? cur / (total - 1) : 1;
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={2.5} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={C.accentL} strokeWidth={2.5}
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: "stroke-dashoffset .35s ease", filter: `drop-shadow(0 0 3px ${C.accentL})` }}
      />
      <text x={size/2} y={size/2 + 4} textAnchor="middle"
        fontSize={9} fontFamily="JetBrains Mono" fill={C.accentL} fontWeight={700}>
        {cur + 1}/{total}
      </text>
    </svg>
  );
}

// ─── Step stepper ────────────────────────────────────────────────────────────
function ObjectStepper({ steps }) {
  const { C } = useTheme();
  const [cur, setCur] = useState(0);
  const containerRef = useRef(null);

  const go = useCallback((dir) => {
    setCur(c => Math.max(0, Math.min(steps.length - 1, c + dir)));
  }, [steps.length]);

  // Keyboard navigation when focused
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
        <div style={{ fontSize:30, opacity:0.12 }}>⚙</div>
        <div style={{ color:C.muted, fontSize:12, fontFamily:"'JetBrains Mono',monospace" }}>No walkthrough steps available.</div>
      </div>
    );
  }

  const s = steps[cur];

  return (
    <div ref={containerRef} tabIndex={0} style={{ outline:"none" }}>
      {/* Dot nav + progress ring */}
      <div style={{ display:"flex", gap:5, marginBottom:12, flexWrap:"wrap", alignItems:"center" }}>
        {steps.map((_, i) => (
          <div
            key={i}
            onClick={() => setCur(i)}
            title={`Step ${i + 1}`}
            style={{
              width:26, height:26, borderRadius:"50%",
              background: i === cur
                ? `linear-gradient(135deg,${C.accent},${C.cyan})`
                : i < cur ? C.green + "22" : C.surface,
              border:`1.5px solid ${i === cur ? C.accentL : i < cur ? C.green : C.border}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:10, fontWeight:700,
              color: i === cur ? "#fff" : i < cur ? C.green : C.muted,
              cursor:"pointer",
              transition:"all .2s",
              boxShadow: i === cur ? `0 0 10px ${C.accentL}55` : "none",
            }}
          >
            {i < cur ? "✓" : i + 1}
          </div>
        ))}
        <div style={{ marginLeft:"auto" }}>
          <ProgressRing cur={cur} total={steps.length} />
        </div>
      </div>

      {/* Step card — key forces remount for fade */}
      <div
        key={cur}
        style={{
          background:C.surface, borderRadius:12,
          border:`1px solid ${C.accentL}30`, padding:16, marginBottom:10,
          animation:"fadeSlideIn .22s ease",
        }}
      >
        <style>{`@keyframes fadeSlideIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:none } }`}</style>

        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:800, color:C.accentL, marginBottom:10 }}>
          Step {s.step}: {s.title}
        </div>

        {s.code_line && (
          <div style={{ position:"relative", marginBottom:10 }}>
            <pre style={{
              background:"#0a0a12", border:`1px solid ${C.cyan}35`,
              borderLeft:`3px solid ${C.cyan}`, borderRadius:8,
              padding:"8px 36px 8px 12px", fontSize:12, color:C.cyan,
              fontFamily:"'JetBrains Mono',monospace", overflowX:"auto", margin:0,
            }}>
              {s.code_line}
            </pre>
            <CopyButton text={s.code_line} />
          </div>
        )}

        <div style={{ fontSize:13, color:C.text, lineHeight:1.8, marginBottom:s.memory_state ? 10 : 0 }}>
          {s.explanation}
        </div>

        {s.memory_state && (
          <div style={{ background:C.green + "0c", border:`1px solid ${C.green}25`, borderRadius:8, padding:"8px 11px" }}>
            <div style={{ fontSize:9, color:C.green, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, marginBottom:4, textTransform:"uppercase", letterSpacing:1 }}>
              📦 Memory State
            </div>
            <div style={{ fontSize:11, color:C.green, fontFamily:"'JetBrains Mono',monospace", lineHeight:1.7 }}>
              {s.memory_state}
            </div>
          </div>
        )}
      </div>

      {/* Nav buttons */}
      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        <button
          onClick={() => go(-1)} disabled={cur === 0}
          style={{ flex:1, padding:"7px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:cur === 0 ? C.muted : C.text, cursor:cur === 0 ? "not-allowed" : "pointer", fontSize:12, transition:"all .15s" }}
        >
          ← Prev
        </button>
        <span style={{ fontSize:10, color:C.dim, fontFamily:"'JetBrains Mono',monospace", whiteSpace:"nowrap" }}>
          ↑↓ keys
        </span>
        <button
          onClick={() => go(1)} disabled={cur === steps.length - 1}
          style={{ flex:1, padding:"7px", borderRadius:8, border:`1px solid ${C.accentL}50`, background:C.accentL + "12", color:cur === steps.length - 1 ? C.muted : C.accentL, cursor:cur === steps.length - 1 ? "not-allowed" : "pointer", fontSize:12, fontWeight:700, transition:"all .15s" }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

// ─── Collapsible concept card ────────────────────────────────────────────────
function ConceptCard({ concept, d }) {
  const { C } = useTheme();
  const [open, setOpen] = useState(false);
  const used = d?.used;

  return (
    <div style={{
      background:C.surface, borderRadius:10,
      border:`1px solid ${used ? C.green + "40" : C.border}`,
      overflow:"hidden",
      transition:"border-color .2s",
    }}>
      <div
        onClick={() => used && setOpen(o => !o)}
        style={{
          display:"flex", alignItems:"center", gap:9,
          padding:"11px 13px", cursor:used ? "pointer" : "default",
        }}
      >
        <span style={{ fontSize:15 }}>{concept.icon}</span>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:used ? C.text : C.muted, fontWeight:used ? 700 : 400, flex:1 }}>
          {concept.label}
        </span>
        {used && (
          <span style={{ fontSize:9, color:C.muted, fontFamily:"'JetBrains Mono',monospace", marginRight:4 }}>
            {open ? "▲" : "▼"}
          </span>
        )}
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:used ? C.green : C.muted, fontWeight:700 }}>
          {used ? "✓ Used" : "✗ Not used"}
        </span>
      </div>

      {used && open && (
        <div style={{ padding:"0 13px 11px 37px", display:"flex", flexDirection:"column", gap:6, animation:"fadeSlideIn .18s ease" }}>
          {d.where && (
            <div style={{ fontSize:11, color:C.cyan, fontFamily:"'JetBrains Mono',monospace" }}>
              ↳ {d.where}
            </div>
          )}
          {d.explanation && (
            <div style={{ fontSize:12, color:C.dim, lineHeight:1.65 }}>
              {d.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main tab ────────────────────────────────────────────────────────────────
export default function OOPTutorTab({ result }) {
  const { C } = useTheme();
  const [tab, setTab] = useState("tutor");
  const [prevTab, setPrevTab] = useState(null);

  const changeTab = (id) => {
    setPrevTab(tab);
    setTab(id);
  };

  if (!result) return null;

  const tabs = [
    { id:"tutor",    label:"🎓 Step-by-Step" },
    { id:"concepts", label:"📚 OOP Concepts"  },
    { id:"explain",  label:"💡 Deep Dive"     },
  ];

  return (
    <div>
      <style>{`
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:none } }
        @keyframes tabFadeIn   { from { opacity:0; transform:translateX(8px) } to { opacity:1; transform:none } }
      `}</style>

      {/* Summary banner */}
      {result.summary && (
        <div style={{
          background:C.accentL + "0c", border:`1px solid ${C.accentL}28`,
          borderRadius:10, padding:"11px 14px", marginBottom:14,
          fontSize:13, color:C.text, lineHeight:1.7,
        }}>
          <span style={{ color:C.accentL, fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:1 }}>
            What this code does{"  "}
          </span>
          {result.summary}
        </div>
      )}

      {/* Tab bar */}
      <div style={{
        display:"flex", gap:3,
        background:C.surface, borderRadius:9, padding:3,
        border:`1px solid ${C.border}`, marginBottom:14,
      }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => changeTab(t.id)}
            style={{
              flex:1, padding:"7px", borderRadius:7, border:"none",
              background: tab === t.id ? C.card : "transparent",
              color: tab === t.id ? C.accentL : C.muted,
              fontFamily:"'JetBrains Mono',monospace", fontSize:11,
              cursor:"pointer", transition:"all .15s",
              fontWeight: tab === t.id ? 700 : 400,
              boxShadow: tab === t.id ? `0 1px 6px ${C.accentL}18` : "none",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content — keyed for animation */}
      <div key={tab} style={{ animation:"tabFadeIn .2s ease" }}>

        {/* ── Step-by-step ── */}
        {tab === "tutor" && (
          <div>
            <div style={{ fontSize:10, color:C.muted, fontFamily:"'JetBrains Mono',monospace", textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>
              Object Creation Walkthrough
            </div>
            <ObjectStepper steps={result.object_creation_steps} />

            {result.key_insights?.length > 0 && (
              <div style={{ marginTop:14 }}>
                <Section title="Key Insights" icon="◈" accent={C.cyan}>
                  {result.key_insights.map((ins, i) => (
                    <div key={i} style={{ display:"flex", gap:7, marginBottom:8, fontSize:12, color:C.dim, lineHeight:1.65 }}>
                      <span style={{ color:C.cyan, flexShrink:0 }}>→</span>{ins}
                    </div>
                  ))}
                </Section>
              </div>
            )}
          </div>
        )}

        {/* ── OOP checklist ── */}
        {tab === "concepts" && (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {OOP_META.map(concept => (
              <ConceptCard
                key={concept.key}
                concept={concept}
                d={result.oop_analysis?.[concept.key]}
              />
            ))}
          </div>
        )}

        {/* ── Deep dive ── */}
        {tab === "explain" && (
          <div>
            {result.concept_explanations?.length > 0 ? (
              result.concept_explanations.map((ce, i) => (
                <div key={i} style={{
                  background:C.surface, borderRadius:12,
                  border:`1px solid ${C.border}`, padding:"13px 14px", marginBottom:12,
                }}>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:800, color:C.accentL, marginBottom:8 }}>
                    {ce.concept}
                  </div>

                  {ce.simple_analogy && (
                    <div style={{
                      background:C.orange + "0c", border:`1px solid ${C.orange}28`,
                      borderRadius:8, padding:"8px 11px", marginBottom:8,
                      fontSize:12, color:C.orange, lineHeight:1.65,
                    }}>
                      🟠 <strong>Analogy:</strong> {ce.simple_analogy}
                    </div>
                  )}

                  {ce.what_it_does_here && (
                    <div style={{ fontSize:12, color:C.dim, lineHeight:1.7, marginBottom:ce.code_snippet ? 8 : 0 }}>
                      <span style={{ color:C.text, fontWeight:600 }}>In this code: </span>
                      {ce.what_it_does_here}
                    </div>
                  )}

                  {ce.code_snippet && (
                    <div style={{ position:"relative" }}>
                      <CodeBlock code={ce.code_snippet} />
                      <CopyButton text={ce.code_snippet} />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:160, gap:10 }}>
                <div style={{ fontSize:30, opacity:0.12 }}>💡</div>
                <div style={{ color:C.muted, fontSize:12, fontFamily:"'JetBrains Mono',monospace" }}>
                  No deep dive explanations available.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}