// src/components/AuthModal.jsx — Enhanced
// Enhancements:
// - useTheme() (no hardcoded C)
// - Entrance animation + backdrop blur
// - Hover lift + glow on buttons
// - Feature list inside modal
// - Keyboard: Escape to close

import { useState, useEffect } from "react";
import { useTheme } from "../utils/ThemeContext";
import { signInWithGoogle, signInWithGitHub } from "../utils/supabase";

export default function AuthModal({ onClose }) {
  const { C } = useTheme();
  const [loading, setLoading] = useState("");
  const [error,   setError]   = useState("");
  const [vis,     setVis]     = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVis(true), 10);
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { clearTimeout(t); window.removeEventListener("keydown", onKey); };
  }, []);

  async function handleGoogle() {
    setLoading("google"); setError("");
    try { await signInWithGoogle(); }
    catch(e) { setError(e.message); setLoading(""); }
  }

  async function handleGitHub() {
    setLoading("github"); setError("");
    try { await signInWithGitHub(); }
    catch(e) { setError(e.message); setLoading(""); }
  }

  const FEATURES = [
    { icon:"💾", text:"Save analyses forever" },
    { icon:"🎯", text:"Track quiz scores" },
    { icon:"📊", text:"Dashboard + streak" },
    { icon:"📚", text:"Analysis history" },
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position:"fixed", inset:0, zIndex:1000,
        background:"rgba(0,0,0,.75)",
        backdropFilter:"blur(6px)",
        display:"flex", alignItems:"center", justifyContent:"center",
        opacity:vis?1:0, transition:"opacity .25s ease",
      }}
    >
      <div
        onClick={e=>e.stopPropagation()}
        style={{
          background:C.surface,
          border:`1px solid ${C.accentL}30`,
          borderRadius:20, padding:"32px 28px",
          width:380, display:"flex", flexDirection:"column", gap:18,
          boxShadow:`0 0 80px ${C.glow}, 0 24px 60px rgba(0,0,0,.5)`,
          transform:vis?"translateY(0) scale(1)":"translateY(20px) scale(.97)",
          transition:"transform .3s ease",
        }}
      >
        {/* Logo + header */}
        <div style={{ textAlign:"center" }}>
          <div style={{ width:48, height:48, borderRadius:14, background:`linear-gradient(135deg,${C.accent},${C.cyan})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, margin:"0 auto 14px", boxShadow:`0 0 24px ${C.accent}55` }}>⬡</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, background:`linear-gradient(90deg,${C.accentL},${C.cyan})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", marginBottom:6 }}>
            Sign in to CODEVIS
          </div>
          <div style={{ fontSize:11, color:C.muted, fontFamily:"'JetBrains Mono',monospace", lineHeight:1.8 }}>
            Save your progress and unlock all features
          </div>
        </div>

        {/* Feature pills */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
          {FEATURES.map((f,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:7, padding:"7px 10px", background:C.card, borderRadius:9, border:`1px solid ${C.border}`, fontSize:11, color:C.dim, fontFamily:"'JetBrains Mono',monospace" }}>
              <span>{f.icon}</span>{f.text}
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ flex:1, height:1, background:C.border }} />
          <span style={{ fontSize:10, color:C.muted, fontFamily:"'JetBrains Mono',monospace" }}>continue with</span>
          <div style={{ flex:1, height:1, background:C.border }} />
        </div>

        {/* Google */}
        <AuthBtn
          onClick={handleGoogle}
          loading={loading==="google"}
          disabled={!!loading}
          C={C}
          icon={
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
          }
          label="Continue with Google"
        />

        {/* GitHub */}
        <AuthBtn
          onClick={handleGitHub}
          loading={loading==="github"}
          disabled={!!loading}
          C={C}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill={C.text}>
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
          }
          label="Continue with GitHub"
        />

        {error && (
          <div style={{ background:C.red+"0f", border:"1px solid "+C.red+"35", borderRadius:8, padding:"8px 12px", color:C.red, fontSize:11, fontFamily:"'JetBrains Mono',monospace", textAlign:"center" }}>
            ⚠ {error}
          </div>
        )}

        <div style={{ fontSize:10, color:C.muted+"80", textAlign:"center", fontFamily:"'JetBrains Mono',monospace", lineHeight:1.7 }}>
          Your data is stored securely on Supabase.<br/>We never sell your data. · Press Esc to close
        </div>

        <button onClick={onClose} style={{ background:"transparent", border:"none", color:C.muted, fontSize:11, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", opacity:.7 }}>
          Maybe later →
        </button>
      </div>
    </div>
  );
}

function AuthBtn({ onClick, loading, disabled, C, icon, label }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>setHov(false)}
      style={{
        padding:"12px", borderRadius:11,
        border:`1px solid ${hov && !disabled ? C.accentL+"50" : C.border}`,
        background: hov && !disabled ? C.card+"ee" : C.card,
        color:C.text, fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:600,
        cursor:disabled?"not-allowed":"pointer",
        display:"flex", alignItems:"center", justifyContent:"center", gap:10,
        transform: hov && !disabled ? "translateY(-1px)" : "translateY(0)",
        boxShadow: hov && !disabled ? `0 4px 16px rgba(0,0,0,.3), 0 0 12px ${C.accentL}18` : "none",
        transition:"all .18s ease",
      }}
    >
      {loading ? (
        <span style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:14, height:14, borderRadius:"50%", border:`2px solid ${C.accentL}40`, borderTopColor:C.accentL, animation:"cvSpin .8s linear infinite" }} />
          Connecting...
        </span>
      ) : <>{icon}{label}</>}
      <style>{"@keyframes cvSpin{to{transform:rotate(360deg)}}"}</style>
    </button>
  );
}