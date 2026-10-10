const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { bangkokToday, bangkokDatePlusDays } = require('../utils/dates');

const TREND_DAYS = 14;

// สรุปภาพรวมสำหรับหน้า Dashboard ของ admin
router.get('/', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const today = bangkokToday();
    const trendStart = bangkokDatePlusDays(-(TREND_DAYS - 1));

    const [
      [assetStatus],
      [categories],
      [[reqCounts]],
      [overdue],
      [fineCounts],
      [[fineMonth]],
      [[empCounts]],
      [trendRows],
      [topAssets],
      [recent],
      [pendingList],
    ] = await Promise.all([
      pool.query('SELECT status, COUNT(*) AS n FROM ASSET GROUP BY status'),
      pool.query(
        `SELECT COALESCE(c.cat_name, 'ไม่ระบุหมวด') AS cat_name, COUNT(*) AS total, SUM(a.status = 'borrowed') AS borrowed
         FROM ASSET a LEFT JOIN ASSET_CATEGORY c ON c.cat_id = a.cat_id
         GROUP BY c.cat_id, c.cat_name ORDER BY total DESC`
      ),
      pool.query(
        `SELECT SUM(status = 'pending') AS pending,
                SUM(status = 'approved') AS approved_open,
                SUM(status = 'returned') AS returned_total,
                COUNT(*) AS total
         FROM BORROW_REQUEST`
      ),
      pool.query(
        `SELECT bd.detail_id, br.borrow_code, DATE_FORMAT(br.due_date, '%Y-%m-%d') AS due_date,
                DATEDIFF(?, br.due_date) AS days_late,
                a.asset_name, e.first_name, e.last_name
         FROM BORROW_DETAIL bd
         JOIN BORROW_REQUEST br ON br.borrow_id = bd.borrow_id
         JOIN ASSET a ON a.asset_id = bd.asset_id
         JOIN EMPLOYEE e ON e.emp_id = br.emp_id
         LEFT JOIN RETURN_RECORD rr ON rr.detail_id = bd.detail_id
         WHERE br.status = 'approved' AND rr.return_id IS NULL AND br.due_date < ?
         ORDER BY br.due_date ASC`,
        [today, today]
      ),
      pool.query(
        `SELECT status, COUNT(*) AS n, COALESCE(SUM(amount), 0) AS total FROM FINE GROUP BY status`
      ),
      pool.query(
        `SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS n FROM FINE
         WHERE status = 'paid' AND DATE_FORMAT(paid_at, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')`
      ),
      pool.query(
        `SELECT SUM(status = 'active') AS active, SUM(status = 'pending') AS pending FROM EMPLOYEE`
      ),
      pool.query(
        `SELECT DATE_FORMAT(request_date, '%Y-%m-%d') AS d, COUNT(*) AS n
         FROM BORROW_REQUEST WHERE request_date >= ? GROUP BY d`,
        [trendStart]
      ),
      pool.query(
        `SELECT a.asset_name, a.asset_code, COUNT(*) AS times
         FROM BORROW_DETAIL bd JOIN ASSET a ON a.asset_id = bd.asset_id
         GROUP BY a.asset_id, a.asset_name, a.asset_code ORDER BY times DESC, a.asset_name LIMIT 5`
      ),
      pool.query(
        `SELECT br.borrow_code, br.status, DATE_FORMAT(br.request_date, '%Y-%m-%d %H:%i') AS request_date,
                e.first_name, e.last_name,
                (SELECT COUNT(*) FROM BORROW_DETAIL WHERE borrow_id = br.borrow_id) AS items
         FROM BORROW_REQUEST br JOIN EMPLOYEE e ON e.emp_id = br.emp_id
         ORDER BY br.request_date DESC LIMIT 8`
      ),
      pool.query(
        `SELECT br.borrow_id, br.borrow_code, DATE_FORMAT(br.request_date, '%Y-%m-%d %H:%i') AS request_date,
                e.first_name, e.last_name
         FROM BORROW_REQUEST br JOIN EMPLOYEE e ON e.emp_id = br.emp_id
         WHERE br.status = 'pending' ORDER BY br.request_date ASC LIMIT 5`
      ),
    ]);

    const assets = { available: 0, borrowed: 0, repair: 0, retired: 0, total: 0 };
    assetStatus.forEach((r) => { assets[r.status] = Number(r.n); assets.total += Number(r.n); });

    const fines = {
      unpaid_count: 0, unpaid_total: 0, review_count: 0, review_total: 0,
      paid_total: 0, paid_month_total: Number(fineMonth.total), paid_month_count: Number(fineMonth.n),
    };
    fineCounts.forEach((r) => {
      if (r.status === 'unpaid') { fines.unpaid_count = Number(r.n); fines.unpaid_total = Number(r.total); }
      if (r.status === 'slip_submitted') { fines.review_count = Number(r.n); fines.review_total = Number(r.total); }
      if (r.status === 'paid') fines.paid_total = Number(r.total);
    });

    // เติมวันที่ไม่มีคำขอให้เป็น 0 เพื่อให้กราฟต่อเนื่อง
    const byDay = Object.fromEntries(trendRows.map((r) => [r.d, Number(r.n)]));
    const trend = [];
    for (let i = TREND_DAYS - 1; i >= 0; i--) {
      const d = bangkokDatePlusDays(-i);
      trend.push({ date: d, count: byDay[d] || 0 });
    }

    res.json({
      generated_at: new Date().toISOString(),
      assets,
      categories: categories.map((c) => ({ cat_name: c.cat_name, total: Number(c.total), borrowed: Number(c.borrowed || 0) })),
      requests: {
        pending: Number(reqCounts.pending || 0),
        approved_open: Number(reqCounts.approved_open || 0),
        returned_total: Number(reqCounts.returned_total || 0),
        total: Number(reqCounts.total || 0),
      },
      overdue: { count: overdue.length, items: overdue.slice(0, 6).map((o) => ({ ...o, days_late: Number(o.days_late) })) },
      fines,
      employees: { active: Number(empCounts.active || 0), pending: Number(empCounts.pending || 0) },
      trend,
      top_assets: topAssets.map((t) => ({ ...t, times: Number(t.times) })),
      recent_requests: recent.map((r) => ({ ...r, items: Number(r.items) })),
      pending_requests: pendingList,
    });
  } catch (err) {
    console.error('[dashboard]', err);
    res.status(500).json({ message: 'โหลดข้อมูลแดชบอร์ดไม่สำเร็จ' });
  }
});

module.exports = router;
