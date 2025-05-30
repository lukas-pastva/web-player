# web-player
A lightweight **self-hosted MP3 library + player**.

Point the container at any folder full of music and it will:

* walk the directory tree,
* expose it read-only through `/api/media`,
* serve the raw files under `/media/**`,
* let you browse and play tracks in the browser.

```bash
docker run -p 8080:8080 \
  -e MEDIA_ROOT=/path/to/your/mp3s \
  lukaspastva/web-player:latest
```
Then open http://localhost:8080 and enjoy 🎵