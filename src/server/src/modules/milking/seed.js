import { Recommendation, Feed } from "./model.js";

/**
 * Build 90-day recommendation rows, each including:
 *   • total ml per day
 *   • meals per day
 *   • NEW: ml per single meal (rounded)
 */
function buildRecommendations() {
  const rows = [];

  for (let ageDays = 0; ageDays < 90; ageDays++) {
    let totalMl, mealsPerDay;

    /* explicit first-week values */
    switch (ageDays) {
      case 0: totalMl = 60;  mealsPerDay = 8; break;
      case 1: totalMl = 90;  mealsPerDay = 8; break;
      case 2: totalMl = 150; mealsPerDay = 7; break;
      case 3: totalMl = 200; mealsPerDay = 7; break;
      case 4: totalMl = 300; mealsPerDay = 6; break;
      case 5: totalMl = 350; mealsPerDay = 6; break;
      case 6: totalMl = 400; mealsPerDay = 6; break;
      case 7: totalMl = 450; mealsPerDay = 6; break;

      /* piece-wise linear ramp-up for days 8-89 */
      default:
        if (ageDays <= 30) {               // 8-30 d
          const p = (ageDays - 7) / (30 - 7);
          totalMl     = Math.round(450 + p * (650 - 450));
          mealsPerDay = 7;
        } else if (ageDays <= 60) {        // 31-60 d
          const p = (ageDays - 30) / (60 - 30);
          totalMl     = Math.round(650 + p * (800 - 650));
          mealsPerDay = 6;
        } else {                           // 61-89 d
          const p = (ageDays - 60) / (90 - 60);
          totalMl     = Math.round(800 + p * (900 - 800));
          mealsPerDay = 5;
        }
    }

    const perMealMl = Math.round(totalMl / mealsPerDay);
    rows.push({ ageDays, totalMl, mealsPerDay, perMealMl });
  }

  return rows;
}

/* ------------------------------------------------------------------ */
/*  Public – called once on server start                              */
/* ------------------------------------------------------------------ */
export async function syncAll() {
  /* `alter:true` adds the new column if the table already exists */
  await Promise.all([Recommendation.sync({ alter:true }), Feed.sync()]);

  if (await Recommendation.count() === 0) {
    await Recommendation.bulkCreate(buildRecommendations());
  }
}
