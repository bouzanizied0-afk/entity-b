انه في نفس المتصفح ولكن انا كمرسل عندما احاول رفع الصورة اضغط عليها فلا تظهر اجب فقط ولا تعدل
// worker.js
let offscreenCanvas = null;
let ctx = null;
let imageData = null; // Uint8ClampedArray
let width = 0;
let height = 0;

let currentR = 0;
let currentG = 0;
let currentB = 0;
let currentA = 255; // Alpha channel

let processedPixelsCount = 0; // لتعقب التقدم

onmessage = (e) => {
    if (e.data.type === 'initCanvas') {
        offscreenCanvas = e.data.canvas;
        ctx = offscreenCanvas.getContext('2d', { alpha: false });
        // عند تهيئة الـ Worker، لا نرسم شيئاً بعد، فقط نتهيأ
    } else if (e.data.type === 'initImage') {
        width = e.data.width;
        height = e.data.height;
        imageData = new Uint8ClampedArray(e.data.imageData); // استقبال Buffer
        ctx.clearRect(0, 0, width, height); // مسح الكانفاس قبل البدء
        processedPixelsCount = 0; // إعادة تعيين العداد
        // إعدادات لكل worker حسب القناة التي سيتحكم بها (افتراضياً الكل يرى كل شيء)
        // في نظام أكثر تعقيداً، يمكن تقسيم البيانات هنا
    } else if (e.data.type === 'command') {
        const cmd = e.data.cmd;
        if (cmd.startsWith('GENERATE_BATCH')) {
            const parts = cmd.split(':');
            const startIndex = parseInt(parts[1]);
            const endIndex = parseInt(parts[2]);
            
            // هذا Worker مسؤول عن الرسم
            drawBatch(startIndex, endIndex);
        }
    } else if (e.data.type === 'clear') {
        if(ctx) ctx.clearRect(0,0,width,height);
        processedPixelsCount = 0;
    }
};

function drawBatch(startIndex, endIndex) {
    if (!ctx || !imageData || width === 0) return;

    // للحصول على ظهور تدريجي سريع، يمكننا التركيز على إكمال الصورة بسرعة
    // الفكرة هنا هي أن كل Worker يساهم في رسم جزء من الصورة
    // في سيناريو حقيقي، يمكن تقسيم البكسلات بشكل أكثر ذكاءً بين العمال

    // لنفترض أن هذا Worker مسؤول عن "التردد" الخاص به في اللون
    // حالياً، كلهم يرسمون البكسلات المحددة
    for (let i = startIndex; i < endIndex; i++) {
        const pixelIdx = i * 4;
        const r = imageData[pixelIdx];
        const g = imageData[pixelIdx + 1];
        const b = imageData[pixelIdx + 2];
        const a = imageData[pixelIdx + 3];

        const x = i % width;
        const y = Math.floor(i / width);
        
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
        ctx.fillRect(x, y, 1, 1);

        // تحديث العدادات (هذه طريقة مبسطة، في التطبيق الحقيقي كل Worker سيحدث عداده الخاص)
        postMessage({ type: 'updateCounter', value: r, channel: 'r' });
        postMessage({ type: 'updateCounter', value: g, channel: 'g' });
        postMessage({ type: 'updateCounter', value: b, channel: 'b' });
        postMessage({ type: 'updateCounter', value: a, channel: 'a' });
    }
    processedPixelsCount += (endIndex - startIndex);
    // يمكن إرسال رسالة "الرسم اكتمل" إذا أردنا
    // postMessage({ type: 'drawComplete', count: processedPixelsCount });
}
انظر في الملفين اين الخطا ولا تعدل
