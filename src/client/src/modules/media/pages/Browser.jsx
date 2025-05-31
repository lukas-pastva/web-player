import React, { useEffect, useState, useRef } from "react";
import Header from "../../../components/Header.jsx";
import api from "../api.js";

/* build breadcrumb array */
function buildCrumbs(rel) {
  if (!rel) return [];
  const parts = rel.split("/").filter(Boolean);
  return parts.map((name, idx) => ({
    name,
    path: parts.slice(0, idx + 1).join("/"),
  }));
}
/* encode for safe URL */
const enc = (p) => p.split("/").map(encodeURIComponent).join("/");

export default function MediaBrowser() {
  const [dir, setDir]         = useState({ path:"", directories:[], files:[] });
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState("");

  /* player state --------------------------------------------------- */
  const [playlist, setList]   = useState([]);     // mp3s in current folder
  const [playIdx,  setIdx]    = useState(-1);     // index in playlist
  const [mode,     setMode]   = useState("sequential"); // none|sequential|shuffle|repeatOne
  const audioRef              = useRef(null);

  /* helper: loads a directory ------------------------------------- */
  const load = (path = "") => {
    setLoading(true);
    api.list(path)
       .then(d => {
         setDir(d);
         setLoading(false);
       })
       .catch(e => { setErr(e.message); setLoading(false); });
  };
  useEffect(() => load(""), []);

  /* whenever dir changes, rebuild playlist ------------------------ */
  useEffect(() => {
    const list = dir.files
      .filter(f => f.toLowerCase().endsWith(".mp3"))
      .map(f => (dir.path ? `${dir.path}/${f}` : f));
    setList(list);
    setIdx(-1);
  }, [dir]);

  /* derived helpers ------------------------------------------------ */
  const playing = playIdx >= 0 ? playlist[playIdx] : null;
  const crumbs  = buildCrumbs(dir.path);

  function startTrack(relPath) {
    const idx = playlist.indexOf(relPath);
    setIdx(idx);
  }

  function handleEnded() {
    if (mode === "repeatOne") {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      return;
    }
    if (mode === "none" || playlist.length === 0) return;

    if (mode === "shuffle") {
      const next = Math.floor(Math.random() * playlist.length);
      setIdx(next);
    } else if (mode === "sequential") {
      const next = playIdx + 1;
      if (next < playlist.length) setIdx(next);
    }
  }

  return (
    <>
      <Header showMeta={false} />
      {err && <p style={{ color:"#c00", padding:"0 1rem" }}>{err}</p>}

      <main>
        <section className="card" style={{ maxWidth:900 }}>
          <h2 style={{ marginTop:0 }}>Media library</h2>

          {/* ── breadcrumbs as buttons ─────────────────────────── */}
          <div style={{ marginBottom:"1rem" }}>
            <strong>Path:&nbsp;</strong>
            <button className="crumb-btn" onClick={()=>load("")}>/</button>
            {crumbs.map(c=>(
              <button
                key={c.path}
                className="crumb-btn"
                onClick={()=>load(c.path)}
              >
                {c.name}
              </button>
            ))}
          </div>

          {loading && <p>Loading…</p>}

          {!loading && (
            <>
              {/* directories */}
              {dir.directories.length > 0 && (
                <>
                  <h3>Folders</h3>
                  <ul style={{ listStyle:"none", paddingLeft:0 }}>
                    {dir.directories.map(d => (
                      <li key={d}>
                        📁{" "}
                        <button
                          className="crumb-btn"
                          onClick={()=>load(dir.path ? `${dir.path}/${d}` : d)}
                        >
                          {d}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {/* MP3 files */}
              {playlist.length > 0 && (
                <>
                  <h3>MP3 files</h3>
                  <ul style={{ listStyle:"none", paddingLeft:0 }}>
                    {playlist.map(rel => {
                      const fname = rel.split("/").pop();
                      return (
                        <li key={rel}>
                          🎵{" "}
                          <button
                            className="crumb-btn"
                            onClick={()=>startTrack(rel)}
                          >
                            {fname}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}

              {dir.directories.length===0 && playlist.length===0 && (
                <p><em>Folder is empty.</em></p>
              )}
            </>
          )}
        </section>

        {/* player */}
        {playing && (
          <section className="card" style={{ maxWidth:900 }}>
            <h3 style={{ marginTop:0 }}>Now playing</h3>
            <p style={{ wordBreak:"break-all" }}>{playing}</p>

            {/* playback-mode selector */}
            <div style={{ marginBottom:"0.8rem" }}>
              <label htmlFor="modeSel" style={{ fontWeight:600, marginRight:6 }}>
                Playback mode:
              </label>
              <select
                id="modeSel"
                value={mode}
                onChange={e=>setMode(e.target.value)}
              >
                <option value="none">No autoplay</option>
                <option value="sequential">Autoplay next</option>
                <option value="shuffle">Shuffle</option>
                <option value="repeatOne">Repeat one</option>
              </select>
            </div>

            <audio
              ref={audioRef}
              src={`/media/${enc(playing)}`}
              controls
              style={{ width:"100%" }}
              autoPlay
              onEnded={handleEnded}
            />
          </section>
        )}
      </main>
    </>
  );
}
