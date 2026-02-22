/**
 * _________________________________________________________________
 * بروتوكول الإرسال التقليدي الميت (Pure Traditional System)
 * المبدأ: إرسال الصورة كملف Base64 ضخم (طريقة الـ 99% من المبرمجين)
 * _________________________________________________________________
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// تفعيل ضوء المحرك في واجهة index.html (لإصلاح الانفصال)
window.engineActive = true;

const firebaseConfig = {
    databaseURL: "https://ziedzizou-7b74d-default-rtdb.europe-west1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const tradRef = ref(db, 'TRADITIONAL_STREAM'); // مسار تقليدي

// ربط العناصر (نفس معرفات ملف index الخاص بك)
const sC = document.getElementById('srcC');
const dC = document.getElementById('dstC');
const msg = document.getElementById('msg');
const statusLight = document.getElementById('statusLight');

// تشغيل مصباح فيرباس
onValue(ref(db, ".info/connected"), (s) => {
    if (s.val()) statusLight.classList.add('online');
    else statusLight.classList.remove('online');
});

// _________________________________________________________________
// [المرسل التقليدي]: لا بكسلات.. لا رموز.. فقط ملف ثقيل
// _________________________________________________________________
document.getElementById('fileIn').onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    msg.innerText = "⏳ جاري تحويل الصورة لملف Base64 ثقيل...";

    reader.onload = async (event) => {
        const fullImageData = event.target.result; // نص عملاق يمثل الملف كاملاً
        
        // رسم المصدر للعرض فقط
        const img = new Image();
        img.onload = () => {
            sC.width = img.width; sC.height = img.height;
            sC.getContext('2d').drawImage(img, 0, 0);
        };
        img.src = fullImageData;

        // إرسال "الكتلة" كاملة إلى فيرباس
        await set(tradRef, {
            content: fullImageData,
            t: Date.now()
        });
        
        msg.innerText = "✅ تم إرسال الملف (النظام التقليدي)";
    };
    reader.readAsDataURL(file);
};

// _________________________________________________________________
// [المستقبل التقليدي]: ينتظر تحميل النص بالكامل ليعرضه
// _________________________________________________________________
onValue(tradRef, (snap) => {
    const data = snap.val();
    if (!data || !data.content) return;

    const start = performance.now();
    
    // الطريقة العقيمة: انتظار المتصفح ليحلل الملف النصي الضخم
    const img = new Image();
    img.src = data.content; 

    img.onload = () => {
        dC.width = img.width;
        dC.height = img.height;
        const dCtx = dC.getContext('2d');
        dCtx.drawImage(img, 0, 0); 
        
        const end = performance.now();
        msg.innerText = `⚠️ تقليدي: اكتمل التحميل في ${(end - start).toFixed(2)}ms`;
    };
});
