// ===== time-encoder.js =====

import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 🔗 ربط بالخادم (يتم تمرير db من index.js)
let dbInstance = null;
let timeRef = null;

// الطابور المحلي للحروف
const queue = []; // عناصر: { char: "ف", nano: 872391002, tickerTarget: 0 }

// ⚙️ إعداد الترميز
export function initEncoder(db, path = "temporal/nano") {
  dbInstance = db;
  timeRef = ref(dbInstance, path);
}

// 🔹 إنشاء Nano رقمي
export function generateNano() {
  return Date.now(); // كل ميللي ثانية Nano فريد
}

// 🔹 حجز حرف مؤقتًا
export function reserveChar(char) {
  const nano = generateNano();
  const tickerTarget = Math.floor(Math.random() * 10) + 1; // الرقم من 1 إلى 10 عنده يرسل الحرف
  queue.push({ char, nano, tickerTarget });
  console.log(`حجز حرف '${char}' عند Nano ${nano} مع هدف عداد ${tickerTarget}`);
}

// 🔹 إرسال Nano للخادم
function sendNano(nano) {
  if (!timeRef) return;
  set(timeRef, nano);
}

// 🔹 عرض الحرف في الواجهة
function displayChar(char) {
  const container = document.getElementById("letter-display");
  if (!container) return;
  const div = document.createElement("div");
  div.textContent = char;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

// 🔹 العدّاد من 1 إلى 10
let tickerValue = 1;
const maxTicker = 10;

// 🔹 بدء النبض والتحريك
export function startTicker() {
  setInterval(() => {
    // تحريك العداد
    tickerValue++;
    if (tickerValue > maxTicker) tickerValue = 1;

    // فحص الحروف المحجوزة
    queue.forEach((item, index) => {
      if (item.tickerTarget === tickerValue) {
        sendNano(item.nano);     // إرسال الرقم فقط
        displayChar(item.char);  // عرض الحرف في الواجهة
        queue.splice(index, 1);  // إزالة العنصر بعد الإرسال
      }
    });

  }, 500); // كل 500ms خطوة للعداد (يمكن تعديلها حسب الرغبة)
}
