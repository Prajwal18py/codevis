// src/tabs/Comparison.jsx — Enhanced: two algorithms racing side by side
// Enhancements: keyboard shortcuts (Space/←/→), random array generator,
// step count stat bars, winner confetti banner with diff%, scrubable progress bar,
// lane highlight on winner finish, smoother action badge transitions

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "../utils/ThemeContext";

// ── Sorting step generators (unchanged logic) ─────────────────────────────────
function getBubbleSteps(arr) {
  const a=[...arr],steps=[];
  for(let i=0;i<a.length-1;i++) for(let j=0;j<a.length-i-1;j++) {
    steps.push({arr:[...a],comparing:[j,j+1],sorted:[],action:"compare"});
    if(a[j]>a[j+1]){[a[j],a[j+1]]=[a[j+1],a[j]];steps.push({arr:[...a],comparing:[j,j+1],sorted:[],action:"swap"});}
  }
  steps.push({arr:[...a],comparing:[],sorted:a.map((_,i)=>i),action:"done"});return steps;
}
function getSelectionSteps(arr) {
  const a=[...arr],steps=[],n=a.length;
  for(let i=0;i<n-1;i++){let m=i;
    for(let j=i+1;j<n;j++){steps.push({arr:[...a],comparing:[m,j],sorted:Array.from({length:i},(_,k)=>k),action:"compare"});if(a[j]<a[m])m=j;}
    if(m!==i){[a[i],a[m]]=[a[m],a[i]];steps.push({arr:[...a],comparing:[i,m],sorted:Array.from({length:i},(_,k)=>k),action:"swap"});}
  }
  steps.push({arr:[...a],comparing:[],sorted:a.map((_,i)=>i),action:"done"});return steps;
}
function getInsertionSteps(arr) {
  const a=[...arr],steps=[];
  for(let i=1;i<a.length;i++){let j=i;
    while(j>0&&a[j-1]>a[j]){steps.push({arr:[...a],comparing:[j-1,j],sorted:[],action:"compare"});[a[j-1],a[j]]=[a[j],a[j-1]];steps.push({arr:[...a],comparing:[j-1,j],sorted:[],action:"swap"});j--;}
  }
  steps.push({arr:[...a],comparing:[],sorted:a.map((_,i)=>i),action:"done"});return steps;
}
function getMergeSteps(arr) {
  const steps=[];
  function merge(a,l,m,r){const L=a.slice(l,m+1),R=a.slice(m+1,r+1);let i=0,j=0,k=l;
    while(i<L.length&&j<R.length){steps.push({arr:[...a],comparing:[l+i,m+1+j],sorted:[],action:"compare"});if(L[i]<=R[j])a[k++]=L[i++];else a[k++]=R[j++];steps.push({arr:[...a],comparing:[k-1],sorted:[],action:"merge"});}
    while(i<L.length){a[k++]=L[i++];steps.push({arr:[...a],comparing:[k-1],sorted:[],action:"merge"});}
    while(j<R.length){a[k++]=R[j++];steps.push({arr:[...a],comparing:[k-1],sorted:[],action:"merge"});}
  }
  function ms(a,l,r){if(l>=r)return;const m=Math.floor((l+r)/2);ms(a,l,m);ms(a,m+1,r);merge(a,l,m,r);}
  const a=[...arr];ms(a,0,a.length-1);steps.push({arr:[...a],comparing:[],sorted:a.map((_,i)=>i),action:"done"});return steps;
}
function getQuickSteps(arr) {
  const steps=[];
  function partition(a,lo,hi){const piv=a[hi];let i=lo-1;
    for(let j=lo;j<hi;j++){steps.push({arr:[...a],comparing:[j,hi],sorted:[],action:"compare",pivot:hi});if(a[j]<=piv){i++;[a[i],a[j]]=[a[j],a[i]];steps.push({arr:[...a],comparing:[i,j],sorted:[],action:"swap",pivot:hi});}}
    [a[i+1],a[hi]]=[a[hi],a[i+1]];steps.push({arr:[...a],comparing:[i+1],sorted:[],action:"pivot",pivot:i+1});return i+1;
  }
  function qs(a,lo,hi){if(lo>=hi)return;const p=partition(a,lo,hi);qs(a,lo,p-1);qs(a,p+1,hi);}
  const a=[...arr];qs(a,0,a.length-1);steps.push({arr:[...a],comparing:[],sorted:a.map((_,i)=>i),action:"done"});return steps;
}

const ALGOS = {
  "Bubble Sort":    getBubbleSteps,
  "Selection Sort": getSelectionSteps,
  "Insertion Sort": getInsertionSteps,
  "Merge Sort":     getMergeSteps,
  "Quick Sort":     getQuickSteps,
};
const ALGO_NAMES = Object.keys(ALGOS);

const getActionColor = (action, C) => ({ swap: C.coral, compare: C.accentL, pivot: C.orange, merge: C.cyan, done: C.green, mark: C.green, idle: C.muted })[action] || C.muted;

// ─── Mini bar ─────────────────────────────────────────────────────────────────
function MiniBar({ value, max, state }) {
  const { C } = useTheme();
  const pct = Math.max(6, (value / max) * 100);
  const col = getActionColor(state, C) || C.muted;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 9, color: col, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>{value}</div>
      <div style={{ width: "100%", maxWidth: 36, height: `${pct}px`, background: col, borderRadius: "3px 3px 0 0", transition: "height .2s ease, background .15s", boxShadow: state !== "idle" ? `0 0 8px ${col}88` : "none" }} />
    </div>
  );
}

// ─── Algorithm lane ───────────────────────────────────────────────────────────
function AlgoLane({ name, steps, cur, accentColor, isWinner }) {
  const { C } = useTheme();
  const step = steps[Math.min(cur, steps.length - 1)] || { arr: [], comparing: [], sorted: [], action: "idle" };
  const max  = Math.max(...(step.arr || [1]), 1);
  const isDone = step.action === "done";

  const getState = i => {
    if (isDone || step.sorted?.includes(i)) return "done";
    if (step.pivot === i) return "pivot";
    if (step.comparing?.includes(i)) return step.action === "swap" ? "swap" : step.action === "merge" ? "merge" : "compare";
    return "idle";
  };

  const swaps    = steps.filter(s => s.action === "swap").length;
  const compares = steps.filter(s => s.action === "compare").length;

  return (
    <div style={{
      flex: 1, background: C.card, borderRadius: 12,
      border: `1px solid ${isDone ? accentColor + "60" : C.border}`,
      padding: 14, transition: "border-color .3s",
      boxShadow: isWinner && isDone ? `0 0 20px ${accentColor}25` : "none",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 800, color: isDone ? accentColor : C.text }}>
          {isWinner && isDone ? "🏆 " : ""}{name}
        </span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {isDone && <span style={{ fontSize: 10, color: accentColor, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>✓ DONE</span>}
          <span style={{ fontSize: 10, color: C.muted, fontFamily: "'JetBrains Mono',monospace" }}>{Math.min(cur, steps.length - 1) + 1}/{steps.length}</span>
        </div>
      </div>

      {/* Bars */}
      <div style={{ background: "#0a0a12", borderRadius: 8, padding: "14px 8px 6px", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 100, justifyContent: "center" }}>
          {step.arr?.map((v, i) => <MiniBar key={i} value={v} max={max} state={getState(i)} />)}
        </div>
      </div>

      {/* Action badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <div style={{ background: (getActionColor(step.action, C) || C.muted) + "22", border: `1px solid ${(getActionColor(step.action, C) || C.muted)}40`, borderRadius: 5, padding: "2px 8px", fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: getActionColor(step.action, C) || C.muted, fontWeight: 700, textTransform: "uppercase", transition: "all .15s" }}>
          {step.action}
        </div>
      </div>

      {/* Stat bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {[
          { label: "Swaps", val: swaps, color: C.coral, max: Math.max(swaps, compares, 1) },
          { label: "Compares", val: compares, color: C.accentL, max: Math.max(swaps, compares, 1) },
        ].map((s, i) => (
          <div key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
              <span style={{ fontSize: 9, color: C.muted, fontFamily: "'JetBrains Mono',monospace" }}>{s.label}</span>
              <span style={{ fontSize: 9, color: s.color, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>{s.val}</span>
            </div>
            <div style={{ height: 3, background: C.border, borderRadius: 9 }}>
              <div style={{ height: "100%", width: `${(s.val / s.max) * 100}%`, background: s.color, borderRadius: 9, transition: "width .3s ease" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Comparison() {
  const { C } = useTheme();
  const [algo1,      setAlgo1]      = useState("Bubble Sort");
  const [algo2,      setAlgo2]      = useState("Quick Sort");
  const [arrayInput, setArrayInput] = useState("8 3 5 1 9 2 7 4 6");
  const [steps1,     setSteps1]     = useState([]);
  const [steps2,     setSteps2]     = useState([]);
  const [cur,        setCur]        = useState(0);
  const [playing,    setPlaying]    = useState(false);
  const [speed,      setSpeed]      = useState(300);
  const timerRef  = useRef(null);
  const progressRef = useRef(null);

  function buildRace() {
    const nums = arrayInput.split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
    if (nums.length < 2 || nums.length > 16) return;
    setSteps1(ALGOS[algo1]([...nums]));
    setSteps2(ALGOS[algo2]([...nums]));
    setCur(0); setPlaying(false);
  }

  useEffect(() => { buildRace(); }, [algo1, algo2]);

  const maxSteps = Math.max(steps1.length, steps2.length, 1);

  useEffect(() => {
    clearInterval(timerRef.current);
    if (playing) {
      timerRef.current = setInterval(() => {
        setCur(c => { if (c >= maxSteps - 1) { setPlaying(false); return c; } return c + 1; });
      }, speed);
    }
    return () => clearInterval(timerRef.current);
  }, [playing, maxSteps, speed]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
      if (e.key === " ") { e.preventDefault(); setPlaying(p => !p); }
      if (e.key === "ArrowRight") { e.preventDefault(); setPlaying(false); setCur(c => Math.min(maxSteps - 1, c + 1)); }
      if (e.key === "ArrowLeft")  { e.preventDefault(); setPlaying(false); setCur(c => Math.max(0, c - 1)); }
      if (e.key === "Home") { e.preventDefault(); setPlaying(false); setCur(0); }
      if (e.key === "End")  { e.preventDefault(); setPlaying(false); setCur(maxSteps - 1); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [maxSteps]);

  // Random array
  function randomArray() {
    const n = Math.floor(Math.random() * 7) + 6; // 6–12 elements
    const nums = Array.from({ length: n }, () => Math.floor(Math.random() * 20) + 1);
    setArrayInput(nums.join(" "));
    setTimeout(() => buildRace(), 0);
  }

  const done1 = cur >= steps1.length - 1;
  const done2 = cur >= steps2.length - 1;
  const winner = done1 && done2
    ? steps1.length < steps2.length ? algo1
    : steps2.length < steps1.length ? algo2
    : "Tie!"
    : null;

  const diffPct = winner && winner !== "Tie!"
    ? Math.round(Math.abs(steps1.length - steps2.length) / Math.max(steps1.length, steps2.length) * 100)
    : 0;

  // Scrubable progress bar
  function onProgressClick(e) {
    const rect = progressRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = (e.clientX - rect.left) / rect.width;
    setCur(Math.round(pct * (maxSteps - 1)));
    setPlaying(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>

      {/* Settings */}
      <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: 14 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
          {/* Algo 1 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 9, color: C.cyan, fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: 1 }}>Algorithm 1</label>
            <select value={algo1} onChange={e => setAlgo1(e.target.value)} style={{ background: C.card, border: `1px solid ${C.cyan}40`, color: C.cyan, borderRadius: 7, padding: "6px 10px", fontFamily: "'JetBrains Mono',monospace", fontSize: 12, cursor: "pointer" }}>
              {ALGO_NAMES.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 6 }}>
            <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, color: C.muted }}>vs</span>
          </div>

          {/* Algo 2 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 9, color: C.coral, fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: 1 }}>Algorithm 2</label>
            <select value={algo2} onChange={e => setAlgo2(e.target.value)} style={{ background: C.card, border: `1px solid ${C.coral}40`, color: C.coral, borderRadius: 7, padding: "6px 10px", fontFamily: "'JetBrains Mono',monospace", fontSize: 12, cursor: "pointer" }}>
              {ALGO_NAMES.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>

          {/* Array input */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: 9, color: C.muted, fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: 1 }}>Array (max 16 numbers)</label>
            <input value={arrayInput} onChange={e => setArrayInput(e.target.value)} style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text, borderRadius: 7, padding: "6px 10px", fontFamily: "'JetBrains Mono',monospace", fontSize: 12, outline: "none" }} />
          </div>

          {/* Speed */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 9, color: C.muted, fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: 1 }}>Speed</label>
            <select value={speed} onChange={e => setSpeed(Number(e.target.value))} style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text, borderRadius: 7, padding: "6px 10px", fontFamily: "'JetBrains Mono',monospace", fontSize: 12, cursor: "pointer" }}>
              <option value={600}>Slow</option>
              <option value={300}>Normal</option>
              <option value={100}>Fast</option>
              <option value={30}>Turbo</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={buildRace} style={{ padding: "7px 16px", borderRadius: 8, border: `1px solid ${C.accentL}50`, background: C.accentL + "18", color: C.accentL, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, cursor: "pointer", fontWeight: 700 }}>
            ↺ Reset Race
          </button>
          <button onClick={randomArray} style={{ padding: "7px 16px", borderRadius: 8, border: `1px solid ${C.teal}50`, background: C.teal + "14", color: C.teal, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, cursor: "pointer" }}>
            🎲 Random Array
          </button>
          <span style={{ marginLeft: "auto", fontSize: 9, color: C.muted, fontFamily: "'JetBrains Mono',monospace", alignSelf: "center" }}>
            Space · ←→ keys
          </span>
        </div>
      </div>

      {/* Winner banner */}
      {winner && (
        <div style={{ background: `linear-gradient(135deg,${C.accent}22,${C.cyan}22)`, border: `1px solid ${C.accentL}50`, borderRadius: 12, padding: "14px 18px", textAlign: "center", animation: "fadeIn .4s ease" }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, background: `linear-gradient(90deg,${C.accentL},${C.cyan})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            🏆 {winner === "Tie!" ? "It's a Tie!" : `${winner} wins!`}
          </div>
          <div style={{ fontSize: 11, color: C.dim, fontFamily: "'JetBrains Mono',monospace", marginTop: 4 }}>
            {steps1.length} steps vs {steps2.length} steps
            {winner !== "Tie!" && ` — ${diffPct}% fewer steps`}
          </div>
        </div>
      )}

      {/* Lanes */}
      <div style={{ display: "flex", gap: 12 }}>
        <AlgoLane name={algo1} steps={steps1} cur={Math.min(cur, steps1.length - 1)} accentColor={C.cyan}  isWinner={winner === algo1} />
        <AlgoLane name={algo2} steps={steps2} cur={Math.min(cur, steps2.length - 1)} accentColor={C.coral} isWinner={winner === algo2} />
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={() => { setCur(0); setPlaying(false); }} style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, cursor: "pointer", fontSize: 16 }}>⏮</button>
        <button onClick={() => { setCur(c => Math.max(0, c - 1)); setPlaying(false); }} style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.text, cursor: "pointer", fontSize: 14 }}>‹</button>
        <button
          onClick={() => setPlaying(p => !p)}
          style={{ flex: 1, padding: "9px", borderRadius: 8, border: "none", background: playing ? `linear-gradient(135deg,${C.orange},${C.coral})` : `linear-gradient(135deg,${C.accent},${C.accentL})`, color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 800, fontFamily: "'Syne',sans-serif", boxShadow: `0 0 20px ${playing ? C.orange : C.accent}44` }}
        >
          {playing ? "⏸ Pause Race" : cur >= maxSteps - 1 ? "↺ Replay Race" : "▶ Start Race"}
        </button>
        <button onClick={() => { setCur(c => Math.min(maxSteps - 1, c + 1)); setPlaying(false); }} style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.text, cursor: "pointer", fontSize: 14 }}>›</button>
        <button onClick={() => { setCur(maxSteps - 1); setPlaying(false); }} style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, cursor: "pointer", fontSize: 16 }}>⏭</button>

        {/* Scrubable progress bar */}
        <div
          ref={progressRef}
          onClick={onProgressClick}
          style={{ flex: 2, height: 8, background: C.border, borderRadius: 9, overflow: "hidden", cursor: "pointer", position: "relative" }}
          title="Click to scrub"
        >
          <div style={{ height: "100%", width: `${maxSteps > 1 ? (cur / (maxSteps - 1)) * 100 : 0}%`, background: `linear-gradient(90deg,${C.accent},${C.cyan})`, transition: "width .15s", borderRadius: 9 }} />
        </div>
      </div>
    </div>
  );
}