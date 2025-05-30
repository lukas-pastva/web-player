import { AppConfig } from "./model.js";

/* make sure the table (and one default row) exist */
export async function syncConfig() {
  await AppConfig.sync({ alter:true });
  const count = await AppConfig.count();
  if (count === 0) {
    await AppConfig.create({
      id              : 1,
      theme           : "boy",
      mode            : "light",
      disabledTypes   : [],
      childName       : "",
      childSurname    : "",
      birthTs         : process.env.BIRTH_TS || null,
      appTitle        : process.env.APP_TITLE || "Web-Baby",
      birthWeightGrams: process.env.BIRTH_WEIGHT_GRAMS
        ? Number(process.env.BIRTH_WEIGHT_GRAMS)
        : null,
    });
  }
}
