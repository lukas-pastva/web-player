/* ──────────────────────────────────────────────────────────
 * /api/media – returns a folder listing for the React client
 *   • ES-module (matches "type": "module")
 *   • honours MEDIA_ROOT env var
 *   • rejects “..” path traversal
 *   • outputs { path, directories, files }
 * ────────────────────────────────────────────────────────── */
import { Router } from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const router = Router();

/* ------------------------------------------------------------------ */
/* locate the media root                                               */
const MEDIA_ROOT =
  process.env.MEDIA_ROOT ||
  path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../../../media",
  );

/* ------------------------------------------------------------------ */
/* helper – join safely and forbid “…/..”                              */
function safeJoin(root, rel = "") {
  const normal = path
    .normalize(rel)
    .replace(/^(\.\.(\/|\\|$))+/, "");          // strip leading “../”
  return path.join(root, normal);
}

/* ------------------------------------------------------------------ */
/* GET /api/media?path=<relative/sub/folder>                           */
router.get("/", async (req, res) => {
  try {
    const relPath = req.query.path ?? "";
    const absPath = safeJoin(MEDIA_ROOT, relPath);

    /* read directory ------------------------------------------------ */
    const entries = await fs.readdir(absPath, { withFileTypes: true });

    /* separate dirs and files, sort for nicer UI -------------------- */
    const directories = entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort((a, b) => a.localeCompare(b, "en"));

    const files = entries
      .filter((e) => e.isFile())
      .map((e) => e.name)
      .sort((a, b) => a.localeCompare(b, "en"));

    res.json({ path: relPath, directories, files });
  } catch (err) {
    /* most likely ENOENT or EACCES */
    res.status(500).json({ error: err.message });
  }
});

export default router;
