import React, { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import Header from "../../../components/Header.jsx";
import api from "../api.js";

/* helpers ---------------------------------------------------------- */
const enc = (p) => p.split("/").map(encodeURIComponent).join("/");
const crumbs = (rel = "") =>
  rel
    .split("/")
    .filter(Boolean)
    .map((n, i) => ({
      name: n,
      path: rel.split("/").slice(0, i + 1).join("/"),
    }));

// detect mobile user-agent
const isMobile =
  typeof navigator !== "undefined" && /Mobi|Android/i.test(navigator.userAgent);

export default function MediaBrowser() {
  /* pull in intro text from env or build-time VITE_ var */
  const introText =
    window.ENV_INTRO_TEXT ?? import.meta.env.VITE_INTRO_TEXT ?? "";

  /* directory & playlist ------------------------------------------ */
  const [dir, setDir] = useState({ path: "", directories: [], files: [] });
  const [playlist, setList] = useState([]);

  /* player state --------------------------------------------------- */
  const [playIdx, setIdx] = useState(-1);
  const [userStart, setUsr] = useState(false);
  const [mode, setMode] = useState("sequential"); // none|sequential|shuffle|repeatOne

  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const audioCtx = useRef(null);
  const analyser = useRef(null);
  const rafId = useRef(null);

  /* ui state */
  const [loading, setLoad] = useState(true);
  const [err, setErr] = useState("");

  /* ── load directory --------------------------------------------- */
  const load = (p = "") => {
    setLoad(true);
    api
      .list(p)
      .then((d) => {
        setDir(d);
        setLoad(false);
      })
      .catch((e) => {
        setErr(e.message);
        setLoad(false);
      });
  };
  useEffect(() => load(""), []);

  /* rebuild playlist on dir change -------------------------------- */
  useEffect(() => {
    const list = dir.files
      .filter((f) => /\.(mp3|m4a)$/i.test(f))
      .map((f) => (dir.path ? `${dir.path}/${f}` : f));
    setList(list);
    setIdx(list.length ? 0 : -1);
    setUsr(false);
  }, [dir]);

  const playing = playIdx >= 0 ? playlist[playIdx] : null;

  /* user clicks an MP3 button ------------------------------------- */
  function startTrack(idx) {
    setIdx(idx);
    setUsr(true);
    setTimeout(() => {
      if (audioRef.current) audioRef.current.play().catch(() => {});
    }, 0);
  }

  /* autoplay chain after first user click ------------------------- */
  useEffect(() => {
    if (userStart && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }, [playIdx, userStart]);

  /* ── AudioContext / analyser (skip on mobile) ------------------- */
  function ensureAnalyser() {
    // skip Web Audio API on mobile to allow native background play
    if (isMobile) return;

    if (!audioCtx.current) {
      audioCtx.current =
        new (window.AudioContext || window.webkitAudioContext)();
      const src = audioCtx.current.createMediaElementSource(audioRef.current);
      analyser.current = audioCtx.current.createAnalyser();
      analyser.current.fftSize = 256;
      src.connect(analyser.current).connect(audioCtx.current.destination);
      drawEq();
    }
    if (audioCtx.current.state === "suspended") {
      audioCtx.current.resume();
    }
  }

  /* equaliser draw loop ------------------------------------------- */
  function drawEq() {
    const canvas = canvasRef.current;
    if (!canvas || !analyser.current) return;

    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    if (canvas.width !== cssW * dpr || canvas.height !== cssH * dpr) {
      canvas.width = cssW * dpr;
      canvas.height = cssH * dpr;
    }

    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    const buffer = new Uint8Array(analyser.current.frequencyBinCount);
    const barW = cssW / buffer.length;

    const render = () => {
      analyser.current.getByteFrequencyData(buffer);
      ctx.clearRect(0, 0, cssW, cssH);
      buffer.forEach((v, i) => {
        const barH = (v / 255) * cssH;
        ctx.fillStyle = "#3b82f6";
        ctx.fillRect(i * barW, cssH - barH, barW - 1, barH);
      });
      rafId.current = requestAnimationFrame(render);
    };
    render();
  }
  useEffect(() => () => cancelAnimationFrame(rafId.current), []);

  /* resume context when page/tab regains focus -------------------- */
  function resumeCtx() {
    if (audioCtx.current && audioCtx.current.state === "suspended") {
      audioCtx.current.resume();
    }
  }
  useEffect(() => {
    window.addEventListener("visibilitychange", resumeCtx);
    window.addEventListener("focus", resumeCtx);
    return () => {
      window.removeEventListener("visibilitychange", resumeCtx);
      window.removeEventListener("focus", resumeCtx);
    };
  }, []);

  /* handle track end ---------------------------------------------- */
  function onEnded() {
    if (mode === "repeatOne") {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      return;
    }
    if (mode === "none" || playlist.length === 0) return;

    if (mode === "shuffle") {
      setIdx(Math.floor(Math.random() * playlist.length));
    } else if (mode === "sequential" && playIdx + 1 < playlist.length) {
      setIdx(playIdx + 1);
    }
  }

  return (
    <>
      <Header />

      {/* render intro text from INTRO_TEXT env var */}
      {introText && (
        <section className="card intro-text" style={{ margin: "1rem" }}>
          <ReactMarkdown>{introText}</ReactMarkdown>
        </section>
      )}

      <main>
        {/* sticky player box */}
        <section className="card player-box">
          {playing ? (
            <>
              <p
                style={{ wordBreak: "break-all", marginBottom: "0.6rem" }}
              >
                {playing}
              </p>

              <label style={{ fontWeight: 600, marginRight: 6 }}>
                Playback mode:
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                style={{ marginBottom: "0.8rem" }}
              >
                <option value="none">No autoplay</option>
                <option value="sequential">Autoplay next</option>
                <option value="shuffle">Shuffle</option>
                <option value="repeatOne">Repeat one</option>
              </select>

              <audio
                ref={audioRef}
                src={`/media/${enc(playing)}`}
                controls
                style={{ width: "100%" }}
                onPlay={ensureAnalyser}
                onEnded={onEnded}
              />

              {/* equaliser - always rendered */}
              <canvas ref={canvasRef} className="eq-canvas" />
            </>
          ) : (
            <p><em>No MP3 files in this folder</em></p>
          )}
        </section>

        {/* library browser */}
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Media library</h2>

          {/* breadcrumbs */}
          {(dir.directories.length > 0 || dir.path) && (
            <div style={{ marginBottom: "1rem" }}>
              <strong>Path:&nbsp;</strong>
              <button className="crumb-btn" onClick={() => load("")}>/</button>
              {crumbs(dir.path).map((c) => (
                <button
                  key={c.path}
                  className="crumb-btn"
                  onClick={() => load(c.path)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {loading && <p>Loading…</p>}
          {err && <p style={{ color: "red" }}>Error: {err}</p>}

          {!loading && !err && (
            <>
              {/* folders */}
              {dir.directories.length > 0 && (
                <>
                  <h3>Folders</h3>
                  <div className="scroll-list">
                    <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
                      {dir.directories.map((d) => (
                        <li key={d}>📁{' '}
                          <button
                            className="crumb-btn"
                            onClick={() => load(dir.path ? `${dir.path}/${d}` : d)}
                          >{d}</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {/* mp3 list */}
              {playlist.length > 0 && (
                <>
                  <div className="scroll-list">
                    <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
                      {playlist.map((rel, i) => {
                        const name = rel.split("/").pop();
                        return (
                          <li key={rel}>🎵{' '}
                            <button className="crumb-btn" onClick={() => startTrack(i)}>{name}</button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </>
              )}

              {dir.directories.length === 0 && playlist.length === 0 && (
                <p><em>Folder is empty.</em></p>
              )}
            </>
          )}
        </section>
      </main>
    </>
  );
}
