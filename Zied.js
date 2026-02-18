// --- [1. الحالة العالمية الموحدة: المحرك والنبض] ---
let fileBuffer = null;      
let lastSessionID = null;   
let currentGlobalSeed = 0;  
let fileName = "QUP_DATA";


// --- [2. النواة الحسابية: التنبؤ الموجي] ---
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
        else if (char === 'B') { pulseCount += 1; i += 2; }
        else { i++; }
    }
    return pulseCount;
}

// --- [3. المعمار الباني: وظيفة الـ Render والتجسيد] ---
function render(clk, step, seed, byteValue, totalSize) {
    const offset = clk * step;
    if (!fileBuffer || offset >= totalSize) return;

    fileBuffer[offset] = (byteValue === -1) ? getSpatioTemporalByte(clk, seed) : byteValue;

    if (clk % 500 === 0) {
        if (window.updateProgressPulse) window.updateProgressPulse(offset / totalSize);
        // أضف هذا السطر لكي تتحرك أرقام الساعة في الواجهة
        if (window.updateRotaryVisual) window.updateRotaryVisual(clk);
    }
}


// --- [4. بوابة الإرسال الشاملة: (صور، فيديو، ملفات، نصوص)] ---
document.getElementById('fileInput').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    fileName = file.name;
    const arrayBuffer = await file.arrayBuffer();
    const rawData = new Uint8Array(arrayBuffer);
    const sessionID = Date.now();
    currentGlobalSeed = Math.random(); 

    console.log(`📡 بدء بث المادة: ${fileName} | الحجم: ${rawData.length} بايت`);

    window.fbSet(window.streamRef, { 
    type: 'init', name: fileName, total: rawData.length, sid: sessionID, seed: currentGlobalSeed 
});


    executeUniversalStream(rawData, currentGlobalSeed, sessionID, fileName);
};

async function executeUniversalStream(rawData, seed, sid, name) {
    const layers = [8, 4, 2, 1]; // التدرج من الشبحية إلى التجسيد
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
                window.fbSet(window.streamRef, { 
         d: packet, step, c: clock, total: rawData.length, sid, seed, name 
           });

                packet = "";
                await new Promise(res => setTimeout(res, 30));
            }
        }
        if (packet || skipCount > 0) {
            if (skipCount > 0) packet += "S" + skipCount + ".";
            window.fbSet(window.streamRef, { 
    d: packet, step, c: clock, total: rawData.length, sid, seed, name 
          });
        }
    }
}

// --- [5. المترجم والمنفذ النهائي (لحظة الحقيقة)] ---
    // --- [5. المترجم والمنفذ النهائي (لحظة الحقيقة)] ---
window.processIncomingPulse = (data) => {
    // التحقق من أن البيانات ليست فارغة
    if (!data || !data.d) return;

    // تهيئة الذاكرة (Buffer) عند أول نبضة من الجلسة
    if (data.sid !== lastSessionID) {
        fileBuffer = new Uint8Array(data.total);
        lastSessionID = data.sid;
        console.log(`📥 استلام إشارة الجلسة: ${data.sid}`);
    }


    const raw = data.d;
    const step = data.step;
    let currentTick = data.c - countPulses(raw); 
    let i = 0;

    // معالجة النبضات الواردة
    while (i < raw.length) {
        if (raw[i] === "S") {
            let end = raw.indexOf(".", i);
            let count = parseInt(raw.substring(i + 1, end));
            for (let s = 0; s < count; s++) {
                render(currentTick + s, step, data.seed, -1, data.total);
            }
            currentTick += count;
            i = end + 1;
        } 
        else if (raw[i] === "B") {
            const byteValue = raw.charCodeAt(i + 1) - 0x4E00;
            render(currentTick, step, data.seed, byteValue, data.total);
            currentTick++;
            i += 2;
        } 
        else i++;
    }

    // --- [حقن منطق التجسيد المادي] ---
    if (step === 1 && currentTick >= data.total) {
        console.log("🚀 اكتملت الطبقة الأخيرة.. جاري التجسيد المادي للمادة.");
        
        const finalBlob = new Blob([fileBuffer]); 
        const downloadUrl = URL.createObjectURL(finalBlob);
        
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = data.name || "QUP_SUCCESS_FILE";
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log("✅ تم تسليم الملف بنجاح وتفريغ قناة البث.");
        // تنظيف الذاكرة بعد الانتهاء
        fileBuffer = null;
        lastSessionID = null;
    }
};

