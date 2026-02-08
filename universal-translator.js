// universal-translator.js
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

/*
  هذا المترجم:
  - لا يتصل بالخادم إلا لاستقبال رقم
  - لا يخزن معنى في الخادم
  - كل المعنى محلي
*/

export function initUniversalTranslator(db, path = "temporal/nano") {
  const nanoRef = ref(db, path);

  onValue(nanoRef, (snapshot) => {
    if (!snapshot.exists()) return;

    const nano = snapshot.val();
    interpret(nano);
  });
}

/* =========================
   🔐 فضاء التفسير (المعنى)
   ========================= */

const INTERPRETATION_SPACE = {
  // حروف
  4: () => showText("ف"),
  5: () => showText("ت"),

  // صور (محلية أو معرفة مسبقًا)
  1001: () => showImage("assets/image1.jpg"),
  1002: () => showImage("assets/image2.jpg"),

  // فيديو
  2001: () => showVideo("assets/video1.mp4"),

  // حالات
  9999: () => alert("تم الوصول إلى حالة خاصة"),
};

/* =========================
   🧠 التفسير
   ========================= */

function interpret(nano) {
  // اختزال الرقم إلى مفتاح
  const key = reduceNano(nano);

  const action = INTERPRETATION_SPACE[key];

  if (action) {
    action();
  } else {
    console.log("🔹 رقم بلا تفسير:", key);
  }
}

/*
  اختزال:
  نحول رقم زمني ضخم إلى مفتاح دلالي
*/
function reduceNano(nano) {
  return nano % 10000; // يمكن تغييرها (جوهر فكرتك!)
}

/* =========================
   🖼️ أدوات العرض
   ========================= */

function showText(text) {
  const c = document.getElementById("output");
  if (!c) return;
  const d = document.createElement("div");
  d.textContent = text;
  c.appendChild(d);
}

function showImage(src) {
  const c = document.getElementById("output");
  if (!c) return;
  const img = document.createElement("img");
  img.src = src;
  img.style.maxWidth = "300px";
  c.appendChild(img);
}

function showVideo(src) {
  const c = document.getElementById("output");
  if (!c) return;
  const v = document.createElement("video");
  v.src = src;
  v.controls = true;
  v.style.maxWidth = "300px";
  c.appendChild(v);
}
