const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { recordActivity } = require('../utils/activityLog');

const STAFF = requireRole('admin', 'approver');

// รายการงานซ่อม พร้อมข้อมูลทรัพย์สิน
router.get('/', requireAuth, STAFF, async (req, res) => {
  try {
    const { status, q } = req.query;
    let sql = `SELECT r.*, a.asset_code, a.asset_name, a.status AS asset_status
               FROM repair r JOIN asset a ON a.asset_id = r.asset_id WHERE 1=1`;
    const params = [];
    if (status) { sql += ' AND r.repair_status = ?'; params.push(status); }
    if (q) {
      sql += ' AND (a.asset_code LIKE ? OR a.asset_name LIKE ? OR r.problem_detail LIKE ?)';
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    sql += ' ORDER BY r.repair_id DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('[repairs:list]', err);
    res.status(500).json({ message: 'โหลดรายการซ่อมไม่สำเร็จ' });
  }
});

// แจ้งซ่อม: ตั้งทรัพย์สินเป็นสถานะ repair ภายใน transaction
router.post('/', requireAuth, STAFF, async (req, res) => {
  const { asset_id, problem_detail } = req.body;
  if (!asset_id || !String(problem_detail || '').trim()) {
    return res.status(400).json({ message: 'กรุณาเลือกทรัพย์สินและระบุอาการเสีย' });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [assets] = await conn.query('SELECT asset_id, status FROM asset WHERE asset_id = ? FOR UPDATE', [asset_id]);
    if (!assets.length) { await conn.rollback(); return res.status(404).json({ message: 'ไม่พบทรัพย์สิน' }); }
    if (assets[0].status !== 'available') {
      await conn.rollback();
      return res.status(409).json({ message: 'รับแจ้งซ่อมได้เฉพาะทรัพย์สินที่ว่างและไม่มีการจองหรือยืมค้างอยู่' });
    }
    const [activeBorrows] = await conn.query(
      `SELECT br.borrow_code FROM BORROW_DETAIL bd
       JOIN BORROW_REQUEST br ON br.borrow_id = bd.borrow_id
       LEFT JOIN RETURN_RECORD rr ON rr.detail_id = bd.detail_id
       WHERE bd.asset_id = ? AND br.status IN ('pending', 'reserved', 'approved')
         AND rr.return_id IS NULL LIMIT 1`,
      [asset_id]
    );
    if (activeBorrows.length) {
      await conn.rollback();
      return res.status(409).json({ message: `รับแจ้งซ่อมไม่ได้ เนื่องจากมีคำขอหรือรายการยืมที่ยังดำเนินการอยู่ (${activeBorrows[0].borrow_code})` });
    }
    const [active] = await conn.query(
      `SELECT repair_id FROM repair WHERE asset_id = ? AND repair_status IN ('pending','in_progress') FOR UPDATE`, [asset_id]
    );
    if (active.length) { await conn.rollback(); return res.status(409).json({ message: 'ทรัพย์สินนี้มีงานซ่อมที่ยังไม่เสร็จอยู่แล้ว' }); }
    const [result] = await conn.query(
      `INSERT INTO repair (report_date, problem_detail, repair_status, asset_id) VALUES (CURDATE(), ?, 'pending', ?)`,
      [String(problem_detail).trim(), asset_id]
    );
    await conn.query("UPDATE asset SET status = 'repair' WHERE asset_id = ?", [asset_id]);
    await recordActivity(req, {
      action: 'create', entityType: 'repair', entityId: result.insertId,
      summary: `แจ้งซ่อมทรัพย์สิน ${asset_id}`,
      after: { asset_id: Number(asset_id), repair_status: 'pending', problem_detail: String(problem_detail).trim() },
    }, conn);
    await conn.commit();
    res.status(201).json({ repair_id: result.insertId, message: 'แจ้งซ่อมสำเร็จ และเปลี่ยนสถานะทรัพย์สินเป็นกำลังซ่อมแล้ว' });
  } catch (err) {
    await conn.rollback();
    console.error('[repairs:create]', err);
    res.status(500).json({ message: 'บันทึกแจ้งซ่อมไม่สำเร็จ' });
  } finally { conn.release(); }
});

// เปลี่ยนสถานะและบันทึกค่าใช้จ่าย
router.patch('/:id', requireAuth, STAFF, async (req, res) => {
  const { repair_status, cost, problem_detail, repair_date } = req.body;
  const allowed = ['pending', 'in_progress', 'done', 'cannot_repair'];
  if (!allowed.includes(repair_status)) return res.status(400).json({ message: 'สถานะงานซ่อมไม่ถูกต้อง' });
  if (cost !== undefined && (cost === '' || cost === null || !Number.isFinite(Number(cost)) || Number(cost) < 0)) {
    return res.status(400).json({ message: 'ค่าซ่อมต้องเป็นตัวเลขตั้งแต่ 0 บาทขึ้นไป' });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query('SELECT * FROM repair WHERE repair_id = ? FOR UPDATE', [req.params.id]);
    if (!rows.length) { await conn.rollback(); return res.status(404).json({ message: 'ไม่พบงานซ่อม' }); }
    const repair = rows[0];
    const [[asset]] = await conn.query('SELECT asset_code, asset_name, status FROM asset WHERE asset_id = ? FOR UPDATE', [repair.asset_id]);
    const date = repair_date || (repair_status === 'done' ? new Date().toISOString().slice(0, 10) : repair.repair_date);
    await conn.query(
      `UPDATE repair SET repair_status = ?, cost = ?, problem_detail = ?, repair_date = ? WHERE repair_id = ?`,
      [repair_status, cost === undefined ? repair.cost : Number(cost), problem_detail === undefined ? repair.problem_detail : String(problem_detail).trim(), date, repair.repair_id]
    );
    if (repair_status === 'done') {
      // คืนสถานะเป็นว่างเมื่อซ่อมเสร็จเท่านั้น
      await conn.query("UPDATE asset SET status = 'available' WHERE asset_id = ? AND status = 'repair'", [repair.asset_id]);
    } else if (repair_status === 'pending' || repair_status === 'in_progress') {
      await conn.query("UPDATE asset SET status = 'repair' WHERE asset_id = ? AND status <> 'retired'", [repair.asset_id]);
    }
    await recordActivity(req, {
      action: 'update', entityType: 'repair', entityId: repair.repair_id,
      summary: `อัปเดตงานซ่อม ${asset?.asset_name || `ทรัพย์สิน ${repair.asset_id}`} (${repair.repair_status} → ${repair_status})`,
      before: { asset_id: repair.asset_id, asset_code: asset?.asset_code, repair_status: repair.repair_status,
        cost: repair.cost, problem_detail: repair.problem_detail, repair_date: repair.repair_date },
      after: { asset_id: repair.asset_id, asset_code: asset?.asset_code, repair_status,
        cost: cost === undefined ? repair.cost : Number(cost),
        problem_detail: problem_detail === undefined ? repair.problem_detail : String(problem_detail).trim(), repair_date: date },
    }, conn);
    await conn.commit();
    res.json({ message: repair_status === 'done' ? 'บันทึกซ่อมเสร็จแล้ว และคืนสถานะทรัพย์สินเป็นว่างเรียบร้อย' : 'อัปเดตงานซ่อมสำเร็จ' });
  } catch (err) {
    await conn.rollback();
    console.error('[repairs:update]', err);
    res.status(500).json({ message: 'อัปเดตงานซ่อมไม่สำเร็จ' });
  } finally { conn.release(); }
});

module.exports = router;
