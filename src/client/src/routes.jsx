import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

const MediaBrowser = lazy(() => import("./modules/media/pages/Browser.jsx"));
const HelpPage     = lazy(() => import("./modules/help/Help.jsx"));
const ConfigPage   = lazy(() => import("./modules/config/Config.jsx"));

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<p style={{ padding:20 }}>Loading…</p>}>
        <Routes>
          <Route path="/"      element={<Navigate to="/media" />} />
          <Route path="/media" element={<MediaBrowser />} />

          {/* still useful for theme etc. */}
          <Route path="/config" element={<ConfigPage />} />
          <Route path="/help"   element={<HelpPage />} />

          {/* any old bookmarked baby routes redirect home */}
          <Route path="*" element={<Navigate to="/media" />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
