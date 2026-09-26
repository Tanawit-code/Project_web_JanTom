const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validatePasswordStrength } = require('../utils/password');

// Admin/approver need this list for dropdowns (approver selection), so allow both to read
router.get('/', requireAuth, requireRole('admin', 'approver'), async (req, res) => {
  const [rows] = await pool.query(
    `SELECT emp_id, emp_code, first_name, last_name, position, phone, email, role, dept_id
     FROM EMPLOYEE ORDER BY emp_id DESC`
  );
  res.json(rows);
});

// Admin creates employee accounts (no public self-registration in this system)
router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { emp_code, first_name, last_name, position, phone, email, username, password, role, dept_id } = req.body;
    if (!emp_code || !first_name || !last_name || !username || !password) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }
    const check = validatePasswordStrength(password);
    if (!check.valid) return res.status(400).json({ message: check.message });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO EMPLOYEE (emp_code, first_name, last_name, position, phone, email, username, password_hash, role, dept_id)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [emp_code, first_name, last_name, position || null, phone || null, email || null,
       username, hash, role || 'employee', dept_id || null]
    );
    res.status(201).json({ emp_id: result.insertId, message: 'เพิ่มพนักงานสำเร็จ' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'รหัสพนักงาน อีเมล หรือ username ซ้ำกับที่มีอยู่' });
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

router.put('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { first_name, last_name, position, phone, email, role, dept_id } = req.body;
    const [result] = await pool.query(
      `UPDATE EMPLOYEE SET first_name=?, last_name=?, position=?, phone=?, email=?, role=?, dept_id=? WHERE emp_id=?`,
      [first_name, last_name, position, phone, email, role, dept_id, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'ไม่พบพนักงาน' });
    res.json({ message: 'แก้ไขข้อมูลพนักงานสำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM EMPLOYEE WHERE emp_id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'ไม่พบพนักงาน' });
    res.json({ message: 'ลบพนักงานสำเร็จ' });
  } catch (err) {
    res.status(500).json({ message: 'ไม่สามารถลบได้ อาจมีข้อมูลการยืมผูกอยู่' });
  }
});

module.exports = router;
