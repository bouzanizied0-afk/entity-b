import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

/* =============================
   1️⃣ ربط بالخادم الأعمى
============================= */
const db = getDatabase();
const nanoRef = ref(db, "temporal/counter"); // نفس المسار المستخدم في index.html

/* =============================
   2️⃣ فضاء التفسير المحلي
============================= */
const INTERPRETATION_SPACE = {
  1: () => showText("ا"),
  2: () => showText("ب"),
  3: () => showText("ت"),
  4: () => showText("ث"),
  5: () => showText("ج"),
  10: () => showText("0"),
  11: () => showText("1"),
  12: () => showText("2"),
  1001: () => showImage("assets/image1.jpg"),
  1002: () => showImage("assets/image2.jpg"),
  2001: () => showVideo("assets/video1.mp4"),
  2002: () => showVideo("assets/video2.mp4"),
  9999: () => showText("⚠ حالة خاصة")
};

/* =============================
   3️⃣ أدوات العرض
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
   4️⃣ التفسير
============================= */
function interpret(nano) {
  const key = nano % 10000;
  const action = INTERPRETATION_SPACE[key];
  if (action) action();
  else console.log("🔹 رقم بلا تفسير:", key);
}

/* =============================
   5️⃣ الاستماع المباشر للخادم
============================= */
onValue(nanoRef, snapshot => {
  if (!snapshot.exists()) return;
  const nano = snapshot.val();
  interpret(nano);
});
