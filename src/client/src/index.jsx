/* Global styles first */
import "./styles.css";

import React          from "react";
import { createRoot } from "react-dom/client";
import AppRoutes      from "./routes.jsx";

/* ---------------------------------------------------------------
 * STYLE  (accent palette) → ENV_STYLE  or  VITE_STYLE
 * TONE   (colour-scheme)  → ENV_TONE   or  VITE_TONE
 * ------------------------------------------------------------- */
const STYLE = window.ENV_STYLE ?? import.meta.env.VITE_STYLE ?? "boy";   // blue = default
const TONE  = window.ENV_TONE  ?? import.meta.env.VITE_TONE  ?? "light"; // light = default

document.documentElement.setAttribute("data-theme", STYLE);
document.documentElement.setAttribute("data-mode",  TONE);

/* Mount the SPA */
createRoot(document.getElementById("root")).render(<AppRoutes />);
