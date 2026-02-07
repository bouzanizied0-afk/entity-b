// simple-translator.js
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

/**
 * initTranslator
 * @param {Database} db - قاعدة بيانات Firebase موجودة مسبقًا
 * @param {string} path - المسار في Firebase حيث تأتي الأوامر
 */
export function initTranslator(db, path = "translator/commands") {
  const cmdRef = ref(db, path);

  // استماع مستمر للأوامر الجديدة
  onValue(cmdRef, (snapshot) => {
    if (!snapshot.exists()) return;

    const command = snapshot.val();

    // تحويل الرقم/الأمر إلى كود JS
    const code = translateNumberToCode(command);

    // تنفيذ الكود فورًا
    try {
      eval(code);
    } catch (e) {
      console.error("خطأ أثناء تنفيذ الأمر:", e);
    }
  });
}

/**
 * translateNumberToCode
 * تحويل رقم إلى كود JS بسيط للتنفيذ
 */
function translateNumberToCode(num) {
  switch (num) {
    case 1:
      return `document.getElementById("chat").innerHTML += '<img src="https://via.placeholder.com/150" style="margin:5px;">';`;
    case 2:
      return `document.body.style.backgroundColor = "orange";`;
    case 3:
      return `console.log("تم تنفيذ الأمر رقم 3");`;
    default:
      return `console.log("رقم غير معروف:", ${num});`;
  }
}
