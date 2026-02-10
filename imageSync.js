// imageSync.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, onValue, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// --- إعداد Firebase ---
const firebaseConfig = {
    apiKey: "AIzaSyD4XkZaqv7_c-uiUFc2NvZEFyQUapirz-Y",
    authDomain: "setouchi-it.firebaseapp.com",
    databaseURL: "https://setouchi-it-default-rtdb.europe-west1.firebasedatabase.app/",
    projectId: "setouchi-it",
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- عداد محلي للمزامنة ---
let localT = 0;

// --- دالة لإرسال صورة ---
export async function sendImage(file) {
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);
    const base64Data = btoa(String.fromCharCode.apply(null, uint8));

    const counterSnap = await get(ref(db, "temporal/counter"));
    const nextT = (counterSnap.val() || 0) + 1;

    const payload = { data: base64Data, type: file.type, T: nextT };

    await set(ref(db, `temporal/stream/state_${nextT}`), payload);
    await set(ref(db, "temporal/counter"), nextT);

    localT = nextT; // تحديث العداد المحلي
}

// --- دالة لتلقي الصور فورًا ---
export function onImageReceived(callback) {
    onValue(ref(db, "temporal/counter"), async (snap) => {
        const serverT = snap.val();
        if (serverT && serverT > localT) {
            localT = serverT;

            const stateSnap = await get(ref(db, `temporal/stream/state_${serverT}`));
            const state = stateSnap.val();
            if (state) {
                const dataURL = `data:${state.type};base64,${state.data}`;
                callback(dataURL, state.T);
            }
        }
    });
}
