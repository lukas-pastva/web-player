/* --------------------------------------------------------------------
 * syncDrive.js  – no-API-key Google-Drive puller with verbose logging
 * ------------------------------------------------------------------ */
import fs   from "fs/promises";
import path from "path";

/* ───────────────────────── helpers ──────────────────────────────── */
const stamp = () => new Date().toISOString().replace(/T/, " ").replace(/\..+/, "");

const embedUrl = (id) =>
  `https://drive.google.com/embeddedfolderview?id=${id}#list`;

/* Robust-ish HTML scrape for .m4a links (two markup variants) */
function parseFiles(html) {
  const out = [];
  const patterns = [
    /data-id="([\w-]+)".*?<span[^>]*>([^<]+\.m4a)<\/span>/gis, // newer markup
    /href="https:\/\/drive\.google\.com\/file\/d\/([\w-]+)\/[^"]*".*?<span[^>]*>([^<]+\.m4a)<\/span>/gis, // older
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(html))) out.push({ id: m[1], name: m[2].trim() });
    if (out.length) break; // first pattern that works wins
  }
  /* de-duplicate (same file can appear twice in HTML) */
  const seen = new Set();
  return out.filter((f) => (seen.has(f.id) ? false : seen.add(f.id)));
}

async function download({ id, name }, mediaRoot) {
  const dest = path.join(mediaRoot, name);
  console.log(`[${stamp()}]   ↪︎ downloading ${name} …`);
  const url  = `https://drive.google.com/uc?export=download&id=${id}`;
  const res  = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  await fs.writeFile(dest, new Uint8Array(await res.arrayBuffer()));
  console.log(`[${stamp()}]   ✓ saved ${name}`);
}

async function wipe(mediaRoot) {
  try {
    const files = await fs.readdir(mediaRoot, { withFileTypes: true });
    const removed = [];
    for (const f of files) {
      if (f.isFile()) {
        await fs.unlink(path.join(mediaRoot, f.name));
        removed.push(f.name);
      }
    }
    console.log(
      `[${stamp()}]   ◼ cleared ${removed.length} local file(s): ${removed.join(
        ", ",
      ) || "(none)"}`
    );
  } catch {
    /* dir may not exist yet – create it */
    await fs.mkdir(mediaRoot, { recursive: true });
  }
}

/* ───────────────────────── main entry ───────────────────────────── */
export default async function syncDrive(mediaRoot) {
  const folderId = process.env.DRIVE_FOLDER_ID;
  if (!folderId) {
    console.warn(`[${stamp()}] Drive-sync skipped – DRIVE_FOLDER_ID not set.`);
    return;
  }

  console.log(
    `[${stamp()}] Drive-sync starting (folder ${folderId}, root ${mediaRoot})`,
  );

  try {
    /* 1️⃣  wipe the current library */
    await wipe(mediaRoot);

    /* 2️⃣  pull the public folder’s HTML & parse */
    const html  = await fetch(embedUrl(folderId)).then((r) => r.text());
    console.log(
      `[${stamp()}]   fetched embed page (${html.length} bytes)`,
    );

    const files = parseFiles(html);
    console.log(
      `[${stamp()}]   found ${files.length} .m4a file(s) in Drive`,
      files.length ? `: ${files.map((f) => f.name).join(", ")}` : "",
    );

    if (files.length === 0) {
      console.warn(
        `[${stamp()}]   ⚠ no .m4a files detected – folder markup may have changed.`,
      );
      return;
    }

    /* 3️⃣  download them one by one */
    for (const f of files) await download(f, mediaRoot);

    console.log(`[${stamp()}] Drive-sync finished – library up-to-date`);
  } catch (err) {
    console.error(`[${stamp()}] Drive-sync error:`, err.message);
  }
}
