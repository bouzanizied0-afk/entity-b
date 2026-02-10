/* ===================== إعدادات الاتصال بالسيرفر ===================== */
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set, onValue, get } = require('firebase/database');

const firebaseConfig = {
  apiKey: "AIzaSyD4XkZaqv7_c-uiUFc2NvZEFyQUapirz-Y",
  authDomain: "setouchi-it.firebaseapp.com",
  databaseURL: "https://setouchi-it-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "setouchi-it"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/* ===================== 1. GLOBAL COUNTER (المزامنة مع السيرفر) ===================== */

async function tick() {
  const counterRef = ref(db, "temporal/counter");
  const snap = await get(counterRef);
  const currentT = snap.val() || 0;
  const newT = currentT + 1;
  await set(counterRef, newT);
  return newT;
}

/* ===================== 2. LOCAL DECOMPOSITION ===================== */
const fs = require("fs");

function decomposeFile(path) {
  const buffer = fs.readFileSync(path);
  const Q = new Array(buffer.length);
  for (let i = 0; i < buffer.length; i++) {
    Q[i] = ((buffer[i] * 31) + i) % 104729;
  }
  return Q;
}

/* ===================== 3. STATE EQUATION ===================== */
function stateEquation(T, Qlen) {
  const start = (T * 37 + Qlen * 13) % Qlen;
  const end   = (T * 17 + Qlen * 19) % Qlen;
  const pivot = (start + end + T) % Qlen;
  return { T, start, end, pivot, Qlen };
}

/* ===================== 5. FIREBASE RELAY (بديل الـ WebSocket) ===================== */

// وظيفة لإرسال الحالة للسيرفر
async function generatorSend(filePath, file_id = 0) {
  const Q = decomposeFile(filePath);
  const T = await tick(); // جلب العداد وتحديثه في السيرفر
  const state = stateEquation(T, Q.length);
  
  const streamRef = ref(db, `temporal/stream/state_${T}`);
  await set(streamRef, {
    file_id,
    ...state
  });
  console.log(`✅ تم إرسال الحالة T=${T} إلى مسار السيرفر.`);
}

// وظيفة للاستماع للحالات القادمة من السيرفر وإعادة البناء
function receiverListen(outputPath) {
  const streamRef = ref(db, "temporal/stream");
  console.log("👂 في انتظار حالات جديدة من السيرفر...");
  
  onValue(streamRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    // الحصول على أحدث حالة مضافة
    const lastKey = Object.keys(data).pop();
    const state = data[lastKey];

    console.log(`🔄 جاري إعادة بناء الحالة: ${lastKey}`);
    const Q = regenerateQueue(state.Qlen);
    const file = assemble(Q, state.start, state.end, state.pivot);
    fs.writeFileSync(outputPath, file);
    console.log(`💾 تم حفظ الملف المسترجع في: ${outputPath}`);
  });
}

/* ===================== 6. QUEUE REGENERATION ===================== */
function regenerateQueue(Qlen) {
  const Q = new Array(Qlen);
  for (let i = 0; i < Qlen; i++) {
    Q[i] = ((i * 31) + i) % 104729;
  }
  return Q;
}

/* ===================== 7. ASSEMBLY ===================== */
function assemble(Q, start, end, pivot) {
  const a = Math.min(start, end);
  const b = Math.max(start, end);
  const out = [];
  for (let i = a; i <= b; i++) {
    out.push(Q[(i + pivot) % Q.length] & 0xFF);
  }
  return Buffer.from(out);
}

/* ===================== EXPORT ===================== */
module.exports = {
  generatorSend,
  receiverListen,
  tick
};
