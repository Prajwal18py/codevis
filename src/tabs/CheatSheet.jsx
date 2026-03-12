// src/tabs/CheatSheet.jsx — Enhanced AI-generated printable cheat sheet
// Enhancements: dual-ring loader, shimmer skeleton, copy code button,
// topic pill hover states, staggered card entrance animations,
// print button with feedback, error inline display, keyboard generate on Enter

import { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "../utils/ThemeContext";
import { callGroq } from "../utils/groq";

const TOPICS = [
  "Bubble Sort","Merge Sort","Quick Sort","Binary Search",
  "BFS","DFS","Dijkstra's Algorithm","Dynamic Programming",
  "OOP Inheritance","OOP Polymorphism","Virtual Functions","Templates",
  "Linked Lists","Binary Trees","Hash Maps","Recursion",
];

function buildCheatPrompt(topic) {
  return `Create a concise cheat sheet for "${topic}" for a CS student.
Return JSON only.

{
  "topic": "${topic}",
  "category": "Sorting|Searching|Graph|DP|OOP|Data Structure",
  "one_liner": "one sentence what it is",
  "key_concept": "the most important thing to remember",
  "complexity": {
    "time": "O(n log n)", "space": "O(n)",
    "note": "one sentence context"
  },
  "steps": [
    "Step 1: description",
    "Step 2: description",
    "Step 3: description"
  ],
  "code": "clean, minimal C++ implementation with short comments",
  "tips": [
    "Tip 1: practical tip",
    "Tip 2: common trap to avoid"
  ],
  "when_to_use": "2-3 scenarios where you pick this",
  "avoid_when": "when NOT to use this",
  "related": ["related topic 1", "related topic 2"]
}`;
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
      position: "absolute", top: 7, right: 7,
      background: copied ? C.green + "22" : "#0a0a1288",
      border: `1px solid ${copied ? C.green + "55" : C.border}`,
      borderRadius: 6, padding: "3px 8px",
      fontSize: 9, color: copied ? C.green : C.muted,
      fontFamily: "'JetBrains Mono',monospace", cursor: "pointer", transition: "all .2s",
    }}>
      {copied ? "✓ copied" : "copy"}
    </button>
  );
}

// ─── FadeIn ───────────────────────────────────────────────────────────────────
function FadeIn({ delay = 0, children }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{ opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(8px)", transition: "all .3s ease" }}>
      {children}
    </div>
  );
}

export default function CheatSheet() {
  const { C } = useTheme();
  const [topic,     setTopic]     = useState("Bubble Sort");
  const [custom,    setCustom]    = useState("");
  const [sheet,     setSheet]     = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [printing,  setPrinting]  = useState(false);
  const printRef = useRef(null);

  async function generate() {
    const t = custom.trim() || topic;
    setLoading(true); setSheet(null); setError("");
    try {
      const res = await callGroq(buildCheatPrompt(t));
      setSheet(res);
    } catch(e) {
      setError("Failed to generate — try again.");
    } finally { setLoading(false); }
  }

  // Enter key in custom input
  const onKeyDown = useCallback((e) => {
    if (e.key === "Enter") generate();
  }, [topic, custom]);

  function printSheet() {
    const el = printRef.current;
    if (!el) return;
    setPrinting(true);
    const win = window.open("", "_blank");
    win.document.write(`
      <html><head><title>${sheet.topic} Cheat Sheet</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Syne:wght@800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #fff; color: #111; font-family: 'JetBrains Mono', monospace; padding: 32px; }
        h1 { font-family: 'Syne', sans-serif; font-size: 28px; color: #7c3aed; margin-bottom: 4px; }
        .tag { display: inline-block; background: #7c3aed22; color: #7c3aed; border: 1px solid #7c3aed44; border-radius: 12px; padding: 2px 10px; font-size: 11px; margin-bottom: 16px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
        .card { border: 1.5px solid #e0e0e0; border-radius: 10px; padding: 14px; }
        .card h2 { font-size: 11px; color: #7c3aed; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
        .card p, .card li { font-size: 12px; color: #333; line-height: 1.7; }
        ul { padding-left: 16px; }
        pre { background: #f5f5f5; border-radius: 8px; padding: 12px; font-size: 11px; color: #333; overflow-x: auto; white-space: pre-wrap; }
        .complexity { display: flex; gap: 12px; }
        .badge { background: #f0f0f0; border-radius: 6px; padding: 3px 10px; font-size: 12px; font-weight: 700; }
        .footer { margin-top: 20px; font-size: 10px; color: #999; text-align: center; }
      </style></head><body>
      <h1>${sheet.topic}</h1>
      <span class="tag">${sheet.category}</span>
      <p style="font-size:14px; color:#555; margin-bottom:16px">${sheet.one_liner}</p>
      <div style="background:#7c3aed11; border:1px solid #7c3aed30; border-radius:8px; padding:12px; margin-bottom:16px;">
        <strong style="color:#7c3aed; font-size:11px">KEY CONCEPT: </strong>
        <span style="font-size:13px">${sheet.key_concept}</span>
      </div>
      <div class="grid">
        <div class="card">
          <h2>⏱ Complexity</h2>
          <div class="complexity">
            <span class="badge">Time: ${sheet.complexity?.time}</span>
            <span class="badge">Space: ${sheet.complexity?.space}</span>
          </div>
          <p style="margin-top:6px;font-size:11px;color:#888">${sheet.complexity?.note}</p>
        </div>
        <div class="card">
          <h2>📋 Steps</h2>
          <ul>${sheet.steps?.map(s=>`<li>${s}</li>`).join("")}</ul>
        </div>
        <div class="card" style="grid-column:1/-1">
          <h2>💻 Code</h2>
          <pre>${sheet.code?.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</pre>
        </div>
        <div class="card">
          <h2>✅ When to Use</h2>
          <p>${sheet.when_to_use}</p>
        </div>
        <div class="card">
          <h2>❌ Avoid When</h2>
          <p>${sheet.avoid_when}</p>
        </div>
        <div class="card">
          <h2>💡 Tips</h2>
          <ul>${sheet.tips?.map(t=>`<li>${t}</li>`).join("")}</ul>
        </div>
        <div class="card">
          <h2>🔗 Related</h2>
          ${sheet.related?.map(r=>`<span class="badge" style="margin:2px;display:inline-block">${r}</span>`).join("")}
        </div>
      </div>
      <div class="footer">Generated by CODEVIS • ${new Date().toLocaleDateString()}</div>
      </body></html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); setPrinting(false); }, 500);
  }

  const catColor = c => ({ Sorting: C.cyan, Searching: C.green, Graph: C.orange, DP: C.accentL, OOP: C.coral, "Data Structure": C.teal }[c] || C.accentL);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <style>{`
        @keyframes spin    { to { transform:rotate(360deg) } }
        @keyframes shimmer { 0%{opacity:.35} 50%{opacity:.7} 100%{opacity:.35} }
      `}</style>

      {/* Topic picker */}
      <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: 14 }}>
        <div style={{ fontSize: 10, color: C.muted, fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Generate a cheat sheet for:</div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
          {TOPICS.map(t => {
            const active = topic === t && !custom;
            return (
              <button key={t} onClick={() => { setTopic(t); setCustom(""); }} style={{
                padding: "4px 10px", borderRadius: 20,
                border: `1px solid ${active ? C.accentL + "60" : C.border}`,
                background: active ? C.accentL + "18" : "transparent",
                color: active ? C.accentL : C.muted,
                fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
                cursor: "pointer", transition: "all .15s",
                fontWeight: active ? 700 : 400,
              }}>
                {t}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={custom}
            onChange={e => setCustom(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Or type any topic... (Enter to generate)"
            style={{ flex: 1, background: C.card, border: `1px solid ${custom ? C.accentL + "50" : C.border}`, color: C.text, borderRadius: 8, padding: "7px 11px", fontFamily: "'JetBrains Mono',monospace", fontSize: 12, outline: "none", transition: "border-color .2s" }}
          />
          <button onClick={generate} disabled={loading} style={{ padding: "7px 20px", borderRadius: 8, border: "none", background: loading ? C.accentL + "30" : `linear-gradient(135deg,${C.accent},${C.accentL})`, color: "#fff", fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", whiteSpace: "nowrap", transition: "opacity .2s" }}>
            {loading ? "⟳ Generating..." : "📄 Generate"}
          </button>
        </div>
        {error && (
          <div style={{ marginTop: 8, background: C.red + "0f", border: `1px solid ${C.red}30`, borderRadius: 7, padding: "6px 10px", color: C.red, fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}>
            ⚠ {error}
          </div>
        )}
      </div>

      {/* Loading with dual ring + skeleton */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: 40 }}>
          <div style={{ position: "relative", width: 48, height: 48 }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `3px solid ${C.border}` }} />
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "3px solid transparent", borderTopColor: C.accentL, animation: "spin .8s linear infinite" }} />
            <div style={{ position: "absolute", inset: 6, borderRadius: "50%", border: "2px solid transparent", borderTopColor: C.cyan, animation: "spin 1.2s linear infinite reverse" }} />
          </div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", color: C.accentL, fontSize: 12 }}>Generating cheat sheet...</div>
          {/* Skeleton */}
          <div style={{ width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", gap: 8 }}>
            {[90, 70, 50, 80, 60].map((w, i) => (
              <div key={i} style={{ height: 10, width: `${w}%`, background: C.surface, borderRadius: 6, animation: `shimmer 1.5s ease-in-out ${i * 0.12}s infinite` }} />
            ))}
          </div>
        </div>
      )}

      {/* Sheet content */}
      {sheet && !loading && (
        <div ref={printRef}>
          {/* Header */}
          <FadeIn delay={0}>
            <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 4 }}>{sheet.topic}</div>
                  <div style={{ display: "inline-block", background: catColor(sheet.category) + "20", color: catColor(sheet.category), border: `1px solid ${catColor(sheet.category)}40`, borderRadius: 12, padding: "2px 10px", fontSize: 10, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>{sheet.category}</div>
                </div>
                <button
                  onClick={printSheet}
                  disabled={printing}
                  style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: printing ? C.green + "30" : `linear-gradient(135deg,${C.green},${C.teal})`, color: "#fff", fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 800, cursor: printing ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all .2s" }}
                >
                  {printing ? "⟳ Opening..." : "🖨️ Print / Save PDF"}
                </button>
              </div>
              <div style={{ fontSize: 13, color: C.dim, lineHeight: 1.7, marginTop: 10 }}>{sheet.one_liner}</div>
            </div>
          </FadeIn>

          {/* Key concept */}
          <FadeIn delay={60}>
            <div style={{ background: C.accentL + "0c", border: `1px solid ${C.accentL}28`, borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
              <div style={{ fontSize: 9, color: C.accentL, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 }}>💡 Key Concept</div>
              <div style={{ fontSize: 13, color: C.text, lineHeight: 1.75 }}>{sheet.key_concept}</div>
            </div>
          </FadeIn>

          {/* 2-col grid */}
          <FadeIn delay={120}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              {/* Complexity */}
              <div style={{ background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, padding: "12px 14px" }}>
                <div style={{ fontSize: 9, color: C.orange, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>⏱ Complexity</div>
                <div style={{ display: "flex", gap: 7, marginBottom: 6 }}>
                  <div style={{ background: C.orange + "18", border: `1px solid ${C.orange}30`, borderRadius: 6, padding: "3px 10px", fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: C.orange, fontWeight: 700 }}>Time: {sheet.complexity?.time}</div>
                  <div style={{ background: C.blue + "18", border: `1px solid ${C.blue}30`, borderRadius: 6, padding: "3px 10px", fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: C.blue, fontWeight: 700 }}>Space: {sheet.complexity?.space}</div>
                </div>
                <div style={{ fontSize: 11, color: C.dim, lineHeight: 1.6 }}>{sheet.complexity?.note}</div>
              </div>

              {/* Steps */}
              <div style={{ background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, padding: "12px 14px" }}>
                <div style={{ fontSize: 9, color: C.cyan, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>📋 Steps</div>
                {sheet.steps?.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 7, marginBottom: 5, fontSize: 11, color: C.dim, lineHeight: 1.55 }}>
                    <span style={{ color: C.cyan, flexShrink: 0, fontWeight: 700 }}>{i + 1}.</span>{s.replace(/^Step \d+:\s*/, "")}
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* Code */}
          <FadeIn delay={180}>
            <div style={{ background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, padding: "12px 14px", marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: C.green, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>💻 Code</div>
              <div style={{ position: "relative" }}>
                <pre style={{ background: "#0a0a12", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 38px 10px 13px", fontSize: 11, color: C.cyan, fontFamily: "'JetBrains Mono',monospace", overflowX: "auto", lineHeight: 1.7, margin: 0 }}>
                  {sheet.code}
                </pre>
                <CopyButton text={sheet.code} />
              </div>
            </div>
          </FadeIn>

          {/* Bottom 4-col grid */}
          <FadeIn delay={240}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
              <div style={{ background: C.green + "08", borderRadius: 10, border: `1px solid ${C.green}25`, padding: "11px 13px" }}>
                <div style={{ fontSize: 9, color: C.green, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, marginBottom: 6 }}>✅ When to Use</div>
                <div style={{ fontSize: 11, color: C.dim, lineHeight: 1.65 }}>{sheet.when_to_use}</div>
              </div>
              <div style={{ background: C.red + "08", borderRadius: 10, border: `1px solid ${C.red}25`, padding: "11px 13px" }}>
                <div style={{ fontSize: 9, color: C.red, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, marginBottom: 6 }}>❌ Avoid When</div>
                <div style={{ fontSize: 11, color: C.dim, lineHeight: 1.65 }}>{sheet.avoid_when}</div>
              </div>
              <div style={{ background: C.orange + "08", borderRadius: 10, border: `1px solid ${C.orange}25`, padding: "11px 13px" }}>
                <div style={{ fontSize: 9, color: C.orange, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, marginBottom: 6 }}>💡 Tips</div>
                {sheet.tips?.map((t, i) => <div key={i} style={{ fontSize: 11, color: C.dim, lineHeight: 1.6, marginBottom: 4 }}>• {t}</div>)}
              </div>
              <div style={{ background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, padding: "11px 13px" }}>
                <div style={{ fontSize: 9, color: C.accentL, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, marginBottom: 8 }}>🔗 Related</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {sheet.related?.map((r, i) => (
                    <span key={i} style={{ background: C.accentL + "15", border: `1px solid ${C.accentL}30`, borderRadius: 10, padding: "2px 8px", fontSize: 10, color: C.accentL, fontFamily: "'JetBrains Mono',monospace" }}>{r}</span>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      )}
    </div>
  );
}