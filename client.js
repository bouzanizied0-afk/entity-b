// ==================== client.js (المطور) ====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.30.0/firebase-app.js";
import { getDatabase, ref, set, onValue, onChildAdded } from "https://www.gstatic.com/firebasejs/9.30.0/firebase-database.js";

// ---------------- Firebase config ----------------
const firebaseConfig = {
  apiKey: "AIzaSyD4XkZaqv7_c-uiUFc2NvZEFyQUapirz-Y",
  authDomain: "setouchi-it.firebaseapp.com",
  databaseURL: "https://setouchi-it-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "setouchi-it",
  storageBucket: "setouchi-it.appspot.com",
  messagingSenderId: "456612217542",
  appId: "1:456612217542:web:51d963523b1306e0bf4dc7"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const streamRef = ref(db, "temporal/stream");
const syncProgressRef = ref(db, "temporal/sync_progress"); // مرجع النسبة المئوية

// --------------------- مرحلة 1: تفكيك الملف ---------------------
async function extract(file) {
  const buffer = await file.arrayBuffer();
  return new Uint8Array(buffer);
}

// --------------------- مرحلة 2: تقسيم إلى Chunks ---------------------
function encode(bytes, chunkSize = 16384) { // تكبير الحجم قليلاً لسرعة الفيديو
  const chunks = [];
  let counter = 0;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.slice(i, i + chunkSize);
    chunks.push({ counter, value: Array.from(slice) });
    counter++;
  }
  return chunks;
}

// --------------------- مرحلة 3: إرسال Chunks مع تحديث التقدم ---------------------
async function sendChunks(chunks) {
  const progressBar = document.getElementById("progressDisplay");
  const counterDisplay = document.getElementById("counterDisplay");

  for (const chunk of chunks) {
    const chunkRef = ref(db, `temporal/stream/${chunk.counter}`);
    try {
      await set(chunkRef, chunk.value);

      const percent = Math.floor(((chunk.counter + 1) / chunks.length) * 100);
      
      // تحديث النسبة محلياً وإرسالها للخادم ليراها الطرف الآخر
      if (progressBar) progressBar.textContent = `Progress: ${percent}%`;
      if (counterDisplay) counterDisplay.textContent = chunk.counter;
      
      await set(syncProgressRef, percent); // بث النسبة مئوية لحظياً

      // سرعة الإرسال (تقليل التأخير لملفات الفيديو)
      await new Promise(r => setTimeout(r, 2)); 

    } catch (err) {
      console.error("فشل الإرسال:", err);
      break;
    }
  }
}

// --------------------- مرحلة 4: Listener تلقائي للمستقبل ---------------------
const receivedChunks = [];
const imageDisplay = document.getElementById("imageDisplay");

// استماع للنسبة المئوية القادمة من الطرف الآخر
onValue(syncProgressRef, (snapshot) => {
    const percent = snapshot.val() || 0;
    const progressBar = document.getElementById("progressDisplay");
    if (progressBar) progressBar.textContent = `Receiving: ${percent}%`;
});

onChildAdded(streamRef, (snapshot) => {
  const data = snapshot.val();
  const counter = parseInt(snapshot.key);
  receivedChunks[counter] = data;

  const counterDisplay = document.getElementById("counterDisplay");
  if (counterDisplay) counterDisplay.textContent = counter;

  // إعادة بناء تدريجي
  const byteArrays = receivedChunks.filter(c => c).map(c => Uint8Array.from(c));
  const totalLength = byteArrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of byteArrays) {
    result.set(arr, offset);
    offset += arr.length;
  }

  if (imageDisplay) {
    const blob = new Blob([result]);
    const url = URL.createObjectURL(blob);
    imageDisplay.src = url;
    
    // إذا كان ميديا (فيديو/صوت) حاول التشغيل التلقائي
    if (imageDisplay.tagName === 'VIDEO' || imageDisplay.tagName === 'AUDIO') {
        imageDisplay.play().catch(() => {}); 
    }
  }
});

// --------------------- ربط الأزرار ---------------------
document.getElementById("send").onclick = async () => {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];
  if (!file) return alert("اختر ملفاً أولاً");

  // تصفير البيانات القديمة قبل الإرسال الجديد
  await set(streamRef, null);
  await set(syncProgressRef, 0);

  const bytes = await extract(file);
  const chunks = encode(bytes);

  // التأكد من وجود عناصر العرض
  prepareUI();

  await sendChunks(chunks);
};

function prepareUI() {
    if (!document.getElementById("progressDisplay")) {
        const p = document.createElement("div");
        p.id = "progressDisplay";
        p.style.cssText = "margin-top: 10px; font-weight: bold; color: #00d4ff;";
        document.body.appendChild(p);
    }
    // ... باقي عناصر العرض كما هي في كودك الأصلي ...
}

// (باقي كود الرسائل النصية يبقى كما هو دون تغيير)
