/* ──────────────────────────────────────────────────────────────
 * Minimal front-end config (file-backed on the server)
 * ────────────────────────────────────────────────────────────── */
const DEFAULT_CFG = {
  theme : "boy",   // blue
  mode  : "auto",  // light|dark|auto
};

let CACHE = { ...DEFAULT_CFG };

export async function initConfig() {
  try {
    const r = await fetch("/api/config");
    CACHE = r.ok ? { ...DEFAULT_CFG, ...(await r.json()) }
                 : { ...DEFAULT_CFG };
  } catch {
    CACHE = { ...DEFAULT_CFG };
  }
}
export function loadConfig()              { return CACHE; }
export function effectiveTheme(f="boy")   { return CACHE.theme ?? f; }
export function effectiveMode (f="light") { return CACHE.mode  ?? f; }
export function storedMode()              { return CACHE.mode ?? "auto"; }

export async function saveConfig(partial) {
  CACHE = { ...CACHE, ...partial };
  await fetch("/api/config", {
    method :"PUT",
    headers: { "Content-Type":"application/json" },
    body   : JSON.stringify(CACHE),
  });
}
