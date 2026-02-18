// --- [0. قناة الاتصال الموحدة] ---
import { io } from "https://cdn.socket.io/4.7.4/socket.io.esm.min.js";
const socket = io("http://127.0.0.1:3000"); 

// --- [1. الحالة العالمية الموحدة: خزان الذاكرة والنبض] ---
let fileBuffer = null;      
let lastSessionID = null;   
let virtualClock = 0;       
let currentGlobalSeed = 0;  

// ملاحظة: تم نقل إشارة socket.emit الأولية إلى داخل دالة التحميل لضمان وجود بيانات الملف

// --- [2. النواة الحسابية: البوصلة والمحاسب] ---
function getSpatioTemporalByte(tick, seed) {
    const compositeWave = (
        Math.sin(tick * 0.05 + seed) + 
        Math.cos(tick * 0.03 + seed * 1.5) + 
        Math.sin(tick * 0.01 + seed * 2.2)
    );
    return Math.floor(((compositeWave / 3) + 1) * 127.5);
}

function countPulses(packet) {
    let pulseCount = 0;
    let i = 0;
    while (i < packet.length) {
        const char = packet[i];
        if (char === 'S') { 
            let end = packet.indexOf('.', i); 
            pulseCount += parseInt(packet.substring(i + 1, end)); 
            i = end + 1; 
        }
        else if (char === 'B' || char === 'M') { pulseCount += 1; i += 2; }
        else if (char === 'X') { pulseCount += 1; i += 4; }
        else { i++; }
    }
    return pulseCount;
}

// --- [3. المعمار الباني: وظيفة الـ Render] ---
function render(clk, step, seed, byteValue) {
    const offset = clk * step;
    if (!fileBuffer || offset >= fileBuffer.length) return;

    if (byteValue === -1) {
        fileBuffer[offset] = getSpatioTemporalByte(clk, seed);
    } else {
        fileBuffer[offset] = byteValue;
    }

    if (clk % 1000 === 0) {
        if (typeof updateProgressPulse === "function") updateProgressPulse(offset / fileBuffer.length);
    }
}

// --- [4. بوابة الدخول: مستقبل الملفات والرسائل] ---
document.getElementById('fileInput').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();
    const rawData = new Uint8Array(arrayBuffer);
    const sessionID = Date.now();
    currentGlobalSeed = Math.random(); 

    console.log(`📡 استيعاب ملف: ${file.name} | الحجم: ${rawData.length}`);

    // هنا يتم الربط المباشر مع السيرفر عند تحميل الملف
    socket.emit('qup_stream_init', { 
        name: file.name, 
        total: rawData.length, 
        sid: sessionID, 
        seed: currentGlobalSeed 
    });

    const sendBtn = document.getElementById('sendBtn');
    sendBtn.disabled = false;
    sendBtn.onclick = () => executeUniversalStream(rawData, currentGlobalSeed, sessionID);
};

window.injectTextMessage = (text) => {
    const encoder = new TextEncoder();
    const textData = encoder.encode(text);
    const sid = Date.now();
    const seed = Math.random();
    socket.emit('qup_stream_init', { name: "TextPulse", total: textData.length, sid: sid, seed: seed });
    executeUniversalStream(textData, seed, sid);
};

// --- [5. المحلل الطبقي: محرك بث البايتات] ---
async function executeUniversalStream(rawData, seed, sid) {
    const layers = [8, 4, 2, 1];
    const threshold = 5;

    for (let step of layers) {
        let packet = "";
        let skipCount = 0;
        let clock = 0;

        for (let i = 0; i < rawData.length; i += step) {
            const actualByte = rawData[i];
            const predictedByte = getSpatioTemporalByte(clock, seed);
            const isMatch = Math.abs(actualByte - predictedByte) < threshold;

            if (isMatch) {
                skipCount++;
            } else {
                if (skipCount > 0) { packet += "S" + skipCount + "."; skipCount = 0; }
                packet += "B" + String.fromCharCode(0x4E00 + actualByte);
            }
            clock++;

            if (packet.length > 8000) {
                if (skipCount > 0) { packet += "S" + skipCount + "."; skipCount = 0; }
                socket.emit('qup_stream', { d: packet, step, c: clock, total: rawData.length, sid: sid, seed: seed });
                packet = "";
                await new Promise(res => setTimeout(res, 0));
            }
        }
        if (packet || skipCount > 0) {
            if (skipCount > 0) packet += "S" + skipCount + ".";
            socket.emit('qup_stream', { d: packet, step: step, c: clock, sid: sid, seed: seed, total: rawData.length });
        }
    }
}

// --- [6. المترجم الشامل: استقبال وإعادة بناء المادة] ---
socket.on('qup_receive', (data) => {
    if (!data || !data.d) return;

    if (data.sid !== lastSessionID) {
        fileBuffer = new Uint8Array(new SharedArrayBuffer(data.total));
        lastSessionID = data.sid;
        virtualClock = 0;
        console.log("🌀 تم مزامنة الجلسة الجديدة.");
    }

    const raw = data.d;
    const step = data.step;
    let clk = data.c - countPulses(raw); 
    
    let i = 0;
    while (i < raw.length) {
        if (raw[i] === "S") {
            let end = raw.indexOf(".", i);
            let count = parseInt(raw.substring(i + 1, end));
            for (let s = 0; s < count; s++) {
                render(clk + s, step, data.seed, -1);
            }
            clk += count;
            i = end + 1;
        } 
        else if (raw[i] === "B") {
            const byteValue = raw.charCodeAt(i + 1) - 0x4E00;
            render(clk, step, data.seed, byteValue);
            clk++;
            i += 2;
        } 
        else i++;
    }
    virtualClock = clk;
});

// --- [7. الربط مع الواجهة] ---
function updateProgressPulse(ratio) {
    const el = document.getElementById('progressStatus');
    if (el) el.innerText = Math.floor(ratio * 100) + "%";
}
