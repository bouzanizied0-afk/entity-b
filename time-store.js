import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyD4XkZaqv7_c-uiUFc2NvZEFyQUapirz-Y",
  authDomain: "setouchi-it.firebaseapp.com",
  databaseURL: "https://setouchi-it-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "setouchi-it",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// هذا هو "الزمن" المشترك
const timeRef = ref(db, "time/minute");

// الاستماع للتغيرات
export function listenTime(callback) {
  onValue(timeRef, snap => {
    if (snap.exists()) {
      callback(snap.val());
    }
  });
}

// الكتابة (تغيير الدقيقة)
export function writeMinute(minute) {
  set(timeRef, minute);
}
