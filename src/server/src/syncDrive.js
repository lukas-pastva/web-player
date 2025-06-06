/* --------------------------------------------------------------------
 * Pull all .m4a files from a public Google-Drive folder into /app/media
 * – works with nothing but the public-folder ID
 * – re-runs periodically (index.js schedules it)
 * ------------------------------------------------------------------ */
import fs   from "fs/promises";
import path from "path";
import fetch from "node:fetch";                 // Node 18+ global

/* ------------------------------------------------------------------ */
/* 1️⃣  Grab folder HTML in Drive’s lightweight “embed” view           */
const embedUrl = (id) => `https://drive.google.com/embeddedfolderview?id=${id}#list`;

/* 2️⃣  Parse <a href="…/file/d/FILE_ID/…"><span>filename.m4a</span> … */
function parseFiles(html) {
  const re = /href="https:\/\/drive\.google\.com\/file\/d\/([\w-]+)\/[^"]*".*?<span[^>]*class="flip-entry-title[^"]*"[^>]*>([^<]+\.m4a)<\/span>/gi;
  const out = [];
  let m;
  while ((m = re.exec(html))) out.push({ id: m[1], name: m[2].trim() });
  return out;
}

/* 3️⃣  Download the file only if it’s not present already */
async function download({ id, name }, mediaRoot) {
  const dest = path.join(mediaRoot, name);
  try { await fs.access(dest); return; }        // exists → skip
  catch { /* fall through */ }

  const url = `https://drive.google.com/uc?export=download&id=${id}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  await fs.writeFile(dest, buf);
  console.log(`✓  ${name}`);
}

/* ------------------------------------------------------------------ */
/* Main entry exported to index.js                                    */
export default async function syncDrive(mediaRoot) {
  const folderId = process.env.DRIVE_FOLDER_ID;
  if (!folderId) {                               // opt-in via env
    console.warn("Drive-sync skipped – DRIVE_FOLDER_ID not set.");
    return;
  }

  try {
    const html  = await fetch(embedUrl(folderId)).then(r => r.text());
    const files = parseFiles(html);
    if (files.length === 0) {
      console.warn("Drive-sync: no .m4a files found in the folder.");
      return;
    }
    await fs.mkdir(mediaRoot, { recursive: true });
    for (const f of files) await download(f, mediaRoot);
  } catch (err) {
    console.error("Drive-sync error:", err.message);
  }
}
