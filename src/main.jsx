// src/main.jsx — entry point only
import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider } from "./utils/ThemeContext";
import Root from "./Root";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <Root />
    </ThemeProvider>
  </React.StrictMode>
);