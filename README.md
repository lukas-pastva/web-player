# web-player
A simple **web-based multimedia player** (MP3 for now).

The backend walks a directory on the host machine – by default `./media`
or whatever you point `MEDIA_ROOT` at – and exposes it read-only via:

* `GET /api/media` → JSON directory listing  
* `/media/<path>`  → static file access (for the `<audio>` tag)

The React frontend lets you drill down through the folder tree and click
any `*.mp3` to start playing it in a native HTML `<audio controls>`.

## Quick start

```bash
docker run -p 8080:8080 \
  -e MEDIA_ROOT=/music              # ← path with your MP3s
  lukaspastva/web-player:latest
```

Then open http://localhost:8080 and enjoy 🎵