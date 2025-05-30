# ─────────────────────────────────────────────────────────────────────
#  1️⃣  Build the React client
# ─────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS client-build
WORKDIR /app/client
ENV NPM_CONFIG_LEGACY_PEER_DEPS=true

COPY client/package*.json ./
COPY client/vite.config.js ./
COPY client/src ./src
RUN npm install && npm run build        # → produces /app/client/dist

# ─────────────────────────────────────────────────────────────────────
#  2️⃣  Final image – server + bundled media
# ─────────────────────────────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app/server

RUN apk add --no-cache curl

# --- install server deps --------------------------------------------
COPY server/package*.json ./
RUN npm install

# --- copy server code + built client --------------------------------
COPY server .
COPY --from=client-build /app/client/dist ./public

# --- NEW: bundle the media folder -----------------------------------
RUN mkdir -p /app/media
COPY media /app/media

ENV PORT=8080
EXPOSE 8080
CMD ["node", "src/index.js"]
