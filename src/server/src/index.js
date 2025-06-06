import express  from "express";
import cors     from "cors";
import path     from "path";
import { fileURLToPath } from "url";
import dotenv   from "dotenv";

import mediaRoutes from "./modules/media/routes.js";

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

app.use("/media",  express.static(mediaRoot));                    // MP3 files
app.use(express.static(path.join(__dirname, "../public")));       // React build
app.get("*", (_req, res) =>
  res.sendFile(path.join(__dirname, "../public/index.html"))
);

app.listen(port, () => {
  console.log(`Web-Player listening on ${port}`);
  console.log(`Serving media from: ${mediaRoot}`);
});
