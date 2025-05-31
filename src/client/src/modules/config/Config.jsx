import React, { useState } from "react";
import Header from "../../components/Header.jsx";
import { loadConfig, saveConfig } from "../../config.js";

export default function ConfigPage() {
  const initial = loadConfig();

  const [theme, setTheme] = useState(initial.theme);
  const [mode,  setMode]  = useState(initial.mode);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    saveConfig({ theme, mode });

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

          {/* theme */}
          <h3>Theme (accent colour)</h3>
          <label>
            <input
              type="radio" name="theme" value="boy"
              checked={theme==="boy"} onChange={()=>setTheme("boy")}
            />{" "}
            Blue
          </label>{" "}
          <label>
            <input
              type="radio" name="theme" value="girl"
              checked={theme==="girl"} onChange={()=>setTheme("girl")}
            />{" "}
            Grey
          </label>

          {/* mode */}
          <h3 style={{ marginTop:"1.2rem" }}>Colour-scheme mode</h3>
          <label>
            <input
              type="radio" name="mode" value="light"
              checked={mode==="light"} onChange={()=>setMode("light")}
            />{" "}
            Light
          </label>{" "}
          <label>
            <input
              type="radio" name="mode" value="dark"
              checked={mode==="dark"} onChange={()=>setMode("dark")}
            />{" "}
            Dark
          </label>{" "}
          <label>
            <input
              type="radio" name="mode" value="auto"
              checked={mode==="auto"} onChange={()=>setMode("auto")}
            />{" "}
            Auto
          </label>

          {/* save */}
          <div style={{ marginTop:"1.2rem" }}>
            <button className="btn" onClick={handleSave}>Save</button>
            {saved && <span className="msg-success">✓ Saved</span>}
          </div>
        </section>
      </main>
    </>
  );
}
