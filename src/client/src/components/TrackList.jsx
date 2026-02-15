import React from "react";

const AUDIO_RE = /\.(mp3|m4a)$/i;
const VIDEO_RE = /\.(mp4|webm|og[gv]|mkv|mov)$/i;
const GIF_RE   = /\.gif$/i;

function getBadge(filename) {
  if (AUDIO_RE.test(filename)) return { label: "audio", cls: "track-badge-audio" };
  if (VIDEO_RE.test(filename)) return { label: "video", cls: "track-badge-video" };
  if (GIF_RE.test(filename))   return { label: "gif",   cls: "track-badge-gif" };
  return null;
}

function NowPlayingBars() {
  return (
    <div className="now-playing-bars">
      <span /><span /><span />
    </div>
  );
}

export default function TrackList({ playlist, playIdx, onSelect }) {
  return (
    <ul className="track-list">
      {playlist.map((rel, i) => {
        const active = i === playIdx;
        const badge = getBadge(rel);
        const delay = Math.min(i * 40, 800);
        return (
          <li key={rel}>
            <button
              className={`track-item${active ? " track-active" : ""}`}
              onClick={() => onSelect(i)}
              style={{ animationDelay: `${delay}ms` }}
            >
              <span className="track-number">
                {active ? <NowPlayingBars /> : String(i + 1).padStart(2, "0")}
              </span>
              <span className="track-name">{rel.split("/").pop()}</span>
              {badge && (
                <span className={`track-badge ${badge.cls}`}>{badge.label}</span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
