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
