const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { bangkokToday } = require('../utils/dates');
const { FINE_TYPES, TYPE_LABEL, createFine, emailFineCreated } = require('../utils/fines');

const clean = (v) => (typeof v === 'string' ? v.trim() : '');
const FINE_PER_DAY = Number(process.env.FINE_PER_DAY) > 0 ? Number(process.env.FINE_PER_DAY) : 100;

// List items currently borrowed and not yet returned (for admin to process a return)
// เพิ่ม days_late / suggested_late_fine ให้ admin ใช้เป็นค่าเริ่มต้นของค่าปรับ
router.get('/pending', requireAuth, requireRole('admin', 'approver'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT bd.detail_id, bd.borrow_id, br.borrow_code, br.due_date,
              DATEDIFF(?, br.due_date) AS days_overdue,
              a.asset_id, a.asset_name, a.asset_code,
              e.first_name, e.last_name, e.emp_code
       FROM BORROW_DETAIL bd
       JOIN BORROW_REQUEST br ON br.borrow_id = bd.borrow_id
       JOIN ASSET a ON a.asset_id = bd.asset_id
       JOIN EMPLOYEE e ON e.emp_id = br.emp_id
       LEFT JOIN RETURN_RECORD rr ON rr.detail_id = bd.detail_id
       WHERE br.status = 'approved' AND rr.return_id IS NULL
       ORDER BY br.due_date ASC`,
      [bangkokToday()]
    );
    res.json(rows.map((r) => {
      const days_late = Math.max(0, Number(r.days_overdue) || 0);
      return { ...r, days_late, suggested_late_fine: days_late * FINE_PER_DAY, fine_per_day: FINE_PER_DAY };
    }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// Record a return for one borrowed item — updates asset back to available,
// and marks the whole request "returned" once every item in it has come back.
// ถ้ามีค่าปรับ (ส่งล่าช้า/ชำรุด) จะสร้างรายการค่าปรับ + แจ้งเตือนพนักงานให้ชำระ
router.post('/', requireAuth, requireRole('admin', 'approver'), async (req, res) => {
  const conn = await pool.getConnection();
  let fine = null;
  let fineInfo = null;
  try {
    const { detail_id, condition_in, fine_amount, fine_type, fine_reason } = req.body;
    if (!detail_id) return res.status(400).json({ message: 'กรุณาระบุรายการที่จะคืน' });
    const fineAmt = Math.round((Number(fine_amount) || 0) * 100) / 100;
    if (fineAmt < 0 || fineAmt > 1000000) return res.status(400).json({ message: 'จำนวนค่าปรับไม่ถูกต้อง' });

    await conn.beginTransaction();

    const [[detail]] = await conn.query(
      `SELECT bd.*, br.borrow_id, br.emp_id FROM BORROW_DETAIL bd JOIN BORROW_REQUEST br ON br.borrow_id = bd.borrow_id WHERE bd.detail_id = ?`,
      [detail_id]
    );
    if (!detail) { await conn.rollback(); return res.status(404).json({ message: 'ไม่พบรายการยืม' }); }

    await conn.query(
      `INSERT INTO RETURN_RECORD (condition_in, fine_amount, detail_id, received_by) VALUES (?,?,?,?)`,
      [condition_in || null, fineAmt, detail_id, req.user.emp_id]
    );

    await conn.query(`UPDATE ASSET SET status='available' WHERE asset_id=?`, [detail.asset_id]);

    if (fineAmt > 0) {
      const type = FINE_TYPES.includes(fine_type) ? fine_type : 'other';
      const reason = (clean(fine_reason) || clean(condition_in) || TYPE_LABEL[type]).slice(0, 255);
      fine = await createFine(conn, { emp_id: detail.emp_id, detail_id, fine_type: type, amount: fineAmt, reason, created_by: req.user.emp_id });
      fineInfo = { emp_id: detail.emp_id, fine_code: fine.fine_code, fine_type: type, amount: fineAmt, reason };
    }

    // if every detail row in this borrow request now has a return record, close the request
    const [[{ total }]] = await conn.query(
      'SELECT COUNT(*) AS total FROM BORROW_DETAIL WHERE borrow_id = ?', [detail.borrow_id]
    );
    const [[{ returnedCount }]] = await conn.query(
      `SELECT COUNT(*) AS returnedCount FROM BORROW_DETAIL bd
       JOIN RETURN_RECORD rr ON rr.detail_id = bd.detail_id WHERE bd.borrow_id = ?`, [detail.borrow_id]
    );
    if (returnedCount >= total) {
      await conn.query(`UPDATE BORROW_REQUEST SET status='returned' WHERE borrow_id=?`, [detail.borrow_id]);
    }

    await conn.commit();
    if (fineInfo) emailFineCreated(fineInfo.emp_id, fineInfo);
    res.status(201).json({
      message: fine ? 'บันทึกการคืนสำเร็จ และแจ้งค่าปรับให้พนักงานแล้ว' : 'บันทึกการคืนสำเร็จ',
      fine,
    });
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'รายการนี้บันทึกการคืนไปแล้ว' });
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  } finally {
    conn.release();
  }
});

module.exports = router;
