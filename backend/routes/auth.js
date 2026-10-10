const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const router = express.Router();
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validatePasswordStrength } = require('../utils/password');
const { sendApprovalRequestEmail, sendRegistrationResultEmail, sendResetEmail } = require('../utils/mailer');
require('dotenv').config();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_TTL_DAYS = 7;
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const clean = (v) => (typeof v === 'string' ? v.trim() : '');

// ---------- Login (ทุก role) ----------
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

    // บอกสถานะเฉพาะตอนรหัสผ่านถูกแล้วเท่านั้น (ไม่เปิดเผยว่ามี username นี้หรือไม่)
    if (emp.status !== 'active') {
      return res.status(403).json({ message: 'บัญชีของคุณอยู่ระหว่างรอผู้ดูแลระบบตรวจสอบและอนุมัติ' });
    }

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

// ---------- สมัครสมาชิกด้วยตัวเอง -> status = pending + ส่งเมลหา admin ----------
router.post('/register', async (req, res) => {
  try {
    const emp_code = clean(req.body.emp_code);
    const first_name = clean(req.body.first_name);
    const last_name = clean(req.body.last_name);
    const username = clean(req.body.username);
    const email = clean(req.body.email).toLowerCase();
    const password = req.body.password;

    if (!emp_code || !first_name || !last_name || !username || !email || !password) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }
    if (!EMAIL_RE.test(email)) return res.status(400).json({ message: 'รูปแบบอีเมลไม่ถูกต้อง' });
    const check = validatePasswordStrength(password);
    if (!check.valid) return res.status(400).json({ message: check.message });

    // เคลียร์คำขอที่ admin ไม่ได้ตอบภายในเวลา จะได้สมัครใหม่ได้
    await pool.query("DELETE FROM EMPLOYEE WHERE status = 'pending' AND approval_expires < NOW()");

    const hash = await bcrypt.hash(password, 10);
    const token = crypto.randomBytes(32).toString('hex'); // ส่งทางอีเมล ไม่เก็บตัวจริงใน DB
    try {
      await pool.query(
        `INSERT INTO EMPLOYEE
           (emp_code, first_name, last_name, email, username, password_hash, role,
            status, approval_token_hash, approval_expires)
         VALUES (?,?,?,?,?,?, 'employee', 'pending', ?, DATE_ADD(NOW(), INTERVAL ? DAY))`,
        [emp_code, first_name, last_name, email, username, hash, sha256(token), TOKEN_TTL_DAYS]
      );
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'รหัสพนักงาน อีเมล หรือ username นี้ถูกใช้งานแล้ว' });
      }
      throw err;
    }

    const reviewLink = `${process.env.FRONTEND_URL || 'http://localhost:5180'}/approve-registration?token=${token}`;
    try {
      await sendApprovalRequestEmail({ emp_code, first_name, last_name, username, email }, reviewLink);
    } catch (mailErr) {
      // บันทึกคำขอแล้ว แต่ส่งเมลไม่สำเร็จ -> log ไว้ ไม่ทำให้ผู้สมัครเห็นว่าล้มเหลว
      console.error('[register] send admin email failed:', mailErr.message);
    }

    res.status(201).json({ message: 'ส่งคำขอสมัครแล้ว กรุณารอผู้ดูแลระบบตรวจสอบและอนุมัติ เมื่ออนุมัติแล้วจะแจ้งทางอีเมล' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ---------- admin เปิดลิงก์จากอีเมล: ดูข้อมูลผู้สมัคร ----------
router.get('/registration/:token', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT emp_code, first_name, last_name, username, email, created_at
       FROM EMPLOYEE
       WHERE approval_token_hash = ? AND status = 'pending' AND approval_expires > NOW()`,
      [sha256(req.params.token)]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'ลิงก์ไม่ถูกต้อง ถูกใช้ไปแล้ว หรือหมดอายุ' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ---------- admin กดอนุมัติ / ปฏิเสธ (ใช้ POST กันระบบสแกนลิงก์ในเมลกดให้เอง) ----------
router.post('/registration/:token', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { action } = req.body;
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'action ต้องเป็น approve หรือ reject' });
    }
    const tokenHash = sha256(req.params.token);
    const [rows] = await pool.query(
      `SELECT emp_id, email FROM EMPLOYEE
       WHERE approval_token_hash = ? AND status = 'pending' AND approval_expires > NOW()`,
      [tokenHash]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'ลิงก์ไม่ถูกต้อง ถูกใช้ไปแล้ว หรือหมดอายุ' });
    }
    const { emp_id, email } = rows[0];

    // เงื่อนไขซ้ำใน WHERE ทำให้ใช้ลิงก์ได้ครั้งเดียวแม้กดพร้อมกัน
    const sql = action === 'approve'
      ? `UPDATE EMPLOYEE SET status='active', approval_token_hash=NULL, approval_expires=NULL
         WHERE emp_id=? AND approval_token_hash=? AND status='pending'`
      : `DELETE FROM EMPLOYEE WHERE emp_id=? AND approval_token_hash=? AND status='pending'`;
    const [result] = await pool.query(sql, [emp_id, tokenHash]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'ลิงก์ถูกใช้ไปแล้ว' });
    }

    // อนุมัติ/ปฏิเสธเสร็จแล้ว -> ส่งอีเมลแจ้งผู้สมัคร (ถ้าส่งไม่ได้ก็ไม่ทำให้การอนุมัติล้มเหลว)
    let emailSent = false;
    try {
      emailSent = await sendRegistrationResultEmail(email, action === 'approve');
    } catch (e) {
      console.error('[registration] notify applicant failed:', e.message);
    }

    res.json({
      message: action === 'approve' ? 'อนุมัติเรียบร้อย ผู้สมัครเข้าสู่ระบบได้แล้ว' : 'ปฏิเสธคำขอเรียบร้อย',
      emailSent,
      email,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ---------- ลืมรหัสผ่าน: ขอลิงก์รีเซ็ตทางอีเมล ----------
const RESET_TTL_MINUTES = 15;
const GENERIC_FORGOT_MSG = 'หากอีเมลนี้ลงทะเบียนไว้ในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปให้แล้ว กรุณาตรวจสอบอีเมล (รวมถึงโฟลเดอร์ Spam)';

router.post('/forgot-password', async (req, res) => {
  try {
    const email = clean(req.body.email).toLowerCase();
    if (!EMAIL_RE.test(email)) return res.status(400).json({ message: 'รูปแบบอีเมลไม่ถูกต้อง' });

    // ตอบข้อความเดียวกันเสมอ ไม่บอกว่ามีอีเมลนี้ในระบบหรือไม่
    res.json({ message: GENERIC_FORGOT_MSG });

    const [rows] = await pool.query(
      `SELECT emp_id, reset_expires > DATE_ADD(NOW(), INTERVAL ? MINUTE) AS too_soon
       FROM EMPLOYEE WHERE LOWER(email) = ? AND status = 'active'`,
      [RESET_TTL_MINUTES - 1, email]
    );
    if (rows.length === 0) return;
    if (rows[0].too_soon) return; // เพิ่งขอไปไม่ถึง 1 นาที กันการกดขอรัวๆ

    const token = crypto.randomBytes(32).toString('hex');
    await pool.query(
      `UPDATE EMPLOYEE SET reset_token_hash = ?, reset_expires = DATE_ADD(NOW(), INTERVAL ? MINUTE) WHERE emp_id = ?`,
      [sha256(token), RESET_TTL_MINUTES, rows[0].emp_id]
    );
    const link = `${process.env.FRONTEND_URL || 'http://localhost:5180'}/reset-password?token=${token}`;
    await sendResetEmail(email, link);
  } catch (err) {
    console.error('[forgot-password]', err.message);
    if (!res.headersSent) res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ตรวจว่าลิงก์รีเซ็ตยังใช้ได้ไหม (ให้หน้าเว็บแจ้งก่อนกรอกรหัสผ่าน)
router.get('/reset-password/:token', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT emp_id FROM EMPLOYEE WHERE reset_token_hash = ? AND reset_expires > NOW() AND status = 'active'`,
      [sha256(req.params.token)]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'ลิงก์ไม่ถูกต้อง ถูกใช้ไปแล้ว หรือหมดอายุ' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ตั้งรหัสผ่านใหม่ด้วย token จากอีเมล
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ message: 'ข้อมูลไม่ครบถ้วน' });
    const check = validatePasswordStrength(newPassword);
    if (!check.valid) return res.status(400).json({ message: check.message });

    const hash = await bcrypt.hash(newPassword, 10);
    // อัปเดตแบบ atomic และล้าง token ทันที ใช้ลิงก์ได้ครั้งเดียว
    const [result] = await pool.query(
      `UPDATE EMPLOYEE SET password_hash = ?, reset_token_hash = NULL, reset_expires = NULL
       WHERE reset_token_hash = ? AND reset_expires > NOW() AND status = 'active'`,
      [hash, sha256(String(token))]
    );
    if (result.affectedRows === 0) {
      return res.status(400).json({ message: 'ลิงก์ไม่ถูกต้อง ถูกใช้ไปแล้ว หรือหมดอายุ กรุณาขอลิงก์ใหม่' });
    }
    res.json({ message: 'ตั้งรหัสผ่านใหม่เรียบร้อย กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

module.exports = router;
