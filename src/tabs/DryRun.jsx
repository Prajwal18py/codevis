// src/tabs/DryRun.jsx — Enhanced
// Enhancements: speed control, keyboard nav, progress ring, animated step expand,
// completion celebration state, copy code line, scrolls active step into view

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "../utils/ThemeContext";

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
function CopyButton({ text }) {
  const { C } = useTheme();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  };
  return (
    <button onClick={e => { e.stopPropagation(); copy(); }} style={{
      position:"absolute", top:6, right:6,
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

// ─── Progress ring ────────────────────────────────────────────────────────────
function ProgressRing({ cur, total, size = 40 }) {
  const { C } = useTheme();
  const done = cur >= total - 1;
  const r    = size / 2 - 3;
  const circ = 2 * Math.PI * r;
  const pct  = total > 1 ? cur / (total - 1) : 1;
  const col  = done ? C.green : C.accentL;
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={2.5} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={2.5}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition:"stroke-dashoffset .35s ease", filter:`drop-shadow(0 0 4px ${col})` }} />
      <text x={size/2} y={size/2-2} textAnchor="middle" fontSize={9} fontFamily="JetBrains Mono" fill={col} fontWeight={700}>
        {done ? "✓" : `${cur+1}`}
      </text>
      <text x={size/2} y={size/2+9} textAnchor="middle" fontSize={7} fontFamily="JetBrains Mono" fill={C.muted}>
        {done ? "done" : `/${total}`}
      </text>
    </svg>
  );
}

const SPEEDS = [
  { label:"0.5×", ms:3600 },
  { label:"1×",   ms:1800 },
  { label:"2×",   ms:900  },
  { label:"3×",   ms:500  },
];

export default function DryRun({ steps }) {
  const { C } = useTheme();
  const [cur,      setCur]      = useState(0);
  const [playing,  setPlaying]  = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1); // default 1×
  const timerRef   = useRef(null);
  const containerRef = useRef(null);
  const activeRef  = useRef(null);

  const done = cur >= (steps?.length || 1) - 1;

  // Auto-play
  useEffect(() => {
    clearInterval(timerRef.current);
    if (playing && !done) {
      timerRef.current = setInterval(() => {
        setCur(c => {
          if (c >= steps.length - 1) { setPlaying(false); return c; }
          return c + 1;
        });
      }, SPEEDS[speedIdx].ms);
    }
    return () => clearInterval(timerRef.current);
  }, [playing, steps?.length, speedIdx, done]);

  // Scroll active step into view
  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior:"smooth", block:"nearest" });
  }, [cur]);

  // Keyboard nav
  const go = useCallback((dir) => {
    setPlaying(false);
    setCur(c => Math.max(0, Math.min((steps?.length||1) - 1, c + dir)));
  }, [steps?.length]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e) => {
      if (e.key==="ArrowRight"||e.key==="ArrowDown") { e.preventDefault(); go(1); }
      if (e.key==="ArrowLeft" ||e.key==="ArrowUp")   { e.preventDefault(); go(-1); }
      if (e.key===" ")                                { e.preventDefault(); setPlaying(p => !p); }
      if (e.key==="Home") { e.preventDefault(); setCur(0); }
      if (e.key==="End")  { e.preventDefault(); setCur(steps.length-1); }
    };
    el.addEventListener("keydown", handler);
    return () => el.removeEventListener("keydown", handler);
  }, [go, steps?.length]);

  if (!steps?.length) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:200, gap:10 }}>
        <div style={{ fontSize:32, opacity:0.12 }}>▶</div>
        <div style={{ color:C.muted, fontSize:12, fontFamily:"'JetBrains Mono',monospace" }}>No dry run steps available.</div>
      </div>
    );
  }

  const stateColor = i => i < cur ? C.green : i === cur ? C.accentL : C.muted;
  const stateBg    = i => i < cur ? C.green+"10" : i === cur ? C.accentL+"14" : "transparent";

  return (
    <div ref={containerRef} tabIndex={0} style={{ outline:"none", display:"flex", flexDirection:"column", gap:12 }}>
      <style>{`@keyframes fadeSlideIn { from { opacity:0; transform:translateY(5px) } to { opacity:1; transform:none } }`}</style>

      {/* Controls bar */}
      <div style={{ display:"flex", alignItems:"center", gap:8, background:C.surface, borderRadius:10, padding:"9px 12px", border:`1px solid ${C.border}` }}>
        <button
          onClick={() => go(-1)} disabled={cur===0}
          style={{ background:C.card, border:`1px solid ${C.border}`, color:cur===0?C.muted:C.text, borderRadius:7, padding:"5px 11px", cursor:cur===0?"not-allowed":"pointer", fontSize:12, transition:"all .15s" }}
        >← Prev</button>

        <button
          onClick={() => {
            if (done && !playing) { setCur(0); setTimeout(() => setPlaying(true), 50); return; }
            setPlaying(p => !p);
          }}
          style={{ background:playing ? C.orange+"20" : C.accentL+"20", border:`1px solid ${playing?C.orange:C.accentL}60`, color:playing?C.orange:C.accentL, borderRadius:7, padding:"5px 14px", cursor:"pointer", fontSize:12, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, transition:"all .15s" }}
        >
          {playing ? "⏸ Pause" : done ? "↺ Replay" : "▶ Auto Play"}
        </button>

        <button
          onClick={() => go(1)} disabled={done}
          style={{ background:C.card, border:`1px solid ${C.border}`, color:done?C.muted:C.text, borderRadius:7, padding:"5px 11px", cursor:done?"not-allowed":"pointer", fontSize:12, transition:"all .15s" }}
        >Next →</button>

        {/* Speed selector */}
        <div style={{ display:"flex", gap:3, marginLeft:4 }}>
          {SPEEDS.map((sp, i) => (
            <button key={i} onClick={() => setSpeedIdx(i)} style={{
              padding:"3px 7px", borderRadius:5, border:`1px solid ${speedIdx===i?C.accentL+"60":C.border}`,
              background: speedIdx===i ? C.accentL+"18" : "transparent",
              color: speedIdx===i ? C.accentL : C.muted,
              fontSize:9, fontFamily:"'JetBrains Mono',monospace", cursor:"pointer",
              transition:"all .15s",
            }}>
              {sp.label}
            </button>
          ))}
        </div>

        <div style={{ marginLeft:"auto" }}>
          <ProgressRing cur={cur} total={steps.length} />
        </div>
      </div>

      {/* Completion banner */}
      {done && (
        <div style={{ background:C.green+"0f", border:`1px solid ${C.green}35`, borderRadius:10, padding:"10px 14px", display:"flex", alignItems:"center", gap:10, animation:"fadeSlideIn .3s ease" }}>
          <span style={{ fontSize:18 }}>🎉</span>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:C.green, fontFamily:"'Syne',sans-serif" }}>Dry run complete!</div>
            <div style={{ fontSize:10, color:C.dim, fontFamily:"'JetBrains Mono',monospace" }}>All {steps.length} steps traced. Press Space or click Replay to restart.</div>
          </div>
        </div>
      )}

      {/* Keyboard hint */}
      <div style={{ fontSize:9, color:C.muted, fontFamily:"'JetBrains Mono',monospace", textAlign:"right", marginTop:-6 }}>
        ← → arrow keys · Space to play/pause
      </div>

      {/* Step list */}
      <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
        {steps.map((s, i) => {
          const active = i === cur;
          return (
            <div
              key={i}
              ref={active ? activeRef : null}
              onClick={() => { setCur(i); setPlaying(false); }}
              style={{
                display:"flex", gap:12, padding:"11px 13px",
                borderRadius:10, border:`1px solid ${stateColor(i)}30`,
                background:stateBg(i), cursor:"pointer",
                transition:"all .2s",
                boxShadow: active ? `0 0 0 1px ${C.accentL}22, 0 2px 12px ${C.accentL}10` : "none",
              }}
            >
              {/* Step number / checkmark */}
              <div style={{
                flexShrink:0, width:24, height:24, borderRadius:"50%",
                background: active ? `linear-gradient(135deg,${C.accent},${C.cyan})` : stateColor(i)+"22",
                border:`1.5px solid ${stateColor(i)}60`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:10, fontWeight:700, color:active?"#fff":stateColor(i),
                fontFamily:"'JetBrains Mono',monospace",
                boxShadow: active ? `0 0 8px ${C.accentL}55` : "none",
                transition:"all .2s",
              }}>
                {i < cur ? "✓" : i+1}
              </div>

              {/* Content */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700, color:stateColor(i), marginBottom:active?5:0, transition:"color .2s" }}>
                  {s.title}
                </div>

                {active && (
                  <div style={{ animation:"fadeSlideIn .18s ease" }}>
                    <div style={{ fontSize:12, color:C.dim, lineHeight:1.7, marginBottom:s.code_line?6:0 }}>
                      {s.description}
                    </div>
                    {s.code_line && (
                      <div style={{ position:"relative" }}>
                        <pre style={{ background:"#0a0a12", border:`1px solid ${C.accentL}30`, borderRadius:7, padding:"6px 38px 6px 10px", fontSize:10, color:C.accentL, fontFamily:"'JetBrains Mono',monospace", margin:0, overflowX:"auto" }}>
                          {cleanCode(s.code_line)}
                        </pre>
                        <CopyButton text={cleanCode(s.code_line)} />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* State label */}
              <div style={{ flexShrink:0, fontSize:9, color:stateColor(i), fontFamily:"'JetBrains Mono',monospace", alignSelf:"flex-start", paddingTop:6, transition:"color .2s" }}>
                {i < cur ? "done" : i===cur ? "active" : "pending"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}