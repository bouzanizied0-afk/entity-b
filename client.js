// ==================== client.js (النسخة المتكاملة) ====================
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
const syncProgressRef = ref(db, "temporal/sync_progress");

// --------------------- مرحلة 1: تفكيك الملف ---------------------
async function extract(file) {
  const buffer = await file.arrayBuffer();
  return new Uint8Array(buffer);
}

// --------------------- مرحلة 2: تقسيم إلى Chunks ---------------------
function encode(bytes, chunkSize = 16384) { 
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
      
      if (progressBar) progressBar.textContent = `Sending: ${percent}%`;
      if (counterDisplay) counterDisplay.textContent = `Chunk: ${chunk.counter}`;
      
      // بث النسبة مئوية لحظياً للطرف الآخر
      await set(syncProgressRef, percent); 

      // تأخير بسيط جداً لضمان ثبات البث
      await new Promise(r => setTimeout(r, 2)); 

    } catch (err) {
      console.error("فشل الإرسال:", err);
      break;
    }
  }
}

// --------------------- مرحلة 4: Listener تلقائي للمستقبل ---------------------
const receivedChunks = [];

// استماع للنسبة المئوية القادمة من الطرف الآخر
onValue(syncProgressRef, (snapshot) => {
    const percent = snapshot.val() || 0;
    const progressBar = document.getElementById("progressDisplay");
    if (progressBar) {
        progressBar.style.display = "block";
        progressBar.textContent = `Syncing: ${percent}%`;
    }
});

onChildAdded(streamRef, (snapshot) => {
  const data = snapshot.val();
  const counter = parseInt(snapshot.key);
  receivedChunks[counter] = data;

  const counterDisplay = document.getElementById("counterDisplay");
  if (counterDisplay) counterDisplay.textContent = `Receiving Chunk: ${counter}`;

  // إعادة بناء المصفوفة
  const byteArrays = receivedChunks.filter(c => c !== undefined).map(c => Uint8Array.from(c));
  const totalLength = byteArrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of byteArrays) {
    result.set(arr, offset);
    offset += arr.length;
  }

  // التعامل مع العرض (صورة أو فيديو)
  const displayElement = document.getElementById("imageDisplay") || document.getElementById("videoDisplay");
  if (displayElement) {
    const blob = new Blob([result]);
    const url = URL.createObjectURL(blob);
    displayElement.src = url;
    
    // تشغيل تلقائي إذا كان فيديو
    if (displayElement.tagName === 'VIDEO') {
        displayElement.play().catch(() => console.log("Waiting for user interaction to play video"));
    }
  }
});

// --------------------- ربط الأزرار ---------------------
document.getElementById("send").onclick = async () => {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];
  if (!file) return alert("اختر ملفاً أولاً");

  // تنظيف الخادم قبل الإرسال الجديد
  await set(streamRef, null);
  await set(syncProgressRef, 0);

  const bytes = await extract(file);
  const chunks = encode(bytes);

  prepareUI(file.type);

  await sendChunks(chunks);
};

// وظيفة تجهيز واجهة العرض بناءً على نوع الملف
function prepareUI(fileType) {
    let displayArea = document.getElementById("displayArea");
    if (!displayArea) {
        displayArea = document.createElement("div");
        displayArea.id = "displayArea";
        document.body.appendChild(displayArea);
    }
    displayArea.innerHTML = ""; // تنظيف قديم

    // إنشاء العداد
    const p = document.createElement("div");
    p.id = "progressDisplay";
    p.style.cssText = "margin-top: 10px; font-weight: bold; color: #00d4ff;";
    displayArea.appendChild(p);

    const c = document.createElement("div");
    c.id = "counterDisplay";
    c.style.cssText = "font-size: 10px; color: #555;";
    displayArea.appendChild(c);

    // اختيار العنصر المناسب (فيديو أم صورة)
    if (fileType.startsWith("video/")) {
        const video = document.createElement("video");
        video.id = "videoDisplay";
        video.controls = true;
        video.autoplay = true;
        video.style.maxWidth = "100%";
        displayArea.appendChild(video);
    } else {
        const img = document.createElement("img");
        img.id = "imageDisplay";
        img.style.maxWidth = "100%";
        displayArea.appendChild(img);
    }
}
