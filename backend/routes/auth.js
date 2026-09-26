const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const pool = require('../config/db');
require('dotenv').config();

// Login for all roles (employee / approver / admin)
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'กรุณากรอก username และ password' });
    }
    const [rows] = await pool.query('SELECT * FROM EMPLOYEE WHERE username = ?', [username]);
    if (rows.length === 0) return res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });

    const emp = rows[0];
    const match = await bcrypt.compare(password, emp.password_hash);
    if (!match) return res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });

    const token = jwt.sign(
      { emp_id: emp.emp_id, username: emp.username, role: emp.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );
    res.json({
      token,
      user: {
        emp_id: emp.emp_id, username: emp.username, role: emp.role,
        first_name: emp.first_name, last_name: emp.last_name,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

module.exports = router;
