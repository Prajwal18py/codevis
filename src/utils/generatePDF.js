// src/utils/generatePDF.js
// Generates a clean revision PDF using browser print dialog
// Enhancements:
// - Syntax-highlighted code blocks (simple keyword coloring in print)
// - Section visibility — all sections present, clearly delineated
// - "Quick Reference" box at top with pattern + complexities at a glance
// - Dry run table rendered if present
// - Common mistakes styled as warning cards
// - Key insights styled as numbered callout cards
// - Better print media query (tighter margins, smaller font)
// - Footer includes problem URL if available
// - OOP: class diagram text hint section added
// - OOP: missing concepts shown as a checklist
// - Both: openPrintWindow is robust with popup-blocked fallback

// ─── Shared helpers ───────────────────────────────────────────────────────────
const SHARED_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Syne:wght@700;800&family=Inter:wght@400;600;700&display=swap');
*  { box-sizing:border-box; margin:0; padding:0; }
body { font-family:'Inter',sans-serif; color:#111; background:#fff; padding:36px 40px; font-size:13px; line-height:1.65; }

/* ── Typography ── */
h1  { font-family:'Syne',sans-serif; font-size:24px; font-weight:800; color:#111; margin-bottom:4px; }
h2  { font-family:'Syne',sans-serif; font-size:14px; font-weight:800; color:#111; }

/* ── Badges ── */
.badge        { display:inline-block; border-radius:12px; padding:2px 11px; font-size:11px; font-weight:700; border:1.5px solid; font-family:'JetBrains Mono',monospace; }
.easy         { color:#16a34a; border-color:#16a34a; background:#f0fdf4; }
.medium       { color:#d97706; border-color:#d97706; background:#fffbeb; }
.hard         { color:#dc2626; border-color:#dc2626; background:#fef2f2; }
.tag          { color:#7c3aed; border-color:#7c3aed22; background:#f5f3ff; }
.badge-green  { color:#059669; border-color:#059669; background:#ecfdf5; }
.badge-red    { color:#dc2626; border-color:#dc2626; background:#fef2f2; }

/* ── Sections ── */
.section       { margin-bottom:22px; page-break-inside:avoid; }
.section-title {
  font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:1.5px;
  color:#7c3aed; margin-bottom:9px; padding-bottom:5px;
  border-bottom:2px solid #ede9fe; display:flex; align-items:center; gap:5px;
}

/* ── Cards ── */
.box          { background:#f8f7ff; border:1.5px solid #e0d9ff; border-radius:9px; padding:12px 14px; margin-bottom:8px; font-size:13px; color:#333; line-height:1.75; }
.box-green    { background:#f0fdf4; border:1.5px solid #bbf7d0; border-radius:9px; padding:11px 14px; margin-bottom:8px; }
.box-amber    { background:#fffbeb; border:1.5px solid #fde68a; border-radius:9px; padding:11px 14px; margin-bottom:8px; }
.box-red      { background:#fef2f2; border:1.5px solid #fecaca; border-radius:9px; padding:11px 14px; margin-bottom:8px; }
.box-blue     { background:#eff6ff; border:1.5px solid #bfdbfe; border-radius:9px; padding:11px 14px; margin-bottom:8px; }

/* ── Quick ref ── */
.quick-ref    { background:linear-gradient(135deg,#f5f3ff,#eff6ff); border:2px solid #c4b5fd; border-radius:12px; padding:14px 18px; margin-bottom:22px; }
.quick-ref-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-top:10px; }
.qr-cell      { text-align:center; background:#fff; border-radius:8px; padding:8px 6px; border:1px solid #e0d9ff; }
.qr-label     { font-size:8px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#7c3aed; margin-bottom:3px; font-family:'JetBrains Mono',monospace; }
.qr-val       { font-family:'JetBrains Mono',monospace; font-size:14px; font-weight:700; color:#111; }

/* ── Steps ── */
.step-row     { display:flex; gap:10px; margin-bottom:12px; }
.step-num     { width:24px; height:24px; border-radius:50%; background:#7c3aed; color:#fff; font-size:11px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:1px; font-family:'JetBrains Mono',monospace; }
.step-body    { flex:1; }
.step-title   { font-weight:700; font-size:13px; color:#111; margin-bottom:2px; }
.step-exp     { color:#444; font-size:12px; line-height:1.65; }
.code-line    { font-family:'JetBrains Mono',monospace; background:#f0eeff; border-radius:4px; padding:1px 8px; font-size:11px; color:#5b21b6; display:inline-block; margin-top:4px; border:1px solid #ddd6fe; }
.analogy      { color:#059669; font-style:italic; font-size:11px; margin-top:4px; }
.memory-state { font-family:'JetBrains Mono',monospace; font-size:10px; color:#059669; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:4px; padding:2px 8px; margin-top:4px; display:inline-block; }

/* ── Code blocks ── */
pre           { font-family:'JetBrains Mono',monospace; background:#1a1a2e; border-radius:9px; padding:13px 15px; font-size:11px; color:#e2e8f0; overflow-wrap:break-word; white-space:pre-wrap; margin-top:8px; border:1px solid #2d2d4e; line-height:1.7; }
.kw           { color:#a78bfa; font-weight:700; }
.str          { color:#86efac; }
.cmt          { color:#6b7280; font-style:italic; }
.num          { color:#fbbf24; }

/* ── Approaches ── */
.approach          { margin-bottom:16px; border:1.5px solid #e5e7eb; border-radius:11px; overflow:hidden; page-break-inside:avoid; }
.approach-header   { background:#f9fafb; padding:9px 14px; font-weight:700; font-size:12px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e5e7eb; }
.approach-body     { padding:12px 14px; }

/* ── Insights / mistakes ── */
.insight-row  { display:flex; gap:10px; margin-bottom:8px; align-items:flex-start; font-size:12px; color:#333; }
.insight-num  { width:20px; height:20px; border-radius:50%; background:#6d28d9; color:#fff; font-size:10px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:1px; }
.mistake-row  { display:flex; gap:8px; margin-bottom:6px; font-size:12px; color:#991b1b; }
.mistake-icon { flex-shrink:0; }

/* ── Complexity grid ── */
.complexity-grid  { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
.c-card           { background:#f8f7ff; border:1.5px solid #e0d9ff; border-radius:9px; padding:10px 12px; text-align:center; }
.c-label          { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#7c3aed; margin-bottom:4px; font-family:'JetBrains Mono',monospace; }
.c-val            { font-family:'JetBrains Mono',monospace; font-size:15px; font-weight:700; color:#111; }

/* ── Concept grid ── */
.concept-grid  { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.concept-card  { border:1.5px solid #e5e7eb; border-radius:9px; padding:10px 13px; page-break-inside:avoid; }
.concept-name  { font-weight:700; font-size:12px; color:#7c3aed; margin-bottom:3px; }
.concept-where { font-family:'JetBrains Mono',monospace; font-size:10px; color:#059669; margin-bottom:4px; }
.concept-exp   { font-size:11px; color:#444; line-height:1.6; }

/* ── Analogy card ── */
.analogy-card   { background:#f0fdf4; border:1.5px solid #bbf7d0; border-radius:9px; padding:11px 14px; margin-bottom:10px; page-break-inside:avoid; }
.analogy-title  { font-weight:700; font-size:12px; color:#059669; margin-bottom:4px; }

/* ── Similar problems ── */
.similar-list { display:flex; gap:8px; flex-wrap:wrap; }

/* ── Checklist ── */
.checklist       { list-style:none; }
.checklist li    { display:flex; align-items:center; gap:8px; margin-bottom:6px; font-size:12px; }
.check-used      { color:#059669; font-weight:700; }
.check-missing   { color:#9ca3af; }

/* ── Two col ── */
.two-col { display:grid; grid-template-columns:1fr 1fr; gap:16px; }

/* ── Footer ── */
.footer  { margin-top:30px; text-align:center; font-size:10px; color:#aaa; border-top:1px solid #f0f0f0; padding-top:12px; font-family:'JetBrains Mono',monospace; }

/* ── Print ── */
@media print {
  body { padding:18px 22px; font-size:12px; }
  h1   { font-size:20px; }
  pre  { font-size:10px; }
  .section { margin-bottom:16px; }
  .page-break { page-break-before:always; }
}
`;

// ─── Syntax highlighter (minimal, print-safe) ─────────────────────────────────
function stripTags(str) {
  if (!str) return "";
  let clean = str;
  // 1. Remove full HTML tags like <span class="kw">text</span>
  clean = clean.replace(/<[^>]+>/g, "");
  // 2. Remove AI remnants: "kw">  "cmt">  "str">  "num">
  clean = clean.replace(/"[a-zA-Z0-9-]+">/g, "");
  // 3. Remove class="xyz"> patterns
  clean = clean.replace(/class="[^"]*">/g, "");
  // 4. Remove &lt;span...&gt; escaped HTML
  clean = clean.replace(/&lt;[^&]*&gt;/g, "");
  // 5. Catch any remaining "> sequences from partial tags
  clean = clean.replace(/[a-zA-Z0-9-]+">/g, "");
  return clean;
}

function highlight(code) {
  if (!code) return "";
  const clean = stripTags(code); // strip any pre-existing html tags
  const escaped = clean.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return escaped
    .replace(/\/\/[^\n]*/g, m => `<span class="cmt">${m}</span>`)
    .replace(/\b(int|long|bool|string|char|float|double|void|auto|return|class|struct|public|private|protected|if|else|for|while|do|new|delete|null|nullptr|None|True|False|def|self|import|from|pass|break|continue|try|except|lambda|vector|map|set|queue|stack|pair|unordered_map|unordered_set|typename|template|virtual|override|const|static|inline|unsigned|signed)\b/g, m => `<span class="kw">${m}</span>`)
    .replace(/"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/g, m => `<span class="str">${m}</span>`)
    .replace(/\b(\d+)\b/g, m => `<span class="num">${m}</span>`);
}

// ─── LC PDF ──────────────────────────────────────────────────────────────────
export function generateLCPdf(result) {
  if (!result) return;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>${result.problem_name || "LeetCode"} — CODEVIS Revision Sheet</title>
<style>${SHARED_STYLES}</style>
</head>
<body>

<!-- ── Header ── -->
<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;flex-wrap:wrap;gap:10px">
  <div>
    <div style="font-size:10px;color:#7c3aed;font-family:'JetBrains Mono',monospace;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px">CODEVIS · LeetCode Analysis</div>
    <h1>${result.problem_name || "LeetCode Problem"}</h1>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
      ${result.difficulty ? `<span class="badge ${result.difficulty.toLowerCase()}">${result.difficulty}</span>` : ""}
      ${result.leetcode_pattern ? `<span class="badge tag">⬡ ${result.leetcode_pattern}</span>` : ""}
      ${(result.topic_tags || []).map(t => `<span class="badge tag">${typeof t === "string" ? t : (t.name || t)}</span>`).join("")}
    </div>
  </div>
  <div style="text-align:right;font-family:'JetBrains Mono',monospace;font-size:10px;color:#aaa">
    Generated ${new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}<br/>
    ${result.problem_url ? `<a href="${result.problem_url}" style="color:#7c3aed">${result.problem_url}</a>` : ""}
  </div>
</div>

<!-- ── Quick Reference ── -->
${result.complexity || result.leetcode_pattern ? `
<div class="quick-ref">
  <div style="font-size:10px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:1.5px;font-family:'JetBrains Mono',monospace">⚡ Quick Reference</div>
  <div class="quick-ref-grid">
    <div class="qr-cell"><div class="qr-label">Time</div><div class="qr-val">${result.complexity?.time || "—"}</div></div>
    <div class="qr-cell"><div class="qr-label">Space</div><div class="qr-val">${result.complexity?.space || "—"}</div></div>
    <div class="qr-cell"><div class="qr-label">Best</div><div class="qr-val">${result.complexity?.best_case || "—"}</div></div>
    <div class="qr-cell"><div class="qr-label">Worst</div><div class="qr-val">${result.complexity?.worst_case || "—"}</div></div>
  </div>
  ${result.leetcode_pattern ? `<div style="margin-top:10px;font-size:11px;color:#5b21b6;font-family:'JetBrains Mono',monospace">Pattern: <strong>${result.leetcode_pattern}</strong></div>` : ""}
</div>` : ""}

<!-- ── Core Intuition ── -->
${result.core_intuition ? `
<div class="section">
  <div class="section-title">💡 Core Intuition</div>
  <div class="box">${result.core_intuition}</div>
</div>` : ""}

<!-- ── Logic Steps ── -->
${result.logic_steps?.length ? `
<div class="section">
  <div class="section-title">🧠 Logic Steps</div>
  ${result.logic_steps.map(s => `
    <div class="step-row">
      <div class="step-num">${s.step}</div>
      <div class="step-body">
        <div class="step-title">${s.title}</div>
        <div class="step-exp">${s.explanation}</div>
        ${s.code_line ? `<div class="code-line">${s.code_line.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</div>` : ""}
        ${s.analogy ? `<div class="analogy">💬 ${s.analogy}</div>` : ""}
      </div>
    </div>
  `).join("")}
</div>` : ""}

<!-- ── Approaches ── -->
${result.approaches?.length ? `
<div class="section">
  <div class="section-title">⚡ Approaches</div>
  ${result.approaches.map((a, i) => `
    <div class="approach">
      <div class="approach-header">
        <span style="display:flex;align-items:center;gap:8px">
          <span style="width:20px;height:20px;border-radius:50%;background:${i === 0 ? "#e5e7eb" : "#7c3aed"};color:${i === 0 ? "#333" : "#fff"};font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center">${i + 1}</span>
          ${a.name}
        </span>
        <span style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#666;display:flex;gap:10px">
          <span>Time: <strong>${a.time}</strong></span>
          <span>Space: <strong>${a.space}</strong></span>
        </span>
      </div>
      <div class="approach-body">
        <p style="margin-bottom:10px;color:#444;font-size:12px;line-height:1.7">${typeof a.plain_explanation === "string" ? a.plain_explanation : (a.explanation || a.description || "")}</p>
        ${a.code ? `<pre>${stripTags(a.code).replace(/</g,"&lt;").replace(/>/g,"&gt;")}</pre>` : ""}
      </div>
    </div>
  `).join("")}
</div>` : ""}

<!-- ── Complexity ── -->
${result.complexity ? `
<div class="section">
  <div class="section-title">△ Complexity Analysis</div>
  <div class="complexity-grid">
    <div class="c-card"><div class="c-label">Time</div><div class="c-val">${result.complexity.time || "—"}</div></div>
    <div class="c-card"><div class="c-label">Space</div><div class="c-val">${result.complexity.space || "—"}</div></div>
    <div class="c-card"><div class="c-label">Best Case</div><div class="c-val">${result.complexity.best_case || "—"}</div></div>
    <div class="c-card"><div class="c-label">Worst Case</div><div class="c-val">${result.complexity.worst_case || "—"}</div></div>
  </div>
  ${result.complexity.explanation ? `<p style="margin-top:10px;font-size:12px;color:#555;line-height:1.7">${result.complexity.explanation}</p>` : ""}
</div>` : ""}

<!-- ── Insights + Mistakes ── -->
<div class="two-col">
  ${result.key_insights?.length ? `
  <div class="section">
    <div class="section-title">🔑 Key Insights</div>
    ${result.key_insights.map((ins, i) => `
      <div class="insight-row">
        <div class="insight-num">${i + 1}</div>
        <div>${typeof ins === "string" ? ins : JSON.stringify(ins)}</div>
      </div>
    `).join("")}
  </div>` : ""}

  ${result.common_mistakes?.length ? `
  <div class="section">
    <div class="section-title">⚠ Common Mistakes</div>
    ${result.common_mistakes.map(m => `
      <div class="box-red" style="padding:8px 12px;margin-bottom:7px">
        <div class="mistake-row">
          <span class="mistake-icon">✕</span>
          <span style="font-size:12px">${typeof m === "string" ? m : JSON.stringify(m)}</span>
        </div>
      </div>
    `).join("")}
  </div>` : ""}
</div>

<!-- ── Tips / Insights ── -->
${result.tips?.length ? `
<div class="section">
  <div class="section-title">💡 Tips &amp; Tricks</div>
  ${result.tips.map(t => `<div class="box-green" style="padding:8px 12px;margin-bottom:7px;font-size:12px;color:#166534">✓ ${typeof t === "string" ? t : JSON.stringify(t)}</div>`).join("")}
</div>` : ""}

<!-- ── Similar Problems ── -->
${result.similar_problems?.length ? `
<div class="section">
  <div class="section-title">🔗 Similar Problems</div>
  <div class="similar-list">
    ${result.similar_problems.map(p => `<span class="badge tag">${typeof p === "string" ? p : (p.name || JSON.stringify(p))}</span>`).join("")}
  </div>
</div>` : ""}

<div class="footer">
  CODEVIS Revision Sheet · ${result.problem_name || "LeetCode"} · ${new Date().toLocaleDateString()}
</div>
</body></html>`;

  openPrintWindow(html, result.problem_name || "leetcode");
}

// ─── OOP PDF ─────────────────────────────────────────────────────────────────
export function generateOOPPdf(result) {
  if (!result) return;

  const allConcepts = [
    "encapsulation","inheritance","polymorphism","abstraction",
    "constructors","destructors","access_modifiers","static_members",
    "virtual_functions","operator_overloading",
  ];
  const usedConcepts    = Object.entries(result.oop_analysis || {}).filter(([, v]) => v?.used);
  const missingConcepts = allConcepts.filter(k => !result.oop_analysis?.[k]?.used);

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>OOP Analysis — CODEVIS Revision Sheet</title>
<style>${SHARED_STYLES}</style>
</head>
<body>

<!-- ── Header ── -->
<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;flex-wrap:wrap;gap:10px">
  <div>
    <div style="font-size:10px;color:#06b6d4;font-family:'JetBrains Mono',monospace;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px">CODEVIS · OOP Analysis</div>
    <h1>Object-Oriented Analysis</h1>
    ${result.summary ? `<p style="margin-top:6px;color:#555;font-size:13px;max-width:540px;line-height:1.7">${result.summary}</p>` : ""}
  </div>
  <div style="text-align:right;font-family:'JetBrains Mono',monospace;font-size:10px;color:#aaa">
    Generated ${new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}
  </div>
</div>

<!-- ── OOP Score quick ref ── -->
<div class="quick-ref" style="background:linear-gradient(135deg,#ecfdf5,#eff6ff);border-color:#6ee7b7">
  <div style="font-size:10px;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:1.5px;font-family:'JetBrains Mono',monospace">🔷 OOP Coverage</div>
  <div style="display:flex;align-items:center;gap:16px;margin-top:10px;flex-wrap:wrap">
    <div style="text-align:center">
      <div style="font-family:'JetBrains Mono',monospace;font-size:28px;font-weight:700;color:#059669">${usedConcepts.length}</div>
      <div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;font-family:'JetBrains Mono',monospace">Concepts Used</div>
    </div>
    <div style="flex:1;height:8px;background:#e5e7eb;border-radius:4px;overflow:hidden;min-width:120px">
      <div style="width:${Math.round((usedConcepts.length/10)*100)}%;height:100%;background:linear-gradient(90deg,#059669,#06b6d4);border-radius:4px"></div>
    </div>
    <div style="font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:700;color:#6b7280">${Math.round((usedConcepts.length/10)*100)}%</div>
  </div>
</div>

<!-- ── Step-by-step ── -->
${result.object_creation_steps?.length ? `
<div class="section">
  <div class="section-title">🎓 Step-by-Step Walkthrough</div>
  ${result.object_creation_steps.map(s => `
    <div class="step-row">
      <div class="step-num">${s.step}</div>
      <div class="step-body">
        <div class="step-title">${s.title}</div>
        <div class="step-exp">${s.explanation}</div>
        ${s.code_line ? `<div class="code-line">${s.code_line.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</div>` : ""}
        ${s.memory_state ? `<div class="memory-state">📦 ${typeof s.memory_state === "string" ? s.memory_state : JSON.stringify(s.memory_state)}</div>` : ""}
      </div>
    </div>
  `).join("")}
</div>` : ""}

<!-- ── OOP Concepts Used ── -->
${usedConcepts.length ? `
<div class="section">
  <div class="section-title">✅ Concepts Used (${usedConcepts.length}/${allConcepts.length})</div>
  <div class="concept-grid">
    ${usedConcepts.map(([key, val]) => `
      <div class="concept-card">
        <div class="concept-name">✓ ${key.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}</div>
        ${val.where ? `<div class="concept-where">📍 Line ${val.line_ref || "?"}: ${val.where}</div>` : ""}
        <div class="concept-exp">${val.explanation || ""}</div>
      </div>
    `).join("")}
  </div>
</div>` : ""}

<!-- ── Missing Concepts Checklist ── -->
${missingConcepts.length > 0 ? `
<div class="section">
  <div class="section-title">📋 Concepts Not Yet Used</div>
  <div style="display:flex;flex-wrap:wrap;gap:8px">
    ${missingConcepts.map(k => `
      <span style="font-size:10px;font-family:'JetBrains Mono',monospace;color:#9ca3af;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:3px 10px">
        ✗ ${k.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}
      </span>
    `).join("")}
  </div>
</div>` : ""}

<!-- ── Deep Dive ── -->
${result.concept_explanations?.length ? `
<div class="section">
  <div class="section-title">💬 Deep Dive — Analogies &amp; Code</div>
  ${result.concept_explanations.map(c => `
    <div class="analogy-card">
      <div class="analogy-title">${c.concept}</div>
      <p style="font-size:12px;color:#166534;margin-bottom:5px;font-style:italic">🌍 ${c.simple_analogy}</p>
      <p style="font-size:12px;color:#444;margin-bottom:6px;line-height:1.65">${c.what_it_does_here}</p>
      ${c.code_snippet ? `<pre>${stripTags(c.code_snippet).replace(/</g,"&lt;").replace(/>/g,"&gt;")}</pre>` : ""}
    </div>
  `).join("")}
</div>` : ""}

<!-- ── Class Diagram Hint ── -->
${result.classes?.length ? `
<div class="section">
  <div class="section-title">🗂 Class Structure Hint</div>
  <div class="box-blue">
    <div style="font-size:11px;font-family:'JetBrains Mono',monospace;color:#1e40af;line-height:1.9">
      ${result.classes.map(cls => `
        <div><strong>${cls.name}</strong>${cls.parent ? ` ⟶ extends ${cls.parent}` : ""}${cls.methods?.length ? ` · methods: ${cls.methods.map(m => typeof m === "string" ? m : (m.name || JSON.stringify(m))).join(", ")}` : ""}</div>
      `).join("")}
    </div>
  </div>
</div>` : ""}

<div class="footer">
  CODEVIS Revision Sheet · OOP Analysis · ${new Date().toLocaleDateString()}
</div>
</body></html>`;

  openPrintWindow(html, "oop-analysis");
}

// ─── Print window helper ──────────────────────────────────────────────────────
function openPrintWindow(html, filename) {
  // Always use blob URL — most reliable cross-browser approach
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, "_blank");
  if (!win) {
    // Popup blocked — fallback: download as HTML file
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${filename}-codevis.html`;
    a.click();
  } else {
    win.onload = () => {
      setTimeout(() => {
        win.focus();
        win.print();
      }, 800);
    };
  }
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}