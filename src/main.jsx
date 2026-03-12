// src/main.jsx
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import LoginPage  from "./pages/LoginPage";
import Dashboard  from "./pages/Dashboard";
import { ThemeProvider } from "./utils/ThemeContext";
import { supabase } from "./utils/supabase";

function Root() {
  const [user,    setUser]    = useState(undefined);
  const [view,    setView]    = useState("dashboard");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null);
      if (session?.user) setView("dashboard");
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#07070d", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:14 }}>
      <div style={{ width:44, height:44, borderRadius:12, background:"linear-gradient(135deg,#7c3aed,#06b6d4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>⬡</div>
      <div style={{ width:32, height:32, borderRadius:"50%", border:"3px solid #a855f7", borderTopColor:"transparent", animation:"spin .8s linear infinite" }} />
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    </div>
  );

  if (!user) return <LoginPage />;
  if (view==="dashboard") return <Dashboard user={user} onEnterApp={()=>setView("app")} />;
  return <App user={user} onDashboard={()=>setView("dashboard")} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <Root />
    </ThemeProvider>
  </React.StrictMode>
);