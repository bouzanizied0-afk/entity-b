import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ================= Firebase =================
const firebaseConfig = {
  apiKey: "AIzaSyD4XkZaqv7_c-uiUFc2NvZEFyQUapirz-Y",
  authDomain: "setouchi-it.firebaseapp.com",
  databaseURL: "https://zied-e3b78-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "zied-e3b78",
  storageBucket: "zied-e3b78.appspot.com",
  messagingSenderId: "456612217542",
  appId: "1:456612217542:web:51d963523b1306e0bf4dc7"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const streamRef = ref(db, "numeric_stream");

// ================= التفكيك المحلي =================
async function extract(file) {
  const buffer = await file.arrayBuffer();
  return new Uint8Array(buffer);
}

// ================= ربط العداد =================
function encode(bytes, start = 0) {
  const out = [];
  let counter = start;
  for (const b of bytes) {
    out.push({ counter, value: b });
    counter++;
  }
  return out;
}

// ================= الإرسال إلى Firebase =================
async function sendStream(stream) {
  for (const item of stream) {
    await set(ref(db, `numeric_stream/tick_${item.counter}`), item.value);
  }
  alert("Sent numerically");
}

// ================= إعادة البناء =================
async function fetchStream() {
  const snapshot = await get(child(ref(db), 'numeric_stream'));
  return snapshot.val() || {};
}

function reconstruct(stream) {
  const keys = Object.keys(stream).sort((a, b) => {
    const nA = parseInt(a.split("_")[1], 10);
    const nB = parseInt(b.split("_")[1], 10);
    return nA - nB;
  });
  const bytes = keys.map(k => stream[k]);
  return new Uint8Array(bytes);
}

function download(bytes, filename = "reconstructed.bin") {
  const blob = new Blob([bytes]);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

// ================= ربط الأزرار =================
document.getElementById("send").onclick = async () => {
  const file = document.getElementById("fileInput").files[0];
  if (!file) return alert("اختر ملفًا أولاً");
  const bytes = await extract(file);
  const stream = encode(bytes);
  await sendStream(stream);
};

document.getElementById("rebuild").onclick = async () => {
  const stream = await fetchStream();
  const bytes = reconstruct(stream);
  download(bytes);
};
