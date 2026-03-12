// src/App.jsx — CODEVIS v4 — Python + Supabase
import { useState, useEffect } from "react";
import { useTheme } from "./utils/ThemeContext";
import { callGroq, buildLCPrompt, buildOOPPrompt, buildAlgoPrompt } from "./utils/groq";
import { supabase, signOut, saveResult } from "./utils/supabase";
import { generateLCPdf, generateOOPPdf } from "./utils/generatePDF";
import { Badge, DiffBadge, Spinner } from "./components/UI";
import { CodeEditor, PlainEditor } from "./components/Editors";
import AuthModal    from "./components/AuthModal";
import ClassDiagram  from "./tabs/ClassDiagram";
import LCTutorTab   from "./tabs/LCTutorTab";
import OOPTutorTab  from "./tabs/OOPTutorTab";
import AlgoTab      from "./tabs/AlgoTab";
import ComplexityTab from "./tabs/ComplexityTab";
import OptimizeTab   from "./tabs/OptimizeTab";
import Playground   from "./tabs/Playground";
import Comparison   from "./tabs/Comparison";
import QuizTab      from "./tabs/QuizTab";
import CheatSheet   from "./tabs/CheatSheet";
import OOPConceptsTab from "./tabs/OOPConceptsTab";
import HistoryTab   from "./tabs/HistoryTab";

// ── Samples ────────────────────────────────────────────────────
const SAMPLES = {
  cpp: {
    oop: `#include <iostream>
#include <string>
#include <vector>
using namespace std;

// ── Abstract Base Class (Abstraction) ─────────────────────────
class Vehicle {
protected:
    string brand;
    int year;
    static int totalVehicles;   // Static member — shared across all objects
public:
    Vehicle(string b, int y) : brand(b), year(y) {
        totalVehicles++;        // increments every time an object is created
    }
    virtual ~Vehicle() { totalVehicles--; }            // Virtual destructor
    virtual double fuelCost() const = 0;               // Pure virtual — forces override
    virtual void display() const {                     // Virtual function
        cout << year << " " << brand << endl;
    }
    static int getTotal() { return totalVehicles; }    // Static method
    string getBrand() const { return brand; }          // Getter — Encapsulation

    // Operator overloading — compare by year
    bool operator>(const Vehicle& v) const { return year > v.year; }
    friend ostream& operator<<(ostream& os, const Vehicle& v);
};
int Vehicle::totalVehicles = 0;

ostream& operator<<(ostream& os, const Vehicle& v) {   // Friend function
    os << "[" << v.brand << " " << v.year << "]";
    return os;
}

// ── Single Inheritance ─────────────────────────────────────────
class Car : public Vehicle {
private:
    double engineCC;           // Encapsulation — private data
public:
    Car(string b, int y, double cc) : Vehicle(b, y), engineCC(cc) {}
    double fuelCost() const override {                 // Runtime Polymorphism
        return engineCC * 0.08;
    }
    void display() const override {
        Vehicle::display();    // calling parent method
        cout << "  Engine: " << engineCC << "cc | Fuel: $" << fuelCost() << "/day" << endl;
    }
};

// ── Multiple Inheritance ───────────────────────────────────────
class Electric {
public:
    int batteryKWh;
    Electric(int kwh) : batteryKWh(kwh) {}
    virtual double chargeCost() const { return batteryKWh * 0.12; }
};

class ElectricCar : public Car, public Electric { // Multiple Inheritance
public:
    ElectricCar(string b, int y, double cc, int kwh)
        : Car(b, y, cc), Electric(kwh) {}
    double fuelCost() const override { return chargeCost(); } // prefer electric
    void display() const override {
        Car::display();
        cout << "  Battery: " << batteryKWh << " kWh | Charge cost: $" << chargeCost() << endl;
    }
};

// ── Template function (Generics) ───────────────────────────────
template <typename T>
T findCheapest(T a, T b) { return (a.fuelCost() < b.fuelCost()) ? a : b; }

// ── Composition ────────────────────────────────────────────────
class Fleet {
    vector<Vehicle*> vehicles;  // Fleet HAS vehicles (composition)
    string companyName;
public:
    Fleet(string name) : companyName(name) {}
    void add(Vehicle* v) { vehicles.push_back(v); }
    void showAll() const {
        cout << "=== " << companyName << " Fleet ===" << endl;
        for (auto v : vehicles) v->display();         // Runtime polymorphism!
        cout << "Total registered: " << Vehicle::getTotal() << endl;
    }
    ~Fleet() { for (auto v : vehicles) delete v; }
};

int main() {
    Fleet fleet("ACME Corp");
    fleet.add(new Car("Toyota", 2022, 1500));
    fleet.add(new Car("BMW", 2024, 3000));
    fleet.add(new ElectricCar("Tesla", 2024, 0, 100));
    fleet.showAll();
    cout << "Total vehicles: " << Vehicle::getTotal() << endl;
    return 0;
}`,
    lc: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> mp;
        for (int i = 0; i < nums.size(); i++) {
            int comp = target - nums[i];
            if (mp.count(comp)) return {mp[comp], i};
            mp[nums[i]] = i;
        }
        return {};
    }
};`
  },
  python: {
    oop: `from abc import ABC, abstractmethod

class Shape(ABC):
    def __init__(self, color: str):
        self.__color = color   # private via name mangling

    @property
    def color(self):
        return self.__color

    @abstractmethod
    def area(self) -> float:
        pass

    def display(self):
        print(f"Color: {self.__color}")

class Circle(Shape):
    def __init__(self, color: str, radius: float):
        super().__init__(color)
        self.__radius = radius

    def area(self) -> float:
        return 3.14159 * self.__radius ** 2

    def display(self):
        super().display()
        print(f"Circle area: {self.area():.2f}")

class Rectangle(Shape):
    def __init__(self, color: str, width: float, height: float):
        super().__init__(color)
        self.__width  = width
        self.__height = height

    def area(self) -> float:
        return self.__width * self.__height

if __name__ == "__main__":
    shapes: list[Shape] = [Circle("Red", 5.0), Rectangle("Blue", 4.0, 6.0)]
    for s in shapes:
        s.display()
        print(f"Area: {s.area():.2f}")`,
    lc: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        seen = {}                          # val -> index
        for i, num in enumerate(nums):
            comp = target - num
            if comp in seen:
                return [seen[comp], i]
            seen[num] = i
        return []`
  }
};

const LC_PROBLEM = `Two Sum — Easy

Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

Example 1: Input: nums = [2,7,11,15], target = 9  Output: [0,1]
Example 2: Input: nums = [3,2,4], target = 6  Output: [1,2]

Constraints:
- 2 <= nums.length <= 10^4
- Only one valid answer exists.`;

const TOP_MODES = [
  { id:"lc",          icon:"🧩", label:"LeetCode"    },
  { id:"oop",         icon:"🔷", label:"OOP"          },
  { id:"oopconcepts", icon:"📖", label:"OOP Concepts" },
  { id:"algo",        icon:"📊", label:"Algorithms"   },
  { id:"playground",  icon:"⚡", label:"Playground"   },
  { id:"compare",     icon:"⚔️",  label:"Compare"      },
  { id:"quiz",        icon:"🎯", label:"Quiz"         },
  { id:"cheatsheet",  icon:"📄", label:"Cheat Sheet"  },
  { id:"history",     icon:"📚", label:"History"      },
];

const LC_TABS  = [
  { id:"logic",      label:"🧠 Logic Tutor"  },
  { id:"diagram",    label:"⬡ Class Diagram" },
  { id:"complexity", label:"△ Complexity"    },
  { id:"optimize",   label:"⚡ Optimize"      },
];
const OOP_TABS = [
  { id:"tutor",   label:"🎓 OOP Tutor"    },
  { id:"diagram", label:"⬡ Class Diagram" },
];

export default function App({ user: userProp, onDashboard }) {
  const { C, isDark, toggle } = useTheme();
  const [mode,        setMode]        = useState("lc");
  const [lang,        setLang]        = useState("cpp");      // "cpp" | "python"
  const [lcProblem,   setLcProblem]   = useState(LC_PROBLEM);
  const [lcCode,      setLcCode]      = useState(SAMPLES.cpp.lc);
  const [oopCode,     setOopCode]     = useState(SAMPLES.cpp.oop);
  const [inputTab,    setInputTab]    = useState("problem");
  const [vizTab,      setVizTab]      = useState("logic");
  const [result,      setResult]      = useState(null);
  const [algoResult,  setAlgoResult]  = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [algoLoading, setAlgoLoading] = useState(false);
  const [algoError,   setAlgoError]   = useState("");
  const [error,       setError]       = useState("");
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [user,        setUser]        = useState(userProp || null);
  const [showAuth,    setShowAuth]    = useState(false);

  // ── Auth listener ──────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null);
      if (session?.user) setShowAuth(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Language switch: swap sample code ─────────────────────
  function switchLang(l) {
    setLang(l);
    setLcCode(SAMPLES[l].lc);
    setOopCode(SAMPLES[l].oop);
    setResult(null);
  }

  // ── Analyze ───────────────────────────────────────────────
  async function handleAnalyze() {
    setLoading(true); setError(""); setResult(null); setSaved(false);
    setVizTab(mode === "oop" ? "tutor" : "logic");
    try {
      const prompt = mode === "lc"
        ? buildLCPrompt(lcProblem, lcCode, lang)
        : buildOOPPrompt(oopCode, lang);
      const parsed = await callGroq(prompt);
      setResult(parsed);
    } catch(e) {
      setError(e.message.includes("JSON") ? "AI parse error — try again." : e.message);
    } finally { setLoading(false); }
  }

  async function handleAlgoAnalyze(name) {
    setAlgoLoading(true); setAlgoResult(null); setAlgoError("");
    try {
      const parsed = await callGroq(buildAlgoPrompt(name));
      setAlgoResult(parsed);
    } catch(e) {
      setAlgoError(e.message.includes("JSON") ? "AI parse error — try again." : e.message);
    } finally { setAlgoLoading(false); }
  }

  // ── Save to Supabase ──────────────────────────────────────
  async function handleSave() {
    if (!user) { setShowAuth(true); return; }
    if (!result) return;
    setSaving(true);
    try {
      await saveResult({
        userId: user.id,
        type:   mode,
        title:  result.problem_name || result.summary?.slice(0,60) || "OOP Analysis",
        lang,
        result,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch(e) {
      setError("Failed to save: " + e.message);
    } finally { setSaving(false); }
  }

  // ── Load from history ─────────────────────────────────────
  function handleHistoryLoad(full) {
    setMode(full.type);
    setLang(full.lang || "cpp");
    setResult(full.result_json);
    setVizTab(full.type === "oop" ? "tutor" : "logic");
    // switch to lc/oop view
    setTimeout(() => setMode(full.type), 50);
  }

  const isFullWidth = ["algo","playground","compare","quiz","cheatsheet","history","oopconcepts"].includes(mode);
  const tabs = mode === "oop" ? OOP_TABS : LC_TABS;
  const langColor = lang === "python" ? C.green : C.accentL;

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"'Inter',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Syne:wght@700;800&family=Orbitron:wght@700&family=Inter:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:${C.surface}}
        ::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      {showAuth && <AuthModal onClose={()=>setShowAuth(false)} />}

      {/* ── Header ── */}
      <div style={{ borderBottom:"1px solid "+C.border, padding:"0 20px", background:C.surface, position:"sticky", top:0, zIndex:100 }}>
        <div style={{ maxWidth:1500, margin:"0 auto", display:"flex", alignItems:"center", height:52, gap:8 }}>
          {/* Logo */}
          <div style={{ width:28, height:28, borderRadius:7, background:`linear-gradient(135deg,${C.accent},${C.cyan})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>⬡</div>
          <span style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, color:C.accentL, flexShrink:0, marginRight:6, letterSpacing:1 }}>CODEVIS</span>

          {/* Mode nav */}
          <div style={{ display:"flex", gap:1, overflowX:"auto" }}>
            {TOP_MODES.map(m => (
              <button key={m.id} onClick={()=>{ setMode(m.id); setResult(null); setAlgoResult(null); setError(""); setVizTab(m.id==="oop"?"tutor":"logic"); }} style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 10px", borderRadius:7, border:"none", background:mode===m.id?C.accentL+"22":"transparent", color:mode===m.id?C.accentL:C.muted, fontFamily:"'JetBrains Mono',monospace", fontSize:10, cursor:"pointer", transition:"all .15s", fontWeight:mode===m.id?700:400, whiteSpace:"nowrap", borderBottom:mode===m.id?"2px solid "+C.accentL:"2px solid transparent" }}>
                <span>{m.icon}</span><span>{m.label}</span>
              </button>
            ))}
          </div>

          {/* Right side: lang toggle + user */}
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
            {/* Theme toggle */}
            <button onClick={toggle} style={{ width:32, height:32, borderRadius:8, border:"1px solid "+C.border, background:C.card, cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>
              {isDark ? "☀️" : "🌙"}
            </button>
            {/* Language toggle — only for lc/oop */}
            {["lc","oop"].includes(mode) && (
              <div style={{ display:"flex", gap:2, background:C.card, borderRadius:8, padding:3, border:"1px solid "+C.border }}>
                {[{id:"cpp",label:"C++"},{id:"python",label:"Python"}].map(l => (
                  <button key={l.id} onClick={()=>switchLang(l.id)} style={{ padding:"4px 10px", borderRadius:6, border:"none", background:lang===l.id?langColor+"22":"transparent", color:lang===l.id?langColor:C.muted, fontFamily:"'JetBrains Mono',monospace", fontSize:10, cursor:"pointer", fontWeight:lang===l.id?700:400, transition:"all .15s" }}>
                    {l.label}
                  </button>
                ))}
              </div>
            )}

            {/* Auth */}
            {user ? (
              <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                {onDashboard && (
                  <button onClick={onDashboard} style={{ padding:"5px 11px", borderRadius:7, border:"1px solid "+C.border, background:"transparent", color:C.muted, fontFamily:"'JetBrains Mono',monospace", fontSize:10, cursor:"pointer" }}>
                    📊 Dashboard
                  </button>
                )}
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="" referrerPolicy="no-referrer" crossOrigin="anonymous" style={{ width:26, height:26, borderRadius:"50%", border:"1.5px solid "+C.border, cursor:"pointer" }} onClick={onDashboard}
                    onError={e=>{ e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }}
                  />
                ) : null}
                <div onClick={onDashboard} style={{ width:26, height:26, borderRadius:"50%", background:`linear-gradient(135deg,${C.accent},${C.cyan})`, display: user.user_metadata?.avatar_url ? "none" : "flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:"#fff", cursor:"pointer", fontFamily:"'Syne',sans-serif", flexShrink:0 }}>
                  {(user.user_metadata?.name||user.user_metadata?.full_name||user.email||"U")[0].toUpperCase()}
                </div>
                <span style={{ fontSize:10, color:C.muted, fontFamily:"'JetBrains Mono',monospace", maxWidth:80, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.user_metadata?.name || user.email}</span>
                <button onClick={signOut} style={{ padding:"3px 8px", borderRadius:6, border:"1px solid "+C.border, background:"transparent", color:C.muted, fontSize:9, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace" }}>Sign out</button>
              </div>
            ) : (
              <button onClick={()=>setShowAuth(true)} style={{ padding:"5px 12px", borderRadius:8, border:"none", background:`linear-gradient(135deg,${C.accent},${C.accentL})`, color:"#fff", fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, cursor:"pointer" }}>
                Sign in
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Full width modes ── */}
      {isFullWidth && (
        <div style={{ maxWidth:1500, margin:"0 auto", padding:"18px 20px" }}>
          {mode==="algo"        && <AlgoTab    onAnalyze={handleAlgoAnalyze} result={algoResult} loading={algoLoading} error={algoError} />}
          {mode==="playground"  && <Playground />}
          {mode==="compare"     && <Comparison />}
          {mode==="quiz"        && <QuizTab    user={user} />}
          {mode==="cheatsheet"  && <CheatSheet />}
          {mode==="history"     && <HistoryTab user={user} onLoad={handleHistoryLoad} />}
          {mode==="oopconcepts" && <OOPConceptsTab lang={lang} />}
        </div>
      )}

      {/* ── 2-col: LC / OOP ── */}
      {!isFullWidth && (
        <div style={{ maxWidth:1500, margin:"0 auto", padding:"18px 20px", display:"grid", gridTemplateColumns:"400px 1fr", gap:20, minHeight:"calc(100vh - 52px)" }}>

          {/* LEFT INPUT */}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {mode==="lc" && (
              <>
                <div style={{ display:"flex", gap:3, background:C.surface, borderRadius:9, padding:3, border:"1px solid "+C.border }}>
                  {[{id:"problem",label:"📋 Problem",col:C.orange},{id:"code",label:"</> Solution",col:langColor}].map(t=>(
                    <button key={t.id} onClick={()=>setInputTab(t.id)} style={{ flex:1, padding:"7px", borderRadius:7, border:"none", background:inputTab===t.id?C.card:"transparent", color:inputTab===t.id?t.col:C.muted, fontFamily:"'JetBrains Mono',monospace", fontSize:11, cursor:"pointer", transition:"all .15s", fontWeight:inputTab===t.id?700:400 }}>
                      {t.label}
                    </button>
                  ))}
                </div>
                {inputTab==="problem" ? (
                  <div style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <span style={{ fontSize:10, color:C.orange, fontFamily:"'JetBrains Mono',monospace", textTransform:"uppercase", letterSpacing:1 }}>Problem Statement</span>
                      <div style={{ display:"flex", gap:5 }}>
                        <button onClick={()=>setLcProblem("")} style={{ background:"transparent", border:"1px solid "+C.border, color:C.muted, borderRadius:6, padding:"3px 9px", cursor:"pointer", fontSize:10 }}>Clear</button>
                        <button onClick={()=>setLcProblem(LC_PROBLEM)} style={{ background:"transparent", border:"1px solid "+C.blue+"50", color:C.blue, borderRadius:6, padding:"3px 9px", cursor:"pointer", fontSize:10 }}>Sample</button>
                      </div>
                    </div>
                    <PlainEditor value={lcProblem} onChange={setLcProblem} filename="problem.txt" minHeight={360} placeholder="Paste the LeetCode problem here..." />
                  </div>
                ) : (
                  <div style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <span style={{ fontSize:10, color:langColor, fontFamily:"'JetBrains Mono',monospace", textTransform:"uppercase", letterSpacing:1 }}>
                        {lang==="python" ? "Python" : "C++"} Solution (optional)
                      </span>
                      <div style={{ display:"flex", gap:5 }}>
                        <button onClick={()=>setLcCode("")} style={{ background:"transparent", border:"1px solid "+C.border, color:C.muted, borderRadius:6, padding:"3px 9px", cursor:"pointer", fontSize:10 }}>Clear</button>
                        <button onClick={()=>setLcCode(SAMPLES[lang].lc)} style={{ background:"transparent", border:"1px solid "+C.blue+"50", color:C.blue, borderRadius:6, padding:"3px 9px", cursor:"pointer", fontSize:10 }}>Sample</button>
                      </div>
                    </div>
                    <CodeEditor value={lcCode} onChange={setLcCode} filename={lang==="python"?"solution.py":"solution.cpp"} minHeight={360} />
                  </div>
                )}
              </>
            )}

            {mode==="oop" && (
              <div style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <span style={{ fontSize:10, color:langColor, fontFamily:"'JetBrains Mono',monospace", textTransform:"uppercase", letterSpacing:1 }}>
                    {lang==="python" ? "Python" : "C++"} OOP Code
                  </span>
                  <div style={{ display:"flex", gap:5 }}>
                    <button onClick={()=>setOopCode("")} style={{ background:"transparent", border:"1px solid "+C.border, color:C.muted, borderRadius:6, padding:"3px 9px", cursor:"pointer", fontSize:10 }}>Clear</button>
                    <button onClick={()=>setOopCode(SAMPLES[lang].oop)} style={{ background:"transparent", border:"1px solid "+C.blue+"50", color:C.blue, borderRadius:6, padding:"3px 9px", cursor:"pointer", fontSize:10 }}>Sample</button>
                  </div>
                </div>
                <CodeEditor value={oopCode} onChange={setOopCode} filename={lang==="python"?"oop_code.py":"oop_code.cpp"} minHeight={420} />
              </div>
            )}

            {error && <div style={{ background:C.red+"0f", border:"1px solid "+C.red+"35", borderRadius:8, padding:"8px 12px", color:C.red, fontSize:11, fontFamily:"'JetBrains Mono',monospace" }}>⚠ {error}</div>}

            <button onClick={handleAnalyze} disabled={loading} style={{ padding:"13px", borderRadius:10, border:"none", background:loading?C.accentL+"30":`linear-gradient(135deg,${C.accent},${C.accentL})`, color:"#fff", fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:800, cursor:loading?"not-allowed":"pointer", letterSpacing:.5, boxShadow:loading?"none":`0 0 30px ${C.glow},0 2px 8px rgba(0,0,0,.4)`, transition:"all .2s" }}>
              {loading ? "⟳  Analyzing..." : mode==="oop" ? "⬡  Analyze OOP Code" : "⬡  Analyze & Explain"}
            </button>

            {result?.summary && (
              <div style={{ background:C.card, borderRadius:10, padding:"11px 13px", border:"1px solid "+C.border, fontSize:12, color:C.dim, lineHeight:1.7 }}>
                <span style={{ color:C.accentL, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", fontSize:10, textTransform:"uppercase", letterSpacing:1 }}>Summary  </span>
                {result.summary}
              </div>
            )}
          </div>

          {/* RIGHT OUTPUT */}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {/* Tabs + PDF + Save */}
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <div style={{ display:"flex", gap:3, background:C.surface, borderRadius:9, padding:3, border:"1px solid "+C.border, flex:1 }}>
                {tabs.map(t=>(
                  <button key={t.id} onClick={()=>setVizTab(t.id)} style={{ flex:1, padding:"8px 6px", borderRadius:7, border:"none", background:vizTab===t.id?C.card:"transparent", color:vizTab===t.id?C.accentL:C.muted, fontFamily:"'JetBrains Mono',monospace", fontSize:11, cursor:"pointer", boxShadow:vizTab===t.id?`0 0 8px ${C.glow}`:"none", transition:"all .15s", fontWeight:vizTab===t.id?700:400 }}>
                    {t.label}
                  </button>
                ))}
              </div>
              {result && (
                <>
                  {/* Save button */}
                  <button onClick={handleSave} disabled={saving||saved} style={{ padding:"8px 13px", borderRadius:9, border:"none", background:saved?C.green+"22":saving?C.accentL+"20":`linear-gradient(135deg,${C.accent},${C.accentL})`, color:saved?C.green:"#fff", fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:700, cursor:saving||saved?"default":"pointer", whiteSpace:"nowrap", transition:"all .3s", display:"flex", alignItems:"center", gap:5 }}>
                    {saved ? "✓ Saved!" : saving ? "⟳" : "💾 Save"}
                  </button>
                  {/* PDF button */}
                  <button onClick={()=> mode==="oop" ? generateOOPPdf(result) : generateLCPdf(result)} style={{ padding:"8px 13px", borderRadius:9, border:"none", background:`linear-gradient(135deg,${C.red}cc,${C.coral})`, color:"#fff", fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", boxShadow:`0 0 12px ${C.red}33`, display:"flex", alignItems:"center", gap:5 }}>
                    📥 PDF
                  </button>
                </>
              )}
            </div>

            {/* Output panel */}
            <div style={{ flex:1, background:C.card, borderRadius:12, border:"1px solid "+C.border, overflow:"auto", padding:16, minHeight:520 }}>
              {loading ? <Spinner /> : !result ? (
                vizTab==="optimize" ? (
                  <OptimizeTab key={lang} code={mode==="lc"?lcCode:oopCode} problem={lcProblem} lang={lang} />
                ) : (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", minHeight:460, gap:14, color:C.muted }}>
                  <div style={{ fontSize:52, opacity:.1 }}>⬡</div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, textAlign:"center", lineHeight:2.2 }}>
                    {mode==="oop" ? `Paste your ${lang==="python"?"Python":"C++"} OOP code and hit Analyze` : "Paste a LeetCode problem and hit Analyze"}<br/>
                    <span style={{ fontSize:10, opacity:.6 }}>AI will explain it step by step</span>
                  </div>
                </div>
                )
              ) : (
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
          </div>
        </div>
      )}
    </div>
  );
}