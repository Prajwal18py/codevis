// src/components/UI.jsx — Enhanced
// Enhancements:
// - useTheme() everywhere (no hardcoded C)
// - CodeBlock: copy button, line numbers, fade-in
// - Section: smooth open/close animation, hover glow
// - Spinner: dual ring + pulsing dot
// - Badge: glow on active
// - Toast: new notification component

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "../utils/ThemeContext";

export function Badge({ children, color, size }) {
  const { C } = useTheme();
  size = size || 11;
  const col = color || C.accentL;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", padding:"2px 9px",
      borderRadius:20, background:col+"1a", border:"1px solid "+col+"40",
      color:col, fontSize:size, fontFamily:"'JetBrains Mono',monospace",
      fontWeight:700, whiteSpace:"nowrap",
    }}>{children}</span>
  );
}

export function PriorityBadge({ p }) {
  const { C } = useTheme();
  const col = p==="HIGH" ? C.red : p==="MEDIUM" ? C.orange : C.green;
  return <Badge color={col} size={10}>{p}</Badge>;
}

export function DiffBadge({ d }) {
  const { C } = useTheme();
  const col = d==="Easy" ? C.green : d==="Medium" ? C.orange : C.red;
  return <Badge color={col}>{d}</Badge>;
}

export function Pill({ active, onClick, children, color }) {
  const { C } = useTheme();
  const [hov, setHov] = useState(false);
  const col = color || C.accentL;
  return (
    <button
      onClick={onClick}
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>setHov(false)}
      style={{
        padding:"6px 14px", borderRadius:8,
        border:"1px solid "+(active?col:hov?C.border+"aa":C.border),
        background:active?col+"1a":hov?C.surface:"transparent",
        color:active?col:hov?C.dim:C.muted,
        fontFamily:"'JetBrains Mono',monospace", fontSize:11,
        cursor:"pointer", transition:"all .18s", fontWeight:active?700:400,
        boxShadow:active?`0 0 10px ${col}22`:"none",
      }}
    >{children}</button>
  );
}

export function Section({ title, icon, accent, children, defaultOpen }) {
  const { C } = useTheme();
  accent = accent || C.accentL;
  const [open, setOpen] = useState(defaultOpen !== false);
  const [hov,  setHov]  = useState(false);
  return (
    <div style={{ borderRadius:10, border:`1px solid ${hov?accent+"40":accent+"20"}`, overflow:"hidden", marginBottom:11, transition:"border-color .2s" }}>
      <div
        onClick={()=>setOpen(o=>!o)}
        onMouseEnter={()=>setHov(true)}
        onMouseLeave={()=>setHov(false)}
        style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 13px", background:hov?accent+"12":accent+"08", cursor:"pointer", userSelect:"none", transition:"background .18s" }}
      >
        <span style={{ fontSize:13 }}>{icon}</span>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:accent, fontWeight:700 }}>{title}</span>
        <span style={{ marginLeft:"auto", color:C.muted, fontSize:9, display:"inline-block", transform:open?"rotate(90deg)":"rotate(0deg)", transition:"transform .22s ease" }}>▶</span>
      </div>
      <div style={{ padding:open?"11px 13px":"0 13px", background:C.card, maxHeight:open?2000:0, overflow:"hidden", transition:"max-height .3s ease, padding .3s ease" }}>
        {children}
      </div>
    </div>
  );
}

export function Spinner({ label }) {
  const { C } = useTheme();
  const [dot, setDot] = useState(0);
  useEffect(() => {
    const t = setInterval(()=>setDot(x=>(x+1)%4), 380);
    return ()=>clearInterval(t);
  }, []);
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:18, padding:60 }}>
      <div style={{ position:"relative", width:52, height:52 }}>
        <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:`3px solid ${C.accentL}30`, borderTopColor:C.accentL, animation:"cvSpin .9s linear infinite" }} />
        <div style={{ position:"absolute", inset:8, borderRadius:"50%", border:`3px solid ${C.cyan}20`, borderBottomColor:C.cyan, animation:"cvSpin .7s linear infinite reverse" }} />
        <div style={{ position:"absolute", inset:"50%", transform:"translate(-50%,-50%)", width:8, height:8, borderRadius:"50%", background:C.accentL, boxShadow:`0 0 10px ${C.accentL}`, animation:"cvPulse 1s ease infinite" }} />
      </div>
      <div style={{ display:"flex", gap:5 }}>
        {[0,1,2].map(i=>(
          <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:i===dot%3?C.accentL:C.border, transition:"background .2s", boxShadow:i===dot%3?`0 0 8px ${C.accentL}`:"none" }} />
        ))}
      </div>
      <span style={{ fontFamily:"'JetBrains Mono',monospace", color:C.accentL, fontSize:11, letterSpacing:1 }}>
        {(label||"Analyzing")+".".repeat(dot)}
      </span>
      <style>{`@keyframes cvSpin{to{transform:rotate(360deg)}}@keyframes cvPulse{0%,100%{opacity:.4;transform:translate(-50%,-50%) scale(.8)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.2)}}`}</style>
    </div>
  );
}

export function CodeBlock({ code, lang }) {
  const { C } = useTheme();
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);
  useEffect(()=>{ const t=setTimeout(()=>setVisible(true),50); return ()=>clearTimeout(t); },[]);
  const copy = useCallback(async()=>{
    try { await navigator.clipboard.writeText(code||""); setCopied(true); setTimeout(()=>setCopied(false),1800); } catch{}
  },[code]);
  if (!code) return null;
  const lines = code.split("\n");
  return (
    <div style={{ position:"relative", borderRadius:9, border:`1px solid ${C.border}`, background:"#07070e", overflow:"hidden", margin:"8px 0 0 0", opacity:visible?1:0, transition:"opacity .3s ease" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"5px 10px", background:C.surface, borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", gap:5 }}>
          {["#ef4444","#f59e0b","#10b981"].map((col,i)=>(
            <div key={i} style={{ width:7, height:7, borderRadius:"50%", background:col, opacity:.7 }} />
          ))}
        </div>
        {lang && <span style={{ fontSize:9, color:C.muted, fontFamily:"'JetBrains Mono',monospace", textTransform:"uppercase", letterSpacing:1 }}>{lang}</span>}
        <button onClick={copy} style={{ background:copied?C.green+"22":"transparent", border:`1px solid ${copied?C.green+"55":C.border}`, borderRadius:5, padding:"2px 8px", fontSize:9, color:copied?C.green:C.muted, fontFamily:"'JetBrains Mono',monospace", cursor:"pointer", transition:"all .2s" }}>
          {copied?"✓ copied":"copy"}
        </button>
      </div>
      <div style={{ display:"flex", overflowX:"auto" }}>
        <div style={{ padding:"10px 8px", color:C.muted+"60", fontSize:10, lineHeight:"1.75", textAlign:"right", minWidth:32, userSelect:"none", borderRight:`1px solid ${C.border}20`, fontFamily:"'JetBrains Mono',monospace", flexShrink:0 }}>
          {lines.map((_,i)=><div key={i}>{i+1}</div>)}
        </div>
        <pre style={{ padding:"10px 14px", fontSize:11, color:C.cyan, fontFamily:"'JetBrains Mono',monospace", lineHeight:"1.75", margin:0, flex:1, whiteSpace:"pre" }}>{code}</pre>
      </div>
    </div>
  );
}

export function Toast({ message, type="success", onDone }) {
  const { C } = useTheme();
  const [vis, setVis] = useState(false);
  useEffect(()=>{
    setVis(true);
    const t = setTimeout(()=>{ setVis(false); setTimeout(onDone,300); }, 2800);
    return ()=>clearTimeout(t);
  },[]);
  const col = type==="success"?C.green:type==="error"?C.red:C.accentL;
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, background:C.surface, border:`1px solid ${col}50`, borderRadius:12, padding:"12px 18px", display:"flex", alignItems:"center", gap:10, boxShadow:`0 4px 24px rgba(0,0,0,.4),0 0 20px ${col}22`, transform:vis?"translateY(0)":"translateY(20px)", opacity:vis?1:0, transition:"all .3s ease", fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:C.text, maxWidth:320 }}>
      <span style={{ fontSize:16 }}>{type==="success"?"✓":type==="error"?"⚠":"ℹ"}</span>
      <span style={{ color:col, fontWeight:700 }}>{message}</span>
    </div>
  );
}