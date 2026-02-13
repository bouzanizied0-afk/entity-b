const io = require("socket.io")(3000, {
  perMessageDeflate: false, // تعطيل الضغط لتوفير وقت المعالج
  transports: ["websocket"] // إجبار استخدام أسرع بروتوكول
});

io.on("connection", (socket) => {
  // استخدام Buffer لتسريع المعالجة بآلاف المرات
  socket.on("matrix-relay", (data) => {
    // volatile تعني: أرسل بأقصى سرعة ولا تنتظر رداً (Fast Stream)
    socket.broadcast.volatile.emit("matrix-relay", {
      r: data.r,
      payload: Buffer.from(data.payload), // التعامل مع البيانات كبايتات خام
      isAtomic: true
    });
  });
});
