# Frontend — ระบบยืมคืนทรัพย์สินบริษัท

Vue 3 + Vite + Vue Router + Axios

วิธีติดตั้งและรันทั้งระบบ (backend + frontend + ฐานข้อมูล) อยู่ที่ [README หลักของโปรเจกต์](../README.md)

```bash
npm install
npm run dev      # http://localhost:5180 (proxy /api และ /uploads ไปที่ backend พอร์ต 4100)
npm run build    # สร้างไฟล์สำหรับ deploy ในโฟลเดอร์ dist/
```

โครงสร้างหลักใน `src/`

| โฟลเดอร์ | หน้าที่ |
|---|---|
| `views/` | หน้าเว็บ (หน้าของ admin อยู่ใน `views/admin/`) |
| `components/` | NavBar, กระดิ่งแจ้งเตือน, ฟอร์มช่องกรอก ฯลฯ |
| `router/index.js` | เส้นทางและการตรวจสิทธิ์ตาม role |
| `services/api.js` | axios (แนบ JWT อัตโนมัติ) |
| `services/auth.js` | เก็บ session ผู้ใช้ |

หมายเหตุ: ไฟล์ `HelloWorld.vue`, `TheWelcome.vue`, `HomeView.vue`, `AboutView.vue` ฯลฯ เป็นของเทมเพลตเริ่มต้นของ Vue ไม่ได้ใช้งานในระบบ ลบทิ้งได้
