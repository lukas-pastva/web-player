import express  from "express";
import cors     from "cors";
import path     from "path";
import { fileURLToPath } from "url";
import dotenv   from "dotenv";

import milkingRoutes  from "./modules/milking/routes.js";
import { syncAll }    from "./modules/milking/seed.js";
import weightRoutes   from "./modules/weight/routes.js";
import { syncWeight } from "./modules/weight/seed.js";

/* ─── config module ─────────────────────────────────────────────── */
import configRoutes   from "./modules/config/routes.js";
import { syncConfig } from "./modules/config/seed.js";

/* ─── bootstrap ─────────────────────────────────────────────────── */
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

/* static SPA */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, "../public")));
app.get("*", (_req, res) =>
  res.sendFile(path.join(__dirname, "../public/index.html"))
);

app.listen(port, () => console.log(`Web-Baby listening on ${port}`));
