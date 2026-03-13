// src/utils/groq.js
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export async function callGroq(prompt, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + GROQ_API_KEY },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.15, max_tokens: 4000,
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) {
      // Rate limit — parse retry-after from error or wait 5s
      const e = await res.json();
      const msg = e.error?.message || "";
      const wait = parseFloat(msg.match(/try again in ([\d.]+)s/)?.[1] || "5");
      if (attempt < retries - 1) {
        await new Promise(r => setTimeout(r, (wait + 0.5) * 1000));
        continue;
      }
      throw new Error(`Rate limit hit. Please wait ${Math.ceil(wait)}s and try again.`);
    }

    if (!res.ok) { const e = await res.json(); throw new Error((e.error && e.error.message) || "Groq API error"); }
    const data = await res.json();
    const text = data.choices[0].message.content.trim().replace(/^```json\s*/,"").replace(/\s*```$/,"").trim();
    return JSON.parse(text);
  }
}

// ── LeetCode mode (C++ or Python) ─────────────────────────────
export function buildLCPrompt(problem, code, lang = "cpp") {
  const langLabel = lang === "python" ? "Python" : "C++";
  const codeBlock = lang === "python" ? "python" : "cpp";
  return `You are an expert DSA teacher explaining to a beginner. Analyze this LeetCode problem.
Return ONLY valid JSON, no markdown, nothing outside the JSON. All code fields must be plain text only — NO HTML tags, NO <span>, NO syntax highlighting markup.

{
  "problem_name": "Two Sum",
  "difficulty": "Easy",
  "topic_tags": ["Array","Hash Map"],
  "leetcode_pattern": "Hash Map",
  "core_intuition": "The key insight — what mental model unlocks this problem in plain English",
  "logic_steps": [
    {
      "step": 1,
      "title": "Understand the goal",
      "explanation": "Plain English — what are we trying to do in this step",
      "code_line": "exact line of code doing this or null",
      "analogy": "real-world analogy for this step (optional)",
      "what_changes": "what variable/data structure changes and how"
    }
  ],
  "approaches": [
    {
      "name": "Brute Force",
      "time": "O(n^2)", "space": "O(1)",
      "plain_explanation": "explain in simple English how brute force works",
      "code": "full working ${langLabel} code with a comment on EVERY line",
      "why_slow": "why this is slow"
    },
    {
      "name": "Optimal Solution",
      "time": "O(n)", "space": "O(n)",
      "plain_explanation": "explain in simple English how optimal works",
      "code": "full working ${langLabel} code with a comment on EVERY line",
      "why_fast": "why this is faster"
    }
  ],
  "complexity": { "time": "O(n)", "space": "O(n)", "best_case": "O(1)", "worst_case": "O(n)", "explanation": "detailed why" },
  "dry_run_steps": [
    { "step": 1, "title": "title", "description": "exactly what happens with example values", "code_line": "line" }
  ],
  "key_insights": ["insight 1", "insight 2"],
  "common_mistakes": ["mistake 1", "mistake 2"],
  "similar_problems": ["Two Sum II", "3Sum"]
}

Problem:
${problem}
${code ? `\nSolution (${langLabel}):\n\`\`\`${codeBlock}\n${code}\n\`\`\`` : ""}`;
}

// ── OOP mode (C++ or Python) ───────────────────────────────────
export function buildOOPPrompt(code, lang = "cpp") {
  const langLabel = lang === "python" ? "Python" : "C++";
  const concepts = lang === "python"
    ? `"encapsulation", "abstraction", "inheritance", "polymorphism", "dunder_methods", "class_methods", "static_methods", "properties", "composition", "duck_typing"`
    : `"encapsulation", "abstraction", "inheritance", "polymorphism", "templates", "abstract_classes", "virtual_functions", "composition", "constructor_init", "method_overriding"`;

  const conceptExample = lang === "python" ? `
    "encapsulation":   {"used":true,  "where":"__radius in Circle (line ~5)", "explanation":"Name mangling with __ hides the attribute from direct outside access."},
    "abstraction":     {"used":true,  "where":"ABC and abstractmethod in Shape", "explanation":"Shape hides HOW area is calculated using Python's ABC module."},
    "inheritance":     {"used":true,  "where":"class Circle(Shape)",            "explanation":"Circle gets all methods from Shape automatically — like a child from a parent."},
    "polymorphism":    {"used":true,  "where":"area() called on different objects","explanation":"Same method name works differently depending on the actual class."},
    "dunder_methods":  {"used":true,  "where":"__init__, __str__",              "explanation":"Special Python methods that define object behavior for built-in operations."},
    "class_methods":   {"used":false, "where":null, "explanation":null},
    "static_methods":  {"used":false, "where":null, "explanation":null},
    "properties":      {"used":true,  "where":"@property radius",               "explanation":"Getter/setter without explicit get/set methods — Pythonic encapsulation."},
    "composition":     {"used":false, "where":null, "explanation":null},
    "duck_typing":     {"used":true,  "where":"area() called without type check","explanation":"If it has area(), we use it — Python doesn't care about the actual type."}`
    : `
    "encapsulation":     {"used":true,  "where":"private radius in Circle (line ~8)", "explanation":"Data is hidden inside the class. Outside code cannot directly change radius — only through methods."},
    "abstraction":       {"used":true,  "where":"pure virtual area() in Shape",       "explanation":"Shape hides HOW area is calculated. Users just call area() without knowing the formula."},
    "inheritance":       {"used":true,  "where":"class Circle : public Shape",        "explanation":"Circle gets color and display() from Shape for free — like a child inheriting from a parent."},
    "polymorphism":      {"used":true,  "where":"Shape* pointer calling area()",      "explanation":"Same pointer calls different area() depending on actual object type — decided at runtime."},
    "templates":         {"used":false, "where":null, "explanation":null},
    "abstract_classes":  {"used":true,  "where":"Shape with area()=0",                "explanation":"Shape cannot be created directly. It is a blueprint only."},
    "virtual_functions": {"used":true,  "where":"virtual area() in Shape",            "explanation":"virtual tells C++ to use the child's version of the method, not the parent's."},
    "composition":       {"used":false, "where":null, "explanation":null},
    "constructor_init":  {"used":true,  "where":"Shape(c), radius(r) in Circle ctor","explanation":"Initializer lists run BEFORE the constructor body — more efficient."},
    "method_overriding": {"used":true,  "where":"area() override in Circle",          "explanation":"Circle provides its own area() formula. The override keyword catches typos at compile time."}`;

  return `You are a ${langLabel} OOP teacher. Explain this code like Python Tutor — step by step, beginner-friendly.
Return ONLY valid JSON, no markdown, nothing outside the JSON. All code fields must be plain text only — NO HTML tags, NO <span>, NO syntax highlighting markup.

{
  "summary": "what this code does in 1-2 sentences",
  "language": "${lang}",
  "classes": [
    {
      "name": "ClassName", "type": "base|derived|interface|utility",
      "isAbstract": false, "parent": null,
      "members": [{"name":"radius","type":"float","access":"private"}],
      "methods": [{"name":"area","isVirtual":true,"access":"public","returns":"float"}],
      "description": "what this class represents"
    }
  ],
  "relationships": [{"from":"Circle","to":"Shape","type":"inherits|composition|aggregation"}],
  "object_creation_steps": [
    {
      "step": 1, "title": "Step title",
      "code_line": "exact line of code",
      "explanation": "plain English — what object is created, what memory is allocated",
      "memory_state": "list what objects/variables now exist in memory"
    }
  ],
  "oop_analysis": {
    ${conceptExample}
  },
  "concept_explanations": [
    {
      "concept": "Inheritance",
      "simple_analogy": "Like a child inheriting traits from a parent",
      "what_it_does_here": "concrete explanation in this code",
      "code_snippet": "the relevant code line"
    }
  ],
  "key_insights": ["insight 1"],
  "common_mistakes": ["mistake 1"]
}

${langLabel} Code:
\`\`\`${lang === "python" ? "python" : "cpp"}
${code}
\`\`\``;
}

// ── Optimize mode ──────────────────────────────────────────────
export function buildOptimizePrompt(problem, code, lang = "cpp") {
  const langLabel = lang === "python" ? "Python" : "C++";
  return `You are an expert DSA coach. The user gave you a brute force or suboptimal solution. Your job is to optimize it step by step.
Return ONLY valid JSON, nothing outside it. All code fields must be plain text only — NO HTML tags, NO <span>, NO syntax highlighting markup.

{
  "original_complexity": {
    "time": "O(n^2)",
    "space": "O(1)",
    "why_slow": "Explain in plain English why the original code is slow or inefficient"
  },
  "optimized_complexity": {
    "time": "O(n)",
    "space": "O(n)",
    "improvement": "Explain what changed and why it's faster now"
  },
  "optimization_steps": [
    {
      "step": 1,
      "title": "Identify the bottleneck",
      "explanation": "Plain English — what part of the original code is slow and why",
      "before_code": "the slow part from original",
      "after_code": "the optimized replacement"
    }
  ],
  "optimized_code": "full complete optimized ${langLabel} code with a comment on EVERY line explaining what it does",
  "key_trick": "The single most important insight or data structure that makes the optimized solution work",
  "why_it_works": "Plain English explanation of why the optimized approach is correct",
  "pattern_used": "e.g. Hash Map, Two Pointers, Sliding Window, Binary Search, etc.",
  "suggestions": [
    {
      "priority": "HIGH",
      "title": "Use a hash map instead of nested loop",
      "explanation": "Detailed explanation of this optimization tip",
      "code_snippet": "short code example showing the fix"
    },
    {
      "priority": "MEDIUM",
      "title": "another suggestion title",
      "explanation": "explanation",
      "code_snippet": "code or null"
    }
  ]
}

Problem:
${problem || "No problem statement provided — analyze the code directly."}

${langLabel} Code to optimize:
\`\`\`${lang === "python" ? "python" : "cpp"}
${code}
\`\`\``;
}

// ── Algorithm mode ─────────────────────────────────────────────
export function buildAlgoPrompt(algoName, lang = "cpp") {
  return (
    `Explain the "${algoName}" algorithm for a CS beginner. Return ONLY valid JSON. ` +
    `All code must be plain text only — no HTML tags, no <span>, no syntax highlighting. ` +
    `You MUST include BOTH full_code (C++ implementation) AND python_code (Python implementation) fields.

` +
    `{
` +
    `  "name": "${algoName}",
` +
    `  "category": "Sorting",
` +
    `  "tagline": "one sentence what it does",
` +
    `  "real_world_analogy": "1-2 sentence real world analogy",
` +
    `  "when_to_use": "1-2 sentences on when to use it",
` +
    `  "complexity": {
` +
    `    "time_best": "O(n)", "time_avg": "O(n log n)", "time_worst": "O(n^2)",
` +
    `    "space": "O(1)", "explanation": "one sentence why"
` +
    `  },
` +
    `  "visual_steps": [
` +
    `    { "step": 1, "title": "Compare first two", "description": "Compare index 0 and 1", "array_before": [5,3,8,1], "array_after": [3,5,8,1], "highlight_indices": [0,1], "action": "swap", "code_line": "if arr[0] > arr[1]: swap" },
` +
    `    { "step": 2, "title": "Next pair", "description": "Compare index 1 and 2", "array_before": [3,5,8,1], "array_after": [3,5,8,1], "highlight_indices": [1,2], "action": "compare", "code_line": "for j in range(n-i-1)" }
` +
    `  ],
` +
    `  "full_code": "paste clean ${lang === "python" ? "Python" : "C++"} code here as a single string with \\n for newlines",
` +
    `  "python_code": "paste clean Python code here as a single string with \\n for newlines",
` +
    `  "dry_run_example": {
` +
    `    "input": [5,3,8,1],
` +
    `    "passes": [
` +
    `      { "pass": 1, "array": [3,5,1,8], "swaps": [[0,1],[2,3]], "note": "Largest element 8 moved to end" }
` +
    `    ],
` +
    `    "output": [1,3,5,8]
` +
    `  },
` +
    `  "pros": ["Simple", "In-place"],
` +
    `  "cons": ["Slow O(n^2)"],
` +
    `  "compare_with": [{ "algo": "Merge Sort", "when_better": "better for large data", "when_worse": "worse for small data" }],
` +
    `  "key_insights": ["insight 1", "insight 2"]
` +
    `}

` +
    `Replace ALL example values above with actual correct values for "${algoName}". Keep exact JSON structure.`
  );
}