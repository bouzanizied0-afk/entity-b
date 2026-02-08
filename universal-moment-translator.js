export class UniversalMomentTranslator {

    constructor(canvasContext, localQueue) {
        this.ctx = canvasContext;
        this.localQueue = localQueue; // ربط بالـ queue المحلي
        this.INTERPRETATION_SPACE = this.buildInterpretationSpace();
    }

    /* ===============================
       Moment Observer
    =============================== */
    onMoment(moment) {
        if(this.localQueue.length>0){
            // deterministic choice من queue المحلي
            const index = moment % this.localQueue.length;
            const state = this.localQueue[index];
            this.executeState(state);
        } else {
            // fallback: deterministic state من INTERPRETATION_SPACE
            const stateId = this.reducer(moment);
            const action = this.INTERPRETATION_SPACE[stateId];
            if(action) action();
        }
    }

    /* ===============================
       Deterministic Reducer
    =============================== */
    reducer(moment) {
        const keys = Object.keys(this.INTERPRETATION_SPACE);
        return keys[moment % keys.length];
    }

    /* ===============================
       Execute State / Render
    =============================== */
    executeState(state){
        const ctx = this.ctx;
        ctx.canvas.width=256; ctx.canvas.height=256;
        ctx.fillStyle="#000"; ctx.fillRect(0,0,256,256);

        if(state.type==='text'){
            ctx.fillStyle="#0f0";
            ctx.font="32px monospace";
            ctx.fillText(state.value,50,140);
        }

        if(state.type==='file'){
            // مجرد عرض اسم الملف
            ctx.fillStyle="#0ff";
            ctx.font="16px monospace";
            ctx.fillText("File: "+state.value,10,128);
        }
    }

    /* ===============================
       Interpretation Space – local deterministic
    =============================== */
    buildInterpretationSpace() {
        const ctx = this.ctx;
        return {
            '0': ()=>{ ctx.fillStyle="#0f0"; ctx.fillRect(0,0,256,256); },
            '1': ()=>{ ctx.fillStyle="#00f"; ctx.fillRect(0,0,256,256); },
            '2': ()=>{ ctx.fillStyle="#f00"; ctx.fillRect(0,0,256,256); },
            '3': ()=>{ ctx.fillStyle="#ff0"; ctx.fillRect(0,0,256,256); },
            '4': ()=>{ ctx.fillStyle="#0ff"; ctx.fillRect(0,0,256,256); }
        };
    }
}
