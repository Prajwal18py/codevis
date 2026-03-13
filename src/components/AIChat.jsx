// src/components/AIChat.jsx — Floating AI Chat with context awareness
import { useState, useRef, useEffect } from "react";
import { useTheme } from "../utils/ThemeContext";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

async function askGroq(messages) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + GROQ_API_KEY },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.4,
      max_tokens: 1024,
    }),
  });
  if (!res.ok) throw new Error("Groq API error");
  const data = await res.json();
  return data.choices[0].message.content.trim();
}

function buildSystemPrompt(mode, lang, result, code) {
  const langLabel = lang === "python" ? "Python" : "C++";
  let context = `You are CODEVIS AI — a helpful, friendly DSA and OOP tutor. Answer in plain text only, no markdown symbols like ** or ##. Keep answers concise and beginner-friendly. Language context: ${langLabel}.`;

  if (mode === "lc" && result) {
    context += `\n\nCurrent LeetCode problem: "${result.problem_name || "Unknown"}" (${result.difficulty || ""}).
Core intuition: ${result.core_intuition || ""}
Pattern: ${result.leetcode_pattern || ""}
Time: ${result.complexity?.time || ""}, Space: ${result.complexity?.space || ""}
The user has already analyzed this problem. Answer questions about it.`;
  } else if (mode === "oop" && result) {
    context += `\n\nCurrent OOP analysis. Summary: ${result.summary || ""}
Concepts used: ${Object.entries(result.oop_analysis || {}).filter(([,v])=>v?.used).map(([k])=>k).join(", ")}
Answer questions about OOP concepts in this code.`;
  } else if (mode === "algo") {
    context += `\n\nThe user is exploring algorithm visualizations. Help them understand sorting algorithms, time/space complexity, and when to use each.`;
  } else if (mode === "graph") {
    context += `\n\nThe user is exploring graph and tree visualizations. Help them understand BFS, DFS, BST operations, and graph theory.`;
  } else {
    context += `\n\nHelp the user with DSA, OOP, algorithms, and coding questions.`;
  }

  if (code) context += `\n\nUser's code:\n${code.slice(0, 800)}`;
  return context;
}

const SUGGESTIONS = {
  lc:    ["Explain the core intuition", "What's the time complexity?", "Show me a simpler approach", "What are common mistakes?"],
  oop:   ["What OOP concepts am I missing?", "Explain polymorphism here", "How do virtual functions work?", "What's the difference between class and struct?"],
  algo:  ["When should I use QuickSort?", "Explain merge sort step by step", "What's the best sorting algorithm?", "Difference between BFS and DFS?"],
  graph: ["How does BFS work?", "What is a BST?", "Explain in-order traversal", "When to use DFS vs BFS?"],
  default: ["Explain Big O notation", "What is dynamic programming?", "Explain recursion with example", "What are pointers in C++?"],
};

export default function AIChat({ mode, lang, result, code }) {
  const { C } = useTheme();
  const [open, setOpen]       = useState(false);
  const [msgs, setMsgs]       = useState([]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread]   = useState(0);
  const bottomRef             = useRef(null);
  const inputRef              = useRef(null);
  const historyRef            = useRef([]); // full message history for multi-turn

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  // Reset chat when mode changes
  useEffect(() => {
    setMsgs([]);
    historyRef.current = [];
  }, [mode]);

  const send = async (text) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput("");

    const userMsg = { role: "user", text: q };
    setMsgs(prev => [...prev, userMsg]);

    // Build history for Groq
    const systemPrompt = buildSystemPrompt(mode, lang, result, code);
    historyRef.current.push({ role: "user", content: q });

    setLoading(true);
    try {
      const groqMsgs = [
        { role: "system", content: systemPrompt },
        ...historyRef.current.slice(-10), // keep last 10 turns
      ];
      const reply = await askGroq(groqMsgs);
      historyRef.current.push({ role: "assistant", content: reply });
      setMsgs(prev => [...prev, { role: "assistant", text: reply }]);
      if (!open) setUnread(u => u + 1);
    } catch (e) {
      setMsgs(prev => [...prev, { role: "assistant", text: "Sorry, couldn't reach AI. Check your API key." }]);
    }
    setLoading(false);
  };

  const suggestions = SUGGESTIONS[mode] || SUGGESTIONS.default;

  return (
    <>
      {/* Floating bubble */}
      <button onClick={() => setOpen(o => !o)} style={{
        position: "fixed", bottom: 28, right: 28, zIndex: 1000,
        width: 54, height: 54, borderRadius: "50%", border: "none",
        background: open ? C.surface : `linear-gradient(135deg, ${C.accent}, ${C.cyan})`,
        boxShadow: `0 4px 24px ${C.accent}55`,
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22, transition: "all .2s",
        outline: `2px solid ${open ? C.border : "transparent"}`,
      }}>
        {open ? "✕" : "🤖"}
        {unread > 0 && !open && (
          <div style={{
            position: "absolute", top: -4, right: -4,
            width: 18, height: 18, borderRadius: "50%",
            background: C.red, color: "#fff",
            fontSize: 9, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>{unread}</div>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: "fixed", bottom: 92, right: 28, zIndex: 999,
          width: 380, maxHeight: 560,
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 18, boxShadow: `0 8px 48px ${C.accent}22`,
          display: "flex", flexDirection: "column",
          animation: "chatIn .2s ease",
        }}>
          <style>{`
            @keyframes chatIn { from { opacity:0; transform:translateY(12px) scale(.97); } to { opacity:1; transform:none; } }
            @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:0} }
            .chat-msg::-webkit-scrollbar { width:4px }
            .chat-msg::-webkit-scrollbar-thumb { background:${C.border}; border-radius:4px }
          `}</style>

          {/* Header */}
          <div style={{ padding: "14px 16px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},${C.cyan})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🤖</div>
            <div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 800, color: C.text }}>CODEVIS AI</div>
              <div style={{ fontSize: 10, color: C.green, fontFamily: "'JetBrains Mono',monospace", display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, animation: "blink 2s infinite" }} />
                Context-aware · {mode.toUpperCase()} mode
              </div>
            </div>
            <button onClick={() => { setMsgs([]); historyRef.current = []; }} style={{ marginLeft: "auto", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, padding: "3px 8px", color: C.muted, fontSize: 9, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" }}>
              Clear
            </button>
          </div>

          {/* Messages */}
          <div className="chat-msg" style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10, minHeight: 0 }}>

            {msgs.length === 0 && (
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>👋</div>
                <div style={{ fontSize: 12, color: C.muted, fontFamily: "'JetBrains Mono',monospace", marginBottom: 14, lineHeight: 1.7 }}>
                  Ask me anything about your<br />current {mode === "lc" ? "LeetCode problem" : mode === "oop" ? "OOP code" : "topic"}!
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {suggestions.map((s, i) => (
                    <button key={i} onClick={() => send(s)} style={{
                      padding: "7px 12px", borderRadius: 9, border: `1px solid ${C.border}`,
                      background: C.card, color: C.dim, fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 11, cursor: "pointer", textAlign: "left", transition: "all .15s",
                    }}
                      onMouseEnter={e => { e.target.style.borderColor = C.accentL; e.target.style.color = C.accentL; }}
                      onMouseLeave={e => { e.target.style.borderColor = C.border; e.target.style.color = C.dim; }}
                    >
                      💬 {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {msgs.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "85%", padding: "9px 13px", borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  background: m.role === "user" ? `linear-gradient(135deg,${C.accent},${C.cyan})` : C.card,
                  border: m.role === "user" ? "none" : `1px solid ${C.border}`,
                  color: m.role === "user" ? "#fff" : C.text,
                  fontSize: 12, lineHeight: 1.7, fontFamily: "'Inter',sans-serif",
                  whiteSpace: "pre-wrap", wordBreak: "break-word",
                }}>
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ padding: "10px 14px", borderRadius: "14px 14px 14px 4px", background: C.card, border: `1px solid ${C.border}`, display: "flex", gap: 5, alignItems: "center" }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: C.accentL, animation: `blink 1.2s ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "10px 12px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8, flexShrink: 0 }}>
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Ask anything..."
              style={{ flex: 1, padding: "8px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontFamily: "'Inter',sans-serif", fontSize: 12, outline: "none", transition: "border-color .15s" }}
              onFocus={e => e.target.style.borderColor = C.accentL}
              onBlur={e => e.target.style.borderColor = C.border}
            />
            <button onClick={() => send()} disabled={!input.trim() || loading} style={{
              width: 36, height: 36, borderRadius: 10, border: "none",
              background: input.trim() && !loading ? `linear-gradient(135deg,${C.accent},${C.cyan})` : C.border,
              color: "#fff", fontSize: 15, cursor: input.trim() && !loading ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .15s",
            }}>↑</button>
          </div>
        </div>
      )}
    </>
  );
}