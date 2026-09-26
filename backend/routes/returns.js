const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

// List items currently borrowed and not yet returned (for admin to process a return)
router.get('/pending', requireAuth, requireRole('admin', 'approver'), async (req, res) => {
  const [rows] = await pool.query(
    `SELECT bd.detail_id, bd.borrow_id, br.borrow_code, br.due_date,
            a.asset_id, a.asset_name, a.asset_code,
            e.first_name, e.last_name, e.emp_code
     FROM BORROW_DETAIL bd
     JOIN BORROW_REQUEST br ON br.borrow_id = bd.borrow_id
     JOIN ASSET a ON a.asset_id = bd.asset_id
     JOIN EMPLOYEE e ON e.emp_id = br.emp_id
     LEFT JOIN RETURN_RECORD rr ON rr.detail_id = bd.detail_id
     WHERE br.status = 'approved' AND rr.return_id IS NULL
     ORDER BY br.due_date ASC`
  );
  res.json(rows);
});

// Record a return for one borrowed item — updates asset back to available,
// and marks the whole request "returned" once every item in it has come back
router.post('/', requireAuth, requireRole('admin', 'approver'), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { detail_id, condition_in, fine_amount } = req.body;
    if (!detail_id) return res.status(400).json({ message: 'กรุณาระบุรายการที่จะคืน' });

    await conn.beginTransaction();

    const [[detail]] = await conn.query(
      `SELECT bd.*, br.borrow_id FROM BORROW_DETAIL bd JOIN BORROW_REQUEST br ON br.borrow_id = bd.borrow_id WHERE bd.detail_id = ?`,
      [detail_id]
    );
    if (!detail) { await conn.rollback(); return res.status(404).json({ message: 'ไม่พบรายการยืม' }); }

    await conn.query(
      `INSERT INTO RETURN_RECORD (condition_in, fine_amount, detail_id, received_by) VALUES (?,?,?,?)`,
      [condition_in || null, fine_amount || 0, detail_id, req.user.emp_id]
    );

    await conn.query(`UPDATE ASSET SET status='available' WHERE asset_id=?`, [detail.asset_id]);

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
    res.status(201).json({ message: 'บันทึกการคืนสำเร็จ' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  } finally {
    conn.release();
  }
});

module.exports = router;
