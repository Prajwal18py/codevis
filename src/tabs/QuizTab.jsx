// src/tabs/QuizTab.jsx — Enhanced AI-generated MCQ quiz
// Enhancements: question progress ring, animated option reveal on select,
// topic search filter, correct/incorrect count in score breakdown,
// per-question answered indicator, better submit CTA state, dual-ring loader,
// shimmer skeleton, keyboard shortcut (1-4) for options

import { useState, useEffect, useRef } from "react";
import { useTheme } from "../utils/ThemeContext";
import { callGroq } from "../utils/groq";

function buildQuizPrompt(topic) {
  return `Generate a 5-question multiple choice quiz about "${topic}" for a CS student.
Return JSON only. Each question must test real understanding, not just definitions.

{
  "topic": "${topic}",
  "questions": [
    {
      "id": 1,
      "question": "What is the time complexity of Bubble Sort in the worst case?",
      "options": ["O(n)", "O(n log n)", "O(n^2)", "O(log n)"],
      "correct": 2,
      "explanation": "Bubble Sort compares every pair in worst case — n*(n-1)/2 comparisons = O(n^2)"
    },
    { "id": 2, "question": "question text", "options": ["A","B","C","D"], "correct": 0, "explanation": "why" },
    { "id": 3, "question": "question text", "options": ["A","B","C","D"], "correct": 1, "explanation": "why" },
    { "id": 4, "question": "question text", "options": ["A","B","C","D"], "correct": 3, "explanation": "why" },
    { "id": 5, "question": "question text", "options": ["A","B","C","D"], "correct": 2, "explanation": "why" }
  ]
}

Make the questions progressively harder. Mix complexity, code tracing, and concept questions. Replace all placeholder text with real questions about "${topic}".`;
}

const QUIZ_TOPICS = [
  "Bubble Sort","Merge Sort","Quick Sort","Binary Search",
  "BFS","DFS","Dynamic Programming","Linked Lists",
  "OOP Inheritance","OOP Polymorphism","OOP Encapsulation","Virtual Functions",
  "Time Complexity","Space Complexity","Recursion","Hash Maps",
];

// ─── Progress ring ────────────────────────────────────────────────────────────
function ProgressRing({ answered, total, size = 44 }) {
  const { C } = useTheme();
  const r = size / 2 - 4;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? answered / total : 0;
  const col = answered === total ? C.green : C.accentL;
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={3} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={3}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: "stroke-dashoffset .4s ease", filter: `drop-shadow(0 0 4px ${col})` }} />
      <text x={size/2} y={size/2-2} textAnchor="middle" fontSize={11} fontFamily="JetBrains Mono" fill={col} fontWeight={700}>{answered}</text>
      <text x={size/2} y={size/2+9} textAnchor="middle" fontSize={8}  fontFamily="JetBrains Mono" fill={C.muted}>/{total}</text>
    </svg>
  );
}

// ─── Skeleton question ────────────────────────────────────────────────────────
function SkeletonQuestion({ index }) {
  const { C } = useTheme();
  return (
    <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: 16 }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 24, height: 24, borderRadius: "50%", background: C.border, flexShrink: 0, animation: `shimmer 1.4s ease-in-out ${index * 0.1}s infinite` }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ height: 12, width: "90%", background: C.border, borderRadius: 5, animation: `shimmer 1.4s ease-in-out ${index * 0.12}s infinite` }} />
          <div style={{ height: 12, width: "65%", background: C.border, borderRadius: 5, animation: `shimmer 1.4s ease-in-out ${index * 0.14}s infinite` }} />
        </div>
      </div>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{ height: 38, background: C.border, borderRadius: 9, marginBottom: 7, animation: `shimmer 1.4s ease-in-out ${(index + i) * 0.08}s infinite` }} />
      ))}
    </div>
  );
}

export default function QuizTab() {
  const { C } = useTheme();
  const [topic,     setTopic]     = useState("Bubble Sort");
  const [custom,    setCustom]    = useState("");
  const [search,    setSearch]    = useState("");
  const [quiz,      setQuiz]      = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [answers,   setAnswers]   = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [error,     setError]     = useState("");
  const [activeQ,   setActiveQ]   = useState(0); // focused question index for keyboard

  async function loadQuiz() {
    const t = custom.trim() || topic;
    setLoading(true); setQuiz(null); setAnswers({}); setSubmitted(false); setError(""); setActiveQ(0);
    try { const res = await callGroq(buildQuizPrompt(t)); setQuiz(res); }
    catch(e) { setError("Failed to generate quiz — try again."); }
    finally { setLoading(false); }
  }

  function pickAnswer(qid, idx) {
    if (submitted) return;
    setAnswers(a => ({ ...a, [qid]: idx }));
  }

  // Keyboard 1-4 for options on active question
  useEffect(() => {
    if (!quiz || submitted) return;
    const handler = (e) => {
      if (e.target.tagName === "INPUT") return;
      const num = parseInt(e.key);
      if (num >= 1 && num <= 4) {
        const q = quiz.questions[activeQ];
        if (q) pickAnswer(q.id, num - 1);
      }
      if (e.key === "ArrowDown") { e.preventDefault(); setActiveQ(i => Math.min(quiz.questions.length - 1, i + 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setActiveQ(i => Math.max(0, i - 1)); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [quiz, submitted, activeQ]);

  const answeredCount = Object.keys(answers).length;
  const total = quiz?.questions?.length || 0;
  const score = quiz ? quiz.questions.filter(q => answers[q.id] === q.correct).length : 0;
  const pct   = total ? Math.round((score / total) * 100) : 0;
  const grade = pct >= 80 ? "🔥 Excellent!" : pct >= 60 ? "👍 Good" : pct >= 40 ? "📚 Keep studying" : "💪 Review the basics";

  const filteredTopics = QUIZ_TOPICS.filter(t => !search || t.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <style>{`
        @keyframes spin    { to { transform:rotate(360deg) } }
        @keyframes shimmer { 0%{opacity:.35} 50%{opacity:.7} 100%{opacity:.35} }
        @keyframes popIn   { from { opacity:0; transform:scale(.95) } to { opacity:1; transform:none } }
      `}</style>

      {/* Topic picker */}
      <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: 14 }}>
        <div style={{ fontSize: 10, color: C.muted, fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Pick a topic to get quizzed on</div>

        {/* Topic search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filter topics..."
          style={{ width: "100%", background: C.card, border: `1px solid ${search ? C.accentL + "50" : C.border}`, color: C.text, borderRadius: 8, padding: "6px 11px", fontFamily: "'JetBrains Mono',monospace", fontSize: 12, outline: "none", marginBottom: 10, transition: "border-color .2s", boxSizing: "border-box" }}
        />

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {filteredTopics.map(t => {
            const active = topic === t && !custom;
            return (
              <button key={t} onClick={() => { setTopic(t); setCustom(""); }} style={{ padding: "5px 11px", borderRadius: 20, border: `1px solid ${active ? C.accentL + "60" : C.border}`, background: active ? C.accentL + "18" : "transparent", color: active ? C.accentL : C.muted, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, cursor: "pointer", transition: "all .15s", fontWeight: active ? 700 : 400 }}>
                {t}
              </button>
            );
          })}
          {filteredTopics.length === 0 && <span style={{ fontSize: 11, color: C.muted, fontFamily: "'JetBrains Mono',monospace" }}>No topics match.</span>}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input value={custom} onChange={e => setCustom(e.target.value)} placeholder="Or type any topic..." style={{ flex: 1, background: C.card, border: `1px solid ${custom ? C.accentL + "50" : C.border}`, color: C.text, borderRadius: 8, padding: "7px 11px", fontFamily: "'JetBrains Mono',monospace", fontSize: 12, outline: "none", transition: "border-color .2s" }} />
          <button onClick={loadQuiz} disabled={loading} style={{ padding: "7px 20px", borderRadius: 8, border: "none", background: loading ? C.accentL + "30" : `linear-gradient(135deg,${C.accent},${C.accentL})`, color: "#fff", fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
            {loading ? "⟳ Loading..." : "🎯 Start Quiz"}
          </button>
        </div>
        {error && <div style={{ color: C.red, fontSize: 11, fontFamily: "'JetBrains Mono',monospace", marginTop: 8 }}>⚠ {error}</div>}
      </div>

      {/* Loading: dual ring + skeleton */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "24px 0" }}>
          <div style={{ position: "relative", width: 48, height: 48 }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `3px solid ${C.border}` }} />
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "3px solid transparent", borderTopColor: C.accentL, animation: "spin .8s linear infinite" }} />
            <div style={{ position: "absolute", inset: 6, borderRadius: "50%", border: "2px solid transparent", borderTopColor: C.cyan, animation: "spin 1.2s linear infinite reverse" }} />
          </div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", color: C.accentL, fontSize: 12 }}>Generating quiz on {custom || topic}...</div>
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
            {[0, 1, 2].map(i => <SkeletonQuestion key={i} index={i} />)}
          </div>
        </div>
      )}

      {/* Score banner */}
      {submitted && quiz && (
        <div style={{ background: `linear-gradient(135deg,${C.accent}20,${C.cyan}20)`, border: `1px solid ${C.accentL}40`, borderRadius: 12, padding: "16px 18px", textAlign: "center", animation: "popIn .35s ease" }}>
          <div style={{ fontFamily: "'Orbitron','JetBrains Mono',monospace", fontSize: 36, fontWeight: 700, color: pct >= 80 ? C.green : pct >= 60 ? C.cyan : pct >= 40 ? C.orange : C.red, marginBottom: 4 }}>
            {score}/{total}
          </div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 6 }}>{grade}</div>

          {/* Score breakdown bar */}
          <div style={{ background: C.border, borderRadius: 9, height: 6, margin: "0 auto 8px", maxWidth: 240, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${C.accent},${C.green})`, borderRadius: 9, transition: "width 1s ease .3s" }} />
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 14, fontSize: 11, color: C.dim, fontFamily: "'JetBrains Mono',monospace", marginBottom: 10 }}>
            <span style={{ color: C.green }}>✓ {score} correct</span>
            <span style={{ color: C.red }}>✕ {total - score} wrong</span>
            <span style={{ color: C.muted }}>{pct}% score</span>
          </div>

          <button onClick={loadQuiz} style={{ padding: "6px 16px", borderRadius: 8, border: `1px solid ${C.accentL}50`, background: C.accentL + "18", color: C.accentL, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, cursor: "pointer" }}>
            ↺ New Quiz
          </button>
        </div>
      )}

      {/* Questions */}
      {quiz && !loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Progress header */}
          {!submitted && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: C.surface, borderRadius: 9, border: `1px solid ${C.border}` }}>
              <ProgressRing answered={answeredCount} total={total} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.text, fontFamily: "'Syne',sans-serif" }}>{answeredCount === total ? "All questions answered!" : `${total - answeredCount} question${total - answeredCount !== 1 ? "s" : ""} remaining`}</div>
                <div style={{ fontSize: 10, color: C.muted, fontFamily: "'JetBrains Mono',monospace" }}>Press 1–4 to select options · ↑↓ to navigate</div>
              </div>
            </div>
          )}

          {quiz.questions?.map((q, qi) => {
            const answered  = answers[q.id] !== undefined;
            const isCorrect = answers[q.id] === q.correct;
            const isActive  = activeQ === qi && !submitted;
            return (
              <div
                key={q.id}
                onClick={() => setActiveQ(qi)}
                style={{ background: C.surface, borderRadius: 12, border: `1px solid ${submitted ? (isCorrect ? C.green : C.red) : isActive ? C.accentL : answered ? C.accentL + "50" : C.border}40`, padding: 16, transition: "border-color .25s", cursor: "pointer" }}
              >
                {/* Question header */}
                <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: submitted ? (isCorrect ? C.green : C.red) : answered ? C.accentL : isActive ? C.accentL + "30" : C.muted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff", flexShrink: 0, transition: "background .2s" }}>
                    {submitted ? (isCorrect ? "✓" : "✕") : qi + 1}
                  </div>
                  <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7, fontWeight: 500 }}>{q.question}</div>
                </div>

                {/* Options */}
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {q.options?.map((opt, i) => {
                    const isSelected = answers[q.id] === i;
                    const isRight    = submitted && i === q.correct;
                    const isWrong    = submitted && isSelected && !isCorrect;
                    const bg     = isRight ? C.green+"18" : isWrong ? C.red+"18" : isSelected ? C.accentL+"15" : "transparent";
                    const border = isRight ? C.green+"60" : isWrong ? C.red+"60" : isSelected ? C.accentL+"60" : C.border;
                    const col    = isRight ? C.green : isWrong ? C.red : isSelected ? C.accentL : C.dim;
                    return (
                      <div
                        key={i}
                        onClick={e => { e.stopPropagation(); pickAnswer(q.id, i); setActiveQ(qi); }}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 9, border: `1px solid ${border}`, background: bg, cursor: submitted ? "default" : "pointer", transition: "all .15s", animation: isSelected && !submitted ? "popIn .12s ease" : "none" }}
                      >
                        <div style={{ width: 22, height: 22, borderRadius: "50%", border: `1.5px solid ${col}`, background: isSelected || isRight ? col + "22" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: col, flexShrink: 0, transition: "all .15s" }}>
                          {isRight ? "✓" : isWrong ? "✕" : !submitted && isActive ? String(i + 1) : String.fromCharCode(65 + i)}
                        </div>
                        <span style={{ fontSize: 12, color: isRight ? C.green : isWrong ? C.red : isSelected ? C.text : C.dim, lineHeight: 1.5 }}>{opt}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {submitted && q.explanation && (
                  <div style={{ marginTop: 10, background: isCorrect ? C.green + "0c" : C.red + "0c", border: `1px solid ${isCorrect ? C.green : C.red}25`, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: isCorrect ? C.green : C.red + "cc", lineHeight: 1.65, animation: "popIn .25s ease" }}>
                    💡 {q.explanation}
                  </div>
                )}
              </div>
            );
          })}

          {/* Submit */}
          {!submitted && (
            <button
              onClick={() => setSubmitted(true)}
              disabled={answeredCount < total}
              style={{ padding: "12px", borderRadius: 10, border: "none", background: answeredCount < total ? C.accentL + "20" : `linear-gradient(135deg,${C.accent},${C.accentL})`, color: answeredCount < total ? C.muted : "#fff", fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 800, cursor: answeredCount < total ? "not-allowed" : "pointer", transition: "all .2s", boxShadow: answeredCount >= total ? `0 0 20px ${C.glow}` : "none" }}
            >
              {answeredCount < total ? `Answer all questions (${answeredCount}/${total})` : "🎯 Submit Answers"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}