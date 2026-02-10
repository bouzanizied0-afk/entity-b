// engineCore.js
export class StateEngine {
    constructor(callbacks) {
        this.onNewState = callbacks.onNewState; // دالة تُنفذ عند استلام صورة
        this.onStatusChange = callbacks.onStatusChange; // دالة لتحديث نصوص الحالة
    }

    async sendFile(file) {
        this.onStatusChange("جاري المعالجة والإرسال...");
        const reader = new FileReader();
        
        reader.onload = async (event) => {
            const uint8 = new Uint8Array(event.target.result);
            const base64Data = btoa(String.fromCharCode.apply(null, uint8));

            // مكان حفظ البيانات سيكون لاحقًا عند الربط بالخادم
            const payload = { data: base64Data, type: file.type };

            this.onNewState(`data:${payload.type};base64,${payload.data}`);
            this.onStatusChange("تم المعالجة محليًا.");
        };
        reader.readAsArrayBuffer(file);
    }
}
