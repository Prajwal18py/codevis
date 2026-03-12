// src/utils/theme.js — supports dark/light mode

export const DARK = {
  bg:      "#07070d",
  surface: "#0f0f17",
  card:    "#111119",
  border:  "#1a1a2a",
  accent:  "#7c3aed",
  accentL: "#a855f7",
  glow:    "rgba(124,58,237,0.18)",
  green:   "#10b981",
  blue:    "#3b82f6",
  orange:  "#f59e0b",
  red:     "#ef4444",
  pink:    "#ec4899",
  cyan:    "#06b6d4",
  coral:   "#f87171",
  amber:   "#fbbf24",
  teal:    "#2dd4bf",
  text:    "#e2e8f0",
  muted:   "#44445a",
  dim:     "#8892a4",
};

export const LIGHT = {
  bg:      "#f8f7ff",
  surface: "#ffffff",
  card:    "#f1f0fb",
  border:  "#ddd8f5",
  accent:  "#7c3aed",
  accentL: "#8b5cf6",
  glow:    "rgba(124,58,237,0.10)",
  green:   "#059669",
  blue:    "#2563eb",
  orange:  "#d97706",
  red:     "#dc2626",
  pink:    "#db2777",
  cyan:    "#0891b2",
  coral:   "#ef4444",
  amber:   "#d97706",
  teal:    "#0d9488",
  text:    "#1e1b4b",
  muted:   "#9ca3af",
  dim:     "#6b7280",
};

// Default export — components import C and it gets swapped via context
export const C = DARK;