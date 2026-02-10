// engine.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, onValue, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyD4XkZaqv7_c-uiUFc2NvZEFyQUapirz-Y",
    authDomain: "setouchi-it.firebaseapp.com",
    databaseURL: "https://setouchi-it-default-rtdb.europe-west1.firebasedatabase.app/",
    projectId: "setouchi-it",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export class StateEngine {
    constructor(callbacks) {
        this.localT = 0;
        this.onNewState = callbacks.onNewState; // دالة تُنفذ عند استلام صورة
        this.onStatusChange = callbacks.onStatusChange; // دالة لتحديث نصوص الحالة
        this.onHeartbeat = callbacks.onHeartbeat; // دالة لتحديث عداد النبض
        this.init();
    }

    init() {
        // الاستماع للنبض
        onValue(ref(db, "system/heartbeat"), (s) => this.onHeartbeat(s.val() || 0));

        // الاستماع التلقائي للحالات
        onValue(ref(db, "temporal/counter"), async (snap) => {
            const serverT = snap.val();
            if (serverT && serverT > this.localT) {
                this.localT = serverT;
                this.onStatusChange("جاري جلب بيانات جديدة...");
                
                const stateSnap = await get(ref(db, `temporal/stream/state_${serverT}`));
                const state = stateSnap.val();
                if (state) {
                    this.onNewState(`data:${state.type};base64,${state.data}`);
                    this.onStatusChange("تم التحديث تلقائياً.");
                }
            }
        });
    }

    async sendFile(file) {
        this.onStatusChange("جاري المعالجة والإرسال...");
        const reader = new FileReader();
        
        reader.onload = async (event) => {
            const uint8 = new Uint8Array(event.target.result);
            const base64Data = btoa(String.fromCharCode.apply(null, uint8));

            const counterSnap = await get(ref(db, "temporal/counter"));
            const nextT = (counterSnap.val() || 0) + 1;

            const payload = { data: base64Data, T: nextT, type: file.type };

            await set(ref(db, `temporal/stream/state_${nextT}`), payload);
            await set(ref(db, "temporal/counter"), nextT);
            
            this.localT = nextT;
            this.onStatusChange("تم الإرسال بنجاح.");
        };
        reader.readAsArrayBuffer(file);
    }
}
