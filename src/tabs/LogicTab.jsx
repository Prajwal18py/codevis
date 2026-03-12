// src/tabs/LogicTab.jsx — Enhanced
// Enhancements: staggered mount animations, expandable approach cards with copy,
// hover states on sections, better empty states, pattern badge, collapsible sections

import { useState, useEffect } from "react";
import { useTheme } from "../utils/ThemeContext";
import { Badge, DiffBadge, Section, CodeBlock } from "../components/UI";

// ─── Copy button ──────────────────────────────────────────────────────────────
function CopyButton({ text }) {
  const { C } = useTheme();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  };
  return (
    <button onClick={e => { e.stopPropagation(); copy(); }} style={{
      position:"absolute", top:7, right:7,
      background: copied ? C.green+"22" : C.surface,
      border:`1px solid ${copied ? C.green+"55" : C.border}`,
      borderRadius:6, padding:"3px 8px",
      fontSize:9, color:copied ? C.green : C.muted,
      fontFamily:"'JetBrains Mono',monospace", cursor:"pointer",
      transition:"all .2s",
    }}>
      {copied ? "✓ copied" : "copy"}
    </button>
  );
}

// ─── Animated section wrapper ─────────────────────────────────────────────────
function FadeIn({ delay = 0, children }) {
  const { C } = useTheme();
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{ opacity:vis?1:0, transform:vis?"translateY(0)":"translateY(10px)", transition:"all .3s ease" }}>
      {children}
    </div>
  );
}

// ─── Approach card ────────────────────────────────────────────────────────────
function ApproachCard({ ap, index, delay }) {
  const { C } = useTheme();
  const [open, setOpen] = useState(index === 0);
  const [hovered, setHovered] = useState(false);
  const col = index === 0 ? C.orange : C.green;

  return (
    <FadeIn delay={delay}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ background:C.surface, borderRadius:12, border:`1px solid ${hovered?col+"50":col+"28"}`, marginBottom:12, overflow:"hidden", transition:"border-color .2s" }}
      >
        {/* Header */}
        <div
          onClick={() => setOpen(o => !o)}
          style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", cursor:"pointer", background:col+"08" }}
        >
          <div style={{ width:28, height:28, borderRadius:"50%", background:col+"20", border:`1px solid ${col}50`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color:col, fontWeight:800, flexShrink:0 }}>
            {index===0 ? "⊘" : "★"}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:800, color:col }}>{ap.name}</div>
            {!open && ap.explanation && (
              <div style={{ fontSize:11, color:C.muted, marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:200 }}>
                {ap.explanation}
              </div>
            )}
          </div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            <Badge color={col}>Time: {ap.time}</Badge>
            <Badge color={col}>Space: {ap.space}</Badge>
          </div>
          <span style={{ color:C.muted, fontSize:10, transform:open?"rotate(90deg)":"rotate(0deg)", transition:"transform .2s", flexShrink:0, marginLeft:4 }}>▶</span>
        </div>

        {/* Body */}
        {open && (
          <div style={{ padding:"12px 14px", animation:"fadeSlideIn .18s ease" }}>
            <div style={{ fontSize:12, color:C.dim, lineHeight:1.75, marginBottom:ap.pseudocode||ap.code?10:0 }}>
              {ap.explanation || ap.plain_explanation}
            </div>

            {(ap.why_slow||ap.why_fast) && (
              <div style={{ background:col+"0c", border:`1px solid ${col}25`, borderRadius:8, padding:"8px 11px", marginBottom:ap.pseudocode||ap.code?10:0, fontSize:12, color:col, lineHeight:1.65 }}>
                {index===0 ? "🐢 Why slow: "+ap.why_slow : "⚡ Why fast: "+ap.why_fast}
              </div>
            )}

            {(ap.pseudocode || ap.code) && (
              <div>
                <div style={{ fontSize:9, color:C.cyan, fontFamily:"'JetBrains Mono',monospace", textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>
                  {ap.code ? "💻 Full Code" : "📋 Pseudocode"}
                </div>
                <div style={{ position:"relative" }}>
                  <CodeBlock code={ap.code || ap.pseudocode} />
                  <CopyButton text={ap.code || ap.pseudocode} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </FadeIn>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────
export default function LogicTab({ result }) {
  const { C } = useTheme();
  if (!result) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:200, gap:10 }}>
        <div style={{ fontSize:32, opacity:0.12 }}>🧠</div>
        <div style={{ color:C.muted, fontSize:12, fontFamily:"'JetBrains Mono',monospace" }}>No analysis available.</div>
      </div>
    );
  }

  return (
    <div>
      <style>{`@keyframes fadeSlideIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:none } }`}</style>

      {/* Problem header */}
      {result.problem_name && (
        <FadeIn delay={0}>
          <div style={{ background:C.surface, borderRadius:10, padding:"12px 14px", marginBottom:12, border:`1px solid ${C.border}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:result.topic_tags?.length?6:0 }}>
              <span style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:800, color:C.text }}>{result.problem_name}</span>
              {result.difficulty && <DiffBadge d={result.difficulty} />}
              {result.leetcode_pattern && <Badge color={C.orange}>{result.leetcode_pattern}</Badge>}
            </div>
            {result.topic_tags?.length > 0 && (
              <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                {result.topic_tags.map((t, i) => <Badge key={i} color={C.blue} size={10}>{t}</Badge>)}
              </div>
            )}
          </div>
        </FadeIn>
      )}

      {/* Core intuition */}
      {result.core_intuition && (
        <FadeIn delay={60}>
          <div style={{ background:C.accentL+"0c", border:`1px solid ${C.accentL}28`, borderRadius:10, padding:"12px 14px", marginBottom:12 }}>
            <div style={{ fontSize:10, color:C.accentL, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, marginBottom:5, textTransform:"uppercase", letterSpacing:1 }}>
              💡 Core Intuition
            </div>
            <div style={{ fontSize:12, color:C.text, lineHeight:1.75 }}>{result.core_intuition}</div>
          </div>
        </FadeIn>
      )}

      {/* Approaches */}
      {result.approaches?.length > 0 ? (
        <div>
          <div style={{ fontSize:10, color:C.muted, fontFamily:"'JetBrains Mono',monospace", textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>
            Approaches
          </div>
          {result.approaches.map((ap, i) => (
            <ApproachCard key={i} ap={ap} index={i} delay={100 + i * 60} />
          ))}
        </div>
      ) : (
        <FadeIn delay={100}>
          <div style={{ background:C.surface, borderRadius:10, padding:"16px 14px", marginBottom:12, border:`1px solid ${C.border}`, textAlign:"center", color:C.muted, fontSize:12, fontFamily:"'JetBrains Mono',monospace" }}>
            No approaches available.
          </div>
        </FadeIn>
      )}

      {/* Key insights */}
      {result.key_insights?.length > 0 && (
        <FadeIn delay={200}>
          <Section title="Key Insights" icon="◈" accent={C.cyan}>
            {result.key_insights.map((ins, i) => (
              <div key={i} style={{ display:"flex", gap:7, marginBottom:8, fontSize:12, color:C.dim, lineHeight:1.65 }}>
                <span style={{ color:C.cyan, flexShrink:0 }}>→</span>{ins}
              </div>
            ))}
          </Section>
        </FadeIn>
      )}

      {/* Common mistakes */}
      {result.common_mistakes?.length > 0 && (
        <FadeIn delay={260}>
          <Section title="Common Mistakes" icon="⚠" accent={C.red}>
            {result.common_mistakes.map((m, i) => (
              <div key={i} style={{ display:"flex", gap:7, marginBottom:8, fontSize:12, color:C.red+"cc", lineHeight:1.65, background:C.red+"08", padding:"6px 9px", borderRadius:7 }}>
                <span style={{ flexShrink:0 }}>✕</span>{m}
              </div>
            ))}
          </Section>
        </FadeIn>
      )}
    </div>
  );
}