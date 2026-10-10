const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { bangkokToday, isValidCeDate } = require('../utils/dates');

const BAD_PURCHASE_DATE = 'วันที่ซื้อไม่ถูกต้อง (ต้องเป็นปี ค.ศ. และไม่เกินวันนี้ เช่น 2025-06-10)';
const badPurchaseDate = (d) => d && (!isValidCeDate(d) || d.slice(0, 10) > bangkokToday());

// All logged-in roles can browse assets (to request a borrow)
router.get('/', requireAuth, async (req, res) => {
  const { q, category, status } = req.query;
  let sql = `SELECT a.*, c.cat_name FROM ASSET a LEFT JOIN ASSET_CATEGORY c ON a.cat_id = c.cat_id WHERE 1=1`;
  const params = [];
  if (q) { sql += ' AND (a.asset_name LIKE ? OR a.asset_code LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  if (category) { sql += ' AND a.cat_id = ?'; params.push(category); }
  if (status) { sql += ' AND a.status = ?'; params.push(status); }
  sql += ' ORDER BY a.asset_id DESC';
  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

router.get('/:id', requireAuth, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM ASSET WHERE asset_id = ?', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ message: 'ไม่พบทรัพย์สิน' });
  res.json(rows[0]);
});

// Admin-only: upload an image for an asset. Returns a URL to store as image_url.
router.post('/upload', requireAuth, requireRole('admin'), (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message || 'อัปโหลดไฟล์ไม่สำเร็จ' });
    if (!req.file) return res.status(400).json({ message: 'กรุณาเลือกไฟล์รูปภาพ' });
    const image_url = `/uploads/${req.file.filename}`;
    res.status(201).json({ image_url });
  });
});

router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { asset_code, asset_name, brand, model, serial_number, purchase_date, price, location, cat_id, image_url } = req.body;
    if (!asset_code || !asset_name) return res.status(400).json({ message: 'กรุณากรอกรหัสและชื่อทรัพย์สิน' });
    if (badPurchaseDate(purchase_date)) return res.status(400).json({ message: BAD_PURCHASE_DATE });
    const [result] = await pool.query(
      `INSERT INTO ASSET (asset_code, asset_name, brand, model, serial_number, purchase_date, price, status, location, cat_id, image_url)
       VALUES (?,?,?,?,?,?,?, 'available', ?, ?, ?)`,
      [asset_code, asset_name, brand || null, model || null, serial_number || null,
       purchase_date || null, price || null, location || null, cat_id || null, image_url || null]
    );
    res.status(201).json({ asset_id: result.insertId, message: 'เพิ่มทรัพย์สินสำเร็จ' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'รหัสทรัพย์สินนี้มีอยู่แล้ว' });
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

router.put('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const { asset_name, brand, model, serial_number, purchase_date, price, status, location, cat_id, image_url } = req.body;
  if (badPurchaseDate(purchase_date)) return res.status(400).json({ message: BAD_PURCHASE_DATE });
  const [result] = await pool.query(
    `UPDATE ASSET SET asset_name=?, brand=?, model=?, serial_number=?, purchase_date=?, price=?, status=?, location=?, cat_id=?, image_url=?
     WHERE asset_id=?`,
    [asset_name, brand, model, serial_number, purchase_date, price, status, location, cat_id, image_url || null, req.params.id]
  );
  if (result.affectedRows === 0) return res.status(404).json({ message: 'ไม่พบทรัพย์สิน' });
  res.json({ message: 'แก้ไขทรัพย์สินสำเร็จ' });
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM ASSET WHERE asset_id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'ไม่พบทรัพย์สิน' });
    res.json({ message: 'ลบทรัพย์สินสำเร็จ' });
  } catch (err) {
    res.status(400).json({ message: 'ไม่สามารถลบได้ อาจมีประวัติการยืมผูกอยู่' });
  }
});

module.exports = router;
