import React from "react";

const I = ({ size = 20, className = "", children, vb = "0 0 24 24" }) => (
  <svg
    width={size}
    height={size}
    viewBox={vb}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ display: "inline-block", verticalAlign: "middle" }}
  >
    {children}
  </svg>
);

export function IconPlay({ size, className }) {
  return (
    <I size={size} className={className}>
      <polygon points="6 3 20 12 6 21 6 3" fill="currentColor" stroke="none" />
    </I>
  );
}

export function IconPause({ size, className }) {
  return (
    <I size={size} className={className}>
      <rect x="6" y="4" width="4" height="16" fill="currentColor" stroke="none" />
      <rect x="14" y="4" width="4" height="16" fill="currentColor" stroke="none" />
    </I>
  );
}

export function IconSkipForward({ size, className }) {
  return (
    <I size={size} className={className}>
      <polygon points="5 4 15 12 5 20 5 4" />
      <line x1="19" y1="5" x2="19" y2="19" />
    </I>
  );
}

export function IconSkipBack({ size, className }) {
  return (
    <I size={size} className={className}>
      <polygon points="19 20 9 12 19 4 19 20" />
      <line x1="5" y1="19" x2="5" y2="5" />
    </I>
  );
}

export function IconShuffle({ size, className }) {
  return (
    <I size={size} className={className}>
      <polyline points="16 3 21 3 21 8" />
      <line x1="4" y1="20" x2="21" y2="3" />
      <polyline points="21 16 21 21 16 21" />
      <line x1="15" y1="15" x2="21" y2="21" />
      <line x1="4" y1="4" x2="9" y2="9" />
    </I>
  );
}

export function IconRepeat({ size, className }) {
  return (
    <I size={size} className={className}>
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </I>
  );
}

export function IconRepeatOne({ size, className }) {
  return (
    <I size={size} className={className}>
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
      <text
        x="12" y="14"
        textAnchor="middle"
        fill="currentColor"
        stroke="none"
        fontSize="8"
        fontWeight="700"
        fontFamily="Inter, sans-serif"
      >
        1
      </text>
    </I>
  );
}

export function IconVolume({ size, className }) {
  return (
    <I size={size} className={className}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </I>
  );
}

export function IconVolumeMute({ size, className }) {
  return (
    <I size={size} className={className}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </I>
  );
}

export function IconFolder({ size, className }) {
  return (
    <I size={size} className={className}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </I>
  );
}

export function IconMusic({ size, className }) {
  return (
    <I size={size} className={className}>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </I>
  );
}

export function IconFilm({ size, className }) {
  return (
    <I size={size} className={className}>
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="2" y1="7" x2="7" y2="7" />
      <line x1="2" y1="17" x2="7" y2="17" />
      <line x1="17" y1="17" x2="22" y2="17" />
      <line x1="17" y1="7" x2="22" y2="7" />
    </I>
  );
}

export function IconImage({ size, className }) {
  return (
    <I size={size} className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </I>
  );
}

export function IconChevronRight({ size, className }) {
  return (
    <I size={size} className={className}>
      <polyline points="9 18 15 12 9 6" />
    </I>
  );
}

export function IconX({ size, className }) {
  return (
    <I size={size} className={className}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </I>
  );
}

export function IconStop({ size, className }) {
  return (
    <I size={size} className={className}>
      <rect x="6" y="6" width="12" height="12" fill="currentColor" stroke="none" rx="1" />
    </I>
  );
}
