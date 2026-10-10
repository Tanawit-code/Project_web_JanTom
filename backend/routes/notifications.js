const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const h = (fn) => (req, res) =>
  fn(req, res).catch((err) => {
    console.error('[notifications]', err);
    if (!res.headersSent) res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  });

router.get('/', requireAuth, h(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT notif_id, type, title, message, link, is_read,
            DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') AS created_at
     FROM NOTIFICATION WHERE emp_id = ? ORDER BY notif_id DESC LIMIT 30`,
    [req.user.emp_id]
  );
  res.json(rows);
}));

router.get('/unread-count', requireAuth, h(async (req, res) => {
  const [[r]] = await pool.query('SELECT COUNT(*) AS n FROM NOTIFICATION WHERE emp_id = ? AND is_read = 0', [req.user.emp_id]);
  res.json({ count: Number(r.n) });
}));

router.post('/read-all', requireAuth, h(async (req, res) => {
  await pool.query('UPDATE NOTIFICATION SET is_read = 1 WHERE emp_id = ? AND is_read = 0', [req.user.emp_id]);
  res.json({ ok: true });
}));

router.post('/:id/read', requireAuth, h(async (req, res) => {
  await pool.query('UPDATE NOTIFICATION SET is_read = 1 WHERE notif_id = ? AND emp_id = ?', [req.params.id, req.user.emp_id]);
  res.json({ ok: true });
}));

module.exports = router;
