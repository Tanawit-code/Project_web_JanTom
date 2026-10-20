const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { recordActivity } = require('../utils/activityLog');

router.get('/', requireAuth, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM ASSET_CATEGORY ORDER BY cat_id');
  res.json(rows);
});

router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  const { cat_name, description } = req.body;
  if (!cat_name) return res.status(400).json({ message: 'กรุณากรอกชื่อประเภท' });
  const [result] = await pool.query('INSERT INTO ASSET_CATEGORY (cat_name, description) VALUES (?, ?)', [cat_name, description || null]);
  await recordActivity(req, { action: 'create', entityType: 'category', entityId: result.insertId, summary: `เพิ่มหมวดหมู่ ${cat_name}`, after: { cat_name, description: description || null } });
  res.status(201).json({ cat_id: result.insertId });
});

router.put('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const { cat_name, description } = req.body;
  const [[before]] = await pool.query('SELECT cat_name, description FROM ASSET_CATEGORY WHERE cat_id=?', [req.params.id]);
  if (!before) return res.status(404).json({ message: 'ไม่พบหมวดหมู่' });
  await pool.query('UPDATE ASSET_CATEGORY SET cat_name=?, description=? WHERE cat_id=?', [cat_name, description, req.params.id]);
  await recordActivity(req, { action: 'update', entityType: 'category', entityId: req.params.id, summary: `แก้ไขหมวดหมู่ ${before.cat_name}`, before, after: { cat_name, description } });
  res.json({ message: 'แก้ไขประเภทสำเร็จ' });
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const [[before]] = await pool.query('SELECT cat_name, description FROM ASSET_CATEGORY WHERE cat_id=?', [req.params.id]);
  if (!before) return res.status(404).json({ message: 'ไม่พบหมวดหมู่' });
  await pool.query('DELETE FROM ASSET_CATEGORY WHERE cat_id=?', [req.params.id]);
  await recordActivity(req, { action: 'delete', entityType: 'category', entityId: req.params.id, summary: `ลบหมวดหมู่ ${before.cat_name}`, before });
  res.json({ message: 'ลบประเภทสำเร็จ' });
});

module.exports = router;
