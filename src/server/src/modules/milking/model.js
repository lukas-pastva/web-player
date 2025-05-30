import { DataTypes } from "sequelize";
import db from "../../db.js";          // shared Sequelize instance

export const FeedingType = {
  BREAST_DIRECT : "BREAST_DIRECT",
  BREAST_BOTTLE : "BREAST_BOTTLE",
  FORMULA_PUMP  : "FORMULA_PUMP",
  FORMULA_BOTTLE: "FORMULA_BOTTLE",
};

/* ─── static daily recommendations ─── */
export const Recommendation = db.define(
  "milking_recommendation",
  {
    ageDays     : { type: DataTypes.INTEGER, primaryKey: true },
    totalMl     : { type: DataTypes.INTEGER, allowNull: false },
    mealsPerDay : { type: DataTypes.INTEGER, allowNull: false },
    perMealMl   : { type: DataTypes.INTEGER, allowNull: false },
  },
  { timestamps: false }
);

/* ─── single feed ─── */
export const Feed = db.define(
  "milking_feed",
  {
    id         : { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    fedAt      : { type: DataTypes.DATE, allowNull: false },
    amountMl   : { type: DataTypes.INTEGER, allowNull: false },
    feedingType: { type: DataTypes.ENUM(...Object.values(FeedingType)), allowNull: false },
  },
  { timestamps: false }
);
