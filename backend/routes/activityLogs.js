const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(10, Number.parseInt(req.query.limit, 10) || 25));
    const offset = (page - 1) * limit;
    const search = String(req.query.search || '').trim().slice(0, 100);
    const action = String(req.query.action || '').trim().slice(0, 40);
    const where = [];
    const params = [];
    if (search) {
      where.push('(actor_name LIKE ? OR summary LIKE ? OR entity_type LIKE ? OR entity_id LIKE ?)');
      params.push(...Array(4).fill(`%${search}%`));
    }
    if (action) { where.push('action = ?'); params.push(action); }
    const clause = where.length ? ` WHERE ${where.join(' AND ')}` : '';
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM ACTIVITY_LOG${clause}`, params);
    const [rows] = await pool.query(
      `SELECT log_id, actor_emp_id, actor_name, action, entity_type, entity_id, summary,
              before_data, after_data, ip_address,
              DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at
       FROM ACTIVITY_LOG${clause} ORDER BY created_at DESC, log_id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    res.json({ rows, total, page, limit });
  } catch (err) {
    console.error('[activity-logs]', err);
    res.status(500).json({ message: 'โหลดประวัติกิจกรรมไม่สำเร็จ กรุณาตรวจสอบว่าได้ติดตั้ง migration_activity_log.sql แล้ว' });
  }
});

module.exports = router;
