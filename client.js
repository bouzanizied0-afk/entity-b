    <script type="module">
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

        let localT = 0;

        // 1. تحديث عداد الخادم للتحقق من الاتصال
        onValue(ref(db, "system/heartbeat"), (s) => document.getElementById("serverTimer").innerText = s.val() || 0);

        // 2. الاستماع والمزامنة التلقائية (الميزة المطلوبة)
        onValue(ref(db, "temporal/counter"), async (snap) => {
            const serverT = snap.val();
            
            // إذا كان العداد على الخادم أكبر من العداد المحلي، يعني هناك صورة جديدة
            if (serverT && serverT > localT) {
                localT = serverT; // تحديث العداد المحلي فوراً لمنع التكرار
                
                document.getElementById("statusText").innerText = "جاري جلب الصورة تلقائياً...";
                document.getElementById("loader").style.display = "block";

                const stateSnap = await get(ref(db, `temporal/stream/state_${serverT}`));
                const incomingState = stateSnap.val();

                if (incomingState) {
                    const imgElement = document.getElementById("resultImg");
                    imgElement.src = `data:${incomingState.type};base64,${incomingState.data}`;
                    imgElement.style.display = "block";
                    
                    document.getElementById("loader").style.display = "none";
                    document.getElementById("statusText").innerText = "تم استلام صورة جديدة وتحديثها.";
                }
            }
        });

        // 3. عملية الإرسال
        document.getElementById('fileInput').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            document.getElementById("statusText").innerText = "جاري معالجة الصورة وإرسالها...";
            document.getElementById("loader").style.display = "block";

            const reader = new FileReader();
            reader.onload = async (event) => {
                const base64Data = btoa(String.fromCharCode.apply(null, new Uint8Array(event.target.result)));

                const counterSnap = await get(ref(db, "temporal/counter"));
                const nextT = (counterSnap.val() || 0) + 1;

                const payload = {
                    data: base64Data,
                    T: nextT,
                    type: file.type
                };

                await set(ref(db, `temporal/stream/state_${nextT}`), payload);
                await set(ref(db, "temporal/counter"), nextT);
                
                localT = nextT; // المزامنة محلياً لعدم استقبال ما أرسلته أنا
                document.getElementById("loader").style.display = "none";
                document.getElementById("statusText").innerText = "تم الإرسال بنجاح.";
            };
            reader.readAsArrayBuffer(file);
        });
    </script>
