/* src/server/src/index.js
 * ─────────────────────────────────────────────────────────────
 * Express server
 *   – /api/media  → folder JSON
 *   – /media/**   → raw audio files
 *   – /assets/**  → Vite-generated JS/CSS/img
 *   – *           → index.html with INTRO_TEXT injected
 * ──────────────────────────────────────────────────────────── */
import express  from "express";
import cors     from "cors";
import path     from "path";
import fs       from "fs";
import { fileURLToPath } from "url";
import dotenv   from "dotenv";

import mediaRoutes from "./modules/media/routes.js";
import syncDrive   from "./syncDrive.js";

dotenv.config();

const app  = express();
const port = process.env.PORT || 8080;

/* ── paths ─────────────────────────────────────────────────── */
const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, "../public");
const MEDIA_ROOT = process.env.MEDIA_ROOT
  ? path.resolve(process.env.MEDIA_ROOT)
  : path.join(__dirname, "../../media");

/* ── middleware ────────────────────────────────────────────── */
app.use(cors());
app.use(express.json());

/* API – JSON folder listings */
app.use("/api/media", mediaRoutes);

/* Static assets */
app.use("/media",   express.static(MEDIA_ROOT));           // audio
app.use("/assets",  express.static(path.join(PUBLIC_DIR, "assets"))); // js/css/img/etc

/* ── HTML shell with INTRO_TEXT ───────────────────────────── */
app.get("*", (_req, res) => {
  const indexPath = path.join(PUBLIC_DIR, "index.html");
  let html        = fs.readFileSync(indexPath, "utf8");

  /* Inject **before** the first module script (works with hashed filenames). */
  const intro    = process.env.INTRO_TEXT ?? "";
  const snippet  =
    `<script>window.ENV_INTRO_TEXT = ${JSON.stringify(intro)};</script>`;

  html = html.replace(/<script\s+type="module"\b/i, `${snippet}\n$&`);

  res.set("Content-Type", "text/html").send(html);
});

/* ── start ────────────────────────────────────────────────── */
app.listen(port, () => {
  console.log(`Web-Player listening on ${port}`);
  console.log(`Serving media from: ${MEDIA_ROOT}`);

  /* initial Google-Drive sync + every 10 min */
  syncDrive(MEDIA_ROOT);
  setInterval(() => syncDrive(MEDIA_ROOT), 10 * 60 * 1000);
});
