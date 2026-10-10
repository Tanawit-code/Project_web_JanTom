const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validatePasswordStrength } = require('../utils/password');

// Admin/approver need this list for dropdowns (approver selection), so allow both to read
router.get('/', requireAuth, requireRole('admin', 'approver'), async (req, res) => {
  const [rows] = await pool.query(
    `SELECT emp_id, emp_code, first_name, last_name, position, phone, email, role, status, dept_id
     FROM EMPLOYEE ORDER BY emp_id DESC`
  );
  res.json(rows);
});

// Admin creates employee accounts directly (status = active). Self-registration lives in routes/auth.js
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

router.get('/my-role', requireAuth, async (req, res) => {
  try {
    const role = req.user.role;

    const [rows] = await pool.query(
      `SELECT emp_id, emp_code, first_name, last_name, position, role
       FROM EMPLOYEE
       WHERE role = ?
       ORDER BY emp_id DESC`,
      [role]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ดูเฉพาะ Admin
router.get('/admins', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT emp_id, emp_code, first_name, last_name, position, phone, email, role, dept_id
       FROM EMPLOYEE
       WHERE role = 'admin'
       ORDER BY emp_id DESC`
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ดูเฉพาะ Approver
router.get('/approvers', requireAuth, requireRole('approver'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT emp_id, emp_code, first_name, last_name, position, phone, email, role, dept_id
       FROM EMPLOYEE
       WHERE role = 'approver'
       ORDER BY emp_id DESC`
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ดูเฉพาะ Employee
router.get('/employees', requireAuth, requireRole('employee'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT emp_id, emp_code, first_name, last_name, position, phone, email, role, dept_id
       FROM EMPLOYEE
       WHERE role = 'employee'
       ORDER BY emp_id DESC`
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});
module.exports = router;
