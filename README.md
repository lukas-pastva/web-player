# web-player
A lightweight **self-hosted media library + player** for your music **and videos**.

Point the container at any folder full of media files (MP3, M4A, MP4, WebM…) and it will:

* walk the directory tree,  
* expose it read-only through `/api/media`,  
* serve the raw files under `/media/**`,  
* let you browse and play tracks **and clips** in the browser.

```bash
docker run -p 8080:8080 \
  -e MEDIA_ROOT=/path/to/your/media \
  lukaspastva/web-player:latest
```