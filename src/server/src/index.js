/* src/server/src/index.js
 * ─────────────────────────────────────────────────────────────
 * Express server – injects INTRO_TEXT *before* React bundle
 * so window.ENV_INTRO_TEXT is defined when index.jsx runs.
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

/* ── middleware ─────────────────────────────────────────────── */
app.use(cors());
app.use(express.json());

/* ── API routes ─────────────────────────────────────────────── */
app.use("/api/media", mediaRoutes);   // folder listings

/* ── static assets & raw media ─────────────────────────────── */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mediaRoot = process.env.MEDIA_ROOT
  ? path.resolve(process.env.MEDIA_ROOT)
  : path.join(__dirname, "../../media");

app.use("/media",  express.static(mediaRoot));                 // audio files
app.use(express.static(path.join(__dirname, "../public")));    // React build

/* ── serve index.html with INTRO_TEXT injection ─────────────── */
app.get("*", (_req, res) => {
  const indexPath = path.join(__dirname, "../public/index.html");
  let   html      = fs.readFileSync(indexPath, "utf8");

  /* Inject *before* the FIRST module script so global is ready
     even after Vite fingerprints the filename. */
  const intro   = process.env.INTRO_TEXT || "";
  const snippet = `<script>window.ENV_INTRO_TEXT = ${
    JSON.stringify(intro)
  };</script>`;

  html = html.replace(
    /<script\s+type="module"\b/i,      // first “type=module” script tag
    `${snippet}\n$&`,
  );

  res.send(html);
});

/* ── start ──────────────────────────────────────────────────── */
app.listen(port, () => {
  console.log(`Web-Player listening on ${port}`);
  console.log(`Serving media from: ${mediaRoot}`);

  /* initial Google-Drive pull + every 10 min */
  syncDrive(mediaRoot);
  setInterval(() => syncDrive(mediaRoot), 10 * 60 * 1000);
});
