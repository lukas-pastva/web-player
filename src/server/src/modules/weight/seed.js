import { Weight } from "./model.js";

/* just make sure the table exists – no seed data needed */
export async function syncWeight() {
  await Weight.sync();
}
