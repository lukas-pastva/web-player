/* src/server/src/index.js
 * ─────────────────────────────────────────────────────────────
 * Express server
 *   • /api/media   → JSON folder listings
 *   • /media/**    → streamed audio/video files with Range support
 *   • /assets/**   → Vite-generated JS/CSS/img
 *   • *            → index.html with INTRO_TEXT injected
 * ──────────────────────────────────────────────────────────── */
import express from 'express';
import cors    from 'cors';
import path    from 'path';
import fs      from 'fs';
import { fileURLToPath } from 'url';
import dotenv  from 'dotenv';
import mime    from 'mime-types';

import mediaRoutes from './modules/media/routes.js';
import syncDrive   from './syncDrive.js';

dotenv.config();

const app  = express();
const port = process.env.PORT || 8080;

/* ── paths ─────────────────────────────────────────────────── */
const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '../public');
const MEDIA_ROOT = process.env.MEDIA_ROOT
  ? path.resolve(process.env.MEDIA_ROOT)
  : path.join(__dirname, '../../media');

/* ── middleware ────────────────────────────────────────────── */
app.use(cors());
app.use(express.json());

/* API – folder listings */
app.use('/api/media', mediaRoutes);

/* Static assets (never index.html here) */
app.use('/assets', express.static(path.join(PUBLIC_DIR, 'assets')));

/* ── media streaming with HTTP Range support ──────────────── */
app.get('/media/*', (req, res) => {
  try {
    const relPath  = decodeURIComponent(req.params[0] ?? '');
    const filePath = path.join(MEDIA_ROOT, relPath);

    /* reject path-traversal attempts */
    if (!filePath.startsWith(MEDIA_ROOT)) {
      return res.status(400).send('Invalid path');
    }

    const stat = fs.statSync(filePath);
    if (!stat.isFile()) return res.sendStatus(404);

    const fileSize = stat.size;
    const mimeType = mime.lookup(filePath) || 'application/octet-stream';
    const range    = req.headers.range;

    /* no Range header → send whole file */
    if (!range) {
      res.writeHead(200, {
        'Content-Type'  : mimeType,
        'Content-Length': fileSize,
        'Accept-Ranges' : 'bytes',
      });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    /* handle partial request */
    const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
    const start = parseInt(startStr, 10);
    const end   = endStr ? parseInt(endStr, 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize) {
      res.status(416).set('Content-Range', `bytes */${fileSize}`).end();
      return;
    }

    const chunkSize = end - start + 1;

    res.writeHead(206, {
      'Content-Range' : `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges' : 'bytes',
      'Content-Length': chunkSize,
      'Content-Type'  : mimeType,
    });

    fs.createReadStream(filePath, { start, end }).pipe(res);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

/* ── HTML shell with intro -- always generated here ───────── */
app.get('*', (_req, res) => {
  const indexPath = path.join(PUBLIC_DIR, 'index.html');
  let   html      = fs.readFileSync(indexPath, 'utf8');

  /* Inject banner text immediately after <head> */
  const intro   = process.env.INTRO_TEXT ?? '';
  const snippet = `<script>window.ENV_INTRO_TEXT = ${JSON.stringify(intro)};</script>`;
  html = html.replace(/<head([^>]*)>/i, `<head$1>\n  ${snippet}`);

  res.type('html').send(html);
});

/* ── start ────────────────────────────────────────────────── */
app.listen(port, () => {
  console.log(`Web-Player listening on ${port}`);
  console.log(`Serving media from: ${MEDIA_ROOT}`);

  /* initial Drive pull + every 10 min */
  syncDrive(MEDIA_ROOT);
  setInterval(() => syncDrive(MEDIA_ROOT), 10 * 60 * 1000);
});
