  // --- إعداد Firebase ---
    import { db, PATHS } from "./serverCore.js";
    
    // --- عداد محلي للمزامنة ---
    let localT = 0;

// --- دالة لإرسال صورة ---
export async function sendImage(file) {
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);
    const base64Data = btoa(String.fromCharCode.apply(null, uint8));

    const counterSnap = await get(ref(db, PATHS.counter));
const nextT = (counterSnap.val() || 0) + 1;

const payload = { data: base64Data, type: file.type, T: nextT };

await set(ref(db, `${PATHS.stream}/state_${nextT}`), payload);
await set(ref(db, PATHS.counter), nextT);

    localT = nextT; // تحديث العداد المحلي
}

// --- دالة لتلقي الصور فورًا ---
export function onImageReceived(callback) {
    onValue(ref(db, PATHS.counter), async (snap) => {
    …
    const stateSnap = await get(ref(db, `${PATHS.stream}/state_${serverT}`));
            const state = stateSnap.val();
            if (state) {
                const dataURL = `data:${state.type};base64,${state.data}`;
                callback(dataURL, state.T);
            }
        }
    });
}
