// src/tabs/Playground.jsx — Enhanced Live algorithm animator
// Enhancements: keyboard shortcuts (Space/←/→/Home/End), progress ring,
// copy step code line, step count badge on action, bar entrance animations,
// scrubable progress bar, better empty/error states, comparison teaser polish

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "../utils/ThemeContext";

// ── Sorting algorithms ────────────────────────────────────────────────────────
function getBubbleSteps(arr) {
  const a=[...arr],steps=[];
  for(let i=0;i<a.length-1;i++){for(let j=0;j<a.length-i-1;j++){
    steps.push({arr:[...a],comparing:[j,j+1],sorted:Array.from({length:i},(_,k)=>a.length-1-k),action:"compare"});
    if(a[j]>a[j+1]){[a[j],a[j+1]]=[a[j+1],a[j]];steps.push({arr:[...a],comparing:[j,j+1],sorted:Array.from({length:i},(_,k)=>a.length-1-k),action:"swap"});}
  }}
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
  const a=[...arr],steps=[],n=a.length;
  for(let i=1;i<n;i++){let j=i;
    while(j>0&&a[j-1]>a[j]){steps.push({arr:[...a],comparing:[j-1,j],sorted:[],action:"compare"});[a[j-1],a[j]]=[a[j],a[j-1]];steps.push({arr:[...a],comparing:[j-1,j],sorted:[],action:"swap"});j--;}
    steps.push({arr:[...a],comparing:[j],sorted:Array.from({length:i+1},(_,k)=>k),action:"mark"});
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
  function partition(a,lo,hi){const piv=a[hi],pi=hi;let i=lo-1;
    for(let j=lo;j<hi;j++){steps.push({arr:[...a],comparing:[j,pi],sorted:[],action:"compare",pivot:pi});if(a[j]<=piv){i++;[a[i],a[j]]=[a[j],a[i]];steps.push({arr:[...a],comparing:[i,j],sorted:[],action:"swap",pivot:pi});}}
    [a[i+1],a[hi]]=[a[hi],a[i+1]];steps.push({arr:[...a],comparing:[i+1],sorted:[],action:"pivot",pivot:i+1});return i+1;
  }
  function qs(a,lo,hi){if(lo>=hi)return;const p=partition(a,lo,hi);qs(a,lo,p-1);qs(a,p+1,hi);}
  const a=[...arr];qs(a,0,a.length-1);steps.push({arr:[...a],comparing:[],sorted:a.map((_,i)=>i),action:"done"});return steps;
}
function getLinearSearchSteps(arr,target){
  const steps=[];
  for(let i=0;i<arr.length;i++){steps.push({arr:[...arr],comparing:[i],sorted:[],action:"compare",found:arr[i]===target?i:-1});if(arr[i]===target)break;}
  return steps;
}
function getBinarySearchSteps(arr,target){
  const a=[...arr].sort((x,y)=>x-y),steps=[];
  let lo=0,hi=a.length-1;
  while(lo<=hi){const mid=Math.floor((lo+hi)/2);steps.push({arr:[...a],comparing:[lo,mid,hi],sorted:[],action:"compare",pivot:mid});if(a[mid]===target){steps.push({arr:[...a],comparing:[mid],sorted:[mid],action:"done"});break;}else if(a[mid]<target)lo=mid+1;else hi=mid-1;}
  return steps;
}

const ALGO_MAP = {
  "Bubble Sort":    (a)=>getBubbleSteps(a),
  "Selection Sort": (a)=>getSelectionSteps(a),
  "Insertion Sort": (a)=>getInsertionSteps(a),
  "Merge Sort":     (a)=>getMergeSteps(a),
  "Quick Sort":     (a)=>getQuickSteps(a),
  "Linear Search":  (a,t)=>getLinearSearchSteps(a,t),
  "Binary Search":  (a,t)=>getBinarySearchSteps(a,t),
};
const SORTING_ALGOS = ["Bubble Sort","Selection Sort","Insertion Sort","Merge Sort","Quick Sort"];
const SEARCH_ALGOS  = ["Linear Search","Binary Search"];

const getActionColor = (action, C) => ({ compare: C.accentL, swap: C.coral, pivot: C.orange, merge: C.cyan, mark: C.green, found: C.green, done: C.green, idle: C.muted })[action] || C.muted;

// ─── Copy button ──────────────────────────────────────────────────────────────
function CopyButton({ text }) {
  const { C } = useTheme();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  };
  return (
    <button onClick={copy} style={{ position:"absolute", top:6, right:6, background:copied?C.green+"22":"#0a0a1288", border:`1px solid ${copied?C.green+"55":C.border}`, borderRadius:6, padding:"3px 8px", fontSize:9, color:copied?C.green:C.muted, fontFamily:"'JetBrains Mono',monospace", cursor:"pointer", transition:"all .2s" }}>
      {copied ? "✓ copied" : "copy"}
    </button>
  );
}

// ─── Progress ring ────────────────────────────────────────────────────────────
function ProgressRing({ cur, total, size = 36 }) {
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
        style={{ transition:"stroke-dashoffset .3s ease", filter:`drop-shadow(0 0 3px ${col})` }} />
      <text x={size/2} y={size/2-2} textAnchor="middle" fontSize={9} fontFamily="JetBrains Mono" fill={col} fontWeight={700}>
        {done ? "✓" : `${cur+1}`}
      </text>
      <text x={size/2} y={size/2+9} textAnchor="middle" fontSize={7} fontFamily="JetBrains Mono" fill={C.muted}>
        {done ? "done" : `/${total}`}
      </text>
    </svg>
  );
}

// ─── Animated bar ─────────────────────────────────────────────────────────────
function Bar({ value, max, state, index }) {
  const { C } = useTheme();
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), index * 25); return () => clearTimeout(t); }, [index]);
  const pct = Math.max(8, (value / max) * 100);
  const col = getActionColor(state, C) || C.cyan;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, flex:1, minWidth:0 }}>
      <div style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", color:col, fontWeight:700, opacity:vis?1:0, transition:"opacity .3s" }}>{value}</div>
      <div style={{ width:"100%", maxWidth:44, height:vis?`${pct}px`:"4px", background:`linear-gradient(180deg,${col},${col}99)`, borderRadius:"4px 4px 0 0", transition:"height .3s cubic-bezier(.34,1.56,.64,1), background .2s", boxShadow:state!=="idle"?`0 0 12px ${col}88`:"none" }} />
    </div>
  );
}

export default function Playground({ algoName }) {
  const { C } = useTheme();
  const [arrayInput,  setArrayInput]  = useState("5 3 8 1 9 2 7 4");
  const [targetInput, setTargetInput] = useState("7");
  const [steps,    setSteps]    = useState([]);
  const [cur,      setCur]      = useState(0);
  const [playing,  setPlaying]  = useState(false);
  const [speed,    setSpeed]    = useState(400);
  const [algo,     setAlgo]     = useState(algoName || "Bubble Sort");
  const [error,    setError]    = useState("");
  const timerRef   = useRef(null);
  const progressRef = useRef(null);

  const isSearch = SEARCH_ALGOS.includes(algo);
  const done     = cur >= steps.length - 1;

  function buildSteps() {
    const nums = arrayInput.split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
    if (nums.length < 2 || nums.length > 20) { setError("Enter 2–20 numbers"); return; }
    setError("");
    const s = ALGO_MAP[algo]?.(nums, parseInt(targetInput) || 0);
    if (s) { setSteps(s); setCur(0); setPlaying(false); }
  }

  useEffect(() => { buildSteps(); }, [algo]);

  useEffect(() => {
    clearInterval(timerRef.current);
    if (playing) {
      timerRef.current = setInterval(() => {
        setCur(c => { if (c >= steps.length - 1) { setPlaying(false); return c; } return c + 1; });
      }, speed);
    }
    return () => clearInterval(timerRef.current);
  }, [playing, steps.length, speed]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
      if (e.key === " ")           { e.preventDefault(); setPlaying(p => !p); }
      if (e.key === "ArrowRight")  { e.preventDefault(); setPlaying(false); setCur(c => Math.min(steps.length - 1, c + 1)); }
      if (e.key === "ArrowLeft")   { e.preventDefault(); setPlaying(false); setCur(c => Math.max(0, c - 1)); }
      if (e.key === "Home")        { e.preventDefault(); setPlaying(false); setCur(0); }
      if (e.key === "End")         { e.preventDefault(); setPlaying(false); setCur(steps.length - 1); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [steps.length]);

  // Scrub progress bar
  function onProgressClick(e) {
    const rect = progressRef.current?.getBoundingClientRect();
    if (!rect || steps.length < 2) return;
    const pct = (e.clientX - rect.left) / rect.width;
    setCur(Math.round(pct * (steps.length - 1)));
    setPlaying(false);
  }

  const step = steps[cur] || { arr: arrayInput.split(/[\s,]+/).map(Number).filter(n => !isNaN(n)), comparing: [], sorted: [], action: "idle" };
  const max  = Math.max(...(step.arr || [1]), 1);

  const getBarState = (i) => {
    if (step.action === "done")       return "done";
    if (step.sorted?.includes(i))     return "done";
    if (step.pivot === i)             return "pivot";
    if (step.found === i)             return "found";
    if (step.comparing?.includes(i))  return step.action === "swap" ? "swap" : step.action === "merge" ? "merge" : "compare";
    return "idle";
  };

  const actionCol = getActionColor(step.action, C) || C.muted;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>

      {/* Controls */}
      <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: 14 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          {/* Algo picker */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 160 }}>
            <label style={{ fontSize: 9, color: C.muted, fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: 1 }}>Algorithm</label>
            <select value={algo} onChange={e => setAlgo(e.target.value)} style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text, borderRadius: 7, padding: "6px 10px", fontFamily: "'JetBrains Mono',monospace", fontSize: 12, cursor: "pointer" }}>
              <optgroup label="Sorting">{SORTING_ALGOS.map(a => <option key={a}>{a}</option>)}</optgroup>
              <optgroup label="Searching">{SEARCH_ALGOS.map(a => <option key={a}>{a}</option>)}</optgroup>
            </select>
          </div>
          {/* Array input */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 3, minWidth: 200 }}>
            <label style={{ fontSize: 9, color: C.muted, fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: 1 }}>Your Array (space or comma, max 20)</label>
            <input value={arrayInput} onChange={e => setArrayInput(e.target.value)} style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text, borderRadius: 7, padding: "6px 10px", fontFamily: "'JetBrains Mono',monospace", fontSize: 12, outline: "none" }} placeholder="5 3 8 1 9 2 7 4" />
          </div>
          {/* Target (search only) */}
          {isSearch && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 80 }}>
              <label style={{ fontSize: 9, color: C.muted, fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: 1 }}>Target</label>
              <input value={targetInput} onChange={e => setTargetInput(e.target.value)} style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text, borderRadius: 7, padding: "6px 10px", fontFamily: "'JetBrains Mono',monospace", fontSize: 12, outline: "none", width: 70 }} />
            </div>
          )}
          {/* Speed */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 80 }}>
            <label style={{ fontSize: 9, color: C.muted, fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: 1 }}>Speed</label>
            <select value={speed} onChange={e => setSpeed(Number(e.target.value))} style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text, borderRadius: 7, padding: "6px 10px", fontFamily: "'JetBrains Mono',monospace", fontSize: 12, cursor: "pointer" }}>
              <option value={800}>Slow</option>
              <option value={400}>Normal</option>
              <option value={150}>Fast</option>
              <option value={50}>Turbo</option>
            </select>
          </div>
        </div>
        {error && <div style={{ color: C.red, fontSize: 11, fontFamily: "'JetBrains Mono',monospace", marginBottom: 8 }}>⚠ {error}</div>}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={buildSteps} style={{ padding: "7px 18px", borderRadius: 8, border: `1px solid ${C.accentL}50`, background: C.accentL + "18", color: C.accentL, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, cursor: "pointer", fontWeight: 700 }}>
            ↺ Rebuild
          </button>
          <span style={{ fontSize: 9, color: C.muted, fontFamily: "'JetBrains Mono',monospace" }}>Space · ←→ keys · click bar to scrub</span>
        </div>
      </div>

      {/* Visualization */}
      <div style={{ background: "#0a0a12", borderRadius: 12, border: `1px solid ${C.border}`, padding: "20px 16px 12px" }}>
        {/* Step info row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ background: actionCol + "20", border: `1px solid ${actionCol}40`, borderRadius: 6, padding: "3px 10px", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: actionCol, fontWeight: 700, textTransform: "uppercase", transition: "all .15s" }}>
            {step.action || "idle"}
          </div>
          {step.comparing?.length > 0 && (
            <div style={{ fontSize: 11, color: C.muted, fontFamily: "'JetBrains Mono',monospace" }}>
              indices: [{step.comparing.join(", ")}]
            </div>
          )}
          <div style={{ marginLeft: "auto" }}>
            <ProgressRing cur={cur} total={steps.length || 1} />
          </div>
        </div>

        {/* Bars */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 160, justifyContent: "center" }}>
          {step.arr?.map((v, i) => <Bar key={i} index={i} value={v} max={max} state={getBarState(i)} />)}
        </div>

        {/* Code line */}
        {step.code_line && (
          <div style={{ marginTop: 10, position: "relative" }}>
            <pre style={{ background: "#12121e", border: `1px solid ${C.accentL}30`, borderRadius: 7, padding: "6px 38px 6px 10px", fontSize: 10, color: C.accentL, fontFamily: "'JetBrains Mono',monospace", margin: 0, overflowX: "auto" }}>
              {step.code_line}
            </pre>
            <CopyButton text={step.code_line} />
          </div>
        )}

        {/* Legend */}
        <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
          {[["compare","Comparing",C.accentL],["swap","Swap",C.coral],["pivot","Pivot",C.orange],["done","Sorted",C.green]].map(([k, l, col]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: step.action === k ? col : C.muted, fontFamily: "'JetBrains Mono',monospace", transition: "color .2s" }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: col, opacity: step.action === k ? 1 : 0.4, boxShadow: step.action === k ? `0 0 6px ${col}` : "none", transition: "all .2s" }} />
              {l}
            </div>
          ))}
        </div>
      </div>

      {/* Playback controls */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={() => { setCur(0); setPlaying(false); }} style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, cursor: "pointer", fontSize: 16 }}>⏮</button>
        <button onClick={() => { setCur(c => Math.max(0, c - 1)); setPlaying(false); }} style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.text, cursor: "pointer", fontSize: 14 }}>‹</button>
        <button
          onClick={() => setPlaying(p => !p)}
          style={{ flex: 1, padding: "9px", borderRadius: 8, border: "none", background: playing ? `linear-gradient(135deg,${C.orange},${C.coral})` : `linear-gradient(135deg,${C.accent},${C.accentL})`, color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 800, fontFamily: "'Syne',sans-serif", boxShadow: playing ? `0 0 20px ${C.orange}44` : `0 0 20px ${C.glow}` }}
        >
          {playing ? "⏸ Pause" : done ? "↺ Replay" : "▶ Play"}
        </button>
        <button onClick={() => { setCur(c => Math.min(steps.length - 1, c + 1)); setPlaying(false); }} style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.text, cursor: "pointer", fontSize: 14 }}>›</button>
        <button onClick={() => { setCur(steps.length - 1); setPlaying(false); }} style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, cursor: "pointer", fontSize: 16 }}>⏭</button>

        {/* Scrubable progress bar */}
        <div
          ref={progressRef}
          onClick={onProgressClick}
          title="Click to jump to step"
          style={{ flex: 2, height: 8, background: C.border, borderRadius: 9, overflow: "hidden", cursor: "pointer", position: "relative" }}
        >
          <div style={{ height: "100%", width: `${steps.length > 1 ? (cur / (steps.length - 1)) * 100 : 0}%`, background: `linear-gradient(90deg,${C.accent},${C.cyan})`, transition: "width .2s", borderRadius: 9 }} />
        </div>
      </div>

      {/* Comparison teaser */}
      <div style={{ background: C.accentL + "08", border: `1px dashed ${C.accentL}30`, borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 16 }}>⚡</span>
        <div style={{ fontSize: 11, color: C.accentL, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>
          Tip: Go to <span style={{ textDecoration: "underline dotted" }}>Comparison tab</span> to race two algorithms on the same array!
        </div>
      </div>
    </div>
  );
}