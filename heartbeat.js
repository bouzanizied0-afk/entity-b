// ================== heartbeat.js ==================

// استيراد Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, onValue, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ---------- إعداد Firebase ----------
const firebaseConfig = {
    apiKey: "AIzaSyD4XkZaqv7_c-uiUFc2NvZEFyQUapirz-Y",
    authDomain: "setouchi-it.firebaseapp.com",
    databaseURL: "https://setouchi-it-default-rtdb.europe-west1.firebasedatabase.app/",
    projectId: "setouchi-it",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ---------- متغير محلي للعداد ----------
const heartbeatRef = ref(db, "system/heartbeat");

// ---------- عداد دوري من 1 إلى 10 ----------
setInterval(async () => {
    try {
        const snap = await get(heartbeatRef);
        let current = snap.val() || 0;
        current = (current >= 10) ? 1 : current + 1;
        await set(heartbeatRef, current);
    } catch (err) {
        console.error("خطأ تحديث عداد heartbeat:", err);
    }
}, 1000);

// ---------- تحديث واجهة المستخدم في أي صفحة ----------
function bindHeartbeatDisplay(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;

    onValue(heartbeatRef, (snap) => {
        el.innerText = snap.val() || 0;
    });
}

// تصدير الدالة لتستخدمها في أي صفحة
export { bindHeartbeatDisplay };
