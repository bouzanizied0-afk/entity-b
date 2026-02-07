// ===== file-encoder.js =====

import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 🔗 ربط بالخادم (تم تمرير db من index.js أو من ملف رئيسي)
let dbInstance = null;
let fileRef = null;

// قائمة الانتظار للملفات
const fileQueue = []; // عناصر: { chunk: ArrayBuffer, nano: number, fileName: string }

// تهيئة الاتصال بالخادم
export function initFileEncoder(db, path = "temporal/files") {
  dbInstance = db;
  fileRef = ref(dbInstance, path);
}

// إنشاء Nano رقمي (يمكن ربطه بالوقت العالمي لاحقًا)
export function generateNano() {
  return Date.now();
}

// تقسيم الملف إلى أجزاء (1 ميجابايت لكل جزء تقريبًا)
export function chunkFile(file, chunkSize = 1024 * 1024) {
  const chunks = [];
  let offset = 0;
  while (offset < file.size) {
    const slice = file.slice(offset, offset + chunkSize);
    chunks.push(slice);
    offset += chunkSize;
  }
  return chunks;
}

// إضافة ملف للحجز والإرسال
export function reserveFile(file) {
  const chunks = chunkFile(file);
  chunks.forEach((chunk, index) => {
    const nano = generateNano() + index; // نضيف index لضمان تمييز كل جزء
    fileQueue.push({
      chunk,
      nano,
      fileName: file.name
    });
    console.log(`حجز جزء من الملف '${file.name}' عند Nano ${nano}`);
  });
}

// إرسال الملفات إلى الخادم
export function startFileTicker() {
  setInterval(() => {
    if (!fileRef) return;
    const now = generateNano();
    fileQueue.forEach((item, index) => {
      if (item.nano <= now) {
        // قراءة الجزء كـ Base64 لإرساله عبر Firebase
        const reader = new FileReader();
        reader.onload = (e) => {
          push(fileRef, {
            fileName: item.fileName,
            chunk: e.target.result, // Base64
            nano: item.nano
          });
        };
        reader.readAsDataURL(item.chunk);

        fileQueue.splice(index, 1);
      }
    });
  }, 50); // نفحص كل 50ms
}
