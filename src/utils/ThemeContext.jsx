// src/utils/ThemeContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { DARK, LIGHT } from "./theme";

const ThemeCtx = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("codevis_theme") !== "light";
  });

  const C = isDark ? DARK : LIGHT;

  function toggle() {
    setIsDark(d => {
      localStorage.setItem("codevis_theme", d ? "light" : "dark");
      return !d;
    });
  }

  // Apply bg to body
  useEffect(() => {
    document.body.style.background = C.bg;
    document.body.style.color = C.text;
  }, [isDark]);

  return (
    <ThemeCtx.Provider value={{ C, isDark, toggle }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeCtx);
}