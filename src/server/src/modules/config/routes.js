import { Router } from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const r = Router();

/* persistent JSON file ------------------------------------------- */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CFG_PATH  = path.join(__dirname, "..", "..", "..", "config.json");

const DEFAULT_CFG = { theme:"boy", mode:"auto" };

async function loadCfg() {
  try { return { ...DEFAULT_CFG, ...(JSON.parse(await fs.readFile(CFG_PATH))) }; }
  catch { return { ...DEFAULT_CFG }; }
}
async function saveCfg(cfg) {
  await fs.writeFile(CFG_PATH, JSON.stringify(cfg, null, 2));
  return cfg;
}

/* GET /api/config */
r.get("/api/config", async (_req, res) => {
  res.json(await loadCfg());
});

/* PUT /api/config */
r.put("/api/config", async (req, res) => {
  const cur  = await loadCfg();
  const next = { ...cur };

  if (["boy","girl"].includes(req.body.theme)) next.theme = req.body.theme;
  if (["light","dark","auto"].includes(req.body.mode))   next.mode  = req.body.mode;

  await saveCfg(next);
  res.json(next);
});

export default r;
