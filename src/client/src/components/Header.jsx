import React from "react";

export default function Header() {
  const domain = (window.location.hostname || "Web-Player").replace(/^www\./, "");

  return (
    <header className="mod-header">
      <h1>{domain}</h1>
    </header>
  );
}
