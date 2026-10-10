# ระบบยืมคืนทรัพย์สินบริษัท (Project_web_JanTom)

เว็บระบบยืม–คืนทรัพย์สินภายในบริษัท พนักงานสมัครสมาชิกเอง → ผู้ดูแลระบบอนุมัติผ่านอีเมล → ยื่นคำขอยืม → ผู้อนุมัติพิจารณา → รับคืน → ถ้าล่าช้าหรือชำรุดจะมีค่าปรับ ชำระผ่าน QR PromptPay แล้วแนบสลิปให้ admin ตรวจสอบ

## สารบัญ

- [ความสามารถของระบบ](#ความสามารถของระบบ)
- [เทคโนโลยีที่ใช้](#เทคโนโลยีที่ใช้)
- [โครงสร้างโปรเจกต์](#โครงสร้างโปรเจกต์)
- [เริ่มต้นใช้งาน (สำหรับเพื่อนในทีม)](#เริ่มต้นใช้งาน-สำหรับเพื่อนในทีม)
- [ตั้งค่า .env](#ตั้งค่า-env)
- [บัญชีสำหรับทดสอบ](#บัญชีสำหรับทดสอบ)
- [ภาพรวมการทำงานและสิทธิ์ผู้ใช้](#ภาพรวมการทำงานและสิทธิ์ผู้ใช้)
- [API โดยสรุป](#api-โดยสรุป)
- [วิธีทำงานร่วมกันด้วย Git](#วิธีทำงานร่วมกันด้วย-git)
- [แก้ปัญหาที่เจอบ่อย](#แก้ปัญหาที่เจอบ่อย)
- [ข้อควรระวังด้านความปลอดภัย](#ข้อควรระวังด้านความปลอดภัย)
- [ไอเดียที่ยังไม่ได้ทำ](#ไอเดียที่ยังไม่ได้ทำ)

## ความสามารถของระบบ

| ส่วน | รายละเอียด |
|---|---|
| บัญชีผู้ใช้ | สมัครสมาชิกเอง (สถานะรอตรวจสอบ), admin อนุมัติ/ปฏิเสธผ่านลิงก์ในอีเมล, ลืมรหัสผ่านผ่านอีเมล, ปุ่มลูกตาดูรหัสผ่าน |
| ทรัพย์สิน | รายการทรัพย์สิน แยกหมวดหมู่ ค้นหา รูปภาพ; admin เพิ่ม/แก้ไข/ลบ |
| การยืม | เลือกหลายรายการในคำขอเดียว เลือกระยะเวลายืม (วันยืม = เวลาที่ส่งคำขอ) → ผู้อนุมัติอนุมัติ/ปฏิเสธ |
| การคืน | admin/ผู้อนุมัติบันทึกรับคืน พร้อมสภาพของ ระบบคำนวณค่าปรับล่าช้าให้อัตโนมัติ (แก้ไขได้) |
| ค่าปรับ | ล่าช้า/ชำรุด/อื่นๆ → แจ้งเตือนพนักงานในเว็บ+อีเมล → QR PromptPay ตามยอด → แนบสลิป → admin ตรวจและยืนยัน/ปฏิเสธ |
| แจ้งเตือน | กระดิ่งในเว็บ (เลขแดงที่ยังไม่อ่าน), แถบเตือนค่าปรับค้างชำระ, อีเมล |
| Dashboard | ภาพรวมสำหรับ admin: งานที่ต้องทำ, กราฟคำขอ, สถานะทรัพย์สิน, ค่าปรับ, รายการเกินกำหนด |

## เทคโนโลยีที่ใช้

- **Backend:** Node.js, Express, MySQL/MariaDB (`mysql2`), JWT (`jsonwebtoken`), `bcryptjs`, `multer`, `nodemailer`
- **Frontend:** Vue 3, Vite, Vue Router, Axios, `qrcode`
- **ฐานข้อมูล:** MySQL / MariaDB (พัฒนาด้วย XAMPP + phpMyAdmin)

## โครงสร้างโปรเจกต์

```
project_web/
├─ backend/
│  ├─ server.js              # จุดเริ่มต้นของ API (พอร์ต 4100)
│  ├─ config/db.js           # การเชื่อมต่อฐานข้อมูล
│  ├─ routes/                # auth, employees, assets, borrowRequests, returns, fines, notifications, dashboard ...
│  ├─ middleware/            # auth (JWT/role), upload (รูปทรัพย์สิน), uploadSlip (สลิป)
│  ├─ utils/                 # mailer, promptpay, dates, fines, notify, createAdmin ...
│  ├─ sql/assetdb.sql        # โครงสร้างตาราง + ข้อมูลตั้งต้น (นำเข้าด้วย phpMyAdmin)
│  ├─ uploads/               # รูปทรัพย์สิน (ไม่ขึ้น Git ยกเว้นไฟล์ตัวอย่าง)
│  ├─ private_uploads/slips/ # สลิปโอนเงิน (ไม่ขึ้น Git เด็ดขาด)
│  └─ .env.example           # ตัวอย่างค่าตั้งค่า (คัดลอกเป็น .env)
└─ frontend/
   ├─ vite.config.js         # พอร์ต 5180 + proxy /api, /uploads ไป backend
   └─ src/
      ├─ views/              # หน้าเว็บ (views/admin/ = หน้าของ admin)
      ├─ components/         # NavBar, NotificationBell, AuthCard, AuthField
      ├─ router/index.js     # เส้นทาง + ตรวจสิทธิ์ตาม role
      └─ services/           # api.js (axios), auth.js (session)
```

## เริ่มต้นใช้งาน (สำหรับเพื่อนในทีม)

### 1) สิ่งที่ต้องมีในเครื่อง

- [Node.js](https://nodejs.org) 18 ขึ้นไป (ตรวจด้วย `node -v`)
- MySQL หรือ MariaDB ที่รันอยู่ (แนะนำ [XAMPP](https://www.apachefriends.org) เปิด Apache + MySQL)
- Git

### 2) โคลนโปรเจกต์

```bash
git clone https://github.com/Tanawit-code/Project_web_JanTom.git
cd Project_web_JanTom
```

### 3) เตรียมฐานข้อมูล

ไฟล์ `backend/sql/assetdb.sql` **ไม่มีคำสั่งสร้างฐานข้อมูล** ต้องสร้างเองก่อน:

1. เปิด phpMyAdmin (`http://localhost/phpmyadmin`)
2. กด **New** → ตั้งชื่อฐานข้อมูล `assetdb` → collation เลือก `utf8mb4_general_ci` → Create
3. คลิกที่ฐานข้อมูล `assetdb` → แท็บ **Import** → เลือกไฟล์ `backend/sql/assetdb.sql` → Import

หรือใช้ command line:

```bash
mysql -u root -e "CREATE DATABASE assetdb CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci"
mysql -u root assetdb < backend/sql/assetdb.sql
```

### 4) รัน Backend

```bash
cd backend
npm install
cp .env.example .env        # Windows (CMD): copy .env.example .env
# แก้ไฟล์ .env ให้ตรงกับเครื่องตัวเอง (ดูหัวข้อ "ตั้งค่า .env")
npm run dev                 # หรือ npm start
```

ต้องเห็นข้อความ `Asset system API running on http://localhost:4100` ทดสอบที่ `http://localhost:4100/api/health` ต้องได้ `{"status":"ok"}`

### 5) รัน Frontend (เปิด terminal ใหม่ ห้ามปิดอันของ backend)

```bash
cd frontend
npm install
npm run dev
```

เปิดเบราว์เซอร์ที่ `http://localhost:5180`

> backend กับ frontend ต้องรันพร้อมกันตลอดเวลาที่ใช้งาน ถ้าปิดฝั่งใดฝั่งหนึ่ง เว็บจะเรียก API ไม่ได้หรือขึ้นหน้าขาว

## ตั้งค่า .env

ไฟล์ `backend/.env` (สร้างจาก `.env.example`) — **ห้าม commit ขึ้น Git**

| ตัวแปร | ต้องตั้ง? | ความหมาย |
|---|---|---|
| `PORT` | ไม่ | พอร์ต backend (ค่าเริ่มต้น 4100 ต้องตรงกับ proxy ใน `frontend/vite.config.js`) |
| `DB_HOST` `DB_USER` `DB_PASSWORD` `DB_NAME` | **ใช่** | ข้อมูลเชื่อมต่อ MySQL (XAMPP: user `root` รหัสผ่านว่าง, ชื่อ DB `assetdb`) |
| `JWT_SECRET` | **ใช่** | ข้อความสุ่มยาวๆ สำหรับเซ็น token **ห้ามใช้ค่าตัวอย่าง** สร้างด้วย `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN` | ไม่ | อายุ token (ค่าเริ่มต้น `1d`) |
| `ADMIN_EMAIL` | ถ้าจะทดสอบอีเมล | อีเมล admin ที่รับคำขอสมัครสมาชิกและแจ้งสลิปค่าปรับ |
| `FRONTEND_URL` | ถ้าจะทดสอบอีเมล | URL หน้าเว็บ (ใช้สร้างลิงก์ในอีเมล) ปกติ `http://localhost:5180` |
| `SMTP_HOST` `SMTP_PORT` `SMTP_USER` `SMTP_PASS` | ไม่ | ถ้าเว้นว่าง ระบบ **ไม่ส่งเมลจริง** แต่พิมพ์ลิงก์ลงใน terminal ของ backend แทน (พอสำหรับทดสอบ) |
| `PROMPTPAY_ID` `PROMPTPAY_NAME` | ถ้าจะทดสอบ QR | เบอร์ PromptPay 10 หลัก/เลข 13 หลักที่รับเงิน และชื่อบัญชีที่แสดง ถ้าว่าง จะสร้าง QR ไม่ได้ |
| `FINE_PER_DAY` | ไม่ | ค่าปรับล่าช้า บาท/วัน (ค่าเริ่มต้น 100) |

**ส่งอีเมลผ่าน Gmail:** เปิด 2-Step Verification ในบัญชี Google → สร้าง App Password ที่ `https://myaccount.google.com/apppasswords` → นำรหัส 16 ตัวมาใส่ `SMTP_PASS` และใส่อีเมลเดียวกันที่ `SMTP_USER` (ใช้รหัสผ่าน Gmail ปกติไม่ได้)

แก้ `.env` แล้วต้อง **รีสตาร์ท backend** (Ctrl+C แล้ว `npm run dev` ใหม่) เพราะ nodemon ไม่รีสตาร์ทเมื่อแก้ `.env`

## บัญชีสำหรับทดสอบ

หากนำเข้าไฟล์ตัวอย่างที่มีบัญชีทดสอบ (ใช้ในเครื่องตัวเองเท่านั้น):

| Username | Password | Role |
|---|---|---|
| `admin` | `Admin@1234` | ผู้ดูแลระบบ |
| `approver` | `Approver@1234` | ผู้อนุมัติ |
| `demo` | `Demo@1234` | พนักงาน |

**ถ้าล็อกอินไม่ได้** (เช่น ไม่ทราบรหัสผ่านของบัญชีในฐานข้อมูลที่นำเข้า) ให้สร้าง/รีเซ็ตบัญชี admin ด้วยคำสั่ง:

```bash
cd backend
node utils/createAdmin.js admin admin@example.com "Admin@1234"
```

ต้องขึ้น `Admin account ready: admin` แล้วล็อกอินด้วย `admin` / `Admin@1234` ได้ จากนั้นเพิ่มพนักงานคนอื่นที่เมนู **จัดการ → จัดการพนักงาน**

รหัสผ่านทุกบัญชีต้องมี 8 ตัวอักษรขึ้นไป มีตัวพิมพ์เล็ก พิมพ์ใหญ่ ตัวเลข และอักขระพิเศษ

## ภาพรวมการทำงานและสิทธิ์ผู้ใช้

| Role | ทำอะไรได้ |
|---|---|
| `employee` | ดูทรัพย์สิน, ยื่นคำขอยืม, ดูคำขอของตัวเอง, ชำระค่าปรับ (QR + แนบสลิป), รับแจ้งเตือน |
| `approver` | ทุกอย่างของ employee + อนุมัติ/ปฏิเสธคำขอ + บันทึกรับคืน (พร้อมระบุค่าปรับ) |
| `admin` | ทุกอย่างของ approver + จัดการทรัพย์สิน/พนักงาน + จัดการค่าปรับและตรวจสลิป + Dashboard + อนุมัติผู้สมัครใหม่ |

**ขั้นตอนหลัก**

1. **สมัครสมาชิก** (`/register`) → บัญชีสถานะ `pending` ล็อกอินไม่ได้ → ระบบส่งเมลหา `ADMIN_EMAIL` พร้อมลิงก์ตรวจสอบ → admin ล็อกอินแล้วเปิดลิงก์ กดอนุมัติ/ปฏิเสธ → ผู้สมัครได้รับเมลแจ้งผล
2. **ยืม:** พนักงานเลือกทรัพย์สิน + ระยะเวลา → คำขอสถานะ `pending` → ผู้อนุมัติอนุมัติ → ทรัพย์สินเปลี่ยนเป็น `borrowed`
3. **คืน:** หน้า "รับคืน" → บันทึกสภาพ + (ถ้ามี) ค่าปรับ → ทรัพย์สินกลับเป็น `available`
4. **ค่าปรับ:** สถานะ `unpaid` → พนักงานสแกน QR จ่ายและแนบสลิป (`slip_submitted`) → admin ตรวจ → `paid` (หรือปฏิเสธเพื่อให้แนบใหม่)

## API โดยสรุป

ทุก endpoint ขึ้นต้นด้วย `/api` (ยกเว้นระบุไว้) และต้องแนบ `Authorization: Bearer <token>` ยกเว้นกลุ่ม auth

| กลุ่ม | เส้นทาง | หมายเหตุ |
|---|---|---|
| ระบบ | `GET /api/health` | ตรวจว่า backend ทำงาน |
| Auth | `POST /auth/login` `/auth/register` `/auth/forgot-password` `/auth/reset-password` | ไม่ต้องล็อกอิน |
| Auth (admin) | `GET/POST /auth/registration/:token` | admin ดู/อนุมัติผู้สมัครใหม่ |
| พนักงาน | `/employees` | admin |
| ทรัพย์สิน | `/assets`, `/categories`, `/departments` | แก้ไขได้เฉพาะ admin |
| คำขอยืม | `/borrow-requests` | พนักงานส่ง, approver/admin อนุมัติ |
| รับคืน | `/returns` | approver/admin |
| ค่าปรับ | `/fines` (`/mine`, `/:id/qr`, `/:id/slip`, `/:id/review`, `/:id/cancel`) | พนักงานดู/จ่ายของตัวเอง, admin จัดการ |
| แจ้งเตือน | `/notifications` | ของผู้ใช้ที่ล็อกอิน |
| Dashboard | `GET /dashboard` | admin |

ทดสอบ API ด้วย Postman: ล็อกอินที่ `POST /api/auth/login` แล้วนำ `token` ที่ได้ไปใส่ในแท็บ Authorization (Bearer Token)

## วิธีทำงานร่วมกันด้วย Git

```bash
git pull                          # ดึงงานล่าสุดก่อนเริ่มทำเสมอ
git checkout -b feature/ชื่องาน    # แยก branch ต่อหนึ่งงาน เช่น feature/report-page
# ... แก้โค้ด ...
git status                        # ตรวจก่อน commit ว่าไม่มี .env, uploads, private_uploads หลุดมา
git add .
git commit -m "อธิบายสิ่งที่ทำ"
git push -u origin feature/ชื่องาน   # แล้วเปิด Pull Request ให้เพื่อนช่วยดู
```

**กติกาของทีม**

- ❌ ห้าม commit: `.env`, รหัสผ่าน, App Password, รูปสลิป (`backend/private_uploads/`), ไฟล์ที่เก็บข้อมูลส่วนตัว
- เปลี่ยนโครงสร้างฐานข้อมูล → เขียนไฟล์ `backend/sql/migration-xxx.sql` แล้วอัปเดต `assetdb.sql` ให้ตรงกัน และแจ้งในกลุ่มให้ทุกคนรันไฟล์ migration
- เพิ่มตัวแปรใน `.env` → เพิ่มใน `.env.example` ด้วย พร้อมคอมเมนต์อธิบาย
- ติดตั้งแพ็กเกจใหม่ → commit `package.json` และ `package-lock.json` แล้วบอกเพื่อนรัน `npm install`
- หลัง `git pull` ถ้า `package.json` เปลี่ยน ให้รัน `npm install` ใหม่ทั้ง backend และ frontend

**รูปทรัพย์สินตัวอย่าง:** โฟลเดอร์ `backend/uploads/` ถูก ignore (กันรูปที่ทดสอบอัปโหลดหลุดขึ้น Git) แต่รูปตัวอย่างที่ข้อมูลตั้งต้นอ้างถึงถูก add ไว้แล้วด้วย `git add -f` ถ้าต้องเพิ่มรูปตัวอย่างใหม่ที่อยากแชร์ ให้ใช้ `git add -f backend/uploads/ชื่อไฟล์`

## แก้ปัญหาที่เจอบ่อย

| อาการ | สาเหตุ / วิธีแก้ |
|---|---|
| `Cannot find module 'nodemailer'` (หรือโมดูลอื่น) | ยังไม่ได้ติดตั้งแพ็กเกจ รัน `npm install` ในโฟลเดอร์ `backend` |
| `Access denied for user 'root'@'localhost'` | `DB_PASSWORD` ใน `.env` ไม่ตรงกับ MySQL (XAMPP ให้เว้นว่าง) ตรวจว่าบันทึกไฟล์แล้ว และรีสตาร์ท backend ถ้ายังไม่หาย ตรวจว่าไม่ได้ตั้งตัวแปร `DB_PASSWORD` ใน Windows ไว้ |
| `Unknown database 'assetdb'` | ยังไม่ได้สร้างฐานข้อมูลก่อน import ดูขั้นตอนที่ 3 |
| `Unknown column '...'` | ฐานข้อมูลเก่ากว่าโค้ด ให้ import `assetdb.sql` ล่าสุดใหม่ หรือรันไฟล์ `migration-*.sql` ที่เกี่ยวข้อง |
| หน้าเว็บโหลดแต่ข้อมูลไม่ขึ้น / Network Error | backend ไม่ได้รัน หรือพอร์ตไม่ตรงกับ proxy ใน `vite.config.js` |
| ล็อกอินแล้วเด้งกลับหน้า login / admin เข้าหน้าอนุมัติไม่ได้ | บัญชีนั้น `role` ไม่ใช่ `admin` ตรวจในตาราง `employee` |
| ไม่มีอีเมลเข้า | ถ้ายังไม่ตั้ง `SMTP_USER`/`SMTP_PASS` ระบบพิมพ์ลิงก์ใน terminal ของ backend แทน ถ้าตั้งแล้ว ตรวจว่าใช้ App Password และดูโฟลเดอร์ Spam |
| QR ชำระเงินขึ้นว่ายังไม่ได้ตั้งค่า | ใส่ `PROMPTPAY_ID` ใน `.env` แล้วรีสตาร์ท backend |
| รูปทรัพย์สินไม่ขึ้น | ไฟล์รูปไม่อยู่ใน `backend/uploads/` ให้ `git pull` ใหม่หรืออัปโหลดรูปใหม่ในหน้าจัดการทรัพย์สิน |

## ข้อควรระวังด้านความปลอดภัย

- โปรเจกต์นี้ใช้เพื่อการเรียน/ทดลอง ถ้าจะนำไปใช้งานจริงต้องตั้ง `JWT_SECRET` ใหม่, เปลี่ยนรหัสผ่านทุกบัญชีตัวอย่าง, ใช้ HTTPS และเพิ่ม rate limit ที่ `/auth/login`, `/auth/register`, `/auth/forgot-password`
- รหัสผ่านในฐานข้อมูลเก็บเป็น bcrypt hash แต่ไฟล์ `.sql` ที่ export จากเครื่องจริงมีอีเมลและ hash ของผู้ใช้จริง ตรวจก่อนนำขึ้น repo สาธารณะ
- สลิปโอนเงินเก็บใน `backend/private_uploads/` ซึ่งไม่ได้เปิดเป็นลิงก์สาธารณะ ดูได้ผ่าน API ที่ตรวจสิทธิ์เท่านั้น (เจ้าของรายการหรือ admin)
- ถ้าเผลอ commit รหัสผ่านหรือ secret ขึ้น GitHub แล้ว ต้อง **เปลี่ยนรหัสนั้นทันที** (การลบไฟล์ทีหลังไม่ช่วย เพราะประวัติ Git ยังเก็บไว้)

## ไอเดียที่ยังไม่ได้ทำ

- ตรวจสลิปอัตโนมัติผ่านบริการภายนอก (ตอนนี้ admin ตรวจด้วยตา)
- ทรัพย์สินที่ชำรุดแล้วตั้งสถานะ "ซ่อม" และบันทึกลงตาราง `repair` อัตโนมัติ
- เพิ่ม rate limit, เพิกถอน token ทันทีหลังรีเซ็ตรหัสผ่าน
- รายงาน/ส่งออก Excel, กราฟค่าปรับรายเดือน
- ลบไฟล์เก่าที่ไม่ได้ใช้: `backend/index.js`, `backend/routes/products.js`, `frontend/src/views/Products.vue`, `AdminProducts.vue` และไฟล์เทมเพลต Vue ใน `components/`
