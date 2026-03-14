// src/utils/piston.js — Free code execution via Piston API (no key needed)

const PISTON_URL = "https://emkc.org/api/v2/piston/execute";

const LANG_MAP = {
  cpp:    { language: "cpp",    version: "10.2.0" },
  python: { language: "python", version: "3.10.0" },
};

export async function runCode(lang, code, stdin = "") {
  const config = LANG_MAP[lang] || LANG_MAP["cpp"];
  try {
    const res = await fetch(PISTON_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: config.language,
        version:  config.version,
        files:    [{ name: "main", content: code }],
        stdin,
      }),
    });
    const data = await res.json();
    return {
      stdout:  data.run?.stdout?.trim() || "",
      stderr:  data.run?.stderr?.trim() || data.compile?.stderr?.trim() || "",
      code:    data.run?.code ?? -1,
      success: data.run?.code === 0,
    };
  } catch (e) {
    return { stdout: "", stderr: "Network error: " + e.message, code: -1, success: false };
  }
}