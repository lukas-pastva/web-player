import React, { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import Header from "../../../components/Header.jsx";
import AudioPlayer from "../../../components/AudioPlayer.jsx";
import PlaybackModeBar from "../../../components/PlaybackModeBar.jsx";
import TrackList from "../../../components/TrackList.jsx";
import FolderGrid from "../../../components/FolderGrid.jsx";
import Lightbox from "../../../components/Lightbox.jsx";
import { SkeletonTracks, SkeletonFolders } from "../../../components/SkeletonLoader.jsx";
import { IconChevronRight } from "../../../components/icons.jsx";
import api from "../api.js";

const enc = (p) => p.split("/").map(encodeURIComponent).join("/");
const crumbs = (rel = "") =>
  rel
    .split("/")
    .filter(Boolean)
    .map((n, i) => ({ name: n, path: rel.split("/").slice(0, i + 1).join("/") }));

const AUDIO_RE = /\.(mp3|m4a)$/i;
const VIDEO_RE = /\.(mp4|webm|og[gv]|mkv|mov)$/i;
const GIF_RE   = /\.gif$/i;

export default function MediaBrowser() {
  const [introText, setIntroText] = useState("");
  const [mode, setMode] = useState("sequential");
  const [userInit, setUserInit] = useState(false);

  useEffect(() => {
    fetch("/config/intro.md")
      .then((r) => (r.ok ? r.text() : ""))
      .then(setIntroText)
      .catch(() => setIntroText(""));
  }, []);

  const [dir, setDir] = useState({ path: "", directories: [], files: [] });
  const [playlist, setPlaylist] = useState([]);
  const [playIdx, setIdx] = useState(-1);
  const playing = playIdx >= 0 ? playlist[playIdx] : null;

  const isAudio = playing && AUDIO_RE.test(playing);
  const isVideo = playing && VIDEO_RE.test(playing);
  const isGif   = playing && GIF_RE.test(playing);

  const audioRef  = useRef(null);
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const audioCtx  = useRef(null);
  const analyser  = useRef(null);
  const rafId     = useRef(null);
  const drawing   = useRef(false);

  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState("");
  const [lightbox, setLightbox] = useState(false);

  const load = (p = "") => {
    setLoading(true);
    api.list(p)
      .then((d) => { setDir(d); setLoading(false); })
      .catch((e) => { setErr(e.message); setLoading(false); });
  };
  useEffect(() => load(""), []);

  useEffect(() => {
    const list = dir.files
      .filter((f) => AUDIO_RE.test(f) || VIDEO_RE.test(f) || GIF_RE.test(f))
      .map((f) => (dir.path ? `${dir.path}/${f}` : f));
    setPlaylist(list);
    setIdx(list.length ? 0 : -1);
    setUserInit(false);
  }, [dir]);

  useEffect(() => {
    if (!userInit || !playing) return;
    if (isAudio) audioRef.current?.play().catch(() => {});
    else if (isVideo) videoRef.current?.play().catch(() => {});
  }, [playIdx, userInit, playing]);

  function startTrack(i) {
    audioRef.current?.pause();
    videoRef.current?.pause();
    setIdx(i);
    setUserInit(true);
    setTimeout(() => {
      if (AUDIO_RE.test(playlist[i])) audioRef.current?.play().catch(() => {});
      else if (VIDEO_RE.test(playlist[i])) videoRef.current?.play().catch(() => {});
    }, 0);
  }

  /* ── Equaliser ── */
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
    const buffer = new Uint8Array(analyser.current.frequencyBinCount);
    const maxBars = 64;
    const gap = 2;

    const render = () => {
      analyser.current.getByteFrequencyData(buffer);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);

      const step = Math.max(1, Math.floor(buffer.length / maxBars));
      const barCount = Math.min(maxBars, Math.floor(buffer.length / step));
      const barW = (cssW - (barCount - 1) * gap) / barCount;
      const halfH = cssH * 0.7;

      const grad = ctx.createLinearGradient(0, cssH, 0, 0);
      grad.addColorStop(0, getComputedStyle(document.documentElement).getPropertyValue("--accent-1").trim() || "#6366f1");
      grad.addColorStop(0.5, getComputedStyle(document.documentElement).getPropertyValue("--accent-2").trim() || "#8b5cf6");
      grad.addColorStop(1, getComputedStyle(document.documentElement).getPropertyValue("--accent-3").trim() || "#a855f7");

      ctx.shadowColor = "rgba(139, 92, 246, 0.4)";
      ctx.shadowBlur = 8;

      for (let i = 0; i < barCount; i++) {
        const v = buffer[i * step] / 255;
        const h = v * halfH;
        const x = i * (barW + gap);
        const y = halfH - h;

        ctx.fillStyle = grad;
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(x, y, barW, h, [3, 3, 0, 0]);
          ctx.fill();
        } else {
          ctx.fillRect(x, y, barW, h);
        }
      }

      // Reflection
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 0.15;
      for (let i = 0; i < barCount; i++) {
        const v = buffer[i * step] / 255;
        const h = v * halfH;
        const x = i * (barW + gap);

        ctx.fillStyle = grad;
        ctx.fillRect(x, halfH + 2, barW, h * 0.4);
      }
      ctx.globalAlpha = 1;

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

  function onEnded() {
    if (mode === "repeatOne") {
      if (isAudio) { audioRef.current.currentTime = 0; audioRef.current.play(); }
      else if (isVideo) { videoRef.current.currentTime = 0; videoRef.current.play(); }
      return;
    }
    if (!playlist.length || mode === "none") return;
    if (mode === "shuffle") {
      setIdx(Math.floor(Math.random() * playlist.length));
    } else if (mode === "sequential" && playIdx + 1 < playlist.length) {
      setIdx(playIdx + 1);
    }
  }

  const breadcrumbItems = crumbs(dir.path);

  return (
    <>
      <Header />

      {introText && (
        <section className="card intro-text">
          <ReactMarkdown>{introText}</ReactMarkdown>
        </section>
      )}

      <main>
        {/* Player */}
        <section className="card player-box">
          {playing ? (
            <>
              <p className="player-filename">{playing.split("/").pop()}</p>

              {playlist.length > 1 && (
                <PlaybackModeBar mode={mode} onModeChange={setMode} />
              )}

              {isAudio && (
                <AudioPlayer
                  audioRef={audioRef}
                  src={`/media/${enc(playing)}`}
                  onPlay={ensureAnalyser}
                  onEnded={onEnded}
                  onPrev={playIdx > 0 ? () => startTrack(playIdx - 1) : undefined}
                  onNext={playIdx < playlist.length - 1 ? () => startTrack(playIdx + 1) : undefined}
                  hasPrev={playIdx > 0}
                  hasNext={playIdx < playlist.length - 1}
                />
              )}

              {isVideo && (
                <video
                  ref={videoRef}
                  src={`/media/${enc(playing)}`}
                  controls
                  className="video-player"
                  onEnded={onEnded}
                />
              )}

              {isGif && (
                <img
                  src={`/media/${enc(playing)}`}
                  alt={playing}
                  className="gif-player"
                  onClick={() => setLightbox(true)}
                />
              )}

              {lightbox && isGif && (
                <Lightbox
                  src={`/media/${enc(playing)}`}
                  alt={playing}
                  onClose={() => setLightbox(false)}
                />
              )}

              {isAudio && <canvas ref={canvasRef} className="eq-canvas" />}
            </>
          ) : (
            <p className="empty-state">No playable media files in this folder</p>
          )}
        </section>

        {/* Library */}
        {(playlist.length > 1 || dir.directories.length > 0) && (
          <section className="card" style={{ maxWidth: 900 }}>
            <h2 className="section-title">Media library</h2>

            {/* Breadcrumbs */}
            {(dir.path || dir.directories.length > 0) && (
              <nav className="breadcrumb-bar">
                <button className="crumb-btn" onClick={() => load("/")}>/</button>
                {breadcrumbItems.map((c, i) => (
                  <React.Fragment key={c.path}>
                    <span className="crumb-separator">
                      <IconChevronRight size={14} />
                    </span>
                    <button
                      className={`crumb-btn${i === breadcrumbItems.length - 1 ? " crumb-current" : ""}`}
                      onClick={() => load(c.path)}
                    >
                      {c.name}
                    </button>
                  </React.Fragment>
                ))}
              </nav>
            )}

            {/* Loading */}
            {loading && (
              <>
                <SkeletonFolders count={4} />
                <SkeletonTracks count={5} />
              </>
            )}

            {err && <p style={{ color: "#ef4444" }}>{err}</p>}

            {/* Folders */}
            {!loading && !err && dir.directories.length > 0 && (
              <FolderGrid
                directories={dir.directories}
                onNavigate={(d) => load(dir.path ? `${dir.path}/${d}` : d)}
              />
            )}

            {/* Tracks */}
            {!loading && !err && playlist.length > 0 && (
              <div className="scroll-list">
                <TrackList
                  playlist={playlist}
                  playIdx={playIdx}
                  onSelect={startTrack}
                />
              </div>
            )}

            {/* Empty */}
            {!loading && !err && dir.directories.length === 0 && playlist.length === 0 && (
              <p className="empty-state">Folder is empty.</p>
            )}
          </section>
        )}
      </main>
    </>
  );
}
