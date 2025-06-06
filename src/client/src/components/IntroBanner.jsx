import React, { useEffect, useState } from "react";
import { marked } from "marked";

/* Fetches /api/intro once and renders it as HTML */
export default function IntroBanner() {
  const [html, setHtml] = useState("");

  useEffect(() => {
    fetch("/api/intro")
      .then((r) => (r.ok ? r.text() : ""))
      .then((md) => setHtml(marked.parse(md)))
      .catch(() => {});
  }, []);

  if (!html) return null;

  return (
    <div
      className="intro-banner"
      /* eslint-disable react/no-danger */
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
