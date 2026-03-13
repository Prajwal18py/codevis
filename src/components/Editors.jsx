// src/components/Editors.jsx — with Monaco (VS Code) editor toggle
import { useState, useRef, useCallback, useEffect } from "react";
import { useTheme } from "../utils/ThemeContext";

// ─── Monaco loader ─────────────────────────────────────────────────────────────
let monacoLoadPromise = null;
function loadMonaco() {
  if (monacoLoadPromise) return monacoLoadPromise;
  monacoLoadPromise = new Promise((resolve) => {
    if (window.monaco) { resolve(window.monaco); return; }
    const loaderScript = document.createElement("script");
    loaderScript.src = "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/loader.min.js";
    loaderScript.onload = () => {
      window.require.config({ paths: { vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs" } });
      window.require(["vs/editor/editor.main"], () => resolve(window.monaco));
    };
    document.head.appendChild(loaderScript);
  });
  return monacoLoadPromise;
}

// ─── Monaco Component ──────────────────────────────────────────────────────────
function MonacoEditor({ value, onChange, language, minHeight, themeName }) {
  const containerRef = useRef(null);
  const editorRef    = useRef(null);
  const [loading, setLoading] = useState(true);
  const { C } = useTheme();

  useEffect(() => {
    let destroyed = false;
    loadMonaco().then((monaco) => {
      if (destroyed || !containerRef.current) return;

      monaco.editor.defineTheme("codevis-dark", {
        base: "vs-dark", inherit: true,
        rules: [
          { token:"keyword",  foreground:"a855f7", fontStyle:"bold" },
          { token:"string",   foreground:"10b981" },
          { token:"comment",  foreground:"8892a4", fontStyle:"italic" },
          { token:"number",   foreground:"f59e0b" },
          { token:"type",     foreground:"06b6d4" },
        ],
        colors: {
          "editor.background":"#07070d", "editor.foreground":"#e2e8f0",
          "editorLineNumber.foreground":"#44445a",
          "editorLineNumber.activeForeground":"#a855f7",
          "editor.lineHighlightBackground":"#111119",
          "editorCursor.foreground":"#a855f7",
          "editor.selectionBackground":"#7c3aed33",
        }
      });
      monaco.editor.defineTheme("codevis-dracula", {
        base:"vs-dark", inherit:true,
        rules:[
          {token:"keyword", foreground:"bd93f9", fontStyle:"bold"},
          {token:"string",  foreground:"f1fa8c"},
          {token:"comment", foreground:"6272a4", fontStyle:"italic"},
          {token:"number",  foreground:"ffb86c"},
          {token:"type",    foreground:"8be9fd"},
        ],
        colors:{
          "editor.background":"#282a36","editor.foreground":"#f8f8f2",
          "editorLineNumber.foreground":"#6272a4","editorCursor.foreground":"#f8f8f2",
          "editor.selectionBackground":"#44475a",
        }
      });
      monaco.editor.defineTheme("codevis-nord", {
        base:"vs-dark", inherit:true,
        rules:[
          {token:"keyword", foreground:"81a1c1", fontStyle:"bold"},
          {token:"string",  foreground:"a3be8c"},
          {token:"comment", foreground:"4c566a", fontStyle:"italic"},
          {token:"number",  foreground:"b48ead"},
          {token:"type",    foreground:"88c0d0"},
        ],
        colors:{
          "editor.background":"#2e3440","editor.foreground":"#eceff4",
          "editorLineNumber.foreground":"#4c566a","editorCursor.foreground":"#88c0d0",
          "editor.selectionBackground":"#434c5e",
        }
      });

      const themeMap = { dark:"codevis-dark", light:"vs", dracula:"codevis-dracula", nord:"codevis-nord" };

      editorRef.current = monaco.editor.create(containerRef.current, {
        value: value || "",
        language: language === "python" ? "python" : "cpp",
        theme: themeMap[themeName] || "codevis-dark",
        fontSize: 13,
        fontFamily: "'JetBrains Mono', monospace",
        fontLigatures: true,
        lineNumbers: "on",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: "off",
        smoothScrolling: true,
        cursorBlinking: "smooth",
        cursorSmoothCaretAnimation: "on",
        padding: { top: 12, bottom: 12 },
        scrollbar: { verticalScrollbarSize: 4, horizontalScrollbarSize: 4 },
      });
      editorRef.current.onDidChangeModelContent(() => onChange(editorRef.current.getValue()));
      setLoading(false);
    });
    return () => { destroyed = true; editorRef.current?.dispose(); editorRef.current = null; };
  }, []);

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.getValue() !== value) editorRef.current.setValue(value || "");
  }, [value]);

  useEffect(() => {
    if (!window.monaco) return;
    const themeMap = { dark:"codevis-dark", light:"vs", dracula:"codevis-dracula", nord:"codevis-nord" };
    window.monaco.editor.setTheme(themeMap[themeName] || "codevis-dark");
  }, [themeName]);

  return (
    <div style={{ position:"relative", height: minHeight || 360 }}>
      {loading && (
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", background:"#07070d", color:C.muted, fontFamily:"'JetBrains Mono',monospace", fontSize:11, zIndex:2 }}>
          ⏳ Loading Monaco editor...
        </div>
      )}
      <div ref={containerRef} style={{ width:"100%", height:"100%" }} />
    </div>
  );
}

// ─── CodeEditor — Simple or Monaco ────────────────────────────────────────────
export function CodeEditor({ value, onChange, filename, minHeight, placeholder, language }) {
  const { C, themeName } = useTheme();
  const [useMonaco, setUseMonaco] = useState(() => localStorage.getItem("codevis_editor") === "monaco");
  const [focused, setFocused] = useState(false);
  const ref = useRef(null);
  minHeight = minHeight || 220;
  const lines = (value || "").split("\n").length;

  const toggleEditor = () => {
    const next = !useMonaco;
    setUseMonaco(next);
    localStorage.setItem("codevis_editor", next ? "monaco" : "simple");
  };

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.target.selectionStart, end = e.target.selectionEnd;
      const newVal = value.substring(0, start) + "  " + value.substring(end);
      onChange(newVal);
      setTimeout(() => { e.target.selectionStart = e.target.selectionEnd = start + 2; }, 0);
    }
  }, [value, onChange]);

  const lang = language || (filename?.endsWith(".py") ? "python" : "cpp");

  return (
    <div style={{ borderRadius:10, overflow:"hidden", border:`1px solid ${focused && !useMonaco ? C.accentL+"60" : C.border}`, background:useMonaco?"transparent":"#090910", flex:1, boxShadow: focused && !useMonaco ? `0 0 16px ${C.accentL}18` : "none", transition:"border-color .2s, box-shadow .2s" }}>
      {/* Title bar */}
      <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 11px", background:"#090910", borderBottom:`1px solid ${C.border}` }}>
        {["#ef4444","#f59e0b","#10b981"].map((col,i)=>(
          <div key={i} style={{ width:8, height:8, borderRadius:"50%", background:col, opacity:.7 }} />
        ))}
        <span style={{ marginLeft:5, fontSize:10, color:C.muted, fontFamily:"'JetBrains Mono',monospace" }}>{filename}</span>
        {!useMonaco && <span style={{ fontSize:9, color:C.muted+"60", fontFamily:"'JetBrains Mono',monospace" }}>{lines} lines</span>}
        <button onClick={toggleEditor} title={useMonaco ? "Switch to simple editor" : "Switch to VS Code Monaco editor"} style={{ marginLeft:"auto", padding:"2px 8px", borderRadius:5, border:`1px solid ${useMonaco ? C.accentL+"60" : C.border}`, background: useMonaco ? C.accentL+"18" : "transparent", color: useMonaco ? C.accentL : C.muted, fontFamily:"'JetBrains Mono',monospace", fontSize:9, cursor:"pointer", fontWeight: useMonaco ? 700 : 400, transition:"all .15s" }}>
          {useMonaco ? "✦ VS Code ON" : "⌨ Monaco"}
        </button>
      </div>

      {useMonaco ? (
        <MonacoEditor value={value} onChange={onChange} language={lang} minHeight={minHeight} themeName={themeName} />
      ) : (
        <div style={{ display:"flex" }}>
          <div style={{ padding:"10px 7px 10px 9px", color:C.muted+"50", fontSize:10, lineHeight:"1.75", textAlign:"right", minWidth:32, userSelect:"none", borderRight:`1px solid ${C.border}20`, fontFamily:"'JetBrains Mono',monospace" }}>
            {Array.from({ length:Math.max(lines,1) }, (_,i) => (
              <div key={i} style={{ color: i === lines-1 && focused ? C.accentL+"80" : C.muted+"50" }}>{i+1}</div>
            ))}
          </div>
          <textarea ref={ref} value={value} onChange={e=>onChange(e.target.value)} onKeyDown={handleKeyDown} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} spellCheck={false} placeholder={placeholder||""} style={{ flex:1, background:"transparent", border:"none", outline:"none", color:C.text, fontFamily:"'JetBrains Mono',monospace", fontSize:12, lineHeight:"1.75", padding:"10px 12px", resize:"none", minHeight, caretColor:C.accentL }} />
        </div>
      )}
    </div>
  );
}

// ─── PlainEditor ───────────────────────────────────────────────────────────────
export function PlainEditor({ value, onChange, filename, minHeight, placeholder }) {
  const { C } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ borderRadius:10, overflow:"hidden", border:`1px solid ${focused ? C.orange+"60" : C.border}`, background:"#090910", boxShadow: focused ? `0 0 16px ${C.orange}14` : "none", transition:"border-color .2s, box-shadow .2s" }}>
      <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 11px", background:"#090910", borderBottom:`1px solid ${C.border}` }}>
        <span style={{ fontSize:12 }}>📋</span>
        <span style={{ fontSize:10, color:C.muted, fontFamily:"'JetBrains Mono',monospace" }}>{filename}</span>
        <span style={{ marginLeft:"auto", fontSize:9, color:C.muted+"60", fontFamily:"'JetBrains Mono',monospace" }}>{(value||"").length} chars</span>
      </div>
      <textarea value={value} onChange={e=>onChange(e.target.value)} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} spellCheck={false} placeholder={placeholder||""} style={{ width:"100%", background:"transparent", border:"none", outline:"none", color:C.dim, fontFamily:"'JetBrains Mono',monospace", fontSize:12, lineHeight:"1.75", padding:"10px 12px", resize:"none", minHeight:minHeight||130, caretColor:C.orange, boxSizing:"border-box" }} />
    </div>
  );
}