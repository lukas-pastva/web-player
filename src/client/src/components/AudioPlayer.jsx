import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  IconPlay, IconPause, IconSkipForward, IconSkipBack,
  IconVolume, IconVolumeMute,
} from "./icons.jsx";

function formatTime(s) {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function AudioPlayer({
  audioRef, src, onPlay, onEnded,
  onPrev, onNext, hasPrev, hasNext,
}) {
  const [paused, setPaused] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const rafRef = useRef(null);
  const seekBarRef = useRef(null);
  const volBarRef = useRef(null);

  const tick = useCallback(() => {
    const el = audioRef.current;
    if (el) {
      setCurrentTime(el.currentTime);
      setDuration(el.duration || 0);
      setPaused(el.paused);
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [audioRef]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tick]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onPl = () => setPaused(false);
    const onPa = () => setPaused(true);
    el.addEventListener("play", onPl);
    el.addEventListener("pause", onPa);
    return () => {
      el.removeEventListener("play", onPl);
      el.removeEventListener("pause", onPa);
    };
  }, [audioRef]);

  function togglePlay() {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().catch(() => {});
      if (onPlay) onPlay();
    } else {
      el.pause();
    }
  }

  function seek(e) {
    const bar = seekBarRef.current;
    const el = audioRef.current;
    if (!bar || !el || !isFinite(el.duration)) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    el.currentTime = ratio * el.duration;
  }

  function changeVolume(e) {
    const bar = volBarRef.current;
    const el = audioRef.current;
    if (!bar || !el) return;
    const rect = bar.getBoundingClientRect();
    const v = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    el.volume = v;
    setVolume(v);
    if (v > 0 && muted) { el.muted = false; setMuted(false); }
  }

  function toggleMute() {
    const el = audioRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setMuted(el.muted);
  }

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="audio-player">
      <audio
        ref={audioRef}
        src={src}
        onEnded={onEnded}
        preload="metadata"
        style={{ display: "none" }}
      />

      {/* Seek bar */}
      <div className="audio-seek-row">
        <span className="audio-time">{formatTime(currentTime)}</span>
        <div className="audio-seek-bar" ref={seekBarRef} onClick={seek}>
          <div className="audio-seek-fill" style={{ width: `${pct}%` }}>
            <div className="audio-seek-thumb" />
          </div>
        </div>
        <span className="audio-time">{formatTime(duration)}</span>
      </div>

      {/* Transport */}
      <div className="audio-transport">
        <button
          className="transport-btn"
          onClick={onPrev}
          disabled={!hasPrev}
          title="Previous"
        >
          <IconSkipBack size={18} />
        </button>

        <button className="transport-btn-play" onClick={togglePlay} title={paused ? "Play" : "Pause"}>
          {paused ? <IconPlay size={22} /> : <IconPause size={22} />}
        </button>

        <button
          className="transport-btn"
          onClick={onNext}
          disabled={!hasNext}
          title="Next"
        >
          <IconSkipForward size={18} />
        </button>
      </div>

      {/* Volume */}
      <div className="audio-volume-row">
        <button className="volume-btn" onClick={toggleMute} title={muted ? "Unmute" : "Mute"}>
          {muted || volume === 0 ? <IconVolumeMute size={16} /> : <IconVolume size={16} />}
        </button>
        <div className="audio-volume-bar" ref={volBarRef} onClick={changeVolume}>
          <div className="audio-volume-fill" style={{ width: `${(muted ? 0 : volume) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
