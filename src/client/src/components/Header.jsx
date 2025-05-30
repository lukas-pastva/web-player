import React, { useState, useEffect } from "react";
import { differenceInCalendarDays, startOfToday } from "date-fns";
import { loadConfig, saveConfig, storedMode } from "../config.js";

/* helper – map “auto” to actual light/dark every call */
function applyMode(mode) {
  let real = mode;
  if (mode === "auto") {
    const h = new Date().getHours();
    real = h >= 7 && h < 19 ? "light" : "dark";
  }
  document.documentElement.setAttribute("data-mode", real);
}

export default function Header({ showMeta = true }) {
  const p = window.location.pathname;

  const {
    childName = "",
    childSurname = "",
    birthTs,
    appTitle: title = "Web-Player",
  } = loadConfig();

  /* age in days (still used on baby pages) */
  const birthDate = birthTs ? new Date(birthTs) : null;
  const ageText = birthDate
    ? `${differenceInCalendarDays(startOfToday(), birthDate)} days`
    : "";

  /* ── colour-mode toggle ─────────────────────────────────────────── */
  const [mode, setMode] = useState(storedMode());

  useEffect(() => {
    if (mode !== "auto") return;
    const id = setInterval(() => applyMode("auto"), 30 * 60 * 1000);
    return () => clearInterval(id);
  }, [mode]);

  function toggleMode() {
    const next =
      mode === "light" ? "dark" : mode === "dark" ? "auto" : "light";
    setMode(next);
    saveConfig({ ...loadConfig(), mode: next });
    applyMode(next);
  }

  const modeIcon = mode === "light" ? "☀️" : mode === "dark" ? "🌙" : "🌓";
  const child    = `${childName} ${childSurname}`.trim();

  return (
    <header className="mod-header">
      <h1>{title}</h1>

      <nav className="nav-center">
        {/* NEW: Media library */}
        <a href="/media" className={p.startsWith("/media") ? "active" : ""}>
          Library
        </a>

        {/* legacy links */}
        <a href="/milking"     className={p === "/milking" ? "active" : ""}>Today</a>
        <a href="/milking/all" className={p.startsWith("/milking/all") ? "active" : ""}>
          All&nbsp;days
        </a>
        <a href="/weight"  className={p === "/weight" ? "active" : ""}>Weight</a>
        <a href="/config"  className={p === "/config" ? "active" : ""}>Config</a>
        <a href="/help"    className={p === "/help"   ? "active" : ""}>Help</a>
      </nav>

      <div style={{ display:"flex", alignItems:"center", gap:".9rem" }}>
        <button className="mode-toggle" onClick={toggleMode} aria-label="Toggle colour mode">
          {modeIcon}
        </button>

        {showMeta && (child || ageText) && (
          <div className="meta" style={{ textAlign:"right", lineHeight:1.2 }}>
            {child && <strong>{child}</strong>}
            {child && ageText && <br />}
            {ageText && <small>{ageText}</small>}
          </div>
        )}
      </div>
    </header>
  );
}
