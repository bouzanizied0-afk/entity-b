// serverCore.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, onValue, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

/* ========= إعداد الخادم ========= */
export const firebaseConfig = {
  apiKey: "AIzaSyC_oqjbxC27qLhH6mx_ngg4WCZUrMW2B7U",
  authDomain: "zied-e3b78.firebaseapp.com",
  databaseURL: "https://zied-e3b78-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "zied-e3b78",
  storageBucket: "zied-e3b78.firebasestorage.app",
  messagingSenderId: "774724725374",
  appId: "1:774724725374:web:a338e16e8689d60dd3062f",
  measurementId: "G-20CPRZJ5JE"
};
export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

/* ========= المسارات الموحدة ========= */
export const PATHS = {
  heartbeat: "system/heartbeat",
  counter: "temporal/counter",
  stream: "temporal/stream"
};

/* ========= عداد دوري كل 10 ثواني ========= */
export async function startHeartbeat(interval = 10000) {
  const hbRef = ref(db, PATHS.heartbeat);

  setInterval(async () => {
    const snap = await get(hbRef);
    const next = (snap.val() || 0) + 1;
    await set(hbRef, next);
  }, interval);
}

/* ========= مراقبة العداد (اختياري) ========= */
export function onCounterChange(callback) {
  onValue(ref(db, PATHS.counter), (snap) => {
    callback(snap.val());
  });
}
