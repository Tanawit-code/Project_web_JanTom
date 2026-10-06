const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

function genBorrowCode() {
  const d = new Date();
  return `BR-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

// Employee submits a request for one or more assets — 1 request : M assets via BORROW_DETAIL
router.post('/', requireAuth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { due_date, purpose, asset_ids } = req.body;
    if (!due_date || !Array.isArray(asset_ids) || asset_ids.length === 0) {
      return res.status(400).json({ message: 'กรุณาระบุวันครบกำหนดและเลือกทรัพย์สินอย่างน้อย 1 รายการ' });
    }

    await conn.beginTransaction();

    // business rule: only assets currently "available" can be requested
    const [assets] = await conn.query(
      `SELECT asset_id, status FROM ASSET WHERE asset_id IN (?)`, [asset_ids]
    );
    const notAvailable = assets.filter((a) => a.status !== 'available');
    if (assets.length !== asset_ids.length || notAvailable.length > 0) {
      await conn.rollback();
      return res.status(409).json({ message: 'มีทรัพย์สินบางรายการไม่ว่างหรือไม่พบในระบบ' });
    }

    const borrow_code = genBorrowCode();
    const [reqResult] = await conn.query(
      `INSERT INTO BORROW_REQUEST (borrow_code, due_date, purpose, status, emp_id) VALUES (?,?,?, 'pending', ?)`,
      [borrow_code, due_date, purpose || null, req.user.emp_id]
    );
    const borrow_id = reqResult.insertId;

    for (const asset_id of asset_ids) {
      await conn.query(
        `INSERT INTO BORROW_DETAIL (borrow_id, asset_id) VALUES (?, ?)`,
        [borrow_id, asset_id]
      );
    }

    await conn.commit();
    res.status(201).json({ borrow_id, borrow_code, message: 'ส่งคำขอยืมสำเร็จ รอการอนุมัติ' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  } finally {
    conn.release();
  }
});

// Employee: view own requests
router.get('/mine', requireAuth, async (req, res) => {
  const [requests] = await pool.query(
    `SELECT * FROM BORROW_REQUEST WHERE emp_id = ? ORDER BY request_date DESC`, [req.user.emp_id]
  );
  for (const r of requests) {
    const [details] = await pool.query(
      `SELECT bd.detail_id, bd.asset_id, a.asset_name, a.asset_code,
              rr.return_id, rr.return_date
       FROM BORROW_DETAIL bd
       JOIN ASSET a ON a.asset_id = bd.asset_id
       LEFT JOIN RETURN_RECORD rr ON rr.detail_id = bd.detail_id
       WHERE bd.borrow_id = ?`, [r.borrow_id]
    );
    r.items = details;
  }
  res.json(requests);
});

// Approver/admin: list pending requests
router.get('/pending', requireAuth, requireRole('approver', 'admin'), async (req, res) => {
  const [requests] = await pool.query(
    `SELECT br.*, e.first_name, e.last_name, e.emp_code
     FROM BORROW_REQUEST br JOIN EMPLOYEE e ON e.emp_id = br.emp_id
     WHERE br.status = 'pending' ORDER BY br.request_date ASC`
  );
  for (const r of requests) {
    const [details] = await pool.query(
      `SELECT bd.detail_id, a.asset_id, a.asset_name, a.asset_code
       FROM BORROW_DETAIL bd JOIN ASSET a ON a.asset_id = bd.asset_id WHERE bd.borrow_id = ?`,
      [r.borrow_id]
    );
    r.items = details;
  }
  res.json(requests);
});

// Approver/admin: approve or reject
router.put('/:id/decision', requireAuth, requireRole('approver', 'admin'), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { decision, note } = req.body; // decision: 'approved' | 'rejected'
    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ message: 'decision ต้องเป็น approved หรือ rejected' });
    }
    await conn.beginTransaction();

    const [result] = await conn.query(
      `UPDATE BORROW_REQUEST SET status=?, approve_date=NOW(), note=?, approver_id=?
       WHERE borrow_id=? AND status='pending'`,
      [decision, note || null, req.user.emp_id, req.params.id]
    );
    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'ไม่พบคำขอ หรือถูกดำเนินการไปแล้ว' });
    }

    if (decision === 'approved') {
      // mark all requested assets as borrowed
      const [details] = await conn.query('SELECT asset_id FROM BORROW_DETAIL WHERE borrow_id = ?', [req.params.id]);
      for (const d of details) {
        await conn.query(`UPDATE ASSET SET status='borrowed' WHERE asset_id=?`, [d.asset_id]);
      }
    }

    await conn.commit();
    res.json({ message: decision === 'approved' ? 'อนุมัติคำขอสำเร็จ' : 'ปฏิเสธคำขอสำเร็จ' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  } finally {
    conn.release();
  }
});

// Admin: view all requests (any status), optional ?status= filter
router.get('/', requireAuth, requireRole('admin', 'approver'), async (req, res) => {
  const { status } = req.query;
  let sql = `SELECT br.*, e.first_name, e.last_name, e.emp_code
             FROM BORROW_REQUEST br JOIN EMPLOYEE e ON e.emp_id = br.emp_id WHERE 1=1`;
  const params = [];
  if (status) { sql += ' AND br.status = ?'; params.push(status); }
  sql += ' ORDER BY br.request_date DESC';
  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

module.exports = router;
