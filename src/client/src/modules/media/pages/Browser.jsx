import React, { useEffect, useState, useRef } from "react";
import Header from "../../../components/Header.jsx";
import api from "../api.js";

/* breadcrumb helpers */
const enc = (p) => p.split("/").map(encodeURIComponent).join("/");
const crumbs = (rel="") =>
  rel.split("/").filter(Boolean).map((n,i)=>({
    name:n, path:rel.split("/").slice(0,i+1).join("/"),
  }));

export default function MediaBrowser() {
  const [dir, setDir]         = useState({ path:"", directories:[], files:[] });
  const [playlist, setList]   = useState([]);
  const [playIdx,  setIdx]    = useState(-1);
  const [mode,     setMode]   = useState("sequential");   // none|sequential|shuffle|repeatOne
  const [loading,  setLoad ]  = useState(true);
  const [err,      setErr  ]  = useState("");

  const audioRef = useRef(null);

  const load = (p="") => {
    setLoad(true);
    api.list(p)
       .then(d=>{ setDir(d); setLoad(false); })
       .catch(e=>{ setErr(e.message); setLoad(false); });
  };
  useEffect(()=>load(""),[]);

  /* rebuild playlist whenever directory changes */
  useEffect(()=>{
    const list=dir.files.filter(f=>f.toLowerCase().endsWith(".mp3"))
                        .map(f=>dir.path?`${dir.path}/${f}`:f);
    setList(list); setIdx(-1);
  },[dir]);

  const playing = playIdx>=0?playlist[playIdx]:null;

  /* player ended → decide next action */
  function onEnded(){
    if(mode==="repeatOne"){ audioRef.current.currentTime=0; audioRef.current.play(); return; }
    if(mode==="none"||playlist.length===0) return;
    if(mode==="shuffle"){ setIdx(Math.floor(Math.random()*playlist.length)); return; }
    if(mode==="sequential" && playIdx+1<playlist.length){ setIdx(playIdx+1); }
  }

  return(
    <>
      <Header />

      <main>
        {/* sticky player box */}
        {playing && (
          <section className="card player-box">
            <h3 style={{marginTop:0}}>Now playing</h3>
            <p style={{wordBreak:"break-all",marginBottom:"0.6rem"}}>{playing}</p>

            <label style={{fontWeight:600,marginRight:6}}>Playback mode:</label>
            <select value={mode} onChange={e=>setMode(e.target.value)} style={{marginBottom:"0.8rem"}}>
              <option value="none">No autoplay</option>
              <option value="sequential">Autoplay next</option>
              <option value="shuffle">Shuffle</option>
              <option value="repeatOne">Repeat one</option>
            </select>

            <audio
              ref={audioRef}
              src={`/media/${enc(playing)}`}
              controls
              style={{width:"100%"}}
              autoPlay
              onEnded={onEnded}
            />
          </section>
        )}

        {/* library browser */}
        <section className="card" style={{maxWidth:900}}>
          <h2 style={{marginTop:0}}>Media library</h2>

          {/* breadcrumbs */}
          <div style={{marginBottom:"1rem"}}>
            <strong>Path:&nbsp;</strong>
            <button className="crumb-btn" onClick={()=>load("")}>/</button>
            {crumbs(dir.path).map(c=>(
              <button key={c.path} className="crumb-btn" onClick={()=>load(c.path)}>
                {c.name}
              </button>
            ))}
          </div>

          {loading && <p>Loading…</p>}

          {!loading && (
            <>
              {/* folders list */}
              {dir.directories.length>0 && (
                <>
                  <h3>Folders</h3>
                  <div className="scroll-list">
                    <ul style={{listStyle:"none",paddingLeft:0,margin:0}}>
                      {dir.directories.map(d=>(
                        <li key={d}>📁{" "}
                          <button className="crumb-btn"
                            onClick={()=>load(dir.path?`${dir.path}/${d}`:d)}>
                            {d}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {/* mp3 list */}
              {playlist.length>0 && (
                <>
                  <h3>MP3 files</h3>
                  <div className="scroll-list">
                    <ul style={{listStyle:"none",paddingLeft:0,margin:0}}>
                      {playlist.map(rel=>{
                        const fname=rel.split("/").pop();
                        return(
                          <li key={rel}>🎵{" "}
                            <button className="crumb-btn" onClick={()=>setIdx(playlist.indexOf(rel))}>
                              {fname}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </>
              )}

              {dir.directories.length===0 && playlist.length===0 && (
                <p><em>Folder is empty.</em></p>
              )}
            </>
          )}
        </section>
      </main>
    </>
  );
}
