import { Router } from "express";
import { Op }     from "sequelize";
import { Weight } from "./model.js";

const r = Router();

/* list (optional range) */
r.get("/api/weight/weights", async (req, res) => {
  const { from, to } = req.query;
  const where = {};
  if (from) where.measuredAt = { ...where.measuredAt, [Op.gte]: from };
  if (to)   where.measuredAt = { ...where.measuredAt, [Op.lte]: to };

  res.json(
    await Weight.findAll({ where, order: [["measuredAt", "DESC"]] })
  );
});

/* create (upsert – max one entry per day) */
r.post("/api/weight/weights", async (req, res) => {
  const { measuredAt, weightGrams } = req.body;
  if (!measuredAt || !weightGrams)
    return res.status(400).json({ error: "measuredAt & weightGrams required" });

  const [row] = await Weight.upsert({ measuredAt, weightGrams });
  res.json(row);
});

/* update */
r.put("/api/weight/weights/:id", async (req, res) => {
  const row = await Weight.findByPk(req.params.id);
  if (!row) return res.status(404).json({ error: "not found" });

  const { measuredAt, weightGrams } = req.body;
  await row.update({ measuredAt, weightGrams });
  res.json(row);
});

/* delete */
r.delete("/api/weight/weights/:id", async (req, res) => {
  const row = await Weight.findByPk(req.params.id);
  if (!row) return res.status(404).json({ error: "not found" });

  await row.destroy();
  res.status(204).end();
});

export default r;
