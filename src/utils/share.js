// src/utils/share.js — Shareable links via URL hash encoding

export function encodeShare(mode, lang, result) {
  try {
    const payload = { mode, lang, result, v: 1 };
    const json = JSON.stringify(payload);
    const encoded = btoa(unescape(encodeURIComponent(json)));
    return `${window.location.origin}${window.location.pathname}#share=${encoded}`;
  } catch { return null; }
}

export function decodeShare(hash) {
  try {
    const match = hash.match(/[#&]share=([^&]*)/);
    if (!match) return null;
    const json = decodeURIComponent(escape(atob(match[1])));
    return JSON.parse(json);
  } catch { return null; }
}

export async function copyShareLink(url) {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch { return false; }
}