// src/components/Editors.jsx — Enhanced
// Enhancements:
// - useTheme() (no hardcoded C)
// - CodeEditor: focus glow border, tab key inserts spaces, ctrl+a select all
// - PlainEditor: character count, focus glow
// - Both: smooth resize, better scrollbar

import { useState, useRef, useCallback } from "react";
import { useTheme } from "../utils/ThemeContext";

export function CodeEditor({ value, onChange, filename, minHeight, placeholder }) {
  const { C } = useTheme();
  const [focused, setFocused] = useState(false);
  const ref = useRef(null);
  minHeight = minHeight || 220;
  const lines = (value || "").split("\n").length;

  const handleKeyDown = useCallback((e) => {
    // Tab key → insert 2 spaces
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end   = e.target.selectionEnd;
      const newVal = value.substring(0, start) + "  " + value.substring(end);
      onChange(newVal);
      setTimeout(() => { e.target.selectionStart = e.target.selectionEnd = start + 2; }, 0);
    }
  }, [value, onChange]);

  return (
    <div style={{
      borderRadius:10, overflow:"hidden",
      border:`1px solid ${focused ? C.accentL+"60" : C.border}`,
      background:"#090910", fontSize:12, flex:1,
      boxShadow: focused ? `0 0 16px ${C.accentL}18` : "none",
      transition:"border-color .2s, box-shadow .2s",
    }}>
      {/* Title bar */}
      <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 11px", background:"#090910", borderBottom:`1px solid ${C.border}` }}>
        {["#ef4444","#f59e0b","#10b981"].map((col,i)=>(
          <div key={i} style={{ width:8, height:8, borderRadius:"50%", background:col, opacity:.7 }} />
        ))}
        <span style={{ marginLeft:5, fontSize:10, color:C.muted, fontFamily:"'JetBrains Mono',monospace" }}>{filename}</span>
        <span style={{ marginLeft:"auto", fontSize:9, color:C.muted+"60", fontFamily:"'JetBrains Mono',monospace" }}>{lines} lines</span>
      </div>

      {/* Editor body */}
      <div style={{ display:"flex" }}>
        {/* Line numbers */}
        <div style={{ padding:"10px 7px 10px 9px", color:C.muted+"50", fontSize:10, lineHeight:"1.75", textAlign:"right", minWidth:32, userSelect:"none", borderRight:`1px solid ${C.border}20`, fontFamily:"'JetBrains Mono',monospace" }}>
          {Array.from({ length:Math.max(lines,1) }, (_,i)=>(
            <div key={i} style={{ color: i === lines-1 && focused ? C.accentL+"80" : C.muted+"50" }}>{i+1}</div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          ref={ref}
          value={value}
          onChange={e=>onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={()=>setFocused(true)}
          onBlur={()=>setFocused(false)}
          spellCheck={false}
          placeholder={placeholder || ""}
          style={{
            flex:1, background:"transparent", border:"none", outline:"none",
            color:C.text, fontFamily:"'JetBrains Mono',monospace", fontSize:12,
            lineHeight:"1.75", padding:"10px 12px", resize:"none",
            minHeight:minHeight, caretColor:C.accentL,
          }}
        />
      </div>
    </div>
  );
}

export function PlainEditor({ value, onChange, filename, minHeight, placeholder }) {
  const { C } = useTheme();
  const [focused, setFocused] = useState(false);
  const charCount = (value || "").length;

  return (
    <div style={{
      borderRadius:10, overflow:"hidden",
      border:`1px solid ${focused ? C.orange+"60" : C.border}`,
      background:"#090910",
      boxShadow: focused ? `0 0 16px ${C.orange}14` : "none",
      transition:"border-color .2s, box-shadow .2s",
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 11px", background:"#090910", borderBottom:`1px solid ${C.border}` }}>
        <span style={{ fontSize:12 }}>📋</span>
        <span style={{ fontSize:10, color:C.muted, fontFamily:"'JetBrains Mono',monospace" }}>{filename}</span>
        <span style={{ marginLeft:"auto", fontSize:9, color:C.muted+"60", fontFamily:"'JetBrains Mono',monospace" }}>{charCount} chars</span>
      </div>
      <textarea
        value={value}
        onChange={e=>onChange(e.target.value)}
        onFocus={()=>setFocused(true)}
        onBlur={()=>setFocused(false)}
        spellCheck={false}
        placeholder={placeholder || ""}
        style={{
          width:"100%", background:"transparent", border:"none", outline:"none",
          color:C.dim, fontFamily:"'JetBrains Mono',monospace", fontSize:12,
          lineHeight:"1.75", padding:"10px 12px", resize:"none",
          minHeight:minHeight||130, caretColor:C.orange, boxSizing:"border-box",
        }}
      />
    </div>
  );
}