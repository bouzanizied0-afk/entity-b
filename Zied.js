import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, update, onValue, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyD4XkZaqv7_c-uiUFc2NvZEFyQUapirz-Y",
    authDomain: "setouchi-it.firebaseapp.com",
    databaseURL: "https://setouchi-it-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "setouchi-it"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const rootPath = 'QUP_Termux_Stream';
const canvas = document.getElementById('matrixCanvas');
const ctx = canvas.getContext('2d', { alpha: false });

function getSpatioTemporalClock(tick) {
    return {
        r: Math.floor((Math.sin(tick * 0.05) + 1) * 127.5),
        g: Math.floor((Math.cos(tick * 0.03) + 1) * 127.5),
        b: Math.floor((Math.sin(tick * 0.01) + 1) * 127.5)
    };
}

// 1. الإرسال اللوني الكامل (Full RGB Encoding)
document.getElementById('sendBtn').onclick = async () => {
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const layers = [8, 4, 2, 1];
    const threshold = 10;
    
    await set(ref(db, rootPath), null);

    for (let step of layers) {
        let packet = "";
        let skipCount = 0;
        let clock = 0;

        for (let y = 0; y < canvas.height; y += step) {
            for (let x = 0; x < canvas.width; x += step) {
                const idx = (y * canvas.width + x) * 4;
                const r = pixels[idx], g = pixels[idx+1], b = pixels[idx+2];
                
                const pred = getSpatioTemporalClock(clock);
                const isMatch = Math.abs(r - pred.r) < threshold && Math.abs(g - pred.g) < threshold;

                if (isMatch) {
                    skipCount++;
                } else {
                    if (skipCount > 0) { packet += "S" + skipCount + "."; skipCount = 0; }
                    // X + 3 رموز للألوان (إجمالي 4 رموز) لضمان الدقة المجهرية
                    packet += "X" + String.fromCharCode(0x4E00 + r) + 
                                   String.fromCharCode(0x5E00 + g) + 
                                   String.fromCharCode(0x6E00 + b);
                }
                clock++;

                if (packet.length > 6000) {
                    if (skipCount > 0) { packet += "S" + skipCount + "."; skipCount = 0; }
                    await update(ref(db, rootPath), { d: packet, step, c: clock, w: canvas.width, h: canvas.height });
                    packet = "";
                    await new Promise(res => setTimeout(res, 5));
                }
            }
        }
        if (packet || skipCount > 0) {
            if (skipCount > 0) packet += "S" + skipCount + ".";
            await update(ref(db, rootPath), { d: packet, step, c: clock, w: canvas.width, h: canvas.height });
        }
    }
};

// 2. الاستقبال بالألوان وتصحيح الشبكة (Grid Sync & Overdrawing +0.5)
onValue(ref(db, rootPath), (snap) => {
    const data = snap.val();
    if (!data || !data.d) return;

    if (canvas.width !== data.w) {
        canvas.width = data.w; canvas.height = data.h;
    }

    const raw = data.d;
    const step = data.step;
    const w = data.w;
    let clk = data.c - countPixels(raw);
    let i = 0;

    while (i < raw.length) {
        if (raw[i] === "S") {
            let end = raw.indexOf(".", i);
            let count = parseInt(raw.substring(i + 1, end));
            for (let s = 0; s < count; s++) { render(clk, step, w, -1); clk++; }
            i = end + 1;
        } else if (raw[i] === "X") {
            const r = raw.charCodeAt(i + 1) - 0x4E00;
            const g = raw.charCodeAt(i + 2) - 0x5E00;
            const b = raw.charCodeAt(i + 3) - 0x6E00;
            render(clk, step, w, r, g, b);
            clk++;
            i += 4;
        } else i++;
    }
});

function render(clk, step, w, r, g = 0, b = 0) {
    // تصحيح الشبكة بناءً على العرض الثابت
    const pixelsPerRow = Math.ceil(w / step);
    const x = (clk % pixelsPerRow) * step;
    const y = Math.floor(clk / pixelsPerRow) * step;
    
    let finalR, finalG, finalB;
    if (r === -1) {
        const pred = getSpatioTemporalClock(clk);
        finalR = pred.r; finalG = pred.g; finalB = pred.b;
    } else {
        finalR = r; finalG = g; finalB = b;
    }
    
    ctx.fillStyle = `rgb(${finalR},${finalG},${finalB})`;
       // استبدل السطر في دالة render بهذا المنطق:
    const size = (step === 1) ? step : step + 0.5;

function countPixels(p) {
    let total = 0, i = 0;
    while(i < p.length) {
        if(p[i] === 'S') { 
            let end = p.indexOf('.', i); 
            total += parseInt(p.substring(i+1, end)); 
            i = end + 1; 
        }
        else if(p[i] === 'X') { total += 1; i += 4; }
        else i++;
    }
    return total;
}

document.getElementById('fileInput').onchange = (e) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width; canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            document.getElementById('sendBtn').disabled = false;
        };
        img.src = ev.target.result;
    };
    reader.readAsDataURL(e.target.files[0]);
};
