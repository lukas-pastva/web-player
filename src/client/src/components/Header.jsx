import React from "react";

export default function Header() {
  const p      = window.location.pathname;
  const domain = (window.location.hostname || "Web-Player").replace(/^www\./, "");

  return (
    <header className="mod-header">
      <h1>{domain}</h1>

      <nav className="nav-center">
        <a href="/media" className={p.startsWith("/media") ? "active" : ""}>
          Library
        </a>
      </nav>
    </header>
  );
}
