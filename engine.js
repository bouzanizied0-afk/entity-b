/**
 * بروتوكول التحول العظيم V13 - نسخة "المسار السريع للمتصفح"
 */

window.engineActive = true; 

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const config = { databaseURL: "https://ziedzizou-7b74d-default-rtdb.europe-west1.firebasedatabase.app" };
const app = initializeApp(config);
const db = getDatabase(app);
const engineRef = ref(db, 'GENESIS_PROTOCOL_V13');

const sC = document.getElementById('srcC'), dC = document.getElementById('dstC');
const sCtx = sC.getContext('2d', { willReadFrequently: true });
const dCtx = dC.getContext('2d');

// وحدة الترميز
const SYMBOLS = {
    encodeColor: (r, g, b) => String.fromCodePoint(0xE000 + r, 0xE100 + g, 0xE200 + b),
    decodeColor: (s, i) => ({ 
        r: s.codePointAt(i) - 0xE000, 
        g: s.codePointAt(i+1) - 0xE100, 
        b: s.codePointAt(i+2) - 0xE200 
    }),
    encodePos: (p) => String.fromCodePoint(0xE300 + (p >> 10), 0xE700 + (p & 0x3FF)),
    decodePos: (s, i) => ((s.codePointAt(i) - 0xE300) << 10) | (s.codePointAt(i+1) - 0xE700),
};

// وحدة الاستخراج (المرسل)
const DELTA = {
    extract: (pixels, bgR, bgG, bgB) => {
        let payload = "";
        let lastColor = "";
        for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i], g = pixels[i+1], b = pixels[i+2], a = pixels[i+3];
            if (a > 10 && (r !== bgR || g !== bgG || b !== bgB)) {
                const currentColor = SYMBOLS.encodeColor(r, g, b);
                const currentPos = SYMBOLS.encodePos(i/4);
                if (currentColor === lastColor) {
                    payload += currentPos + String.fromCodePoint(0xF000);
                } else {
                    payload += currentPos + currentColor;
                    lastColor = currentColor;
                }
            }
        }
        return payload;
    }
};

// محرك التشغيل
document.getElementById('fileIn').onchange = (e) => {
    const img = new Image();
    img.onload = async () => {
        const W = 250; 
        const H = Math.floor(img.height * (W/img.width));
        sC.width = W; sC.height = H;

        sCtx.imageSmoothingEnabled = false;
        sCtx.drawImage(img, 0, 0, W, H);

        const raw = sCtx.getImageData(0, 0, W, H).data;
        const br = raw[0], bg = raw[1], bb = raw[2];
        const baseColorStr = SYMBOLS.encodeColor(br, bg, bb);

        msg.innerText = "جاري البث الذري...";
        const payload = DELTA.extract(raw, br, bg, bb); 
        
        await set(engineRef, { W, H, base: baseColorStr, l4: payload });
        msg.innerText = "الوصول آني والدقة كاملة ✅";
    };
    img.src = URL.createObjectURL(e.target.files[0]);
};

// ============================================================
// الجزء 4: نظام الاستقبال - جعل المتصفح يرسم "الكتلة الواحدة"
// ============================================================
onValue(engineRef, (snap) => {
    const d = snap.val(); if(!d || !d.l4) return;
    
    if(dC.width !== d.W) { dC.width = d.W; dC.height = d.H; }

    // 1. المتصفح يجهز "حاوية بكسلات" في الذاكرة (سريع جداً)
    const imgData = dCtx.createImageData(d.W, d.H);
    const pixels = imgData.data;

    // 2. تعبئة الخلفية (صب الكتلة في الذاكرة)
    const b = SYMBOLS.decodeColor(d.base, 0);
    for (let i = 0; i < pixels.length; i += 4) {
        pixels[i] = b.r; pixels[i+1] = b.g; pixels[i+2] = b.b; pixels[i+3] = 255;
    }

    // 3. فك التشفير مباشرة داخل مصفوفة البكسلات
    const data = d.l4;
    let cursor = 0;
    let lastR = 0, lastG = 0, lastB = 0;

    while (cursor < data.length) {
        const pos = SYMBOLS.decodePos(data.substring(cursor, cursor + 2), 0);
        cursor += 2;

        const code = data.codePointAt(cursor);
        if (code !== 0xF000) {
            const c = SYMBOLS.decodeColor(data.substring(cursor, cursor + 3), 0);
            lastR = c.r; lastG = c.g; lastB = c.b;
            cursor += 3;
        } else {
            cursor += 1;
        }

        const pIdx = pos * 4;
        pixels[pIdx] = lastR;
        pixels[pIdx+1] = lastG;
        pixels[pIdx+2] = lastB;
        pixels[pIdx+3] = 255;
    }

    // 4. الطلقة النهائية: المتصفح يفرغ الذاكرة على الشاشة دفعة واحدة
    dCtx.putImageData(imgData, 0, 0);
});
