/**
 * matrixTunnel.js - محرك النفق الرقمي
 * الوظيفة: تحويل بيانات الإنترنت الخام إلى نبضات مصفوفة مشفرة
 */

export const matrixTunnel = {
    // 1. تحويل الطلب إلى "نبضة مصفوفة" (Encoding)
    encodeRequest: (url) => {
        console.log("🔒 تشفير الطلب إلى نبضة مصفوفة...");
        // تحويل النص إلى أرقام مصفوفة (0-15) للتمويه
        const buffer = btoa(url); // تحويل العنوان لترميز Base64
        let matrixPulse = [];
        for (let i = 0; i < buffer.length; i++) {
            matrixPulse.push(buffer.charCodeAt(i) % 16); 
        }
        return matrixPulse; // هذه هي النبضة التي ستمر عبر ثغرة الـ DNS أو الأنبوب
    },

    // 2. فك تشفير البيانات القادمة من السيرفر (Decoding)
    decodeResponse: (matrixData) => {
        console.log("🔓 فك تشفير البيانات القادمة من النفق...");
        // هنا نقوم بتحويل الأرقام القادمة من أمريكا إلى بيانات يفهمها المتصفح
        // في هذه المرحلة، سنحولها إلى "خريطة بصرية" ليتم عرضها في ملف الـ index
        return matrixData;
    },

    // 3. بوابة الاتصال (The Gateway)
    sendThroughTunnel: async (socket, url) => {
        const pulse = matrixTunnel.encodeRequest(url);
        socket.emit("request-tunnel", { data: pulse });
        document.getElementById('status').innerText = "📡 النفق نشط: يتم الجلب من الخارج...";
    }
};
