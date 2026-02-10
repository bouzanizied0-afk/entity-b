// هذا الملف يتبع نفس مسار ملف المسارات heartbeat.js
// جميع البيانات تتم عبر المسار: system/heartbeat

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, onValue, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyD4XkZaqv7_c-uiUFc2NvZEFyQUapirz-Y",
    authDomain: "setouchi-it.firebaseapp.com",
    databaseURL: "https://setouchi-it-default-rtdb.europe-west1.firebasedatabase.app/",
    projectId: "setouchi-it",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let localT = 0;

// --------------------- متابعة heartbeat ---------------------
onValue(ref(db, "system/heartbeat"), (s) => {
    console.log("Heartbeat:", s.val() || 0);
});

// --------------------- متابعة counter ضمن system/heartbeat ---------------------
onValue(ref(db, "system/heartbeat/counter"), async (snap) => {
    const serverT = snap.val();

    if (serverT && serverT > localT) {
        localT = serverT; // تحديث العداد المحلي لمنع التكرار
        console.log("جاري جلب البيانات لعدد:", serverT);

        const stateSnap = await get(ref(db, `system/heartbeat/stream/state_${serverT}`));
        const incomingState = stateSnap.val();

        if (incomingState) {
            console.log(`تم استلام البيانات T=${serverT}`, incomingState);
        }
    }
});

// --------------------- إرسال بيانات ضمن system/heartbeat ---------------------
async function sendFile(file) {
    if (!file) return;

    console.log("جاري معالجة وإرسال الملف:", file.name);

    const reader = new FileReader();
    reader.onload = async (event) => {
        const base64Data = btoa(String.fromCharCode.apply(null, new Uint8Array(event.target.result)));

        const counterSnap = await get(ref(db, "system/heartbeat/counter"));
        const nextT = (counterSnap.val() || 0) + 1;

        const payload = {
            data: base64Data,
            T: nextT,
            type: file.type
        };

        await set(ref(db, `system/heartbeat/stream/state_${nextT}`), payload);
        await set(ref(db, "system/heartbeat/counter"), nextT);

        localT = nextT;
        console.log("تم الإرسال بنجاح T=", nextT);
    };
    reader.readAsArrayBuffer(file);
}

// مثال للاستخدام: sendFile(fileObject);
