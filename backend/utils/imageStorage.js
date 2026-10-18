const fs = require('fs');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');
require('dotenv').config();

// ตั้งค่าได้ 2 แบบ: CLOUDINARY_URL=cloudinary://key:secret@cloud_name
// หรือแยก CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET
const enabled = Boolean(
  process.env.CLOUDINARY_URL ||
  (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
);
if (enabled && !process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const localDir = path.join(__dirname, '..', 'uploads');

function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: process.env.CLOUDINARY_FOLDER || 'assets',
        resource_type: 'image',
        // ย่อรูปและบีบอัดอัตโนมัติ ประหยัดโควตา/โหลดเร็ว
        transformation: [{ width: 1200, height: 1200, crop: 'limit' }, { quality: 'auto', fetch_format: 'auto' }],
      },
      (err, result) => (err ? reject(err) : resolve(result.secure_url))
    ).end(buffer);
  });
}

// คืน URL ที่เก็บลงคอลัมน์ asset.image_url
async function saveImage(file) {
  if (enabled) return uploadToCloudinary(file.buffer);
  // ยังไม่ตั้งค่า Cloudinary -> เก็บลงดิสก์เหมือนเดิม (สะดวกตอนพัฒนา)
  fs.mkdirSync(localDir, { recursive: true });
  const ext = path.extname(file.originalname).toLowerCase();
  const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  fs.writeFileSync(path.join(localDir, name), file.buffer);
  return `/uploads/${name}`;
}

module.exports = { saveImage, cloudinaryEnabled: enabled };
