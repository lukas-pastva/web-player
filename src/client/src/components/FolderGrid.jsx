import React from "react";
import { IconFolder } from "./icons.jsx";

export default function FolderGrid({ directories, onNavigate }) {
  return (
    <div className="folder-grid">
      {directories.map((d, i) => (
        <button
          key={d}
          className="folder-card"
          onClick={() => onNavigate(d)}
          style={{ animationDelay: `${Math.min(i * 60, 600)}ms` }}
        >
          <div className="folder-icon-circle">
            <IconFolder size={22} />
          </div>
          <span className="folder-card-name" title={d}>{d}</span>
        </button>
      ))}
    </div>
  );
}
