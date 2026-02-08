import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

/* =============================
   1️⃣ إعداد Firebase
============================= */
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

/* =============================
   2️⃣ ربط بالمخزن الزمني للخادم الأعمى
============================= */
const nanoRef = ref(db, "temporal/counter"); // أو temporal/nano حسب اختيارك

/* =============================
   3️⃣ فضاء التفسير المحلي
============================= */
const INTERPRETATION_SPACE = {
  // حروف عربية
  1: () => showText("ا"),
  2: () => showText("ب"),
  3: () => showText("ت"),
  4: () => showText("ث"),
  5: () => showText("ج"),
  // أرقام
  10: () => showText("0"),
  11: () => showText("1"),
  12: () => showText("2"),
  // صور
  1001: () => showImage("assets/image1.jpg"),
  1002: () => showImage("assets/image2.jpg"),
  // فيديو
  2001: () => showVideo("assets/video1.mp4"),
  2002: () => showVideo("assets/video2.mp4"),
  // حالات خاصة
  9999: () => showText("⚠ حالة خاصة")
};

/* =============================
   4️⃣ أدوات العرض
============================= */
function showText(text) {
  const c = document.getElementById("output") || console;
  if (c instanceof HTMLElement) {
    const d = document.createElement("div");
    d.textContent = text;
    c.appendChild(d);
    c.scrollTop = c.scrollHeight;
  } else console.log("🔹", text);
}

function showImage(src) {
  const c = document.getElementById("output") || document.body;
  const img = document.createElement("img");
  img.src = src;
  img.style.maxWidth = "300px";
  img.style.margin = "5px";
  c.appendChild(img);
  c.scrollTop = c.scrollHeight || 0;
}

function showVideo(src) {
  const c = document.getElementById("output") || document.body;
  const v = document.createElement("video");
  v.src = src;
  v.controls = true;
  v.style.maxWidth = "300px";
  v.style.margin = "5px";
  c.appendChild(v);
  c.scrollTop = c.scrollHeight || 0;
}

/* =============================
   5️⃣ التفسير: تحويل الرقم إلى فعل
============================= */
function interpret(nano) {
  const key = nano % 10000; // اختزال الرقم إلى مفتاح دلالي
  const action = INTERPRETATION_SPACE[key];
  if (action) action();
  else console.log("🔹 رقم بلا تفسير:", key);
}

/* =============================
   6️⃣ الاستماع المباشر للخادم
============================= */
onValue(nanoRef, (snapshot) => {
  if (!snapshot.exists()) return;
  const nano = snapshot.val();
  interpret(nano);
});
