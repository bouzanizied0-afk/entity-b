// ==================== client.js ====================

// رابط السيرفر الخاص بك
const SERVER_URL = "https://setouchi-it-default-rtdb.europe-west1.firebasedatabase.app";

// --------------------- مرحلة 1: تفكيك الملف ---------------------
async function extract(file) {
  const buffer = await file.arrayBuffer();
  return new Uint8Array(buffer); // مصفوفة Bytes
}

// --------------------- مرحلة 2: تقسيم إلى Chunks وربط العداد ---------------------
function encode(bytes, chunkSize = 1024) {
  const chunks = [];
  let counter = 0;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.slice(i, i + chunkSize);
    chunks.push({ counter, value: Array.from(slice) });
    counter++;
  }
  return chunks;
}

// --------------------- مرحلة 3: إرسال Chunks مع تحديث التقدم ---------------------
async function sendChunks(chunks) {
  const progressBar = document.getElementById("progressDisplay");
  for (const chunk of chunks) {
    const url = `${SERVER_URL}/stream/${chunk.counter}.json`;
    try {
      await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chunk.value)
      });

      // تحديث شريط التقدم
      const percent = Math.floor(((chunk.counter + 1) / chunks.length) * 100);
      if (progressBar) progressBar.textContent = `Progress: ${percent}%`;

      // نبضة صغيرة لرؤية الحركة
      await new Promise(r => setTimeout(r, 5));

    } catch (err) {
      console.error("فشل الإرسال:", err);
      alert("حدث خطأ أثناء الإرسال، تحقق من الاتصال بالخادم");
      break;
    }
  }
  alert("تم الإرسال بنجاح!");
}

// --------------------- مرحلة 4: سحب Chunks وإعادة البناء ---------------------
async function fetchChunks() {
  const res = await fetch(`${SERVER_URL}/stream.json`);
  const data = await res.json();

  if (!data) return [];

  // تحويل من {counter: value, ...} إلى مصفوفة {counter, value}
  const chunks = Object.keys(data).map(key => ({
    counter: parseInt(key),
    value: data[key]
  }));

  // ترتيب حسب الرقم
  chunks.sort((a, b) => a.counter - b.counter);
  return chunks;
}

function reconstruct(chunks) {
  const byteArrays = chunks.map(c => Uint8Array.from(c.value));
  // دمج جميع المصفوفات
  let totalLength = byteArrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of byteArrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

function downloadFile(bytes, filename = "reconstructed.bin") {
  const blob = new Blob([bytes]);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

// --------------------- مرحلة 5: ربط الأزرار ---------------------
document.getElementById("send").onclick = async () => {
  const file = document.getElementById("fileInput").files[0];
  if (!file) return alert("اختر ملفاً أولاً");

  const bytes = await extract(file);
  const chunks = encode(bytes);

  // تأكد من وجود عنصر شريط التقدم
  if (!document.getElementById("progressDisplay")) {
    const p = document.createElement("div");
    p.id = "progressDisplay";
    p.style.marginTop = "10px";
    document.body.appendChild(p);
  }

  await sendChunks(chunks);
};

document.getElementById("rebuild").onclick = async () => {
  const chunks = await fetchChunks();
  if (!chunks.length) return alert("لا توجد بيانات لإعادة البناء");

  const bytes = reconstruct(chunks);
  downloadFile(bytes);
};

// --------------------- دعم الرسائل النصية (خانة دردشة) ---------------------
const chatInput = document.getElementById("chatInput");
const chatDisplay = document.getElementById("chatDisplay");
const sendMsgBtn = document.getElementById("sendMsgBtn");

if (sendMsgBtn && chatInput && chatDisplay) {
  sendMsgBtn.onclick = () => {
    const text = chatInput.value.trim();
    if (!text) return;
    const msg = document.createElement("div");
    msg.textContent = text;
    chatDisplay.appendChild(msg);
    chatInput.value = "";
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
  };
}
