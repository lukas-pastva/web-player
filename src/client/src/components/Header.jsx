import React, { useState, useEffect } from "react";
import { loadConfig, saveConfig, storedMode } from "../config.js";
import IntroBanner from "./IntroBanner.jsx";   // ← NEW

function applyMode(mode) {
  let real = mode;
  if (mode === "auto") {
    const h = new Date().getHours();
    real = h >= 7 && h < 19 ? "light" : "dark";
  }
  document.documentElement.setAttribute("data-mode", real);
}

export default function Header() {
  const p      = window.location.pathname;
  const domain = (window.location.hostname || "Web-Player").replace(/^www\./, "");

  /* colour-scheme toggle */
  const [mode, setMode] = useState(storedMode());

  useEffect(() => {
    if (mode !== "auto") return;
    const id = setInterval(() => applyMode("auto"), 30 * 60 * 1000);
    return () => clearInterval(id);
  }, [mode]);

  function toggleMode() {
    const next = mode === "light" ? "dark" : mode === "dark" ? "auto" : "light";
    setMode(next);
    saveConfig({ mode: next });
    applyMode(next);
  }

  const modeIcon = mode === "light" ? "☀️" : mode === "dark" ? "🌙" : "🌓";

  return (
    <>
      <header className="mod-header">
        <h1>{domain}</h1>

        <nav className="nav-center">
          <a href="/media"  className={p.startsWith("/media") ? "active" : ""}>Library</a>
          <a href="/config" className={p === "/config" ? "active" : ""}>Config</a>
          <a href="/help"   className={p === "/help"   ? "active" : ""}>Help</a>
        </nav>

        <button
          className="mode-toggle"
          onClick={toggleMode}
          aria-label="Toggle colour mode"
        >
          {modeIcon}
        </button>
      </header>

      <IntroBanner />
    </>
  );
}
