const multer = require('multer');
const path = require('path');

// เก็บไฟล์ไว้ใน memory ชั่วคราว แล้วให้ route ส่งต่อไป Cloudinary (หรือบันทึกลงดิสก์ถ้ายังไม่ได้ตั้งค่า)
const storage = multer.memoryStorage();

const ALLOWED = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED.includes(ext)) {
    return cb(new Error('รองรับเฉพาะไฟล์รูปภาพ (jpg, jpeg, png, webp, gif) เท่านั้น'));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = upload;
