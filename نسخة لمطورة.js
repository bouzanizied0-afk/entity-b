/* =========================================================
   TEMPORAL DETERMINISTIC SYNCHRONIZATION SYSTEM
   Firebase Version (Blind Relay)
   ========================================================= */

const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set, onValue } = require('firebase/database');
const fs = require("fs");

/* ===================== Firebase Configuration ===================== */
const firebaseConfig = {
  apiKey: "AIzaSyD4XkZaqv7_c-uiUFc2NvZEFyQUapirz-Y",
  authDomain: "setouchi-it.firebaseapp.com",
  databaseURL: "https://setouchi-it-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "setouchi-it"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/* ===================== 1. LOCAL GLOBAL COUNTER ===================== */
let LOCAL_T = 0;

function tick() {
  LOCAL_T += 1;
  return LOCAL_T;
}

function currentT() {
  return LOCAL_T;
}

/* ===================== 2. UNIVERSAL LOCAL DECOMPOSITION ===================== */
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

/* ===================== 4. EMIT STATE TO FIREBASE ===================== */
async function generatorSend(filePath, file_id = 0) {
  const Q = decomposeFile(filePath);
  const T = tick(); // ✅ حتمي محليًا
  const state = stateEquation(T, Q.length);

  // إرسال الحالة فقط، لا يغير التزامن
  const streamRef = ref(db, `temporal/stream/state_${T}`);
  await set(streamRef, {
    file_id,
    ...state
  });

  console.log(`✅ تم إرسال الحالة T=${T} إلى مسار السيرفر.`);
}

/* ===================== 5. RECEIVER: LISTEN & RECONSTRUCT ===================== */
function receiverListen(outputPath, expectedQlen) {
  const streamRef = ref(db, "temporal/stream");
  console.log("👂 في انتظار حالات جديدة من السيرفر...");

  onValue(streamRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    // اختر الحالة التي تتوافق مع العداد المحلي المتوقع
    const keys = Object.keys(data).map(k => parseInt(k)).sort((a,b)=>a-b);
    for (const key of keys) {
      if (key !== currentT() + 1) continue; // فقط الحالة التالية المتوقعة

      const state = data[key];
      LOCAL_T = state.T; // تحديث العداد المحلي بشكل حتمي

      const Q = regenerateQueue(state.Qlen || expectedQlen);
      const file = assemble(Q, state.start, state.end, state.pivot);
      fs.writeFileSync(outputPath, file);

      console.log(`💾 تم حفظ الملف المسترجع في: ${outputPath} (T=${state.T})`);
      break; // معالجة حالة واحدة فقط لكل tick
    }
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
  tick,
  currentT
};
