// إدارة الشبكة اللامركزية P2P - نسخة Chat Pro العالمية
export class P2PNetwork {
    constructor(onMessageReceived) {
        /**
         * تحديث استراتيجي: إضافة خوادم STUN عالمية.
         * هذه الخوادم تعمل كـ "دليل هاتف" ليعرف كل متصفح مكان الآخر 
         * عبر الإنترنت العالمي وتجاوز جدران الحماية (NAT Traversal).
         */
        this.peer = new Peer({
            config: {
                'iceServers': [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' },
                    { urls: 'stun:global.stun.twilio.com:3478?transport=udp' }
                ],
                'sdpSemantics': 'unified-plan'
            }
        }); 
        this.conn = null;
        this.onMessage = onMessageReceived;
    }

    // تشغيل العقدة والحصول على الـ ID
    init(onIdReady) {
        this.peer.on('open', (id) => onIdReady(id));

        // الاستماع للاتصالات القادمة
        this.peer.on('connection', (c) => {
            this.conn = c;
            console.log("تم الاتصال بواسطة طرف خارجي 🔗");
            this._setupListeners();
        });

        // التعامل مع أخطاء الشبكة
        this.peer.on('error', (err) => {
            console.error("خطأ في الشبكة P2P:", err.type);
            this.onMessage({ type: 'system', text: "حدث خطأ في الاتصال: " + err.type });
        });
    }

    // محاولة الربط مع طرف آخر (تونس <-> أمريكا)
    connect(peerId) {
        if (!peerId) return;
        /**
         * reliable: true تضمن وصول الرسائل كاملة وبترتيبها
         * حتى لو كان الإنترنت ضعيفاً بين القارات.
         */
        this.conn = this.peer.connect(peerId, {
            reliable: true 
        });
        this._setupListeners();
    }

    // إعداد مستمعي البيانات داخل النفق المشفر
    _setupListeners() {
        if (!this.conn) return;

        this.conn.on('open', () => {
            console.log("نفق البيانات مفتوح الآن 🟢");
            this.onMessage({ type: 'system', text: "تم الربط بنجاح! 🟢" });
        });

        this.conn.on('data', (data) => {
            this.onMessage(data);
        });

        this.conn.on('close', () => {
            this.onMessage({ type: 'system', text: "انقطع الاتصال بالطرف الآخر 🔴" });
        });
    }

    /**
     * إرسال البيانات (رسائل دردشة أو تنبيهات نظام)
     */
    sendData(dataObject) {
        if (this.conn && this.conn.open) {
            this.conn.send(dataObject);
        } else {
            console.warn("محاولة إرسال فاشلة: لا يوجد اتصال نشط.");
            this.onMessage({ type: 'system', text: "فشل الإرسال: العقدة غير متصلة! ❌" });
        }
    }
}
