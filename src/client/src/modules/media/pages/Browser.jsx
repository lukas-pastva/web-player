import React, { useEffect, useState } from "react";
import Header from "../../../components/Header.jsx";
import api from "../api.js";

/* build breadcrumb data from “foo/bar” -> [{name:"foo",path:"foo"}, …] */
function buildCrumbs(rel) {
  if (!rel) return [];
  const parts = rel.split("/").filter(Boolean);
  return parts.map((name, idx) => ({
    name,
    path: parts.slice(0, idx + 1).join("/"),
  }));
}
/* encode every segment for a safe URL */
const enc = (p) => p.split("/").map(encodeURIComponent).join("/");

export default function MediaBrowser() {
  const [dir, setDir]         = useState({ path:"", directories:[], files:[] });
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState("");
  const [playing, setPlaying] = useState(null);      // relative file path

  const load = (path = "") => {
    setLoading(true);
    api.list(path)
       .then(d => { setDir(d); setLoading(false); })
       .catch(e => { setErr(e.message); setLoading(false); });
  };

  useEffect(() => load(""), []);

  const crumbs = buildCrumbs(dir.path);

  return (
    <>
      <Header showMeta={false} />

      {err && <p style={{ color:"#c00", padding:"0 1rem" }}>{err}</p>}

      <main>
        <section className="card" style={{ maxWidth:900 }}>
          <h2 style={{ marginTop:0 }}>Media library</h2>

          {/* breadcrumbs */}
          <p style={{ marginBottom:"1rem" }}>
            <strong>Path:</strong>{" "}
            <a href="#" onClick={e => { e.preventDefault(); load(""); }}>/</a>
            {crumbs.map(c => (
              <span key={c.path}>
                {" / "}
                <a href="#" onClick={e => { e.preventDefault(); load(c.path); }}>
                  {c.name}
                </a>
              </span>
            ))}
          </p>

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
                        <a href="#"
                           onClick={e => { e.preventDefault(); load(dir.path ? `${dir.path}/${d}` : d); }}>
                          {d}
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {/* MP3 files */}
              {dir.files.filter(f => f.toLowerCase().endsWith(".mp3")).length > 0 && (
                <>
                  <h3>MP3 files</h3>
                  <ul style={{ listStyle:"none", paddingLeft:0 }}>
                    {dir.files
                      .filter(f => f.toLowerCase().endsWith(".mp3"))
                      .map(f => {
                        const rel = dir.path ? `${dir.path}/${f}` : f;
                        return (
                          <li key={f}>
                            🎵{" "}
                            <a href="#" onClick={e => { e.preventDefault(); setPlaying(rel); }}>
                              {f}
                            </a>
                          </li>
                        );
                      })}
                  </ul>
                </>
              )}

              {dir.directories.length === 0 &&
               dir.files.filter(f => f.toLowerCase().endsWith(".mp3")).length === 0 && (
                 <p><em>Folder is empty.</em></p>
              )}
            </>
          )}
        </section>

        {/* audio player */}
        {playing && (
          <section className="card" style={{ maxWidth:900 }}>
            <h3 style={{ marginTop:0 }}>Now playing</h3>
            <p style={{ wordBreak:"break-all" }}>{playing}</p>
            <audio
              src={`/media/${enc(playing)}`}
              controls
              style={{ width:"100%" }}
              autoPlay
            />
          </section>
        )}
      </main>
    </>
  );
}
