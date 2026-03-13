// src/utils/theme.js — Dark / Light / Dracula / Nord

export const DARK = {
  bg:"#07070d", surface:"#0f0f17", card:"#111119", border:"#1a1a2a",
  accent:"#7c3aed", accentL:"#a855f7", glow:"rgba(124,58,237,0.18)",
  green:"#10b981", blue:"#3b82f6", orange:"#f59e0b", red:"#ef4444",
  pink:"#ec4899", cyan:"#06b6d4", coral:"#f87171", amber:"#fbbf24",
  teal:"#2dd4bf", text:"#e2e8f0", muted:"#44445a", dim:"#8892a4",
};

export const LIGHT = {
  bg:"#f8f7ff", surface:"#ffffff", card:"#f1f0fb", border:"#ddd8f5",
  accent:"#7c3aed", accentL:"#8b5cf6", glow:"rgba(124,58,237,0.10)",
  green:"#059669", blue:"#2563eb", orange:"#d97706", red:"#dc2626",
  pink:"#db2777", cyan:"#0891b2", coral:"#ef4444", amber:"#d97706",
  teal:"#0d9488", text:"#1e1b4b", muted:"#9ca3af", dim:"#6b7280",
};

export const DRACULA = {
  bg:"#282a36", surface:"#21222c", card:"#1e1f29", border:"#44475a",
  accent:"#bd93f9", accentL:"#caa9fa", glow:"rgba(189,147,249,0.18)",
  green:"#50fa7b", blue:"#8be9fd", orange:"#ffb86c", red:"#ff5555",
  pink:"#ff79c6", cyan:"#8be9fd", coral:"#ff6e6e", amber:"#f1fa8c",
  teal:"#50fa7b", text:"#f8f8f2", muted:"#6272a4", dim:"#b3bac5",
};

export const NORD = {
  bg:"#2e3440", surface:"#3b4252", card:"#434c5e", border:"#4c566a",
  accent:"#88c0d0", accentL:"#81a1c1", glow:"rgba(136,192,208,0.18)",
  green:"#a3be8c", blue:"#5e81ac", orange:"#d08770", red:"#bf616a",
  pink:"#b48ead", cyan:"#88c0d0", coral:"#d08770", amber:"#ebcb8b",
  teal:"#8fbcbb", text:"#eceff4", muted:"#4c566a", dim:"#d8dee9",
};

export const THEMES = {
  dark:    { label:"🌑 Dark",    theme: DARK    },
  light:   { label:"☀️ Light",   theme: LIGHT   },
  dracula: { label:"🧛 Dracula", theme: DRACULA },
  nord:    { label:"🏔 Nord",    theme: NORD    },
};

export const C = DARK;