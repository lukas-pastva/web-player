import React from "react";

export function SkeletonTracks({ count = 5 }) {
  return (
    <div>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton skeleton-track" />
      ))}
    </div>
  );
}

export function SkeletonFolders({ count = 4 }) {
  return (
    <div className="folder-grid">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton skeleton-folder" />
      ))}
    </div>
  );
}
