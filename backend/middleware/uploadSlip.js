const multer = require('multer');
const path = require('path');
const fs = require('fs');

// เก็บสลิปนอกโฟลเดอร์ uploads ที่เปิดสาธารณะ — ดูได้ผ่าน API ที่ตรวจสิทธิ์เท่านั้น
const SLIP_DIR = path.join(__dirname, '..', 'private_uploads', 'slips');
if (!fs.existsSync(SLIP_DIR)) fs.mkdirSync(SLIP_DIR, { recursive: true });

const ALLOWED = ['.jpg', '.jpeg', '.png', '.webp'];

const uploadSlip = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, SLIP_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `slip-${req.params.id}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (!ALLOWED.includes(path.extname(file.originalname).toLowerCase())) {
      return cb(new Error('รองรับเฉพาะรูปภาพ (jpg, png, webp)'));
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = { uploadSlip, SLIP_DIR };
