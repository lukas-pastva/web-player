import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

/* Only the Media browser remains */
const MediaBrowser = lazy(() => import("./modules/media/pages/Browser.jsx"));

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<p style={{ padding: 20 }}>Loading…</p>}>
        <Routes>
          <Route path="/"      element={<Navigate to="/media" />} />
          <Route path="/media" element={<MediaBrowser />} />

          {/* catch-all: back to the library */}
          <Route path="*" element={<Navigate to="/media" />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
