/* src/client/src/modules/media/pages/Browser.jsx
 * ───────────────────────────────────────────────────────────
 * Media browser + player
 *   • supports audio (.mp3, .m4a) and video (.mp4, .webm, .ogg, .mkv, **.mov**)
 *   • Media-Session keeps audio alive on lock-screen
 *   • Equaliser draws while an **audio** track plays and page is visible
 *   • INTRO_TEXT banner injected by the server
 * ─────────────────────────────────────────────────────────── */

import React, { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import Header from "../../../components/Header.jsx";
import api from "../api.js";

/* helpers -------------------------------------------------- */
const enc = (p) => p.split("/").map(encodeURIComponent).join("/");
const crumbs = (rel = "") =>
  rel
    .split("/")
    .filter(Boolean)
    .map((n, i) => ({
      name: n,
      path: rel.split("/").slice(0, i + 1).join("/"),
    }));

/* recognised extensions */
const AUDIO_RE = /\.(mp3|m4a)$/i;
const VIDEO_RE = /\.(mp4|webm|og[gv]|mkv|mov)$/i;

export default function MediaBrowser() {
  /* 🛈 intro text (server-side injection or build-time env) */
  const introText =
    window.ENV_INTRO_TEXT ?? import.meta.env.VITE_INTRO_TEXT ?? "";

  /* directory & playlist ----------------------------------- */
  const [dir, setDir]   = useState({ path: "", directories: [], files: [] });
  const [playlist, set] = useState([]);

  /* player state ------------------------------------------- */
  const [playIdx,  setIdx]  = useState(-1);
  const [userInit, setUI ]  = useState(false);
  const [mode,     setMode] = useState("sequential"); // none|sequential|shuffle|repeatOne
  const playing = playIdx >= 0 ? playlist[playIdx] : null;

  const isAudio = playing && AUDIO_RE.test(playing);
  const isVideo = playing && VIDEO_RE.test(playing);

  /* refs ---------------------------------------------------- */
  const audioRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const audioCtx  = useRef(null);
  const analyser  = useRef(null);
  const rafId     = useRef(null);
  const drawing   = useRef(false); // loop running?

  /* UI flags */
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState("");

  /* ───────────────────── load directory */
  const load = (p = "") => {
    setLoading(true);
    api
      .list(p)
      .then((d) => {
        setDir(d);
        setLoading(false);
      })
      .catch((e) => {
        setErr(e.message);
        setLoading(false);
      });
  };
  useEffect(() => load(""), []);

  /* rebuild playlist whenever dir changes */
  useEffect(() => {
    const list = dir.files
      .filter((f) => AUDIO_RE.test(f) || VIDEO_RE.test(f))
      .map((f) => (dir.path ? `${dir.path}/${f}` : f));

    set(list);
    setIdx(list.length ? 0 : -1);
    setUI(false);
  }, [dir]);

  /* user clicks a track */
  function startTrack(i) {
    /* stop any current media first */
    audioRef.current?.pause();
    videoRef.current?.pause();

    setIdx(i);
    setUI(true);

    /* play immediately (still inside gesture) */
    setTimeout(() => {
      if (AUDIO_RE.test(playlist[i])) {
        audioRef.current?.play().catch(() => {});
      } else {
        videoRef.current?.play().catch(() => {});
      }
    }, 0);
  }

  /* continue autoplay after track switches */
  useEffect(() => {
    if (!userInit || !playing) return;
    const ref = isAudio ? audioRef.current : videoRef.current;
    ref?.play().catch(() => {});
  }, [playIdx, userInit, playing]);

  /* ───────────────────── equaliser infra (audio only) */
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
    if (!isAudio) return; // video ⇒ no analyser
    if (!audioCtx.current) {
      audioCtx.current =
        new (window.AudioContext || window.webkitAudioContext)();
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

  /* pause / resume on visibility --------------------------------- */
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

  /* cleanup on unmount */
  useEffect(() => () => stopEq(), []);

  /* handle track end */
  function onEnded() {
    if (mode === "repeatOne") {
      const ref = isAudio ? audioRef.current : videoRef.current;
      ref.currentTime = 0;
      ref.play();
      return;
    }
    if (!playlist.length || mode === "none") return;

    if (mode === "shuffle") {
      setIdx(Math.floor(Math.random() * playlist.length));
    } else if (mode === "sequential" && playIdx + 1 < playlist.length) {
      setIdx(playIdx + 1);
    }
  }

  /* ───────────────────── render */
  return (
    <>
      <Header />

      {introText && (
        <section className="card intro-text" style={{ margin: "1rem" }}>
          <ReactMarkdown>{introText}</ReactMarkdown>
        </section>
      )}

      <main>
        {/* sticky player */}
        <section className="card player-box">
          {playing ? (
            <>
              <p style={{ wordBreak: "break-all", marginBottom: "0.6rem" }}>
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

              {isAudio && (
                <audio
                  ref={audioRef}
                  src={`/media/${enc(playing)}`}
                  controls
                  style={{ width: "100%" }}
                  onPlay={ensureAnalyser}
                  onEnded={onEnded}
                />
              )}

              {isVideo && (
                <video
                  ref={videoRef}
                  src={`/media/${enc(playing)}`}
                  controls
                  style={{ width: "100%", maxHeight: "60vh" }}
                  onEnded={onEnded}
                />
              )}

              {/* equaliser only for audio */}
              {isAudio && <canvas ref={canvasRef} className="eq-canvas" />}
            </>
          ) : (
            <p>
              <em>No playable media files in this folder</em>
            </p>
          )}
        </section>

        {/* browser */}
        <section className="card" style={{ maxWidth: 900 }}>
          <h2 style={{ marginTop: 0 }}>Media library</h2>

          {/* ─── Breadcrumbs — hidden when at root and no sub-folders ─── */}
          {(dir.path || dir.directories.length > 0) && (
            <div style={{ marginBottom: "1rem" }}>
              <strong>Path:&nbsp;</strong>
              <button className="crumb-btn" onClick={() => load("/")}>
                /
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

          {loading && <p>Loading…</p>}
          {err      && <p style={{ color: "red" }}>{err}</p>}

          {!loading && !err && (
            <>
              {dir.directories.length > 0 && (
                <>
                  <h3>Folders</h3>
                  <div className="scroll-list">
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                      {dir.directories.map((d) => (
                        <li key={d}>
                          📁{" "}
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

              {playlist.length > 0 && (
                <>
                  <div className="scroll-list">
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                      {playlist.map((rel, i) => (
                        <li key={rel}>
                          {AUDIO_RE.test(rel) ? "🎵" : "🎬"}{" "}
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
                </>
              )}

              {dir.directories.length === 0 && playlist.length === 0 && (
                <p>
                  <em>Folder is empty.</em>
                </p>
              )}
            </>
          )}
        </section>
      </main>
    </>
  );
}