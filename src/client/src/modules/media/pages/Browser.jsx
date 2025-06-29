import React, { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import Header from "../../../components/Header.jsx";
import api from "../api.js";

const enc = (p) => p.split("/").map(encodeURIComponent).join("/");
const crumbs = (rel = "") =>
  rel
    .split("/")
    .filter(Boolean)
    .map((n, i) => ({ name: n, path: rel.split("/").slice(0, i + 1).join("/"), }));

const AUDIO_RE = /\.(mp3|m4a)$/i;
const VIDEO_RE = /\.(mp4|webm|og[gv]|mkv|mov)$/i;
const GIF_RE   = /\.gif$/i;

export default function MediaBrowser() {
  // Intro markdown
  const [introText, setIntroText] = useState("");
  // Playback mode state
  const [mode, setMode] = useState("sequential");
  // User interaction flag to enable autoplay
  const [userInit, setUserInit] = useState(false);

  useEffect(() => {
    fetch("/config/intro.md")
      .then((r) => (r.ok ? r.text() : ""))
      .then(setIntroText)
      .catch(() => setIntroText(""));
  }, []);

  // Directory listing state
  const [dir, setDir] = useState({ path: "", directories: [], files: [] });
  // Playlist (playable files)
  const [playlist, setPlaylist] = useState([]);
  const [playIdx, setIdx] = useState(-1);
  const playing = playIdx >= 0 ? playlist[playIdx] : null;

  const isAudio = playing && AUDIO_RE.test(playing);
  const isVideo = playing && VIDEO_RE.test(playing);
  const isGif   = playing && GIF_RE.test(playing);

  // Refs for media elements & analyser
  const audioRef  = useRef(null);
  const videoRef  = useRef(null);
  const gifRef    = useRef(null);
  const canvasRef = useRef(null);
  const audioCtx  = useRef(null);
  const analyser  = useRef(null);
  const rafId     = useRef(null);
  const drawing   = useRef(false);

  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState("");
  const [lightbox, setLightbox] = useState(false);

  // Load directory from API
  const load = (p = "") => {
    setLoading(true);
    api.list(p)
      .then((d) => { setDir(d); setLoading(false); })
      .catch((e) => { setErr(e.message); setLoading(false); });
  };
  useEffect(() => load(""), []);

  // Build playlist whenever dir changes
  useEffect(() => {
    const list = dir.files
      .filter((f) => AUDIO_RE.test(f) || VIDEO_RE.test(f) || GIF_RE.test(f))
      .map((f) => (dir.path ? `${dir.path}/${f}` : f));
    setPlaylist(list);
    setIdx(list.length ? 0 : -1);
    setUserInit(false);
  }, [dir]);

  // Handle autoplay after track change
  useEffect(() => {
    if (!userInit || !playing) return;
    const ref = isAudio ? audioRef.current : videoRef.current;
    ref?.play().catch(() => {});
  }, [playIdx, userInit, playing]);

  // Start a track on user click
  function startTrack(i) {
    audioRef.current?.pause();
    videoRef.current?.pause();
    setIdx(i);
    setUserInit(true);
    setTimeout(() => {
      if (AUDIO_RE.test(playlist[i])) {
        audioRef.current?.play().catch(() => {});
      } else if (VIDEO_RE.test(playlist[i])) {
        videoRef.current?.play().catch(() => {});
      }
    }, 0);
  }

  useEffect(() => {
    if (!userInit || !playing) return;
    const ref = isAudio ? audioRef.current : videoRef.current;
    if (isAudio || isVideo) ref?.play().catch(() => {});
  }, [playIdx, userInit, playing]);

  // Fullscreen handler for GIF
  function handleGifClick() {
    if (gifRef.current && document.fullscreenEnabled) {
      gifRef.current.requestFullscreen().catch(() => {});
    }
  }

  // Equaliser & analyser logic
  function startEq() {
    if (!isAudio || drawing.current || !analyser.current) return;
    drawing.current = true;
    drawEq();
  }
  function stopEq() {
    if (!drawing.current) return;
    cancelAnimationFrame(rafId.current);
    drawing.current = false;
  }

  function ensureAnalyser() {
    if (!isAudio) return;
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
      const src = audioCtx.current.createMediaElementSource(audioRef.current);
      analyser.current = audioCtx.current.createAnalyser();
      analyser.current.fftSize = 256;
      src.connect(analyser.current).connect(audioCtx.current.destination);
    }
    startEq();
    if (audioCtx.current.state === "suspended") audioCtx.current.resume();
  }

  function drawEq() {
    const canvas = canvasRef.current;
    if (!canvas || !analyser.current) return;
    const dpr  = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    if (canvas.width !== cssW * dpr || canvas.height !== cssH * dpr) {
      canvas.width  = cssW * dpr;
      canvas.height = cssH * dpr;
    }
    const ctx    = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    const buffer = new Uint8Array(analyser.current.frequencyBinCount);
    const barW   = cssW / buffer.length;
    const render = () => {
      analyser.current.getByteFrequencyData(buffer);
      ctx.clearRect(0, 0, cssW, cssH);
      buffer.forEach((v, i) => {
        const h = (v / 255) * cssH;
        ctx.fillStyle = "#3b82f6";
        ctx.fillRect(i * barW, cssH - h, barW - 1, h);
      });
      rafId.current = requestAnimationFrame(render);
    };
    render();
  }

  useEffect(() => {
    const handleVis = () => {
      if (document.visibilityState === "visible") {
        audioCtx.current?.resume();
        startEq();
      } else {
        stopEq();
      }
    };
    document.addEventListener("visibilitychange", handleVis);
    window.addEventListener("focus", handleVis);
    return () => {
      document.removeEventListener("visibilitychange", handleVis);
      window.removeEventListener("focus", handleVis);
    };
  }, []);
  useEffect(() => () => stopEq(), []);
  // Handle track end
  function onEnded() {
    if (mode === "repeatOne") {
      if (isAudio) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      } else if (isVideo) {
        videoRef.current.currentTime = 0;
        videoRef.current.play();
      }
      return;
    }
    if (!playlist.length || mode === "none") return;
    if (mode === "shuffle") {
      setIdx(Math.floor(Math.random() * playlist.length));
    } else if (mode === "sequential" && playIdx + 1 < playlist.length) {
      setIdx(playIdx + 1);
    }
  }

  return (
    <>
      <Header />

      {introText && (
        <section className="card intro-text" style={{ margin: "1rem" }}>
          <ReactMarkdown>{introText}</ReactMarkdown>
        </section>
      )}

      <main>
        <section className="card player-box">
          {playing ? (
            <>
              <p style={{ wordBreak: "break-all", marginBottom: "0.6rem" }}>{playing}</p>

              {/* Playback mode */}
              {playlist.length > 1 && (
                <>
                  <label style={{ fontWeight: 600, marginRight: 6 }}>Playback mode:</label>
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
                </>
              )}

              {/* Audio */}
              {isAudio && (
                <audio ref={audioRef} src={`/media/${enc(playing)}`} controls style={{ width: "100%" }} onPlay={ensureAnalyser} onEnded={onEnded} />
              )}

              {/* Video */}
              {isVideo && (
                <video ref={videoRef} src={`/media/${enc(playing)}`} controls style={{ maxWidth: "100%", maxHeight: "60vh" }} onEnded={onEnded} />
              )}

              {/* GIF fullscreen */}
              {isGif && (
                <img
                  src={`/media/${enc(playing)}`}
                  alt={playing}
                  style={{ cursor: "pointer", maxWidth: "100%", maxHeight: "60vh", width: "auto", height: "auto" }}
                  onClick={() => setLightbox(true)}
                />
              )}

              {lightbox && (
                <div
                  onClick={() => setLightbox(false)}
                  style={{
                    position: "fixed",
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: "rgba(0,0,0,0.9)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000,
                  }}
                >
                  <img
                    src={`/media/${enc(playing)}`}
                    style={{ maxWidth: "100%", maxHeight: "100%" }}
                  />
                </div>
              )}


              {/* Equaliser */}
              {isAudio && <canvas ref={canvasRef} className="eq-canvas" />}               
            </>
          ) : (
            <p><em>No playable media files in this folder</em></p>
          )}
        </section>

        {/* Library */}
        {playlist.length > 1 && (
          <section className="card" style={{ maxWidth: 900 }}>
            <h2 style={{ marginTop: 0 }}>Media library</h2>

            {/* Breadcrumbs */}
            {(dir.path || dir.directories.length > 0) && (
              <div style={{ marginBottom: "1rem" }}>
                <strong>Path:&nbsp;</strong>
                <button className="crumb-btn" onClick={() => load("/")}>/
                </button>
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

            {/* Loading & error */}
            {loading && <p>Loading…</p>}
            {err && <p style={{ color: "red" }}>{err}</p>}

            {/* Folders */}
            {!loading && !err && dir.directories.length > 0 && (
              <>
                <h3>Folders</h3>
                <div className="scroll-list">
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {dir.directories.map((d) => (
                      <li key={d}>
                        📁{' '}
                        <button
                          className="crumb-btn"
                          onClick={() =>
                            load(dir.path ? `${dir.path}/${d}` : d)
                          }
                        >
                          {d}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {/* File list */}
            {!loading && !err && (
              <div className="scroll-list">
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {playlist.map((rel, i) => (
                    <li key={rel}>
                      {AUDIO_RE.test(rel)
                        ? '🎵'
                        : GIF_RE.test(rel)
                        ? '🖼️'
                        : '🎬'}{' '}
                      <button
                        className="crumb-btn"
                        onClick={() => startTrack(i)}
                      >
                        {rel.split("/").pop()}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Empty folder */}
            {!loading && !err && dir.directories.length === 0 && playlist.length === 0 && (
              <p><em>Folder is empty.</em></p>
            )}
          </section>
        )}
      </main>
    </>
  );
}
