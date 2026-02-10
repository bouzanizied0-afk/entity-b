<!DOCTYPE html>
<html lang="ar">
<head>
  <meta charset="UTF-8">
  <title>اختبار نظام التزامن للملفات</title>
  <style>
    body { font-family: sans-serif; background: #f0f0f0; padding: 30px; }
    .container { max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);}
    h1 { text-align: center; color: #333; }
    input[type="file"] { display: block; margin: 20px 0; }
    button { padding: 10px 20px; font-size: 16px; cursor: pointer; }
    #log { margin-top: 20px; background: #f9f9f9; padding: 10px; height: 200px; overflow-y: auto; border: 1px solid #ccc; border-radius: 4px; }
    #reconstructedFile { margin-top: 20px; }
  </style>
</head>
<body>

  <div class="container">
    <h1>🗂 تجربة إرسال ملف بالتزامن الحتمي</h1>

    <input type="file" id="fileInput" />
    <button id="sendBtn">إرسال الملف</button>

    <div id="log"></div>

    <div id="reconstructedFile">
      <h3>الملف المسترجع:</h3>
      <a id="downloadLink" href="#" download="reconstructed_file.bin">تحميل الملف المسترجع</a>
    </div>
  </div>

  <!-- ربط engins.js -->
  <script type="module">
    import { generatorSend, receiverListen } from './engins.js';

    const fileInput = document.getElementById("fileInput");
    const sendBtn = document.getElementById("sendBtn");
    const log = document.getElementById("log");
    const downloadLink = document.getElementById("downloadLink");

    // تسجيل الأحداث في صندوق اللوج
    function logMessage(msg) {
      log.innerHTML += `<div>${msg}</div>`;
      log.scrollTop = log.scrollHeight;
    }

    // إرسال الملف
    sendBtn.addEventListener("click", async () => {
      if (!fileInput.files.length) {
        alert("اختر ملفًا أولاً");
        return;
      }

      const file = fileInput.files[0];
      logMessage(`📤 جاري إرسال الملف: ${file.name}`);

      // لتحويل File إلى مسار / buffer محلي
      // هنا نفترض أن engins.js يدعم FileReader API
      await generatorSend(file, 0);

      logMessage(`✅ تم الإعلان عن حالة الملف على Firebase`);
    });

    // استقبال الملف المسترجع
    const outputPath = "reconstructed_file.bin"; // اسم الملف في النظام المحلي / Node
    const expectedQlen = 1024; // يجب تعديله حسب حجم الملف أو الاتفاق المسبق

    receiverListen(outputPath, expectedQlen);

    logMessage("👂 النظام في انتظار ملفات من Firebase...");
  </script>

</body>
</html>
