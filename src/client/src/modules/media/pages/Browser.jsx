import React, { useEffect, useState, useRef } from "react";
import Header from "../../../components/Header.jsx";
import api from "../api.js";

/* helpers ----------------------------------------------------------- */
const enc = (p) => p.split("/").map(encodeURIComponent).join("/");
const crumbs = (rel="") =>
  rel.split("/").filter(Boolean).map((n,i)=>({
    name:n, path:rel.split("/").slice(0,i+1).join("/"),
  }));

export default function MediaBrowser() {
  /* directory & list */
  const [dir,      setDir ] = useState({ path:"", directories:[], files:[] });
  const [playlist, setList] = useState([]);

  /* player state */
  const [playIdx,  setIdx ] = useState(-1);
  const [userStart,setUsr ] = useState(false);
  const [mode,     setMode] = useState("sequential"); // none|sequential|shuffle|repeatOne

  const audioRef   = useRef(null);
  const canvasRef  = useRef(null);
  const audioCtx   = useRef(null);
  const analyser   = useRef(null);
  const rafId      = useRef(null);

  /* ui state */
  const [loading,  setLoad] = useState(true);
  const [err,      setErr ] = useState("");

  /* load dir -------------------------------------------------------- */
  const load = (p="") => {
    setLoad(true);
    api.list(p)
       .then(d=>{ setDir(d); setLoad(false); })
       .catch(e=>{ setErr(e.message); setLoad(false); });
  };
  useEffect(()=>load(""),[]);

  /* rebuild playlist on dir change --------------------------------- */
  useEffect(()=>{
    const list=dir.files.filter(f=>f.toLowerCase().endsWith(".mp3"))
                        .map(f=>dir.path?`${dir.path}/${f}`:f);
    setList(list); setIdx(list.length?0:-1); setUsr(false);
  },[dir]);

  /* autoplay chain once user clicked -------------------------------- */
  useEffect(()=>{
    if(userStart && audioRef.current){
      audioRef.current.play().catch(()=>{});
    }
  },[playIdx,userStart]);

  const playing = playIdx>=0?playlist[playIdx]:null;

  /* user selects a track */
  function startTrack(idx){
    setIdx(idx); setUsr(true);
  }

  /* equaliser setup / animation ------------------------------------ */
  useEffect(()=>{
    if(!audioRef.current || !canvasRef.current) return;
    if(!audioCtx.current){
      /* create context on first user gesture (userStart) */
      const resumeCtx = () => {
        audioCtx.current = new (window.AudioContext||window.webkitAudioContext)();
        const srcNode = audioCtx.current.createMediaElementSource(audioRef.current);
        analyser.current = audioCtx.current.createAnalyser();
        analyser.current.fftSize = 256;
        srcNode.connect(analyser.current).connect(audioCtx.current.destination);
        draw();                                  // kick-off anim loop
        window.removeEventListener("click", resumeCtx);
      };
      window.addEventListener("click", resumeCtx, { once:true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  function draw(){
    const canvas = canvasRef.current;
    if(!canvas || !analyser.current) return;
    const ctx = canvas.getContext("2d");
    const { width, height } = canvas;
    const buffer = new Uint8Array(analyser.current.frequencyBinCount);

    const render = ()=>{
      analyser.current.getByteFrequencyData(buffer);
      ctx.clearRect(0,0,width,height);
      const barW = width / buffer.length;
      buffer.forEach((v,i)=>{
        const barH = (v/255)*height;
        ctx.fillStyle="#3b82f6";
        ctx.fillRect(i*barW, height-barH, barW-1, barH);
      });
      rafId.current = requestAnimationFrame(render);
    };
    render();
  }

  /* cleanup on unmount */
  useEffect(()=>()=>cancelAnimationFrame(rafId.current),[]);

  /* ended event */
  function onEnded(){
    if(mode==="repeatOne"){ audioRef.current.currentTime=0; audioRef.current.play(); return; }
    if(mode==="none"||playlist.length===0) return;
    if(mode==="shuffle"){ setIdx(Math.floor(Math.random()*playlist.length)); }
    else if(mode==="sequential" && playIdx+1<playlist.length){ setIdx(playIdx+1); }
  }

  return(
    <>
      <Header />

      <main>
        {/* player box ─ always visible */}
        <section className="card player-box">
          <h3 style={{marginTop:0}}>Now playing</h3>

          {playing ? (
            <>
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
                onEnded={onEnded}
              />

              {/* equaliser canvas */}
              <canvas ref={canvasRef} className="eq-canvas"/>
            </>
          ) : (
            <p><em>No MP3 files in this folder</em></p>
          )}
        </section>

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
              {/* folders */}
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
                      {playlist.map((rel,i)=>{
                        const fname = rel.split("/").pop();
                        return(
                          <li key={rel}>🎵{" "}
                            <button className="crumb-btn" onClick={()=>startTrack(i)}>
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
