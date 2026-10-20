const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { saveImage } = require('../utils/imageStorage');
const { bangkokToday, isValidCeDate } = require('../utils/dates');
const { recordActivity } = require('../utils/activityLog');

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

router.get('/:id/history', requireAuth, async (req, res) => {
  try {
    const [assets] = await pool.query('SELECT asset_id FROM ASSET WHERE asset_id=?', [req.params.id]);
    if (!assets.length) return res.status(404).json({ message: 'ไม่พบทรัพย์สิน' });
    const [rows] = await pool.query(
      `SELECT br.borrow_id, br.borrow_code,
              COALESCE(br.approve_date, br.pickup_date, br.request_date) AS borrowed_at,
              CASE WHEN rr.return_id IS NOT NULL THEN 'returned' ELSE br.status END AS status,
              e.first_name, e.last_name, rr.return_date, rr.condition_in, bd.condition_out,
              CASE
                WHEN rr.return_id IS NULL THEN NULL
                WHEN EXISTS (SELECT 1 FROM FINE f WHERE f.detail_id=bd.detail_id AND f.fine_type='damaged') THEN 1
                WHEN LOWER(COALESCE(rr.condition_in, '')) REGEXP 'ร้าว|แตก|เสีย|ชำรุด|ตำหนิ|เสียหาย' THEN 1
                ELSE 0
              END AS has_defect
       FROM BORROW_DETAIL bd
       JOIN BORROW_REQUEST br ON br.borrow_id=bd.borrow_id
       JOIN EMPLOYEE e ON e.emp_id=br.emp_id
       LEFT JOIN RETURN_RECORD rr ON rr.detail_id=bd.detail_id
       WHERE bd.asset_id=?
       ORDER BY COALESCE(br.approve_date, br.pickup_date, br.request_date) DESC, br.borrow_id DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการโหลดประวัติทรัพย์สิน' });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM ASSET WHERE asset_id = ?', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ message: 'ไม่พบทรัพย์สิน' });
  res.json(rows[0]);
});

// Admin-only: upload an image for an asset. Returns a URL to store as image_url.
router.post('/upload', requireAuth, requireRole('admin'), (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message || 'อัปโหลดไฟล์ไม่สำเร็จ' });
    if (!req.file) return res.status(400).json({ message: 'กรุณาเลือกไฟล์รูปภาพ' });
    try {
      const image_url = await saveImage(req.file); // URL เต็มของ Cloudinary หรือ /uploads/xxx
      res.status(201).json({ image_url });
    } catch (e) {
      console.error('[upload]', e.message);
      res.status(500).json({ message: 'อัปโหลดรูปภาพไม่สำเร็จ' });
    }
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
    await recordActivity(req, { action: 'create', entityType: 'asset', entityId: result.insertId,
      summary: `เพิ่มทรัพย์สิน ${asset_name} (${asset_code})`, after: { asset_code, asset_name, brand, model, serial_number, purchase_date, price, location, cat_id, image_url, status: 'available' } });
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
  const [[before]] = await pool.query('SELECT asset_code, asset_name, brand, model, serial_number, purchase_date, price, status, location, cat_id, image_url FROM ASSET WHERE asset_id=?', [req.params.id]);
  if (!before) return res.status(404).json({ message: 'ไม่พบทรัพย์สิน' });
  const [result] = await pool.query(
    `UPDATE ASSET SET asset_name=?, brand=?, model=?, serial_number=?, purchase_date=?, price=?, status=?, location=?, cat_id=?, image_url=?
     WHERE asset_id=?`,
    [asset_name, brand, model, serial_number, purchase_date, price, status, location, cat_id, image_url || null, req.params.id]
  );
  if (result.affectedRows === 0) return res.status(404).json({ message: 'ไม่พบทรัพย์สิน' });
  await recordActivity(req, { action: 'update', entityType: 'asset', entityId: req.params.id,
    summary: `แก้ไขทรัพย์สิน ${before.asset_name} (${before.asset_code})`, before,
    after: { asset_code: before.asset_code, asset_name, brand, model, serial_number, purchase_date, price, status, location, cat_id, image_url: image_url || null } });
  res.json({ message: 'แก้ไขทรัพย์สินสำเร็จ' });
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const [[before]] = await pool.query('SELECT asset_code, asset_name, brand, model, serial_number, purchase_date, price, status, location, cat_id FROM ASSET WHERE asset_id=?', [req.params.id]);
    if (!before) return res.status(404).json({ message: 'ไม่พบทรัพย์สิน' });
    const [result] = await pool.query('DELETE FROM ASSET WHERE asset_id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'ไม่พบทรัพย์สิน' });
    await recordActivity(req, { action: 'delete', entityType: 'asset', entityId: req.params.id,
      summary: `ลบทรัพย์สิน ${before.asset_name} (${before.asset_code})`, before });
    res.json({ message: 'ลบทรัพย์สินสำเร็จ' });
  } catch (err) {
    res.status(400).json({ message: 'ไม่สามารถลบได้ อาจมีประวัติการยืมผูกอยู่' });
  }
});

module.exports = router;
