// matrixEngine.js
// نسخة 4.0 محلية ومستقلة كـ JS Module
// لا تتضمن أي HTML أو DOM داخلي


// ================== دوال أساسية ==================

/**
 * تحويل أي بكسل RGB إلى رقم صغير (0-15 افتراضي)
 * @param {number} r 
 * @param {number} g 
 * @param {number} b 
 * @param {number} scale دقة التحويل
 * @returns {number}
 */
export function pixelToNumber(r, g, b, scale = 16) {
    return Math.floor((r + g + b) / 3 / scale);
}

/**
 * ضغط صف من الأرقام إلى سلسلة (Base16)
 * @param {number[]} row 
 * @returns {string}
 */
export function compressRow(row) {
    return row.map(v => v.toString(16)).join('');
}

/**
 * فك ضغط صف مضغوط
 * @param {string} str 
 * @returns {number[]}
 */
export function decompressRow(str) {
    return str.split('').map(v => parseInt(v, 16));
}

/**
 * تشفير صف باستخدام XOR
 * @param {number[]} row 
 * @param {number} key 
 * @returns {number[]}
 */
export function encryptRow(row, key = 7) {
    return row.map(v => v ^ key);
}

/**
 * فك تشفير صف باستخدام XOR
 * @param {number[]} row 
 * @param {number} key 
 * @returns {number[]}
 */
export function decryptRow(row, key = 7) {
    return row.map(v => v ^ key);
}

/**
 * رسم مصفوفة رقمية على أي canvas
 * @param {number[][]} matrix 
 * @param {HTMLCanvasElement} canvas 
 */
export function drawMatrix(matrix, canvas) {
    const ctx = canvas.getContext('2d');
    const height = canvas.height;
    const width = canvas.width;
    const imgData = ctx.createImageData(width, height);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const val = matrix[y] && matrix[y][x] !== undefined ? matrix[y][x] : 0;
            const rgb = val * 16; // تقريبياً إعادة الرقم إلى لون
            const idx = (y * width + x) * 4;
            imgData.data[idx] = rgb;
            imgData.data[idx + 1] = rgb;
            imgData.data[idx + 2] = rgb;
            imgData.data[idx + 3] = 255;
        }
    }

    ctx.putImageData(imgData, 0, 0);
}

/**
 * تفكيك صورة إلى مصفوفة محليًا
 * @param {HTMLImageElement|HTMLCanvasElement} imgOrCanvas 
 * @param {number} matrixWidth 
 * @param {number} matrixHeight 
 * @param {number} scale 
 * @returns {number[][]} localMatrix
 */
export function extractMatrix(imgOrCanvas, matrixWidth = 100, matrixHeight = 100, scale = 16) {
    const canvas = document.createElement('canvas');
    canvas.width = matrixWidth;
    canvas.height = matrixHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imgOrCanvas, 0, 0, matrixWidth, matrixHeight);
    const imageData = ctx.getImageData(0, 0, matrixWidth, matrixHeight);

    const localMatrix = [];
    for (let y = 0; y < matrixHeight; y++) {
        const row = [];
        for (let x = 0; x < matrixWidth; x++) {
            const idx = (y * matrixWidth + x) * 4;
            const r = imageData.data[idx];
            const g = imageData.data[idx + 1];
            const b = imageData.data[idx + 2];
            row.push(pixelToNumber(r, g, b, scale));
        }
        localMatrix.push(row);
    }
    return localMatrix;
}


