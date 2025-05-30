/* Lightweight file-based config – no DB needed */
import { Router } from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const r = Router();

/* ------------------------------------------------------------------ */
/*  Where we persist the single config object                         */
/* ------------------------------------------------------------------ */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CFG_PATH  = path.join(__dirname, "..", "..", "..", "config.json");

/* defaults identical to the frontend copy -------------------------- */
const DEFAULT_CFG = {
  id              : 1,
  theme           : "boy",
  mode            : "auto",
  disabledTypes   : [],
  childName       : "",
  childSurname    : "",
  birthTs         : "",
  appTitle        : "Web-Player",
  birthWeightGrams: null,
};

/* helper – always returns a full config object                       */
async function loadCfg() {
  try {
    const raw = await fs.readFile(CFG_PATH, "utf-8");
    return { ...DEFAULT_CFG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_CFG };
  }
}
async function saveCfg(cfg) {
  await fs.writeFile(CFG_PATH, JSON.stringify(cfg, null, 2));
  return cfg;
}

/* ------------------------------------------------------------------ */
/*  GET /api/config                                                   */
/* ------------------------------------------------------------------ */
r.get("/api/config", async (_req, res) => {
  res.json(await loadCfg());
});

/* ------------------------------------------------------------------ */
/*  PUT /api/config                                                   */
/* ------------------------------------------------------------------ */
r.put("/api/config", async (req, res) => {
  const cur  = await loadCfg();
  const next = { ...cur, ...req.body };
  await saveCfg(next);
  res.json(next);
});

export default r;
