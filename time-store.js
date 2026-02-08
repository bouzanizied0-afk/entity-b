import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 🔐 إعداد Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD4XkZaqv7_c-uiUFc2NvZEFyQUapirz-Y",
  authDomain: "setouchi-it.firebaseapp.com",
  databaseURL: "https://setouchi-it-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "setouchi-it",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 🕰️ الزمن الحقيقي (الخادم فقط)
const clockRef = ref(db, "system/clock");

// 📡 الاستماع للزمن (قراءة فقط)
export function listenClock(callback) {
  onValue(clockRef, snap => {
    if (snap.exists()) {
      callback(snap.val()); // { tick, epoch, updatedAt }
    }
  });
}
