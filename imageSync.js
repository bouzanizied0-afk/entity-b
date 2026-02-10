import {
  ref,
  get,
  set,
  onValue
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

/* ================== إعدادات ================== */
const STREAM = "temporal/stream";
const COUNTER = "temporal/counter";

/* ================== حالة محلية ================== */
let localT = 0;
let reconstruction = [];

/* ================== تفكيك الصورة محليًا ================== */
export async function fingerprintImage(file) {
  const bmp = await createImageBitmap(file);

  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(bmp, 0, 0, 64, 64);

  const { data } = ctx.getImageData(0, 0, 64, 64);

  // استخراج بصمة كثافة (ليس بايتات الصورة)
  const fingerprint = [];
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    fingerprint.push(((r + g + b) / 3) | 0);
  }

  return fingerprint;
}

/* ================== بث البصمة تدريجيًا ================== */
export async function transmitFingerprint(db, fingerprint) {
  const snap = await get(ref(db, COUNTER));
  let T = snap.val() || 0;

  for (let i = 0; i < fingerprint.length; i++) {
    T++;

    await set(ref(db, `${STREAM}/state_${T}`), {
      v: fingerprint[i],   // إشارة، لا صورة
      i,                   // موضع
    });

    await set(ref(db, COUNTER), T);
  }

  localT = T;
}

/* ================== استقبال + تركيب تقاربي ================== */
export function listenAndReconstruct(db, onUpdate) {
  onValue(ref(db, COUNTER), async (snap) => {
    const serverT = snap.val();
    if (!serverT || serverT <= localT) return;

    for (let t = localT + 1; t <= serverT; t++) {
      const s = await get(ref(db, `${STREAM}/state_${t}`));
      const state = s.val();
      if (!state) continue;

      reconstruction[state.i] = state.v;
      onUpdate(reconstruction);
    }

    localT = serverT;
  });
}
