/* ──────────────────────────────────────────────────────────
 * Express server – ES-module version
 *  • loads .env (dotenv)
 *  • can still import CommonJS route modules via createRequire
 *  • serves INTRO_MD banner and the /media tree
 * ────────────────────────────────────────────────────────── */

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import dotenv from "dotenv";

/* enable .env support */
dotenv.config();

/* CommonJS routes need require(), so create one */
const require = createRequire(import.meta.url);
const configRoutes = require("./modules/config/routes.js");
const mediaRoutes  = require("./modules/media/routes.js");

/* __dirname helper in ESM */
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app  = express();
const PORT = process.env.PORT || 8080;

/* JSON body parsing for /api/config */
app.use(express.json());

/* ─────────────── API routes */
app.use("/api/config", configRoutes);
app.use("/api/media" , mediaRoutes);

/* ─────────────── introduction banner (Markdown text) */
const INTRO_MD = process.env.INTRO_MD || "";
app.get("/api/intro", (_req, res) => {
  res.type("text/markdown").send(INTRO_MD);
});

/* ─────────────── static files */
const MEDIA_ROOT = process.env.MEDIA_ROOT
  ? path.resolve(process.env.MEDIA_ROOT)
  : path.resolve(__dirname, "../../media");

app.use("/media", express.static(MEDIA_ROOT));
app.use(express.static(path.resolve(__dirname, "../public")));

/* SPA fallback */
app.get("*", (_req, res) =>
  res.sendFile(path.resolve(__dirname, "../public/index.html")),
);

app.listen(PORT, () =>
  console.log(`Web-Player listening on http://localhost:${PORT}`),
);
