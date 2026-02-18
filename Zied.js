import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue } from "firebase/database";

// 1. إعداد الاتصال الكوني
const firebaseConfig = {
  apiKey: "AIzaSyAZs0bb_t-bzMtaJqy_W_QDBSdQKHLEiD4",
  authDomain: "ziedzizou-7b74d.firebaseapp.com",
  databaseURL: "https://ziedzizou-7b74d-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "ziedzizou-7b74d",
  storageBucket: "ziedzizou-7b74d.firebasestorage.app",
  messagingSenderId: "937969676323",
  appId: "1:937969676323:web:8c89472de068a2e6cd0196"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const streamRef = ref(db, 'universal_sync_stream');

// --- [الحالة العالمية] ---
let fileBuffer = null;
let lastSessionID = null;
let currentGlobalSeed = 0;

// 2. البوصلة الزمكانية (The Compass)
function getSpatioTemporalByte(tick, seed) {
    const compositeWave = (Math.sin(tick * 0.05 + seed) + Math.cos(tick * 0.03 + seed * 1.5) + Math.sin(tick * 0.01 + seed * 2.2));
    return Math.floor(((compositeWave / 3) + 1) * 127.5);
}

// 3. المحاسب (The Pulse Counter)
function countUniversalPulses(packet) {
    let pulseCount = 0, i = 0;
    while (i < packet.length) {
        if (packet[i] === 'S') { 
            let end = packet.indexOf('.', i); 
            pulseCount += parseInt(packet.substring(i + 1, end)); 
            i = end + 1; 
        }
        else if (packet[i] === 'B') { pulseCount += 1; i += 2; }
        else i++;
    }
    return pulseCount;
}

// 4. المعمار/العازف (The Architect)
function render(clk, step, seed, byteValue) {
    const offset = clk * step;
    if (!fileBuffer || offset >= fileBuffer.length) return;
    fileBuffer[offset] = (byteValue === -1) ? getSpatioTemporalByte(clk, seed) : byteValue;
}

// 5. البوابة والمحلل (The Gateway & Streamer)
document.getElementById('fileInput').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const rawData = new Uint8Array(await file.arrayBuffer());
    const sid = Date.now();
    currentGlobalSeed = Math.random();

    document.getElementById('sendBtn').onclick = async () => {
        const layers = [8, 4, 2, 1];
        for (let step of layers) {
            let packet = "", skipCount = 0, clock = 0;
            for (let i = 0; i < rawData.length; i += step) {
                const isMatch = Math.abs(rawData[i] - getSpatioTemporalByte(clock, currentGlobalSeed)) < 5;
                if (isMatch) skipCount++;
                else {
                    if (skipCount > 0) { packet += "S" + skipCount + "."; skipCount = 0; }
                    packet += "B" + String.fromCharCode(0x4E00 + rawData[i]);
                }
                clock++;
                if (packet.length > 1000) { // حزم أصغر لتناسب فيرباس
                    await set(streamRef, { d: packet, step, c: clock, total: rawData.length, sid, seed: currentGlobalSeed, t: Date.now() });
                    packet = "";
                }
            }
            if (packet || skipCount > 0) {
                if (skipCount > 0) packet += "S" + skipCount + ".";
                await set(streamRef, { d: packet, step, c: clock, total: rawData.length, sid, seed: currentGlobalSeed, t: Date.now() });
            }
        }
    };
};

// 6. المترجم الشامل (The Universal Decoder)
onValue(streamRef, (snapshot) => {
    const data = snapshot.val();
    if (!data || !data.d) return;

    if (data.sid !== lastSessionID) {
        fileBuffer = new Uint8Array(data.total); // استخدام Uint8Array لضمان التوافق
        lastSessionID = data.sid;
    }

    const packet = data.d;
    let currentTick = data.c - countUniversalPulses(packet);
    let i = 0;
    while (i < packet.length) {
        if (packet[i] === 'S') {
            let end = packet.indexOf('.', i);
            let count = parseInt(packet.substring(i + 1, end));
            for (let s = 0; s < count; s++) render(currentTick + s, data.step, data.seed, -1);
            currentTick += count; i = end + 1;
        } else if (packet[i] === 'B') {
            render(currentTick, data.step, data.seed, packet.charCodeAt(i + 1) - 0x4E00);
            currentTick++; i += 2;
        } else i++;
    }
});
