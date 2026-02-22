/**
 * _________________________________________________________________
 * بروتوكول V1-CRYSTAL ULTIMATE (النسخة الخارقة)
 * الفلسفة: الضغط المسبق + التشفير الرمزي + المزامنة الآنية الشاملة
 * _________________________________________________________________
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue, get, child } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

window.engineActive = true;

const firebaseConfig = {
    databaseURL: "https://ziedzizou-7b74d-default-rtdb.europe-west1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const engineRef = ref(db, 'V1_ULTIMATE_STREAM');

const sC = document.getElementById('srcC');
const dC = document.getElementById('dstC');
const sCtx = sC.getContext('2d', { willReadFrequently: true });
const dCtx = dC.getContext('2d');
const msg = document.getElementById('msg');
const statusLight = document.getElementById('statusLight');

// 1. الاتصال المستقر
onValue(ref(db, ".info/connected"), (s) => {
    if (s.val()) statusLight.classList.add('online');
    else statusLight.classList.remove('online');
});

// 2. المحرك الرمزي مع مفتاح الأمان
const SECRET_KEY = 42;
const V1_CORE = {
    toSym: (r, g, b) => {
        const er = (r + SECRET_KEY) % 256;
        const eg = (g + SECRET_KEY) % 256;
        const eb = (b + SECRET_KEY) % 256;
        return String.fromCodePoint(0xE000 + er, 0xE100 + eg, 0xE200 + eb);
    },
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

// 3. المُرسل الخارق (ضغط مسبق + نبضة رمزية)
document.getElementById('fileIn').onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const img = new Image();
    img.onload = async () => {
        // العبقرية: تقليص الحجم لـ 200px لضمان سرعة النقل الآني
        const scale = 200 / img.width;
        sC.width = 200;
        sC.height = Math.floor(img.height * scale);
        
        sCtx.imageSmoothingEnabled = true; // تنعيم الحواف عند التصغير
        sCtx.drawImage(img, 0, 0, sC.width, sC.height);
        
        const raw = sCtx.getImageData(0, 0, sC.width, sC.height).data;
        let payload = "";

        msg.innerText = "🚀 جاري إطلاق النبضة الآنية...";

        for (let i = 0; i < raw.length; i += 4) {
            payload += V1_CORE.toSym(raw[i], raw[i+1], raw[i+2]);
        }

        await set(engineRef, { 
            w: sC.width, h: sC.height, data: payload, t: Date.now() 
        });
        
        msg.innerText = "✅ تم النقل الآني بنجاح!";
    };
    img.src = URL.createObjectURL(file);
};

// 4. المُستقبل الذكي (مزامنة فورية للمتصل والمتأخر)
const renderPulse = (snap) => {
    const d = snap.val();
    if (!d || !d.data) return;

    const start = performance.now();
    requestAnimationFrame(() => {
        if (dC.width !== d.w) {
            dC.width = d.w; dC.height = d.h;
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
        const end = performance.now();
        msg.innerText = `📡 تم الاستقبال والدمج في ${(end - start).toFixed(2)}ms`;
    });
};

// الاستماع الحي
onValue(engineRef, renderPulse);

// جلب الحالة فور فتح المتصفح (للمتأخرين)
get(child(ref(db), 'V1_ULTIMATE_STREAM')).then((snapshot) => {
    if (snapshot.exists()) renderPulse(snapshot);
});
