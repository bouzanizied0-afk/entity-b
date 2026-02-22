/**
 * _________________________________________________________________
 * بروتوكول V1-CRYSTAL: النسخة الأمنية الحية (Secure Live Edition)
 * الفلسفة: النقل الخطي الصافي + التشفير بالإزاحة + البث التلقائي
 * _________________________________________________________________
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// _________________________________________________________________
// [الجزء الأول]: إعدادات الاتصال والواجهة (The Infrastructure)
// _________________________________________________________________

window.engineActive = true; // تفعيل ضوء المحرك في index.html

const firebaseConfig = {
    databaseURL: "https://ziedzizou-7b74d-default-rtdb.europe-west1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const engineRef = ref(db, 'INSTANT_STREAM');

// ربط العناصر البرمجية بالواجهة الرسومية
const sC = document.getElementById('srcC');
const dC = document.getElementById('dstC');
const sCtx = sC.getContext('2d', { willReadFrequently: true });
const dCtx = dC.getContext('2d');
const msg = document.getElementById('msg');
const statusLight = document.getElementById('statusLight');

// مراقبة حالة السيرفر (المصباح الأول)
onValue(ref(db, ".info/connected"), (s) => {
    if (s.val()) statusLight.classList.add('online');
    else statusLight.classList.remove('online');
});

// _________________________________________________________________
// [الجزء الثاني]: المحرك القلبي والتشفير (The Security Core)
// _________________________________________________________________

const SECRET_KEY = 42; // مفتاحك السري الخاص

const V1_CORE = {
    // تشفير RGB إلى رموز يونيكود مع حماية الإزاحة
    toSym: (r, g, b) => {
        const er = (r + SECRET_KEY) % 256;
        const eg = (g + SECRET_KEY) % 256;
        const eb = (b + SECRET_KEY) % 256;
        // نستخدم نطاق 0xE000 لضمان نقاء البيانات من تلاعب المتصفح
        return String.fromCodePoint(0xE000 + er, 0xE100 + eg, 0xE200 + eb);
    },
    
    // فك التشفير واستعادة الدقة الكريستالية الأصلية
    decode: (str, idx) => {
        let dr = (str.codePointAt(idx) - 0xE000) - SECRET_KEY;
        let dg = (str.codePointAt(idx + 1) - 0xE100) - SECRET_KEY;
        let db = (str.codePointAt(idx + 2) - 0xE200) - SECRET_KEY;
        
        return {
            r: dr < 0 ? dr + 256 : dr,
            g: dg < 0 ? dg + 256 : dg,
            b: db < 0 ? db + 256 : db
        };
    }
};



// _________________________________________________________________
// [الجزء الثالث]: وحدة الإرسال (The Transmitter Unit)
// _________________________________________________________________

document.getElementById('fileIn').onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const img = new Image();
    img.onload = async () => {
        // فلسفة V1: الحفاظ على الأبعاد الأصلية (وضوح 100%)
        sC.width = img.width; 
        sC.height = img.height;
        sCtx.imageSmoothingEnabled = false;
        sCtx.drawImage(img, 0, 0);
        
        const raw = sCtx.getImageData(0, 0, sC.width, sC.height).data;
        let payload = "";

        msg.innerText = "🚀 جاري تشفير وبث النبضة...";

        // بناء النبضة الخطية (بكسل خلف بكسل)
        for (let i = 0; i < raw.length; i += 4) {
            payload += V1_CORE.toSym(raw[i], raw[i+1], raw[i+2]);
        }

        // إرسال البيانات مع تفعيل خاصية الزمن (t) لإجبار التحديث الآني
        await set(engineRef, { 
            w: sC.width, 
            h: sC.height, 
            data: payload,
            t: Date.now() 
        });
        
        msg.innerText = "✅ تم البث بنجاح (V1-Crystal Secure)";
    };
    img.src = URL.createObjectURL(file);
};

// _________________________________________________________________
// [الجزء الرابع المطور]: وحدة الاستقبال الآلي والتحقق الفوري
// _________________________________________________________________

let isRendering = false;

// دالة المعالجة المركزية (فصلناها لنستدعيها في أي وقت)
const processPulse = (snap) => {
    const d = snap.val();
    if (!d || !d.data || isRendering) return;

    isRendering = true;
    requestAnimationFrame(() => {
        // مزامنة الأبعاد
        if (dC.width !== d.w) {
            dC.width = d.w; 
            dC.height = d.h;
        }

        const imgData = dCtx.createImageData(d.w, d.h);
        const p = imgData.data;
        const stream = d.data;
        
        let pIdx = 0;
        for (let i = 0; i < stream.length; i += 3) {
            const c = V1_CORE.decode(stream, i);
            p[pIdx] = c.r; p[pIdx+1] = c.g; p[pIdx+2] = c.b;
            p[pIdx+3] = 255;
            pIdx += 4;
        }
        dCtx.putImageData(imgData, 0, 0);
        isRendering = false;
        msg.innerText = "📡 المزامنة مكتملة: الصورة قيد العرض";
    });
};

// 1. الاستماع للتغييرات الحية (كما كان سابقاً)
onValue(engineRef, (snap) => {
    processPulse(snap);
});

// 2. [الإضافة الجديدة]: إجبار المحرك على قراءة البيانات فور فتح المتصفح
import { get, child } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const dbRef = ref(getDatabase());
get(child(dbRef, 'INSTANT_STREAM')).then((snapshot) => {
    if (snapshot.exists()) {
        console.log("تم العثور على نبضة سابقة، جاري المزامنة...");
        processPulse(snapshot);
    }
});



