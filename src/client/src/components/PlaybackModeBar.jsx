import React from "react";
import { IconSkipForward, IconShuffle, IconRepeatOne, IconStop } from "./icons.jsx";

const MODES = [
  { value: "sequential", icon: IconSkipForward, title: "Autoplay next" },
  { value: "shuffle",    icon: IconShuffle,     title: "Shuffle" },
  { value: "repeatOne",  icon: IconRepeatOne,   title: "Repeat one" },
  { value: "none",       icon: IconStop,        title: "No autoplay" },
];

export default function PlaybackModeBar({ mode, onModeChange }) {
  return (
    <div className="playback-mode-bar">
      {MODES.map((m) => {
        const Icon = m.icon;
        return (
          <button
            key={m.value}
            className={`mode-btn${mode === m.value ? " mode-active" : ""}`}
            onClick={() => onModeChange(m.value)}
            title={m.title}
          >
            <Icon size={16} />
          </button>
        );
      })}
    </div>
  );
}
