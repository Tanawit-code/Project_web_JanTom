const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { bangkokToday } = require('../utils/dates');
const { FINE_TYPES, TYPE_LABEL, FINE_PER_DAY, calculateLateFine, createFine, emailFineCreated } = require('../utils/fines');
const { recordActivity } = require('../utils/activityLog');
const { notifyAdmins } = require('../utils/notify');

const clean = (v) => (typeof v === 'string' ? v.trim() : '');

// List items currently borrowed and not yet returned (for admin to process a return)
// เพิ่ม days_late / suggested_late_fine ให้ admin ใช้เป็นค่าเริ่มต้นของค่าปรับ
router.get('/pending', requireAuth, requireRole('admin', 'approver'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT bd.detail_id, bd.borrow_id, br.borrow_code, br.due_date,
              DATE_FORMAT(bd.return_requested_at, '%Y-%m-%d %H:%i:%s') AS return_requested_at,
              DATEDIFF(?, br.due_date) AS days_overdue,
              a.asset_id, a.asset_name, a.asset_code,
              e.first_name, e.last_name, e.emp_code
       FROM BORROW_DETAIL bd
       JOIN BORROW_REQUEST br ON br.borrow_id = bd.borrow_id
       JOIN ASSET a ON a.asset_id = bd.asset_id
       JOIN EMPLOYEE e ON e.emp_id = br.emp_id
       LEFT JOIN RETURN_RECORD rr ON rr.detail_id = bd.detail_id
       WHERE br.status = 'approved' AND rr.return_id IS NULL
       ORDER BY (bd.return_requested_at IS NULL) ASC, bd.return_requested_at ASC, br.due_date ASC`,
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

// Employee notifies admins that a borrowed item is ready to be returned.
router.post('/request', requireAuth, async (req, res) => {
  const detailId = Number(req.body.detail_id);
  if (!Number.isInteger(detailId) || detailId < 1) {
    return res.status(400).json({ message: 'กรุณาระบุรายการทรัพย์สินที่ต้องการแจ้งคืน' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[item]] = await conn.query(
      `SELECT bd.detail_id, bd.return_requested_at, br.borrow_id, br.borrow_code,
              br.status AS borrow_status, a.asset_id, a.asset_name, a.asset_code
       FROM BORROW_DETAIL bd
       JOIN BORROW_REQUEST br ON br.borrow_id = bd.borrow_id
       JOIN ASSET a ON a.asset_id = bd.asset_id
       LEFT JOIN RETURN_RECORD rr ON rr.detail_id = bd.detail_id
       WHERE bd.detail_id = ? AND br.emp_id = ? AND rr.return_id IS NULL
       FOR UPDATE`,
      [detailId, req.user.emp_id]
    );
    if (!item || item.borrow_status !== 'approved') {
      await conn.rollback();
      return res.status(404).json({ message: 'ไม่พบรายการยืมที่ยังสามารถแจ้งคืนได้' });
    }
    if (item.return_requested_at) {
      await conn.rollback();
      return res.status(409).json({ message: 'รายการนี้แจ้งคืนไปแล้ว รอแอดมินตรวจรับ' });
    }

    await conn.query('UPDATE BORROW_DETAIL SET return_requested_at = NOW() WHERE detail_id = ?', [detailId]);
    await recordActivity(req, {
      action: 'return_requested', entityType: 'borrow_detail', entityId: detailId,
      summary: `แจ้งคืน ${item.asset_name} (${item.asset_code}) ตามคำขอ ${item.borrow_code}`,
      before: { return_requested_at: null, borrow_status: item.borrow_status },
      after: { return_requested: true, borrow_code: item.borrow_code, asset_id: item.asset_id,
        asset_name: item.asset_name, asset_code: item.asset_code },
    }, conn);
    await conn.commit();

    try {
      const [[employee]] = await pool.query(
        'SELECT first_name, last_name FROM EMPLOYEE WHERE emp_id = ?', [req.user.emp_id]
      );
      await notifyAdmins(pool, {
        type: 'return_requested',
        title: 'พนักงานแจ้งคืนทรัพย์สิน',
        message: `${employee?.first_name || ''} ${employee?.last_name || ''} · ${item.borrow_code} · ${item.asset_name} (${item.asset_code})`,
        link: '/admin/returns',
      });
    } catch (notifyErr) {
      console.error('[returns] admin notification failed:', notifyErr.message);
    }

    res.json({ message: 'ส่งแจ้งคืนแล้ว รอแอดมินตรวจรับทรัพย์สิน' });
  } catch (err) {
    await conn.rollback();
    console.error('[returns:request]', err);
    res.status(500).json({ message: 'แจ้งคืนทรัพย์สินไม่สำเร็จ' });
  } finally {
    conn.release();
  }
});

// Record a return for one borrowed item — updates asset back to available,
// and marks the whole request "returned" once every item in it has come back.
// ถ้ามีค่าปรับ (ส่งล่าช้า/ชำรุด) จะสร้างรายการค่าปรับ + แจ้งเตือนพนักงานให้ชำระ
router.post('/', requireAuth, requireRole('admin', 'approver'), async (req, res) => {
  const conn = await pool.getConnection();
  const fineInfos = [];
  try {
    const { detail_id, condition_in, fine_amount, fine_type, fine_reason } = req.body;
    if (!detail_id) return res.status(400).json({ message: 'กรุณาระบุรายการที่จะคืน' });
    const enteredFineAmt = Math.round((Number(fine_amount) || 0) * 100) / 100;

    await conn.beginTransaction();

    const [[detail]] = await conn.query(
      `SELECT bd.*, br.borrow_id, br.borrow_code, br.emp_id, br.due_date,
              a.asset_name, a.asset_code,
              GREATEST(DATEDIFF(?, br.due_date), 0) AS days_late
       FROM BORROW_DETAIL bd JOIN BORROW_REQUEST br ON br.borrow_id = bd.borrow_id
       JOIN ASSET a ON a.asset_id = bd.asset_id
       WHERE bd.detail_id = ?`,
      [bangkokToday(), detail_id]
    );
    if (!detail) { await conn.rollback(); return res.status(404).json({ message: 'ไม่พบรายการยืม' }); }

    // Late fees are always calculated by the server; the submitted amount is only for damage/other fees.
    const daysLate = Math.max(0, Number(detail.days_late) || 0);
    const isLate = daysLate > 0;
    const lateFineAmt = isLate ? calculateLateFine(daysLate) : 0;
    const extraFineAmt = ['damaged', 'other'].includes(fine_type) ? enteredFineAmt : 0;
    const fineAmt = lateFineAmt + extraFineAmt;
    if (enteredFineAmt < 0 || fineAmt > 1000000) {
      await conn.rollback();
      return res.status(400).json({ message: 'จำนวนค่าปรับไม่ถูกต้อง' });
    }

    const [returnResult] = await conn.query(
      `INSERT INTO RETURN_RECORD (condition_in, fine_amount, detail_id, received_by) VALUES (?,?,?,?)`,
      [condition_in || null, fineAmt, detail_id, req.user.emp_id]
    );

    await conn.query(`UPDATE ASSET SET status='available' WHERE asset_id=?`, [detail.asset_id]);

    if (lateFineAmt > 0) {
      const reason = `ส่งคืนล่าช้า ${daysLate} วัน (วันละ ${FINE_PER_DAY} บาท)`;
      const fine = await createFine(conn, { emp_id: detail.emp_id, detail_id, fine_type: 'late', amount: lateFineAmt, reason, created_by: req.user.emp_id });
      fineInfos.push({ emp_id: detail.emp_id, fine_code: fine.fine_code, fine_type: 'late', amount: lateFineAmt, reason });
    }
    if (extraFineAmt > 0) {
      const type = FINE_TYPES.includes(fine_type) ? fine_type : 'other';
      const reason = (clean(fine_reason) || clean(condition_in) || TYPE_LABEL[type]).slice(0, 255);
      const fine = await createFine(conn, { emp_id: detail.emp_id, detail_id, fine_type: type, amount: extraFineAmt, reason, created_by: req.user.emp_id });
      fineInfos.push({ emp_id: detail.emp_id, fine_code: fine.fine_code, fine_type: type, amount: extraFineAmt, reason });
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

    await recordActivity(req, {
      action: 'return', entityType: 'borrow_detail', entityId: detail_id,
      summary: `รับคืน ${detail.asset_name} (${detail.asset_code}) จาก ${detail.borrow_code}`,
      before: { borrow_code: detail.borrow_code, asset_id: detail.asset_id, asset_name: detail.asset_name, asset_code: detail.asset_code, status: 'borrowed' },
      after: { return_id: returnResult.insertId, condition_in: condition_in || null, fine_amount: fineAmt,
        request_status: returnedCount >= total ? 'returned' : 'approved' },
    }, conn);

    await conn.commit();
    fineInfos.forEach((info) => emailFineCreated(info.emp_id, info));
    res.status(201).json({
      message: fineInfos.length ? 'บันทึกการคืนสำเร็จ และแจ้งค่าปรับให้พนักงานแล้ว' : 'บันทึกการคืนสำเร็จ',
      fines: fineInfos,
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
