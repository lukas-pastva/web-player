import React, { useState } from "react";
import Header from "../../components/Header.jsx";
import { loadConfig, saveConfig } from "../../config.js";

export default function ConfigPage() {
  const initial = loadConfig();

  /* simple three-field state */
  const [appTitle, setTitle] = useState(initial.appTitle);
  const [theme,    setTheme] = useState(initial.theme);
  const [mode,     setMode]  = useState(initial.mode);
  const [saved,    setSaved] = useState(false);

  function handleSave() {
    saveConfig({ appTitle: appTitle.trim() || "Web-Player", theme, mode });

    /* apply instantly */
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("data-mode",  mode);

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <>
      <Header />
      <main>
        <section className="card config-wrap">
          <h2>Configuration</h2>

          {/* app title */}
          <h3>Application title</h3>
          <input
            type="text"
            value={appTitle}
            onChange={(e) => setTitle(e.target.value)}
            style={{ marginBottom:"1rem" }}
          />

          {/* theme */}
          <h3>Theme (accent colour)</h3>
          <label><input type="radio" name="theme" value="boy"
            checked={theme==="boy"} onChange={()=>setTheme("boy")}/> Teal</label>
          {"  "}
          <label><input type="radio" name="theme" value="girl"
            checked={theme==="girl"} onChange={()=>setTheme("girl")}/> Pink</label>

          {/* mode */}
          <h3 style={{ marginTop:"1.2rem" }}>Colour-scheme mode</h3>
          <label><input type="radio" name="mode" value="light"
            checked={mode==="light"} onChange={()=>setMode("light")}/> Light</label>
          {"  "}
          <label><input type="radio" name="mode" value="dark"
            checked={mode==="dark"}  onChange={()=>setMode("dark")}/> Dark</label>
          {"  "}
          <label><input type="radio" name="mode" value="auto"
            checked={mode==="auto"}  onChange={()=>setMode("auto")}/> Auto</label>

          {/* save button */}
          <div style={{ marginTop:"1.2rem" }}>
            <button className="btn" onClick={handleSave}>Save</button>
            {saved && <span className="msg-success">✓ Saved</span>}
          </div>
        </section>
      </main>
    </>
  );
}
