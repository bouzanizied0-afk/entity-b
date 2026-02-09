// --------------------- إعدادات ---------------------
const CHUNK_SIZE = 1024 * 4; // 4KB لكل Chunk
const FIREBASE_URL = "https://setouchi-it-default-rtdb.europe-west1.firebasedatabase.app/stream";

// --------------------- استخراج البايتات ---------------------
async function extract(file) {
  const buffer = await file.arrayBuffer();
  return new Uint8Array(buffer);
}

// --------------------- تقسيم إلى Chunks ---------------------
function chunkBytes(bytes) {
  const chunks = [];
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.slice(i, i + CHUNK_SIZE);
    chunks.push(chunk);
  }
  return chunks;
}

// --------------------- إرسال Chunks إلى Firebase ---------------------
async function sendChunks(chunks, progressCallback) {
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const url = `${FIREBASE_URL}/${i}.json`;

    await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Array.from(chunk))
    });

    if (progressCallback) progressCallback(i + 1, chunks.length);
  }
}

// --------------------- سحب Chunks وإعادة البناء ---------------------
async function fetchChunks() {
  const res = await fetch(`${FIREBASE_URL}.json`);
  const data = await res.json();
  if (!data) return [];

  // تحويل كل Chunk إلى Uint8Array
  const chunks = Object.keys(data)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .map(key => new Uint8Array(data[key]));

  return chunks;
}

function reconstructFromChunks(chunks) {
  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const c of chunks) {
    result.set(c, offset);
    offset += c.length;
  }
  return result;
}

// --------------------- تنزيل الملف ---------------------
function downloadFile(bytes, filename = "reconstructed.bin") {
  const blob = new Blob([bytes]);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

// --------------------- واجهة المستخدم ---------------------
document.getElementById("send").onclick = async () => {
  const file = document.getElementById("fileInput").files[0];
  if (!file) return alert("اختر ملفاً أولاً");

  const bytes = await extract(file);
  const chunks = chunkBytes(bytes);

  const progressBar = document.getElementById("counterDisplay");
  progressBar.textContent = `0 / ${chunks.length}`;

  await sendChunks(chunks, (sent, total) => {
    progressBar.textContent = `${sent} / ${total}`;
  });

  alert("تم الإرسال بنجاح");
};

document.getElementById("rebuild").onclick = async () => {
  const chunks = await fetchChunks();
  if (!chunks.length) return alert("لا توجد بيانات لإعادة البناء");

  const bytes = reconstructFromChunks(chunks);
  downloadFile(bytes, "reconstructed_file.bin");
};

// --------------------- دردشة نصية ---------------------
const chatBox = document.getElementById("chatBox");
const chatInput = document.getElementById("chatInput");
const chatSend = document.getElementById("chatSend");

chatSend.onclick = async () => {
  const text = chatInput.value.trim();
  if (!text) return;
  const url = `${FIREBASE_URL}/chat.json`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, time: Date.now() })
  });
  chatInput.value = "";
};

// --------------------- تحديث الدردشة ---------------------
async function updateChat() {
  const res = await fetch(`${FIREBASE_URL}/chat.json`);
  const data = await res.json();
  if (!data) return;

  chatBox.innerHTML = "";
  Object.values(data).forEach(msg => {
    const div = document.createElement("div");
    div.textContent = msg.text;
    chatBox.appendChild(div);
  });
}

// تحديث الدردشة كل ثانية
setInterval(updateChat, 1000);
