// --- [1. الحالة العالمية الموحدة: خزان الذاكرة والنبض] ---
let fileBuffer = null;      // الجسر المادي لتخزين البايتات (Uint8Array)
let lastSessionID = null;   // معرف الجلسة لضمان عدم تداخل البيانات
let virtualClock = 0;       // إبرة العداد الدوار المرجعية
let currentGlobalSeed = 0;  // مفتاح التزامن الزمكاني

// الاعتماد على المتغيرات الممررة من الواجهة (index.html)
const db = window.db;
const streamRef = window.streamRef;
const fbSet = window.fbSet;
const fbOnValue = window.fbOnValue;

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

    // تحديث الواجهة عند كل 100 نبضة لضمان سلاسة العداد في فيرباس
    if (clk % 100 === 0) {
        window.updateProgressPulse(offset / fileBuffer.length);
        window.updateRotaryVisual(clk);
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

    console.log(`📡 استيعاب مصفوفة: ${file.name} | الحجم الكلي: ${rawData.length}`);
    window.logToChat(`تم تجهيز المصفوفة: ${file.name} لبث النبضات.`);

    const sendBtn = document.getElementById('sendBtn');
    sendBtn.disabled = false;
    sendBtn.onclick = () => {
        window.logToChat("🚀 انطلاق النبضة الكاملة عبر قناة التزامن...");
        executeUniversalStream(rawData, currentGlobalSeed, sessionID);
    };
};

// حقن الرسائل النصية كنبضات (Unified Chat Protocol)
window.injectTextMessage = (text) => {
    const encoder = new TextEncoder();
    const textData = encoder.encode(text);
    const sessionID = Date.now();
    executeUniversalStream(textData, Math.random(), sessionID);
};

// --- [5. المحلل الطبقي: محرك بث البايتات عبر Firebase] ---

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

            // تقليل حجم الحزمة لـ 1000 حرف لضمان استقرار Firebase Realtime
            if (packet.length > 1000) {
                if (skipCount > 0) { packet += "S" + skipCount + "."; skipCount = 0; }
                await fbSet(streamRef, { 
                    d: packet, 
                    step: step, 
                    c: clock, 
                    total: rawData.length, 
                    sid: sid, 
                    seed: seed,
                    t: Date.now() // مفتاح لضمان استجابة onValue اللحظية
                });
                packet = "";
                // تأخير بسيط لمنع تجاوز حدود الـ Rate limit في فيرباس
                await new Promise(res => setTimeout(res, 10));
            }
        }
        if (packet || skipCount > 0) {
            if (skipCount > 0) packet += "S" + skipCount + ".";
            await fbSet(streamRef, { 
                d: packet, 
                step: step, 
                c: clock, 
                total: rawData.length, 
                sid: sid, 
                seed: seed,
                t: Date.now()
            });
        }
        window.logToChat(`انتهى بث الطبقة ${step} بنجاح.`);
    }
}

// --- [6. المترجم الشامل: استقبال وإعادة بناء المادة من Firebase] ---

fbOnValue(streamRef, (snapshot) => {
    const data = snapshot.val();
    if (!data || !data.d) return;

    // تهيئة الذاكرة للجلسة الجديدة (تم استبدال SharedArrayBuffer لضمان التوافق)
    if (data.sid !== lastSessionID) {
        fileBuffer = new Uint8Array(data.total);
        lastSessionID = data.sid;
        virtualClock = 0;
        window.logToChat(`استقبال جلسة جديدة: [${data.sid}] - الحجم: ${data.total} بايت`);
    }

    const raw = data.d;
    const step = data.step;
    const currentSeed = data.seed;
    let currentTick = data.c - countPulses(raw); 
    let i = 0;

    while (i < raw.length) {
        if (raw[i] === "S") {
            let end = raw.indexOf(".", i);
            let count = parseInt(raw.substring(i + 1, end));
            for (let s = 0; s < count; s++) {
                render(currentTick + s, step, currentSeed, -1);
            }
            currentTick += count;
            i = end + 1;
        } 
        else if (raw[i] === "B") {
            const byteValue = raw.charCodeAt(i + 1) - 0x4E00;
            render(currentTick, step, currentSeed, byteValue);
            currentTick++;
            i += 2;
        } 
        else i++;
    }
    virtualClock = currentTick;
    
    // فحص اكتمال البناء في الطبقة الأخيرة
    if (step === 1 && virtualClock >= (fileBuffer.length - 1)) {
        triggerFinalAssembly();
    }
});

// --- [7. المعالجة النهائية: تجميع الملف] ---

function triggerFinalAssembly() {
    window.logToChat("💎 اكتمل استحضار المادة الرقمية. جاري تجهيز الملف النهائي...");
    // هنا يمكن إضافة دالة لتحميل الملف تلقائياً
    const blob = new Blob([fileBuffer]);
    const url = URL.createObjectURL(blob);
    window.logToChat(`<a href="${url}" download="Sync_File_${lastSessionID}" style="color:var(--neon-green)">💾 انقر هنا لتحميل الملف المستلم</a>`);
}
