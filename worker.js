let imageData = null; 
let width = 0;
let height = 0;
let myChannel = ''; 

onmessage = (e) => {
    if (e.data.type === 'initImage') {
        width = e.data.width;
        height = e.data.height;
        imageData = new Uint8ClampedArray(e.data.imageData);
        myChannel = e.data.channel; // التخصص: r أو g أو b أو a
    } else if (e.data.type === 'command') {
        const parts = e.data.cmd.split(':');
        drawBatch(parseInt(parts[1]), parseInt(parts[2]));
    }
};

function drawBatch(startIndex, endIndex) {
    if (!imageData) return;
    
    let batchPixels = [];

    for (let i = startIndex; i < endIndex; i++) {
        const idx = i * 4;
        const x = i % width;
        const y = Math.floor(i / width);

        let r=0, g=0, b=0, a=0;
        let colorVal = 0;

        // تنفيذ أمرك: كل مصنع يهتم بلونه الخاص وإزاحته فقط
        if (myChannel === 'r') { r = imageData[idx]; colorVal = r; a = 255; }
        else if (myChannel === 'g') { g = imageData[idx+1]; colorVal = g; a = 255; }
        else if (myChannel === 'b') { b = imageData[idx+2]; colorVal = b; a = 255; }
        else if (myChannel === 'a') { a = imageData[idx+3]; colorVal = a; }

        batchPixels.push({x, y, r, g, b, a, colorVal});
    }

    // إرسال الدفعة كاملة لتسريع "طريق" البيانات
    postMessage({ type: 'renderBatch', data: batchPixels, channel: myChannel });
}
