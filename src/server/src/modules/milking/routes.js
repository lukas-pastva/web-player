import { Router } from "express";
import { Op }     from "sequelize";
import { Recommendation, Feed, FeedingType } from "./model.js";

const r = Router();

/* ------------------------------------------------------------------ */
/*  Recommendations                                                   */
/* ------------------------------------------------------------------ */
r.get("/api/milking/recommendations", async (_req, res) => {
  res.json(await Recommendation.findAll({ order: [["ageDays", "ASC"]] }));
});

/* ------------------------------------------------------------------ */
/*  NEW – Latest feed (any date)                                      */
/* ------------------------------------------------------------------ */
r.get("/api/milking/feeds/last", async (_req, res) => {
  const last = await Feed.findOne({ order: [["fedAt", "DESC"]] });
  if (!last) return res.status(204).end();        // none yet
  res.json(last);
});

/* ------------------------------------------------------------------ */
/*  Feeds – list (by date range)                                      */
/* ------------------------------------------------------------------ */
r.get("/api/milking/feeds", async (req, res) => {
  const { from, to } = req.query;
  const where = {};
  if (from) where.fedAt = { ...where.fedAt, [Op.gte]: new Date(from) };
  if (to)   where.fedAt = { ...where.fedAt, [Op.lte]: new Date(to) };
  res.json(await Feed.findAll({ where, order: [["fedAt", "ASC"]] }));
});

/* ------------------------------------------------------------------ */
/*  Feeds – create                                                    */
/* ------------------------------------------------------------------ */
r.post("/api/milking/feeds", async (req, res) => {
  const { fedAt, amountMl, feedingType } = req.body;

  if (!fedAt || !amountMl || !feedingType) {
    return res.status(400).json({ error: "fedAt, amountMl & feedingType required" });
  }
  if (!Object.values(FeedingType).includes(feedingType)) {
    return res.status(400).json({ error: "invalid feedingType" });
  }

  res.json(await Feed.create({ fedAt, amountMl, feedingType }));
});

/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/*  Feeds – update                                                    */
/* ------------------------------------------------------------------ */
r.put("/api/milking/feeds/:id", async (req, res) => {
  const feed = await Feed.findByPk(req.params.id);
  if (!feed) return res.status(404).json({ error: "not found" });

  const { fedAt, amountMl, feedingType } = req.body;
  if (feedingType && !Object.values(FeedingType).includes(feedingType)) {
    return res.status(400).json({ error: "invalid feedingType" });
  }

  await feed.update({ fedAt, amountMl, feedingType });
  res.json(feed);
});

/* ------------------------------------------------------------------ */
/*  Feeds – delete                                                    */
/* ------------------------------------------------------------------ */
r.delete("/api/milking/feeds/:id", async (req, res) => {
  const feed = await Feed.findByPk(req.params.id);
  if (!feed) return res.status(404).json({ error: "not found" });

  await feed.destroy();
  res.status(204).end();
});

export default r;
