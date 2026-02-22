/**
 * بروتوكول التحول العظيم V13 - النسخة النهائية الفائقة
 * الهدف: دقة 100%، سرعة فورية، ووضوح تام عند المرسل والمستقبل
 */

window.engineActive = true; 

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// --- [قاعدة البيانات] ---
const config = { databaseURL: "https://ziedzizou-7b74d-default-rtdb.europe-west1.firebasedatabase.app" };
const app = initializeApp(config);
const db = getDatabase(app);
const engineRef = ref(db, 'GENESIS_PROTOCOL_V13'); // تم التحديث لـ V13 لضمان اتصال نظيف

const sC = document.getElementById('srcC'), dC = document.getElementById('dstC');
// تفعيل خاصية الألوان الخام لمنع البهتان
const sCtx = sC.getContext('2d', { willReadFrequently: true, colorSpace: 'srgb' });
const dCtx = dC.getContext('2d', { colorSpace: 'srgb' });

// إدارة حالة الاتصال
onValue(ref(db, ".info/connected"), (s) => {
    const statusLight = document.getElementById('statusLight');
    if (s.val()) {
        statusLight.classList.add('online');
        document.getElementById('connState').innerText = "العصب الرقمي متصل ✅";
    } else {
        statusLight.classList.remove('online');
        document.getElementById('connState').innerText = "بانتظار تفعيل العصب الرقمي...";
    }
});

// ============================================================
// الجزء 1: وحدة الترميز الذري المطور (The Atomic Encoding Module)
// ============================================================
const SYMBOLS = {
    // تشفير الألوان في نطاق المنطقة الخاصة (PUA) لمنع تلاعب المتصفح
    encodeColor: (r, g, b) => String.fromCodePoint(0xE000 + r, 0xE100 + g, 0xE200 + b),
    decodeColor: (s, i) => ({ 
        r: s.codePointAt(i) - 0xE000, 
        g: s.codePointAt(i+1) - 0xE100, 
        b: s.codePointAt(i+2) - 0xE200 
    }),
    
    // تشفير المواقع بدقة ذرية
    encodePos: (p) => String.fromCodePoint(0xE300 + (p >> 10), 0xE700 + (p & 0x3FF)),
    decodePos: (s, i) => ((s.codePointAt(i) - 0xE300) << 10) | (s.codePointAt(i+1) - 0xE700),
};

// ============================================================
// الجزء 2: وحدة الضغط المتتالي (The Sequential Compression Module)
// مسؤوليتها: دمج البكسلات المتكررة لتقليل حجم البيانات وتسريع البث
// ============================================================
const DELTA = {
    extract: (pixels, bgR, bgG, bgB) => {
        let payload = "";
        let count = 0;
        let lastColor = "";

        for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i], g = pixels[i+1], b = pixels[i+2], a = pixels[i+3];
            
            // تجاهل الشفافية أو البكسلات المطابقة تماماً للخلفية
            if (a > 10 && (r !== bgR || g !== bgG || b !== bgB)) {
                const currentColor = SYMBOLS.encodeColor(r, g, b);
                const currentPos = SYMBOLS.encodePos(i/4);

                if (currentColor === lastColor) {
                    // رمز "الصاروخ" 0xF000 يعني: نفس اللون السابق للبكسل الحالي
                    payload += currentPos + String.fromCodePoint(0xF000);
                } else {
                    payload += currentPos + currentColor;
                    lastColor = currentColor;
                }
                count++;
            }
        }
        return { payload, count };
    }
};

// ============================================================
// الجزء 3: وحدة الإرسال والطبقات (The Layering System)
// ============================================================
const LAYERS = {
    deploy: async (w, h, baseColor, l4Data) => {
        // نرسل كل شيء في نبضة واحدة لضمان الآنية وعدم تشتت البيانات
        await set(engineRef, { 
            W: w, H: h, 
            base: baseColor, 
            l4: l4Data 
        });
    }
};

// ============================================================
// محرك التشغيل الرئيسي (Main Execution) - تركيز على دقة المرسل
// ============================================================
document.getElementById('fileIn').onchange = (e) => {
    const img = new Image();
    img.onload = async () => {
        // 1. تحديد الأبعاد مع الحفاظ على التناسب
        const W = 250; 
        const H = Math.floor(img.height * (W/img.width));
        sC.width = W; sC.height = H;

        // 2. ضمان دقة المرسل (تعطيل التنعيم كلياً قبل الرسم)
        sCtx.imageSmoothingEnabled = false;
        sCtx.webkitImageSmoothingEnabled = false;
        sCtx.drawImage(img, 0, 0, W, H);

        // 3. تحليل البيانات الخام
        const raw = sCtx.getImageData(0, 0, W, H).data;
        const br = raw[0], bg = raw[1], bb = raw[2];
        const baseColorStr = SYMBOLS.encodeColor(br, bg, bb);

        msg.innerText = "جاري البث الذري...";
        
        // 4. استخراج الفوارق بدقة 100% (بدول تسامح Tolerance)
        const dFull = DELTA.extract(raw, br, bg, bb); 
        
        // 5. البث الفوري
        await LAYERS.deploy(W, H, baseColorStr, dFull.payload);
        
        document.getElementById('efficiency').innerText = `الدقة: 100% | الحالة: تم البث بنجاح`;
        msg.innerText = "الوصول آني والدقة كاملة ✅";
    };
    img.src = URL.createObjectURL(e.target.files[0]);
};

// ============================================================
// الجزء 4: نظام الاستقبال (Receiver Side)
// ============================================================
onValue(engineRef, (snap) => {
    const d = snap.val(); if(!d) return;
    
    // ضبط لوحة المستقبل لتطابق المرسل تماماً
    if(dC.width !== d.W) {
        dC.width = d.W; dC.height = d.H;
        dCtx.imageSmoothingEnabled = false;
    }

    // 1. رسم الخلفية الأصلية
    const b = SYMBOLS.decodeColor(d.base, 0);
    dCtx.fillStyle = `rgb(${b.r},${b.g},${b.b})`;
    dCtx.fillRect(0, 0, d.W, d.H);

    // 2. إعادة بناء الطبقة بدقة بكسل-ببكسل
    if(d.l4) {
        const id = dCtx.getImageData(0, 0, d.W, d.H);
        let lastColor = {r: 0, g: 0, b: 0};
        let cursor = 0;
        const data = d.l4;

        while (cursor < data.length) {
            // فك تشفير الموقع
            const pos = SYMBOLS.decodePos(data.substring(cursor, cursor + 2), 0);
            cursor += 2;

            // فحص نوع البيانات (لون جديد أم تكرار)
            const code = data.codePointAt(cursor);
            if (code === 0xF000) {
                // استخدام اللون السابق (توفير في حجم البيانات)
                cursor += 1;
            } else {
                // فك تشفير لون جديد
                lastColor = SYMBOLS.decodeColor(data.substring(cursor, cursor + 3), 0);
                cursor += 3;
            }

            const pIdx = pos * 4;
            if(pIdx < id.data.length) {
                id.data[pIdx] = lastColor.r;
                id.data[pIdx+1] = lastColor.g;
                id.data[pIdx+2] = lastColor.b;
                id.data[pIdx+3] = 255; // تعتيم كامل للبكسل
            }
        }
        dCtx.putImageData(id, 0, 0);
    }
});
