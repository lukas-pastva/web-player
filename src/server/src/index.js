/* ──────────────────────────────────────────────────────────
 * Express server – now also serves the INTRO_MD markdown
 * ────────────────────────────────────────────────────────── */
const express = require("express");
const path    = require("path");

const configRoutes = require("./modules/config/routes");
const mediaRoutes  = require("./modules/media/routes");

const app  = express();
const PORT = process.env.PORT || 8080;

/* JSON body parsing for /api/config */
app.use(express.json());

/* ─────────────── API routes */
app.use("/api/config", configRoutes);
app.use("/api/media",  mediaRoutes);

/* NEW ─────────── introduction banner
   Returns raw markdown from the INTRO_MD env variable.            */
const INTRO_MD = process.env.INTRO_MD || "";
app.get("/api/intro", (_req, res) => {
  res.type("text/markdown").send(INTRO_MD);
});

/* ─────────────── static files */
app.use("/media",  express.static(path.resolve(__dirname, "../../media")));
app.use(express.static(path.resolve(__dirname, "../public")));

/* SPA fallback */
app.get("*", (_req, res) =>
  res.sendFile(path.resolve(__dirname, "../public/index.html")),
);

app.listen(PORT, () =>
  console.log(`Web-Player listening on http://localhost:${PORT}`),
);
