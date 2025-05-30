/* ────────────────────────────────────────────────────────────────────
 * Central application configuration – persisted on the server
 * ──────────────────────────────────────────────────────────────────── */

import { ORDER as ALL_TYPES } from "./feedTypes.js";   // canonical list
export { ALL_TYPES };                                  // ← RE-EXPORT!

const DEFAULT_CFG = {
  theme        : "boy",
  mode         : "auto",
  disabledTypes: [],
  childName    : "",
  childSurname : "",
  birthTs      : "",
  appTitle     : "Web-Baby",
  birthWeightGrams: null,
};

let CACHE = { ...DEFAULT_CFG };

/* pulls (or creates) the single config row */
export async function initConfig() {
  try {
    const r = await fetch("/api/config");
    CACHE = r.ok ? { ...DEFAULT_CFG, ...(await r.json()) }
                 : { ...DEFAULT_CFG };
  } catch {
    CACHE = { ...DEFAULT_CFG };
  }
}

export function loadConfig() { return CACHE; }

/* helpers ---------------------------------------------------------- */
export function effectiveTheme(fallback="boy") { return CACHE.theme ?? fallback; }
export function effectiveMode (fallback="light") { return CACHE.mode  ?? fallback; }
export function storedMode()  { return CACHE.mode ?? "auto"; }
export function isTypeEnabled(t) { return !CACHE.disabledTypes.includes(t); }
export function birthTimestamp() { return CACHE.birthTs || null; }
export function birthWeight() {
  return Number.isFinite(CACHE.birthWeightGrams) ? CACHE.birthWeightGrams : null;
}
export function appTitle() { return CACHE.appTitle || "Web-Baby"; }

/* save to DB and cache locally */
export async function saveConfig(partial) {
  CACHE = { ...CACHE, ...partial };
  await fetch("/api/config", {
    method :"PUT",
    headers: { "Content-Type":"application/json" },
    body   : JSON.stringify(CACHE),
  });
}
