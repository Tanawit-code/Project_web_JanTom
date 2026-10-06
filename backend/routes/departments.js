const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM DEPARTMENT ORDER BY dept_id');
  res.json(rows);
});

router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  const { dept_name, dept_location } = req.body;
  if (!dept_name) return res.status(400).json({ message: 'กรุณากรอกชื่อแผนก' });
  const [result] = await pool.query('INSERT INTO DEPARTMENT (dept_name, dept_location) VALUES (?, ?)', [dept_name, dept_location || null]);
  res.status(201).json({ dept_id: result.insertId });
});

router.put('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const { dept_name, dept_location } = req.body;
  await pool.query('UPDATE DEPARTMENT SET dept_name=?, dept_location=? WHERE dept_id=?', [dept_name, dept_location, req.params.id]);
  res.json({ message: 'แก้ไขแผนกสำเร็จ' });
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  await pool.query('DELETE FROM DEPARTMENT WHERE dept_id=?', [req.params.id]);
  res.json({ message: 'ลบแผนกสำเร็จ' });
});

module.exports = router;
