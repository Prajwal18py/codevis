// src/App.jsx — CODEVIS v5 — All features
// ✅ Monaco Editor toggle  ✅ Dracula/Nord/Dark/Light themes
// ✅ Shareable links       ✅ Mobile responsive
// ✅ AI Chat bubble        ✅ Graph & Tree Visualizer
import { useState, useEffect, useRef } from "react";
import { useTheme } from "./utils/ThemeContext";
import { callGroq, buildLCPrompt, buildOOPPrompt, buildAlgoPrompt } from "./utils/groq";
import { supabase, signOut, saveResult, updateStreak } from "./utils/supabase";
import { generateLCPdf, generateOOPPdf } from "./utils/generatePDF";
import { encodeShare, decodeShare, copyShareLink } from "./utils/share";
import { THEMES } from "./utils/theme";
import { Spinner } from "./components/UI";
import { CodeEditor, PlainEditor } from "./components/Editors";
import AuthModal      from "./components/AuthModal";
import AIChat         from "./components/AIChat";
import ClassDiagram   from "./tabs/ClassDiagram";
import LCTutorTab     from "./tabs/LCTutorTab";
import OOPTutorTab    from "./tabs/OOPTutorTab";
import AlgoTab        from "./tabs/AlgoTab";
import ComplexityTab  from "./tabs/ComplexityTab";
import OptimizeTab    from "./tabs/OptimizeTab";
import Playground     from "./tabs/Playground";
import Comparison     from "./tabs/Comparison";
import QuizTab        from "./tabs/QuizTab";
import CheatSheet     from "./tabs/CheatSheet";
import OOPConceptsTab from "./tabs/OOPConceptsTab";
import HistoryTab     from "./tabs/HistoryTab";
import GraphTreeTab   from "./tabs/GraphTreeTab";
import BattleTab     from "./tabs/BattleTab";

// ── Samples ───────────────────────────────────────────────────────────────────
const SAMPLES = {
  cpp: {
    oop:`#include <iostream>
#include <string>
#include <vector>
using namespace std;

class Vehicle {
protected:
    string brand; int year;
    static int totalVehicles;
public:
    Vehicle(string b,int y):brand(b),year(y){totalVehicles++;}
    virtual ~Vehicle(){totalVehicles--;}
    virtual double fuelCost() const = 0;
    virtual void display() const { cout<<year<<" "<<brand<<endl; }
    static int getTotal(){ return totalVehicles; }
    string getBrand() const { return brand; }
    bool operator>(const Vehicle& v) const { return year>v.year; }
    friend ostream& operator<<(ostream& os,const Vehicle& v);
};
int Vehicle::totalVehicles=0;
ostream& operator<<(ostream& os,const Vehicle& v){
    os<<"["<<v.brand<<" "<<v.year<<"]"; return os;
}

class Car:public Vehicle{
private: double engineCC;
public:
    Car(string b,int y,double cc):Vehicle(b,y),engineCC(cc){}
    double fuelCost() const override { return engineCC*0.08; }
    void display() const override {
        Vehicle::display();
        cout<<"  Engine: "<<engineCC<<"cc"<<endl;
    }
};

class Electric{
public:
    int batteryKWh;
    Electric(int kwh):batteryKWh(kwh){}
    virtual double chargeCost() const { return batteryKWh*0.12; }
};

class ElectricCar:public Car,public Electric{
public:
    ElectricCar(string b,int y,double cc,int kwh):Car(b,y,cc),Electric(kwh){}
    double fuelCost() const override { return chargeCost(); }
};

int main(){
    Car c("Toyota",2022,1500);
    ElectricCar e("Tesla",2024,0,100);
    c.display(); e.display();
    return 0;
}`,
    lc:`class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int,int> mp;
        for(int i=0;i<nums.size();i++){
            int comp=target-nums[i];
            if(mp.count(comp)) return {mp[comp],i};
            mp[nums[i]]=i;
        }
        return {};
    }
};`
  },
  python:{
    oop:`from abc import ABC, abstractmethod

class Shape(ABC):
    def __init__(self,color:str):
        self.__color=color
    @property
    def color(self): return self.__color
    @abstractmethod
    def area(self)->float: pass
    def display(self): print(f"Color: {self.__color}")

class Circle(Shape):
    def __init__(self,color,radius):
        super().__init__(color)
        self.__radius=radius
    def area(self): return 3.14159*self.__radius**2

class Rectangle(Shape):
    def __init__(self,color,w,h):
        super().__init__(color)
        self.__w=w; self.__h=h
    def area(self): return self.__w*self.__h

if __name__=="__main__":
    shapes=[Circle("Red",5.0),Rectangle("Blue",4.0,6.0)]
    for s in shapes:
        s.display()
        print(f"Area: {s.area():.2f}")`,
    lc:`class Solution:
    def twoSum(self,nums:list[int],target:int)->list[int]:
        seen={}
        for i,num in enumerate(nums):
            comp=target-num
            if comp in seen: return [seen[comp],i]
            seen[num]=i
        return []`
  }
};

const LC_PROBLEM=`Two Sum — Easy

Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

Example 1: Input: nums = [2,7,11,15], target = 9  Output: [0,1]
Example 2: Input: nums = [3,2,4], target = 6  Output: [1,2]

Constraints:
- 2 <= nums.length <= 10^4
- Only one valid answer exists.`;

const TOP_MODES=[
  {id:"lc",          icon:"🧩",label:"LeetCode"},
  {id:"oop",         icon:"🔷",label:"OOP"},
  {id:"oopconcepts", icon:"📖",label:"OOP Concepts"},
  {id:"algo",        icon:"📊",label:"Algorithms"},
  {id:"playground",  icon:"⚡",label:"Playground"},
  {id:"compare",     icon:"⚔️", label:"Compare"},
  {id:"graph",       icon:"🌳",label:"Graph & Tree"},
  {id:"quiz",        icon:"🎯",label:"Quiz"},
  {id:"cheatsheet",  icon:"📄",label:"Cheat Sheet"},
  {id:"battle",      icon:"⚔️", label:"Battle"},
  {id:"history",     icon:"📚",label:"History"},
];

const LC_TABS=[
  {id:"logic",     label:"🧠 Logic"},
  {id:"diagram",   label:"⬡ Diagram"},
  {id:"complexity",label:"△ Complexity"},
  {id:"optimize",  label:"⚡ Optimize"},
];
const OOP_TABS=[
  {id:"tutor",  label:"🎓 OOP Tutor"},
  {id:"diagram",label:"⬡ Diagram"},
];

const FULLWIDTH=["algo","playground","compare","quiz","cheatsheet","history","oopconcepts","graph","battle"];

// ── useIsMobile ───────────────────────────────────────────────────────────────
function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
}

// ── Theme Picker ──────────────────────────────────────────────────────────────
function ThemePicker({ C, themeName, setTheme }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  return (
    <div ref={ref} style={{ position:"relative" }}>
      <button onClick={()=>setOpen(o=>!o)} title="Theme" style={{ width:32,height:32,borderRadius:8,border:`1px solid ${C.border}`,background:C.card,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center" }}>
        🎨
      </button>
      {open && (
        <div style={{ position:"absolute",top:38,right:0,background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:6,zIndex:300,minWidth:150,boxShadow:`0 8px 32px rgba(0,0,0,.35)` }}>
          {Object.entries(THEMES).map(([key,val])=>(
            <button key={key} onClick={()=>{setTheme(key);setOpen(false);}} style={{ width:"100%",padding:"7px 12px",borderRadius:7,border:"none",background:themeName===key?C.accentL+"22":"transparent",color:themeName===key?C.accentL:C.text,fontFamily:"'JetBrains Mono',monospace",fontSize:11,cursor:"pointer",textAlign:"left",fontWeight:themeName===key?700:400,transition:"all .1s" }}>
              {val.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Share Button ──────────────────────────────────────────────────────────────
function ShareBtn({ mode, lang, result, C }) {
  const [state, setState] = useState("idle");
  if (!result) return null;
  const handle = async () => {
    const url = encodeShare(mode, lang, result);
    if (!url) { setState("error"); setTimeout(()=>setState("idle"),2000); return; }
    const ok = await copyShareLink(url);
    setState(ok?"copied":"error");
    setTimeout(()=>setState("idle"),2500);
  };
  return (
    <button onClick={handle} style={{ padding:"8px 12px",borderRadius:9,border:"none",background:state==="copied"?C.green+"22":state==="error"?C.red+"22":`linear-gradient(135deg,${C.teal}cc,${C.cyan})`,color:state==="copied"?C.green:state==="error"?C.red:"#fff",fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",transition:"all .3s" }}>
      {state==="copied"?"✓ Copied!":state==="error"?"✗ Failed":"🔗 Share"}
    </button>
  );
}

// ── Mobile Nav Drawer ─────────────────────────────────────────────────────────
function MobileNav({ C, mode, setMode, setResult, setAlgoResult, setError, setVizTab, open, onClose }) {
  if (!open) return null;
  return (
    <>
      <div onClick={onClose} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:200 }} />
      <div style={{ position:"fixed",top:0,left:0,bottom:0,width:260,background:C.surface,zIndex:201,padding:"16px 12px",overflowY:"auto",borderRight:`1px solid ${C.border}` }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16 }}>
          <span style={{ fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:800,color:C.accentL }}>CODEVIS</span>
          <button onClick={onClose} style={{ background:"transparent",border:"none",color:C.muted,fontSize:20,cursor:"pointer" }}>✕</button>
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:3 }}>
          {TOP_MODES.map(m=>(
            <button key={m.id} onClick={()=>{ setMode(m.id); setError(""); onClose(); }} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:9,border:"none",background:mode===m.id?C.accentL+"22":"transparent",color:mode===m.id?C.accentL:C.text,fontFamily:"'JetBrains Mono',monospace",fontSize:12,cursor:"pointer",fontWeight:mode===m.id?700:500,textAlign:"left",transition:"all .15s" }}>
              <span style={{ fontSize:16 }}>{m.icon}</span>{m.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App({ user: userProp, onDashboard }) {
  const { C, isDark, toggle, themeName, setTheme } = useTheme();
  const isMobile = useIsMobile();

  const [mode,        setMode]        = useState("lc");
  const [lang,        setLang]        = useState("cpp");
  const [lcProblem,   setLcProblem]   = useState(LC_PROBLEM);
  const [lcCode,      setLcCode]      = useState(SAMPLES.cpp.lc);
  const [oopCode,     setOopCode]     = useState(SAMPLES.cpp.oop);
  const [inputTab,    setInputTab]    = useState("problem");
  const [vizTab,      setVizTab]      = useState("logic");
  const [results,     setResults]     = useState({});  // per-mode cache
  const result = results[mode] || null;
  const setResult = (val) => setResults(prev => ({ ...prev, [mode]: val }));
  const [algoResult,  setAlgoResult]  = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [algoLoading, setAlgoLoading] = useState(false);
  const [algoError,   setAlgoError]   = useState("");
  const [error,       setError]       = useState("");
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [user,        setUser]        = useState(userProp||null);
  const [showAuth,    setShowAuth]    = useState(false);
  const [shareBanner, setShareBanner] = useState(null);
  const [mobileNav,   setMobileNav]   = useState(false);
  // Mobile — show input or output panel
  const [mobilePanel, setMobilePanel] = useState("input"); // "input" | "output"



  // ── Auth ──────────────────────────────────────────────────────────────────
  // Auth is handled by Root.jsx — App just uses the user prop directly
  // No listener here to avoid re-renders on token refresh

  function switchLang(l) {
    setLang(l); setLcCode(SAMPLES[l].lc); setOopCode(SAMPLES[l].oop); setResults({});
  }

  async function handleAnalyze() {
    setLoading(true); setError(""); setResult(null); setSaved(false);
    // setVizTab reset removed — keep current vizTab on mode switch
    if (isMobile) setMobilePanel("output");
    try {
      const prompt=mode==="lc"?buildLCPrompt(lcProblem,lcCode,lang):buildOOPPrompt(oopCode,lang);
      setResult(await callGroq(prompt));
      if (user?.id) updateStreak(user.id).catch(()=>{});
    } catch(e) {
      setError(e.message.includes("JSON")?"AI parse error — try again.":e.message);
    } finally { setLoading(false); }
  }

  async function handleAlgoAnalyze(name) {
    setAlgoLoading(true); setAlgoResult(null); setAlgoError("");
    try { setAlgoResult(await callGroq(buildAlgoPrompt(name))); }
    catch(e) { setAlgoError(e.message.includes("JSON")?"AI parse error.":e.message); }
    finally { setAlgoLoading(false); }
  }

  async function handleSave() {
    if (!user){ setShowAuth(true); return; }
    if (!result) return;
    setSaving(true);
    try {
      await saveResult({userId:user.id,type:mode,title:result.problem_name||result.summary?.slice(0,60)||"OOP Analysis",lang,result});
      setSaved(true); setTimeout(()=>setSaved(false),3000);
    } catch(e){ setError("Save failed: "+e.message); }
    finally { setSaving(false); }
  }

  function handleHistoryLoad(full) {
    setMode(full.type); setLang(full.lang||"cpp"); setResult(full.result_json);
    setVizTab(full.type==="oop"?"tutor":"logic");
    setTimeout(()=>setMode(full.type),50);
  }

  const isFullWidth = FULLWIDTH.includes(mode);
  const tabs = mode==="oop"?OOP_TABS:LC_TABS;
  const langColor = lang==="python"?C.green:C.accentL;

  // ── Header ────────────────────────────────────────────────────────────────
  const header = (
    <div style={{ borderBottom:`1px solid ${C.border}`,padding:"0 16px",background:C.surface,position:"sticky",top:0,zIndex:100 }}>
      <div style={{ maxWidth:1500,margin:"0 auto",display:"flex",alignItems:"center",height:52,gap:8 }}>
        {/* Hamburger on mobile */}
        {isMobile && (
          <button onClick={()=>setMobileNav(true)} style={{ background:"transparent",border:"none",color:C.text,fontSize:20,cursor:"pointer",padding:"4px",lineHeight:1 }}>☰</button>
        )}
        {/* Logo */}
        <div style={{ width:26,height:26,borderRadius:7,background:`linear-gradient(135deg,${C.accent},${C.cyan})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0 }}>⬡</div>
        <span style={{ fontFamily:"'Syne',sans-serif",fontSize:isMobile?14:18,fontWeight:800,color:C.accentL,flexShrink:0,letterSpacing:1 }}>CODEVIS</span>

        {/* Desktop nav */}
        {!isMobile && (
          <div style={{ display:"flex",gap:1,overflowX:"auto",flex:1 }}>
            {TOP_MODES.map(m=>(
              <button key={m.id} onClick={()=>{setMode(m.id);setError("");}} style={{ display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:7,border:"none",background:mode===m.id?C.accentL+"22":"transparent",color:mode===m.id?C.accentL:C.text,fontFamily:"'JetBrains Mono',monospace",fontSize:10,cursor:"pointer",fontWeight:mode===m.id?700:500,whiteSpace:"nowrap",borderBottom:mode===m.id?`2px solid ${C.accentL}`:"2px solid transparent",opacity:mode===m.id?1:0.75,flexShrink:0,transition:"all .15s" }}>
                <span>{m.icon}</span><span>{m.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Mobile — show current mode label */}
        {isMobile && (
          <span style={{ flex:1,fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:C.accentL,fontWeight:700 }}>
            {TOP_MODES.find(m=>m.id===mode)?.icon} {TOP_MODES.find(m=>m.id===mode)?.label}
          </span>
        )}

        {/* Right controls */}
        <div style={{ display:"flex",alignItems:"center",gap:isMobile?4:6,flexShrink:0 }}>
          <ThemePicker C={C} themeName={themeName} setTheme={setTheme} />
          {!isMobile && (
            <button onClick={toggle} style={{ width:32,height:32,borderRadius:8,border:`1px solid ${C.border}`,background:C.card,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center" }}>
              {isDark?"☀️":"🌙"}
            </button>
          )}
          {["lc","oop"].includes(mode) && !isMobile && (
            <div style={{ display:"flex",gap:2,background:C.card,borderRadius:8,padding:3,border:`1px solid ${C.border}` }}>
              {[{id:"cpp",label:"C++"},{id:"python",label:"Python"}].map(l=>(
                <button key={l.id} onClick={()=>switchLang(l.id)} style={{ padding:"4px 10px",borderRadius:6,border:"none",background:lang===l.id?langColor+"22":"transparent",color:lang===l.id?langColor:C.muted,fontFamily:"'JetBrains Mono',monospace",fontSize:10,cursor:"pointer",fontWeight:lang===l.id?700:400,transition:"all .15s" }}>
                  {l.label}
                </button>
              ))}
            </div>
          )}
          {user?(
            <div style={{ display:"flex",alignItems:"center",gap:5 }}>
              {onDashboard && !isMobile && <button onClick={onDashboard} style={{ padding:"4px 9px",borderRadius:7,border:`1px solid ${C.border}`,background:"transparent",color:C.muted,fontFamily:"'JetBrains Mono',monospace",fontSize:10,cursor:"pointer" }}>📊</button>}
              {user.user_metadata?.avatar_url
                ?<img src={user.user_metadata.avatar_url} alt="" referrerPolicy="no-referrer" crossOrigin="anonymous" style={{ width:26,height:26,borderRadius:"50%",border:`1.5px solid ${C.border}`,cursor:"default" }} onError={e=>{e.target.style.display="none";}} />
                :<div style={{ width:26,height:26,borderRadius:"50%",background:`linear-gradient(135deg,${C.accent},${C.cyan})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff",cursor:"default",fontFamily:"'Syne',sans-serif",flexShrink:0 }}>
                  {(user.user_metadata?.name||user.email||"U")[0].toUpperCase()}
                </div>
              }
              {!isMobile && <button onClick={signOut} style={{ padding:"3px 8px",borderRadius:6,border:`1px solid ${C.border}`,background:"transparent",color:C.muted,fontSize:9,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace" }}>out</button>}
            </div>
          ):(
            <button onClick={()=>setShowAuth(true)} style={{ padding:"5px 12px",borderRadius:8,border:"none",background:`linear-gradient(135deg,${C.accent},${C.accentL})`,color:"#fff",fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:700,cursor:"pointer" }}>
              Sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // ── Left input panel ──────────────────────────────────────────────────────
  const leftPanel = (
    <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
      {/* Mobile lang toggle */}
      {isMobile && ["lc","oop"].includes(mode) && (
        <div style={{ display:"flex",gap:2,background:C.card,borderRadius:8,padding:3,border:`1px solid ${C.border}` }}>
          {[{id:"cpp",label:"C++"},{id:"python",label:"Python"}].map(l=>(
            <button key={l.id} onClick={()=>switchLang(l.id)} style={{ flex:1,padding:"6px",borderRadius:6,border:"none",background:lang===l.id?langColor+"22":"transparent",color:lang===l.id?langColor:C.muted,fontFamily:"'JetBrains Mono',monospace",fontSize:11,cursor:"pointer",fontWeight:lang===l.id?700:400 }}>
              {l.label}
            </button>
          ))}
        </div>
      )}

      {mode==="lc" && (
        <>
          <div style={{ display:"flex",gap:3,background:C.surface,borderRadius:9,padding:3,border:`1px solid ${C.border}` }}>
            {[{id:"problem",label:"📋 Problem",col:C.orange},{id:"code",label:"</> Solution",col:langColor}].map(t=>(
              <button key={t.id} onClick={()=>setInputTab(t.id)} style={{ flex:1,padding:"7px",borderRadius:7,border:"none",background:inputTab===t.id?C.card:"transparent",color:inputTab===t.id?t.col:C.muted,fontFamily:"'JetBrains Mono',monospace",fontSize:11,cursor:"pointer",fontWeight:inputTab===t.id?700:400,transition:"all .15s" }}>
                {t.label}
              </button>
            ))}
          </div>
          {inputTab==="problem"?(
            <div style={{ flex:1,display:"flex",flexDirection:"column",gap:6 }}>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                <span style={{ fontSize:10,color:C.orange,fontFamily:"'JetBrains Mono',monospace",textTransform:"uppercase",letterSpacing:1 }}>Problem Statement</span>
                <div style={{ display:"flex",gap:5 }}>
                  <button onClick={()=>setLcProblem("")} style={{ background:"transparent",border:`1px solid ${C.border}`,color:C.muted,borderRadius:6,padding:"3px 9px",cursor:"pointer",fontSize:10 }}>Clear</button>
                  <button onClick={()=>setLcProblem(LC_PROBLEM)} style={{ background:"transparent",border:`1px solid ${C.blue}50`,color:C.blue,borderRadius:6,padding:"3px 9px",cursor:"pointer",fontSize:10 }}>Sample</button>
                </div>
              </div>
              <PlainEditor value={lcProblem} onChange={setLcProblem} filename="problem.txt" minHeight={isMobile?200:360} placeholder="Paste the LeetCode problem here..." />
              {lcProblem === LC_PROBLEM && (
                <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 10px", borderRadius:7, background:C.orange+"12", border:`1px solid ${C.orange}35`, fontSize:10, color:C.orange, fontFamily:"'JetBrains Mono',monospace" }}>
                  <span style={{fontSize:12}}>☝️</span>
                  <span>This is a <strong>sample problem</strong> — replace it with your own LeetCode problem!</span>
                </div>
              )}
            </div>
          ):(
            <div style={{ flex:1,display:"flex",flexDirection:"column",gap:6 }}>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                <span style={{ fontSize:10,color:langColor,fontFamily:"'JetBrains Mono',monospace",textTransform:"uppercase",letterSpacing:1 }}>{lang==="python"?"Python":"C++"} Solution</span>
                <div style={{ display:"flex",gap:5 }}>
                  <button onClick={()=>setLcCode("")} style={{ background:"transparent",border:`1px solid ${C.border}`,color:C.muted,borderRadius:6,padding:"3px 9px",cursor:"pointer",fontSize:10 }}>Clear</button>
                  <button onClick={()=>setLcCode(SAMPLES[lang].lc)} style={{ background:"transparent",border:`1px solid ${C.blue}50`,color:C.blue,borderRadius:6,padding:"3px 9px",cursor:"pointer",fontSize:10 }}>Sample</button>
                </div>
              </div>
              <CodeEditor value={lcCode} onChange={setLcCode} filename={lang==="python"?"solution.py":"solution.cpp"} minHeight={isMobile?200:360} language={lang} />
            </div>
          )}
        </>
      )}

      {mode==="oop" && (
        <div style={{ flex:1,display:"flex",flexDirection:"column",gap:6 }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
            <span style={{ fontSize:10,color:langColor,fontFamily:"'JetBrains Mono',monospace",textTransform:"uppercase",letterSpacing:1 }}>{lang==="python"?"Python":"C++"} OOP Code</span>
            <div style={{ display:"flex",gap:5 }}>
              <button onClick={()=>setOopCode("")} style={{ background:"transparent",border:`1px solid ${C.border}`,color:C.muted,borderRadius:6,padding:"3px 9px",cursor:"pointer",fontSize:10 }}>Clear</button>
              <button onClick={()=>setOopCode(SAMPLES[lang].oop)} style={{ background:"transparent",border:`1px solid ${C.blue}50`,color:C.blue,borderRadius:6,padding:"3px 9px",cursor:"pointer",fontSize:10 }}>Sample</button>
            </div>
          </div>
          <CodeEditor value={oopCode} onChange={setOopCode} filename={lang==="python"?"oop_code.py":"oop_code.cpp"} minHeight={isMobile?200:420} language={lang} />
        </div>
      )}

      {error && <div style={{ background:C.red+"0f",border:`1px solid ${C.red}35`,borderRadius:8,padding:"8px 12px",color:C.red,fontSize:11,fontFamily:"'JetBrains Mono',monospace" }}>⚠ {error}</div>}

      <button onClick={handleAnalyze} disabled={loading} style={{ padding:"13px",borderRadius:10,border:"none",background:loading?C.accentL+"30":`linear-gradient(135deg,${C.accent},${C.accentL})`,color:"#fff",fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:800,cursor:loading?"not-allowed":"pointer",boxShadow:loading?"none":`0 0 30px ${C.glow},0 2px 8px rgba(0,0,0,.4)`,transition:"all .2s" }}>
        {loading?"⟳  Analyzing...":mode==="oop"?"⬡  Analyze OOP Code":"⬡  Analyze & Explain"}
      </button>

      {result?.summary && (
        <div style={{ background:C.card,borderRadius:10,padding:"11px 13px",border:`1px solid ${C.border}`,fontSize:12,color:C.dim,lineHeight:1.7 }}>
          <span style={{ color:C.accentL,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",fontSize:10,textTransform:"uppercase",letterSpacing:1 }}>Summary  </span>
          {result.summary}
        </div>
      )}

      {/* Mobile: switch to output */}
      {isMobile && result && (
        <button onClick={()=>setMobilePanel("output")} style={{ padding:"10px",borderRadius:9,border:`1px solid ${C.accentL}`,background:C.accentL+"15",color:C.accentL,fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:700,cursor:"pointer" }}>
          View Results →
        </button>
      )}
    </div>
  );

  // ── Right output panel ────────────────────────────────────────────────────
  const rightPanel = (
    <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
      <div style={{ display:"flex",gap:8,alignItems:"center",flexWrap:"wrap" }}>
        <div style={{ display:"flex",gap:3,background:C.surface,borderRadius:9,padding:3,border:`1px solid ${C.border}`,flex:1,minWidth:isMobile?0:200 }}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setVizTab(t.id)} style={{ flex:1,padding:"7px 4px",borderRadius:7,border:"none",background:vizTab===t.id?C.card:"transparent",color:vizTab===t.id?C.accentL:C.text,fontFamily:"'JetBrains Mono',monospace",fontSize:isMobile?9:11,cursor:"pointer",fontWeight:vizTab===t.id?700:500,transition:"all .15s",whiteSpace:"nowrap",opacity:vizTab===t.id?1:0.75 }}>
              {t.label}
            </button>
          ))}
        </div>
        {result && (
          <div style={{ display:"flex",gap:5,flexWrap:"wrap" }}>
            <ShareBtn mode={mode} lang={lang} result={result} C={C} />
            <button onClick={handleSave} disabled={saving||saved} style={{ padding:"7px 12px",borderRadius:9,border:"none",background:saved?C.green+"22":saving?C.accentL+"20":`linear-gradient(135deg,${C.accent},${C.accentL})`,color:saved?C.green:"#fff",fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,cursor:saving||saved?"default":"pointer",whiteSpace:"nowrap",transition:"all .3s" }}>
              {saved?"✓ Saved!":saving?"⟳":"💾"}
            </button>
            <button onClick={()=>mode==="oop"?generateOOPPdf(result):generateLCPdf(result)} style={{ padding:"7px 12px",borderRadius:9,border:"none",background:`linear-gradient(135deg,${C.red}cc,${C.coral})`,color:"#fff",fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap" }}>
              📥 PDF
            </button>
          </div>
        )}
      </div>

      <div style={{ flex:1,background:C.card,borderRadius:12,border:`1px solid ${C.border}`,overflow:"auto",padding:16,minHeight:isMobile?300:520 }}>
        {loading?<Spinner />:!result?(
          vizTab==="optimize"?<OptimizeTab key={lang} code={mode==="lc"?lcCode:oopCode} problem={lcProblem} lang={lang} />:(
            <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",minHeight:isMobile?260:460,gap:14,color:C.muted }}>
              <div style={{ fontSize:52,opacity:.1 }}>⬡</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:12,textAlign:"center",lineHeight:2.2 }}>
                {mode==="oop"?`Paste your ${lang==="python"?"Python":"C++"} OOP code`:"Paste a LeetCode problem"}<br/>
                <span style={{ fontSize:10,opacity:.6 }}>and hit Analyze</span>
              </div>
            </div>
          )
        ):(
          <div>
            {mode==="lc"  && vizTab==="logic"      && <LCTutorTab    result={result} />}
            {mode==="lc"  && vizTab==="diagram"    && <ClassDiagram  data={result} />}
            {mode==="lc"  && vizTab==="complexity" && <ComplexityTab result={result} />}
            {mode==="lc"  && vizTab==="optimize"   && <OptimizeTab   key={lang} code={lcCode} problem={lcProblem} lang={lang} />}
            {mode==="oop" && vizTab==="tutor"      && <OOPTutorTab   result={result} />}
            {mode==="oop" && vizTab==="diagram"    && <ClassDiagram  data={result} />}
          </div>
        )}
      </div>

      {/* Mobile: back to input */}
      {isMobile && (
        <button onClick={()=>setMobilePanel("input")} style={{ padding:"9px",borderRadius:9,border:`1px solid ${C.border}`,background:"transparent",color:C.muted,fontFamily:"'JetBrains Mono',monospace",fontSize:11,cursor:"pointer" }}>
          ← Back to Input
        </button>
      )}
    </div>
  );

  return (
    <div style={{ minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'Inter',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Syne:wght@700;800&family=Inter:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:${C.surface}}
        ::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:none}}
      `}</style>

      {showAuth && <AuthModal onClose={()=>setShowAuth(false)} />}

      <MobileNav C={C} mode={mode} setMode={setMode} setResult={setResult} setAlgoResult={setAlgoResult} setError={setError} setVizTab={setVizTab} open={mobileNav} onClose={()=>setMobileNav(false)} />

      {shareBanner && (
        <div style={{ position:"fixed",top:60,left:"50%",transform:"translateX(-50%)",zIndex:500,background:C.green+"22",border:`1px solid ${C.green}55`,borderRadius:10,padding:"10px 20px",color:C.green,fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:700,animation:"slideDown .3s ease",whiteSpace:"nowrap" }}>
          {shareBanner}
        </div>
      )}

      {header}

      {/* Full-width modes — always mounted, hidden via display:none to prevent remount flash */}
      <div style={{ maxWidth:1500,margin:"0 auto",padding:isMobile?"12px":"18px 20px", display: isFullWidth ? "block" : "none" }}>
        <div style={{ display: mode==="algo"        ? "block":"none" }}><AlgoTab onAnalyze={handleAlgoAnalyze} result={algoResult} loading={algoLoading} error={algoError} /></div>
        <div style={{ display: mode==="playground"  ? "block":"none" }}><Playground /></div>
        <div style={{ display: mode==="compare"     ? "block":"none" }}><Comparison /></div>
        <div style={{ display: mode==="quiz"        ? "block":"none" }}><QuizTab user={user} /></div>
        <div style={{ display: mode==="cheatsheet"  ? "block":"none" }}><CheatSheet /></div>
        <div style={{ display: mode==="graph"       ? "block":"none" }}><GraphTreeTab /></div>
        <div style={{ display: mode==="history"     ? "block":"none" }}><HistoryTab user={user} onLoad={handleHistoryLoad} /></div>
        <div style={{ display: mode==="battle"      ? "block":"none" }}><BattleTab user={user} /></div>
        <div style={{ display: mode==="oopconcepts" ? "block":"none" }}><OOPConceptsTab /></div>
      </div>

      {/* 2-col: LC / OOP — desktop */}
      <div style={{ maxWidth:1500,margin:"0 auto",padding:"18px 20px",display: !isFullWidth && !isMobile ? "grid":"none", gridTemplateColumns:"clamp(320px,28%,420px) 1fr",gap:20,minHeight:"calc(100vh - 52px)" }}>
        {leftPanel}
        {rightPanel}
      </div>

      {/* Single col mobile */}
      <div style={{ padding:"12px", display: !isFullWidth && isMobile ? "block":"none" }}>
        {mobilePanel==="input" ? leftPanel : rightPanel}
      </div>

      <AIChat mode={mode} lang={lang} result={result} code={mode==="lc"?lcCode:oopCode} />
    </div>
  );
}