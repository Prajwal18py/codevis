// src/utils/ThemeContext.jsx — supports Dark / Light / Dracula / Nord
import { createContext, useContext, useState, useEffect } from "react";
import { THEMES } from "./theme";

const ThemeCtx = createContext();

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState(() =>
    localStorage.getItem("codevis_theme") || "dark"
  );

  const C = THEMES[themeName]?.theme || THEMES.dark.theme;
  const isDark = themeName !== "light";

  function setTheme(name) {
    setThemeName(name);
    localStorage.setItem("codevis_theme", name);
  }

  function toggle() {
    setTheme(themeName === "dark" ? "light" : "dark");
  }

  useEffect(() => {
    document.body.style.background = C.bg;
    document.body.style.color = C.text;
  }, [themeName]);

  return (
    <ThemeCtx.Provider value={{ C, isDark, toggle, themeName, setTheme }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeCtx);
}