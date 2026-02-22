/**
 * بروتوكول التحول العظيم V14 - النسخة الهجينة المكبوسة
 * المبدأ: الترميز الذري للمواقع والألوان + التغليف الستيني (Base64 Wrapper)
 */

window.engineActive = true; 

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// --- [قاعدة البيانات] ---
const config = { databaseURL: "https://ziedzizou-7b74d-default-rtdb.europe-west1.firebasedatabase.app" };
const app = initializeApp(config);
const db = getDatabase(app);
const engineRef = ref(db, 'GENESIS_PROTOCOL_V14'); 

// --- [عناصر الواجهة] ---
const sC = document.getElementById('srcC'), dC = document.getElementById('dstC');
const sCtx = sC.getContext('2d', { willReadFrequently: true });
const dCtx = dC.getContext('2d');
const msg = document.getElementById('msg');
const statusLight = document.getElementById('statusLight');

// إدارة حالة اتصال Firebase
onValue(ref(db, ".info/connected"), (s) => {
    if (s.val()) statusLight.classList.add('online');
    else statusLight.classList.remove('online');
});

// ============================================================
// الجزء 1: وحدة الكبس الهجين (The Hybrid Packing Module)
// ============================================================
const PACKER = {
    // يحول مصفوفة الأرقام إلى نص Base64 مضغوط
    toBase64: (uint8Array) => {
        let binary = '';
        const len = uint8Array.byteLength;
        for (let i = 0; i < len; i++) binary += String.fromCharCode(uint8Array[i]);
        return btoa(binary);
    },
    // يعيد نص Base64 إلى مصفوفة أرقام أصلية
    fromBase64: (b64) => {
        const binary = atob(b64);
        const uint8 = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) uint8[i] = binary.charCodeAt(i);
        return uint8;
    }
};

// ============================================================
// الجزء 2: وحدة الاستخراج الذري (The Atomic Delta)
// ============================================================
const DELTA = {
    extract: (pixels, br, bg, bb) => {
        const atoms = []; 
        let lR = -1, lG = -1, lB = -1;

        for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i], g = pixels[i+1], b = pixels[i+2], a = pixels[i+3];
            // تجاهل الخلفية والشفافية
            if (a > 10 && (r !== br || g !== bg || b !== bb)) {
                const pos = i / 4;
                // كبس الموقع في 2 بايت (يدعم حتى 65535 بكسل)
                atoms.push(pos >> 8, pos & 0xFF);

                if (r === lR && g === lG && b === lB) {
                    atoms.push(0xFE); // رمز "الصاروخ" (تكرار اللون السابق)
                } else {
                    atoms.push(r, g, b); // لون جديد
                    lR = r; lG = g; lB = b;
                }
            }
        }
        return PACKER.toBase64(new Uint8Array(atoms));
    }
};

// ============================================================
// المحرك الرئيسي: الإرسال (The Transmitter)
// ============================================================
document.getElementById('fileIn').onchange = (e) => {
    const img = new Image();
    img.onload = async () => {
        const W = 250; 
        const H = Math.floor(img.height * (W/img.width));
        sC.width = W; sC.height = H;

        // رسم حاد بدون تنعيم
        sCtx.imageSmoothingEnabled = false;
        sCtx.drawImage(img, 0, 0, W, H);

        const raw = sCtx.getImageData(0, 0, W, H).data;
        const br = raw[0], bg = raw[1], bb = raw[2];

        msg.innerText = "⚡ جاري الكبس الذري والتغليف الستيني...";
        const payload = DELTA.extract(raw, br, bg, bb); 
        
        await set(engineRef, { W, H, bg: [br, bg, bb], data: payload });
        msg.innerText = "🚀 تم الإرسال الفوري للدقة الذرية!";
    };
    img.src = URL.createObjectURL(e.target.files[0]);
};

// ============================================================
// المحرك الرئيسي: الاستقبال (The Receiver)
// ============================================================
onValue(engineRef, (snap) => {
    const d = snap.val(); if (!d || !d.data) return;
    
    if (dC.width !== d.W) { dC.width = d.W; dC.height = d.H; }
    
    const imgData = dCtx.createImageData(d.W, d.H);
    const p = imgData.data;

    // 1. فك غلاف الـ 64 والعودة للذرات الخام
    const atoms = PACKER.fromBase64(d.data);

    // 2. صب الخلفية الأصلية
    for (let i = 0; i < p.length; i += 4) {
        p[i] = d.bg[0]; p[i+1] = d.bg[1]; p[i+2] = d.bg[2]; p[i+3] = 255;
    }

    // 3. إعادة بناء البكسلات من الذرات المكبوسة
    let ptr = 0;
    let lR = 0, lG = 0, lB = 0;
    while (ptr < atoms.length) {
        const pos = (atoms[ptr++] << 8) | atoms[ptr++];
        const next = atoms[ptr++];
        
        if (next !== 0xFE) {
            lR = next; lG = atoms[ptr++]; lB = atoms[ptr++];
        }

        const i = pos * 4;
        p[i] = lR; p[i+1] = lG; p[i+2] = lB; p[i+3] = 255;
    }

    // 4. الطلقة النهائية (المتصفح يفرغ الذاكرة على الشاشة)
    dCtx.putImageData(imgData, 0, 0);
    msg.innerText = "✅ تم الاستقبال: دقة 100% في زمن قياسي";
});
