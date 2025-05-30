import { Router } from "express";
import { AppConfig } from "./model.js";

const r = Router();

/* ------------------------------------------------------------------ */
/*  Helper – ensure the single row exists                             */
/* ------------------------------------------------------------------ */
async function getRow() {
  let row = await AppConfig.findByPk(1);
  if (!row) row = await AppConfig.create({ id: 1 });   // defaults from model
  return row;
}

/* ------------------------------------------------------------------ */
/*  GET  /api/config  – return current configuration                  */
/* ------------------------------------------------------------------ */
r.get("/api/config", async (_req, res) => {
  res.json(await getRow());
});

/* ------------------------------------------------------------------ */
/*  PUT  /api/config  – update configuration                          */
/* ------------------------------------------------------------------ */
r.put("/api/config", async (req, res) => {
  const row = await getRow();
  const {
    theme,
    mode,                    // light | dark | auto
    disabledTypes,
    childName,
    childSurname,
    birthTs,                 // ISO date-time or null
    appTitle,
    birthWeightGrams,
  } = req.body;

  await row.update({
    /* theme – only “boy” or “girl” accepted */
    theme        : ["boy", "girl"].includes(theme) ? theme : row.theme,

    /* mode – allow the new “auto” option */
    mode         : ["light", "dark", "auto"].includes(mode) ? mode : row.mode,

    /* feed-type visibility list */
    disabledTypes: Array.isArray(disabledTypes) ? disabledTypes : row.disabledTypes,

    /* baby name fields */
    childName    : typeof childName    === "string" ? childName    : row.childName,
    childSurname : typeof childSurname === "string" ? childSurname : row.childSurname,

    /* birth timestamp (nullable) */
    birthTs      : birthTs || null,

    /* custom app title – fall back to current if blank */
    appTitle     : typeof appTitle === "string" && appTitle.trim()
                    ? appTitle.trim()
                    : row.appTitle,

    /* stored birth weight (grams) – must be a finite number */
    birthWeightGrams: Number.isFinite(birthWeightGrams)
                      ? Math.round(birthWeightGrams)
                      : row.birthWeightGrams,
  });

  res.json(row);
});

export default r;
