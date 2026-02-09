// --------------------- المرحلة 3 — التفكيك المحلي ---------------------
async function extract(file) {
  const buffer = await file.arrayBuffer();
  return new Uint8Array(buffer); // مصفوفة Bytes
}

// --------------------- المرحلة 4 — ربط العداد ---------------------
function encode(bytes, start = 0) {
  const out = [];
  let counter = start;

  for (const b of bytes) {
    out.push({ counter, value: b });
    counter++;
  }
  return out;
}

// --------------------- المرحلة 5 — الإرسال إلى Firebase ---------------------
async function sendStream(stream) {
  const display = document.getElementById("counterDisplay"); // عنصر العدّاد في الواجهة

  for (const item of stream) {
    const url = `https://setouchi-it-default-rtdb.europe-west1.firebasedatabase.app/stream/${item.counter}.json`;
    try {
      await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.value)
      });

      // تحديث قيمة العداد في الواجهة
      display.textContent = item.counter;

      // نبضة زمنية صغيرة لرؤية الحركة
      await new Promise(r => setTimeout(r, 5));

    } catch (err) {
      console.error("فشل الإرسال:", err);
      alert("حدث خطأ أثناء الإرسال، تحقق من الاتصال بالخادم");
      break;
    }
  }
  alert("تم الإرسال رقميًا");
}

// --------------------- المرحلة 6 — إعادة البناء ---------------------
async function fetchStream() {
  const url = "https://setouchi-it-default-rtdb.europe-west1.firebasedatabase.app/stream.json";
  const res = await fetch(url);
  const data = await res.json();

  // تحويل من {counter: value, ...} إلى مصفوفة {counter, value}
  const stream = Object.keys(data).map(key => ({
    counter: parseInt(key),
    value: data[key]
  }));

  return stream;
}

function reconstruct(stream) {
  stream.sort((a, b) => a.counter - b.counter);
  return new Uint8Array(stream.map(e => e.value));
}

function download(bytes, filename = "reconstructed.bin") {
  const blob = new Blob([bytes]);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

// --------------------- المرحلة 7 — ربط كل شيء ---------------------
document.getElementById("send").onclick = async () => {
  const file = document.getElementById("fileInput").files[0];
  if (!file) return alert("اختر ملفاً أولاً");

  const bytes = await extract(file);
  const stream = encode(bytes);

  // تأكد من وجود عنصر العدّاد في الواجهة
  if (!document.getElementById("counterDisplay")) {
    const span = document.createElement("span");
    span.id = "counterDisplay";
    span.style.display = "block";
    span.style.marginTop = "10px";
    document.body.appendChild(span);
  }

  await sendStream(stream);
};

document.getElementById("rebuild").onclick = async () => {
  const stream = await fetchStream();
  const bytes = reconstruct(stream);
  download(bytes);
};
