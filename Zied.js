// 1. استبدال محرك Firebase بمحرك Socket.io الصاروخي
import { io } from "https://cdn.socket.io/4.7.4/socket.io.esm.min.js";

// الربط المباشر مع السيرفر في ترمكس
const socket = io("http://127.0.0.1:3000"); 

const canvas = document.getElementById('matrixCanvas');
const ctx = canvas.getContext('2d', { alpha: false });

// الحفاظ على عنصر الواجهة لعرض النسبة المئوية
let progressDisplay = document.getElementById('progressStatus');
if (!progressDisplay) {
    progressDisplay = document.createElement('div');
    progressDisplay.id = 'progressStatus';
    progressDisplay.style = "color: #0f0; font-family: monospace; margin: 10px 0;";
    document.body.insertBefore(progressDisplay, canvas);
}

// [أمانة]: منطق الساعة الزمنية كما هو دون تغيير
function getSpatioTemporalClock(tick) {
    return {
        r: Math.floor((Math.sin(tick * 0.05) + 1) * 127.5),
        g: Math.floor((Math.cos(tick * 0.03) + 1) * 127.5),
        b: Math.floor((Math.sin(tick * 0.01) + 1) * 127.5)
    };
}

// 2. نظام الإرسال (تم تحويله لـ Socket.emit)
document.getElementById('sendBtn').onclick = async () => {
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const layers = [8, 4, 2, 1];
    const threshold = 10;
    const sessionID = Date.now(); 

    progressDisplay.innerText = "🚀 إرسال مباشر عبر المحرك الجديد...";

    for (let step of layers) {
        let packet = "";
        let skipCount = 0;
        let clock = 0;
        const totalPixels = Math.ceil(canvas.width / step) * Math.ceil(canvas.height / step);

        for (let y = 0; y < canvas.height; y += step) {
            for (let x = 0; x < canvas.width; x += step) {
                const idx = (Math.floor(y) * canvas.width + Math.floor(x)) * 4;
                const r = pixels[idx], g = pixels[idx+1], b = pixels[idx+2];
                
                const pred = getSpatioTemporalClock(clock);
                const isMatch = Math.abs(r - pred.r) < threshold && Math.abs(g - pred.g) < threshold;

                if (isMatch) {
                    skipCount++;
                } else {
                    if (skipCount > 0) { packet += "S" + skipCount + "."; skipCount = 0; }
                    packet += "X" + String.fromCharCode(0x4E00 + r) + 
                                   String.fromCharCode(0x5E00 + g) + 
                                   String.fromCharCode(0x6E00 + b);
                }
                clock++;

                if (packet.length > 7000) {
                    if (skipCount > 0) { packet += "S" + skipCount + "."; skipCount = 0; }
                    
                    // تحويل الإرسال إلى السيرفر المحلي فوراً
                    socket.emit('qup_stream', { 
                        d: packet, step, c: clock, w: canvas.width, h: canvas.height, sid: sessionID 
                    });
                    
                    const percent = Math.floor((clock / totalPixels) * 100);
                    progressDisplay.innerText = `📡 طبقة [${step}]: ${percent}%`;
                    
                    packet = "";
                    // تقليل الـ delay إلى الصفر تقريباً لأن السوكيت يتحمل
                    await new Promise(res => setTimeout(res, 0)); 
                }
            }
        }
        if (packet || skipCount > 0) {
            if (skipCount > 0) packet += "S" + skipCount + ".";
            socket.emit('qup_stream', { d: packet, step, c: clock, w: canvas.width, h: canvas.height, sid: sessionID });
        }
    }
    progressDisplay.innerText = "✅ اكتمل الإرسال اللحظي";
};

// 3. الاستقبال الذكي (تم تحويله لـ Socket.on)
let lastSessionID = null;

socket.on('qup_receive', (data) => {
    if (!data || !data.d) return;

    if (data.sid !== lastSessionID || canvas.width !== data.w) {
        canvas.width = data.w; 
        canvas.height = data.h;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        lastSessionID = data.sid;
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

// [أمانة]: دالة الرسم كما هي مع الحفاظ على مقاسات الـ size الاحترافية
function render(clk, step, w, r, g = 0, b = 0) {
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
    const size = (step === 1) ? 1 : step + 0.6; 
    ctx.fillRect(x, y, size, size);
}

// [أمانة]: دالة عد البكسلات كما هي
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
