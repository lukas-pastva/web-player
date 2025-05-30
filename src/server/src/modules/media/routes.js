import { Router } from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const r = Router();

/* absolute MEDIA_ROOT ------------------------------------------------ */
const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const MEDIA_ROOT = process.env.MEDIA_ROOT
  ? path.resolve(process.env.MEDIA_ROOT)
  : path.join(__dirname, "../../../../media");

/* stop sneaky “../” traversal */
function safeJoin(root, rel = "") {
  const resolved = path.resolve(root, rel);
  if (!resolved.startsWith(root)) throw new Error("Path traversal denied");
  return resolved;
}

/* GET /api/media?path=sub/dir --------------------------------------- */
r.get("/api/media", async (req, res) => {
  try {
    const relPath   = req.query.path || "";
    const absTarget = safeJoin(MEDIA_ROOT, relPath);

    const entries = await fs.readdir(absTarget, { withFileTypes: true });
    const directories = [];
    const files       = [];

    for (const e of entries) {
      (e.isDirectory() ? directories : files).push(e.name);
    }

    directories.sort((a, b) => a.localeCompare(b));
    files.sort((a, b) => a.localeCompare(b));

    res.json({
      path       : relPath,
      parentPath : relPath ? path.dirname(relPath) : null,
      directories,
      files,
    });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
});

export default r;
