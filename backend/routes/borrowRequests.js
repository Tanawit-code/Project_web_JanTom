const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { bangkokToday, bangkokDatePlusDays, isValidCeDate } = require('../utils/dates');

function genBorrowCode() {
  const d = new Date();
  return `BR-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

// Employee submits a request for one or more assets — 1 request : M assets via BORROW_DETAIL
router.post('/', requireAuth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { due_date, days, purpose, asset_ids, mode = 'borrow', pickup_date } = req.body;
    const reserve = mode === 'reserve';
    if (!['borrow', 'reserve'].includes(mode)) return res.status(400).json({ message: 'รูปแบบคำขอไม่ถูกต้อง' });
    // วันที่ยืม = เวลาที่ส่งคำขอ (request_date ตั้งอัตโนมัติ) ส่วนวันคืน = วันนี้ + จำนวนวันที่เลือก
    const nDays = Number.parseInt(days, 10);
    const useDays = Number.isInteger(nDays) && nDays >= 1 && nDays <= 30;
    if (reserve && !useDays) return res.status(400).json({ message: 'ระยะเวลายืมต้องอยู่ระหว่าง 1 ถึง 30 วัน' });
    if ((!useDays && !due_date) || !Array.isArray(asset_ids) || asset_ids.length === 0) {
      return res.status(400).json({ message: 'กรุณาเลือกระยะเวลายืมและเลือกทรัพย์สินอย่างน้อย 1 รายการ' });
    }
    if (reserve && (!isValidCeDate(pickup_date) || pickup_date.slice(0, 10) < bangkokToday() || pickup_date.slice(0, 10) > bangkokDatePlusDays(7))) {
      return res.status(400).json({ message: 'วันรับต้องอยู่ระหว่างวันนี้ถึง 7 วันข้างหน้า' });
    }
    if (!useDays && (!isValidCeDate(due_date) || due_date.slice(0, 10) < bangkokToday())) {
      return res.status(400).json({ message: 'วันครบกำหนดคืนไม่ถูกต้อง (ต้องเป็นปี ค.ศ. และไม่ย้อนหลัง)' });
    }

    await conn.beginTransaction();

    // business rule: only assets currently "available" can be requested
    const uniqueAssetIds = [...new Set(asset_ids.map(Number))];
    if (uniqueAssetIds.length !== asset_ids.length || uniqueAssetIds.some((id) => !Number.isInteger(id) || id < 1)) {
      await conn.rollback();
      return res.status(400).json({ message: 'รายการทรัพย์สินไม่ถูกต้อง' });
    }
    const [assets] = await conn.query(
      `SELECT asset_id, status FROM ASSET WHERE asset_id IN (?) FOR UPDATE`, [uniqueAssetIds]
    );
    const notAvailable = assets.filter((a) => a.status !== 'available');
    if (assets.length !== asset_ids.length || notAvailable.length > 0) {
      await conn.rollback();
      return res.status(409).json({ message: 'มีทรัพย์สินบางรายการไม่ว่างหรือไม่พบในระบบ' });
    }
    if (reserve) {
      const [conflicts] = await conn.query(
        `SELECT DISTINCT bd.asset_id FROM BORROW_DETAIL bd
         JOIN BORROW_REQUEST br ON br.borrow_id = bd.borrow_id
         LEFT JOIN RETURN_RECORD rr ON rr.detail_id = bd.detail_id
         WHERE bd.asset_id IN (?) AND br.status = 'pending' AND rr.return_id IS NULL`,
        [uniqueAssetIds]
      );
      if (conflicts.length) {
        await conn.rollback();
        return res.status(409).json({ message: 'มีคำขอยืมรออนุมัติสำหรับทรัพย์สินบางรายการแล้ว' });
      }
    }

    const borrow_code = genBorrowCode();
    // คำนวณวันคืนเป็นเวลาไทยฝั่ง Node (ไม่พึ่ง time zone ของ MySQL)
    const pickup = reserve ? pickup_date.slice(0, 10) : null;
    const finalDue = reserve
      ? new Date(Date.parse(`${pickup}T00:00:00Z`) + nDays * 86400000).toISOString().slice(0, 10)
      : (useDays ? bangkokDatePlusDays(nDays) : due_date.slice(0, 10));
    const [reqResult] = await conn.query(
      `INSERT INTO BORROW_REQUEST (borrow_code, due_date, pickup_date, purpose, status, emp_id) VALUES (?,?,?, ?, ?, ?)`,
      [borrow_code, finalDue, pickup, purpose || null, reserve ? 'reserved' : 'pending', req.user.emp_id]
    );
    const borrow_id = reqResult.insertId;

    for (const asset_id of asset_ids) {
      await conn.query(
        `INSERT INTO BORROW_DETAIL (borrow_id, asset_id) VALUES (?, ?)`,
        [borrow_id, asset_id]
      );
      if (reserve) await conn.query(`UPDATE ASSET SET status='reserved' WHERE asset_id=?`, [asset_id]);
    }

    await conn.commit();
    res.status(201).json({ borrow_id, borrow_code, message: reserve ? 'จองทรัพย์สินสำเร็จ' : 'ส่งคำขอยืมสำเร็จ รอการอนุมัติ' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  } finally {
    conn.release();
  }
});

// Reservation holder checks in on or after the chosen pickup date; the normal approval flow follows.
router.post('/:id/pickup', requireAuth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      `UPDATE BORROW_REQUEST SET status='pending' WHERE borrow_id=? AND emp_id=? AND status='reserved' AND pickup_date <= ?`,
      [req.params.id, req.user.emp_id, bangkokToday()]
    );
    if (!result.affectedRows) {
      await conn.rollback();
      return res.status(409).json({ message: 'ยังไม่ถึงวันรับ หรือรายการจองนี้ไม่สามารถดำเนินการได้' });
    }
    await conn.commit();
    res.json({ message: 'รับทรัพย์สินแล้ว ส่งคำขอยืมให้ผู้อนุมัติเรียบร้อย' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  } finally { conn.release(); }
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
      const [[borrow]] = await conn.query('SELECT pickup_date FROM BORROW_REQUEST WHERE borrow_id=?', [req.params.id]);
      const [details] = await conn.query(
        `SELECT bd.asset_id, a.status FROM BORROW_DETAIL bd JOIN ASSET a ON a.asset_id=bd.asset_id
         WHERE bd.borrow_id = ? FOR UPDATE`, [req.params.id]
      );
      for (const d of details) {
        const expected = borrow?.pickup_date ? 'reserved' : 'available';
        if (d.status !== expected) {
          await conn.rollback();
          return res.status(409).json({ message: 'ทรัพย์สินไม่พร้อมอนุมัติ เนื่องจากสถานะถูกเปลี่ยนแล้ว' });
        }
        await conn.query(`UPDATE ASSET SET status='borrowed' WHERE asset_id=?`, [d.asset_id]);
      }
    } else {
      const [[borrow]] = await conn.query('SELECT pickup_date FROM BORROW_REQUEST WHERE borrow_id=?', [req.params.id]);
      if (borrow?.pickup_date) {
        const [reserved] = await conn.query(
          `SELECT asset_id FROM BORROW_DETAIL WHERE borrow_id=?`, [req.params.id]
        );
        for (const d of reserved) {
          await conn.query(`UPDATE ASSET SET status='available' WHERE asset_id=? AND status='reserved'`, [d.asset_id]);
        }
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
