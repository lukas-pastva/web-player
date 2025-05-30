import express  from "express";
import cors     from "cors";
import path     from "path";
import { fileURLToPath } from "url";
import dotenv   from "dotenv";

import milkingRoutes  from "./modules/milking/routes.js";
import { syncAll }    from "./modules/milking/seed.js";
import weightRoutes   from "./modules/weight/routes.js";
import { syncWeight } from "./modules/weight/seed.js";
import configRoutes   from "./modules/config/routes.js";
import { syncConfig } from "./modules/config/seed.js";

/* ─── NEW: media module ──────────────────────────────────────────── */
import mediaRoutes    from "./modules/media/routes.js";

dotenv.config();
await Promise.all([syncAll(), syncWeight(), syncConfig()]);

const app  = express();
const port = process.env.PORT || 8080;

/* middleware */
app.use(cors());
app.use(express.json());

/* API routes */
app.use(milkingRoutes);
app.use(weightRoutes);
app.use(configRoutes);
app.use(mediaRoutes);                       // ← NEW

/* static SPA + raw media files ------------------------------------ */
const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const mediaRoot  = process.env.MEDIA_ROOT
  ? path.resolve(process.env.MEDIA_ROOT)
  : path.join(__dirname, "../../media");

app.use("/media", express.static(mediaRoot));   // exposes files

app.use(express.static(path.join(__dirname, "../public")));
app.get("*", (_req, res) =>
  res.sendFile(path.join(__dirname, "../public/index.html"))
);

app.listen(port, () => {
  console.log(`Web-Player listening on ${port}`);
  console.log(`Serving media from: ${mediaRoot}`);
});