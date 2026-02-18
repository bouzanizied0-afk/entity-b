const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// إعداد Socket.io مع السماح بالاتصالات العابرة للمواقع (CORS)
const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

// تقديم الملفات الثابتة (مثل index.html و Zied.js) من نفس المجلد
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- [ منطق إدارة نبضات QUP ] ---

io.on('connection', (socket) => {
    console.log(`✨ عقدة جديدة متصلة: ${socket.id}`);

    // 1. استقبال إشارة البداية وتوزيعها (اسم الملف، الحجم، Seed)
    socket.on('universal_stream_init', (data) => {
        console.log(`📢 بدء جلسة بث جديدة: ${data.name} | SID: ${data.sid}`);
        socket.broadcast.emit('universal_receive_init', data);
    });

    // 2. استقبال وتمرير نبضات البيانات (الطبقات 8, 4, 2, 1)
    socket.on('universal_stream', (payload) => {
        // إعادة البث لكل المستخدمين ما عدا المرسل
        socket.broadcast.emit('universal_receive', payload);
    });

    socket.on('disconnect', () => {
        console.log(`❌ انفصلت العقدة: ${socket.id}`);
    });
});

// تشغيل السيرفر على المنفذ 3000 أو المنفذ المتاح
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`
    ===========================================
    🚀 QUP Server Is Active
    📡 Listening on: http://localhost:${PORT}
    🛡️ Protocol: Spatio-Temporal Layering
    ===========================================
    `);
});
