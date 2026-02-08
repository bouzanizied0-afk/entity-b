// cloud-clock.js
import { initializeApp } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";

initializeApp();
const db = getDatabase();

let tick = 0;
let epoch = 0;

setInterval(async () => {
  tick++;
  if (tick > 10) tick = 1;
  epoch++;

  await db.ref("system/clock").set({
    tick,
    epoch,
    updatedAt: Date.now()
  });
}, 600);
