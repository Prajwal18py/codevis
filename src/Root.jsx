// src/Root.jsx — auth router
import { useState, useEffect } from "react";
import App       from "./App";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import { supabase } from "./utils/supabase";
import { decodeShare } from "./utils/share";
import SharedView from "./pages/SharedView";

export default function Root() {
  const [user,       setUser]       = useState(undefined);
  const [view,       setView]       = useState("dashboard");
  const [dashKey,    setDashKey]    = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [sharedData, setSharedData] = useState(null); // decoded share payload

  // Read share hash immediately — before auth or anything else
  useEffect(() => {
    const shared = decodeShare(window.location.hash);
    if (shared?.result) {
      setSharedData(shared);
      history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.user) setView("dashboard");
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // TOKEN_REFRESHED fires every hour — ignore it completely to avoid re-renders
      if (event === "TOKEN_REFRESHED") return;
      if (event === "SIGNED_IN") {
        setUser(session?.user || null);
        setView(sharedData ? "app" : "dashboard");
      }
      if (event === "SIGNED_OUT") {
        setUser(null);
        setView("dashboard");
      }
      if (event === "USER_UPDATED") {
        setUser(session?.user || null);
        // Don't change view
      }
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

  // Show shared analysis publicly — no login needed
  if (sharedData?.result) return (
    <SharedView
      data={sharedData}
      onOpenApp={() => { setSharedData(null); setView(user ? "app" : "dashboard"); }}
    />
  );

  if (!user) return <LoginPage />;
  if (view === "dashboard") return <Dashboard key={dashKey} user={user} onEnterApp={() => setView("app")} />;
  return <App user={user} onDashboard={() => { setDashKey(k => k + 1); setView("dashboard"); }} />;
}