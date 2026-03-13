// src/pages/SharedView.jsx — Public read-only shared analysis (no login required)
import { useState } from "react";
import { useTheme } from "../utils/ThemeContext";
import { generateLCPdf, generateOOPPdf } from "../utils/generatePDF";
import LCTutorTab    from "../tabs/LCTutorTab";
import OOPTutorTab   from "../tabs/OOPTutorTab";
import ClassDiagram  from "../tabs/ClassDiagram";
import ComplexityTab from "../tabs/ComplexityTab";

const LC_TABS  = [
  { id:"logic",      label:"🧠 Logic Tutor"   },
  { id:"diagram",    label:"⬡ Class Diagram"  },
  { id:"complexity", label:"△ Complexity"     },
];
const OOP_TABS = [
  { id:"tutor",   label:"🎓 OOP Tutor"    },
  { id:"diagram", label:"⬡ Class Diagram" },
];

export default function SharedView({ data, onOpenApp }) {
  const { C, isDark, toggle } = useTheme();
  const { mode, lang, result } = data;
  const [vizTab, setVizTab] = useState(mode === "oop" ? "tutor" : "logic");

  const tabs = mode === "oop" ? OOP_TABS : LC_TABS;
  const langColor = lang === "python" ? C.green : C.accentL;

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"'Inter',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Syne:wght@700;800&family=Inter:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:${C.surface}} ::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}
      `}</style>

      {/* Header */}
      <div style={{ borderBottom:`1px solid ${C.border}`, padding:"0 20px", background:C.surface, position:"sticky", top:0, zIndex:100 }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", alignItems:"center", height:52, gap:10 }}>
          {/* Logo */}
          <div style={{ width:28, height:28, borderRadius:7, background:`linear-gradient(135deg,${C.accent},${C.cyan})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>⬡</div>
          <span style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, color:C.accentL, letterSpacing:1 }}>CODEVIS</span>

          {/* Shared badge */}
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"3px 10px", borderRadius:20, background:C.green+"18", border:`1px solid ${C.green}35`, fontSize:10, color:C.green, fontFamily:"'JetBrains Mono',monospace", fontWeight:700 }}>
            🔗 Shared Analysis
          </div>

          {/* Lang badge */}
          <div style={{ padding:"3px 10px", borderRadius:20, background:langColor+"18", border:`1px solid ${langColor}35`, fontSize:10, color:langColor, fontFamily:"'JetBrains Mono',monospace", fontWeight:700 }}>
            {lang === "python" ? "🐍 Python" : "⚙️ C++"}
          </div>

          <div style={{ marginLeft:"auto", display:"flex", gap:8, alignItems:"center" }}>
            {/* Theme toggle */}
            <button onClick={toggle} style={{ width:32, height:32, borderRadius:8, border:`1px solid ${C.border}`, background:C.card, cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>
              {isDark ? "☀️" : "🌙"}
            </button>

            {/* PDF */}
            <button onClick={() => mode === "oop" ? generateOOPPdf(result) : generateLCPdf(result)}
              style={{ padding:"7px 13px", borderRadius:8, border:"none", background:`linear-gradient(135deg,${C.red}cc,${C.coral})`, color:"#fff", fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:700, cursor:"pointer" }}>
              📥 PDF
            </button>

            {/* Open in app CTA */}
            <button onClick={onOpenApp}
              style={{ padding:"7px 16px", borderRadius:8, border:"none", background:`linear-gradient(135deg,${C.accent},${C.accentL})`, color:"#fff", fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:800, cursor:"pointer", boxShadow:`0 0 20px ${C.accent}44`, display:"flex", alignItems:"center", gap:6 }}>
              ⬡ Open in CODEVIS →
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"24px 20px" }}>

        {/* Info banner */}
        <div style={{ background:`linear-gradient(135deg,${C.accent}12,${C.cyan}08)`, border:`1px solid ${C.accentL}25`, borderRadius:14, padding:"14px 18px", marginBottom:20, display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ fontSize:28 }}>🔗</div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:800, color:C.text, marginBottom:3 }}>
              Someone shared a {mode === "lc" ? "LeetCode" : "OOP"} analysis with you
            </div>
            <div style={{ fontSize:11, color:C.muted, fontFamily:"'JetBrains Mono',monospace" }}>
              This is a read-only view. Click <strong style={{color:C.accentL}}>Open in CODEVIS</strong> to analyze your own code.
            </div>
          </div>
          {result?.problem_name && (
            <div style={{ padding:"6px 14px", borderRadius:10, background:C.orange+"18", border:`1px solid ${C.orange}35`, fontSize:12, color:C.orange, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, whiteSpace:"nowrap" }}>
              {result.problem_name}
            </div>
          )}
        </div>

        {/* Summary */}
        {result?.summary && (
          <div style={{ background:C.card, borderRadius:10, padding:"11px 14px", border:`1px solid ${C.border}`, fontSize:12, color:C.dim, lineHeight:1.7, marginBottom:16 }}>
            <span style={{ color:C.accentL, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", fontSize:10, textTransform:"uppercase", letterSpacing:1 }}>Summary  </span>
            {result.summary}
          </div>
        )}

        {/* Viz tabs */}
        <div style={{ display:"flex", gap:3, background:C.surface, borderRadius:9, padding:3, border:`1px solid ${C.border}`, marginBottom:16 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setVizTab(t.id)} style={{ flex:1, padding:"8px 6px", borderRadius:7, border:"none", background:vizTab===t.id?C.card:"transparent", color:vizTab===t.id?C.accentL:C.muted, fontFamily:"'JetBrains Mono',monospace", fontSize:11, cursor:"pointer", fontWeight:vizTab===t.id?700:400, transition:"all .15s", boxShadow:vizTab===t.id?`0 0 8px ${C.glow}`:"none" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Result */}
        <div style={{ background:C.card, borderRadius:12, border:`1px solid ${C.border}`, padding:16, minHeight:400 }}>
          {mode === "lc"  && vizTab === "logic"      && <LCTutorTab    result={result} />}
          {mode === "lc"  && vizTab === "diagram"    && <ClassDiagram  data={result} />}
          {mode === "lc"  && vizTab === "complexity" && <ComplexityTab result={result} />}
          {mode === "oop" && vizTab === "tutor"      && <OOPTutorTab   result={result} />}
          {mode === "oop" && vizTab === "diagram"    && <ClassDiagram  data={result} />}
        </div>

        {/* CTA footer */}
        <div style={{ marginTop:24, textAlign:"center" }}>
          <div style={{ fontSize:12, color:C.muted, fontFamily:"'JetBrains Mono',monospace", marginBottom:12 }}>
            Want to analyze your own code?
          </div>
          <button onClick={onOpenApp}
            style={{ padding:"12px 32px", borderRadius:12, border:"none", background:`linear-gradient(135deg,${C.accent},${C.accentL})`, color:"#fff", fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:800, cursor:"pointer", boxShadow:`0 0 30px ${C.accent}44` }}>
            ⬡ Try CODEVIS Free →
          </button>
        </div>
      </div>
    </div>
  );
}