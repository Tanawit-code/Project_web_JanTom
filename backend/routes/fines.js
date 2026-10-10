const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const router = express.Router();
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { uploadSlip, SLIP_DIR } = require('../middleware/uploadSlip');
const { buildPromptPayPayload } = require('../utils/promptpay');
const { notify, notifyAdmins } = require('../utils/notify');
const { sendNotifyEmail } = require('../utils/mailer');
const { FINE_TYPES, STATUSES, TYPE_LABEL, fmtMoney, frontendUrl, createFine, emailFineCreated } = require('../utils/fines');

const clean = (v) => (typeof v === 'string' ? v.trim() : '');
// กัน async error ทำให้ process ล้ม
const h = (fn) => (req, res) =>
  fn(req, res).catch((err) => {
    console.error('[fines]', err);
    if (!res.headersSent) res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  });

const SELECT_FINE = `
  SELECT f.fine_id, f.fine_code, f.emp_id, f.detail_id, f.fine_type, f.amount, f.reason, f.status,
         (f.slip_file IS NOT NULL) AS has_slip, f.review_note,
         DATE_FORMAT(f.created_at, '%Y-%m-%d %H:%i') AS created_at,
         DATE_FORMAT(f.slip_uploaded_at, '%Y-%m-%d %H:%i') AS slip_uploaded_at,
         DATE_FORMAT(f.paid_at, '%Y-%m-%d %H:%i') AS paid_at,
         a.asset_name, a.asset_code, br.borrow_code,
         e.first_name, e.last_name, e.emp_code
  FROM FINE f
  JOIN EMPLOYEE e ON e.emp_id = f.emp_id
  LEFT JOIN BORROW_DETAIL bd ON bd.detail_id = f.detail_id
  LEFT JOIN ASSET a ON a.asset_id = bd.asset_id
  LEFT JOIN BORROW_REQUEST br ON br.borrow_id = bd.borrow_id`;
const shape = (r) => ({ ...r, amount: Number(r.amount), has_slip: !!r.has_slip, type_label: TYPE_LABEL[r.fine_type] });

function looksLikeImage(b) {
  if (b.length < 12) return false;
  const jpg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  const png = b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
  const webp = b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP';
  return jpg || png || webp;
}
const removeSlip = (file) => { if (file) fs.unlink(path.join(SLIP_DIR, path.basename(file)), () => {}); };

// ---------------- พนักงาน ----------------
router.get('/mine', requireAuth, h(async (req, res) => {
  const [rows] = await pool.query(
    `${SELECT_FINE} WHERE f.emp_id = ?
     ORDER BY FIELD(f.status, 'unpaid', 'slip_submitted', 'paid', 'cancelled'), f.created_at DESC`,
    [req.user.emp_id]
  );
  res.json(rows.map(shape));
}));

router.get('/mine/summary', requireAuth, h(async (req, res) => {
  const [[r]] = await pool.query(
    `SELECT SUM(status = 'unpaid') AS unpaid_count,
            COALESCE(SUM(CASE WHEN status = 'unpaid' THEN amount END), 0) AS unpaid_total,
            SUM(status = 'slip_submitted') AS submitted_count
     FROM FINE WHERE emp_id = ?`,
    [req.user.emp_id]
  );
  res.json({
    unpaid_count: Number(r.unpaid_count || 0),
    unpaid_total: Number(r.unpaid_total || 0),
    submitted_count: Number(r.submitted_count || 0),
  });
}));

// QR PromptPay ตามยอดค่าปรับ (เจ้าของรายการหรือ admin เท่านั้น)
router.get('/:id/qr', requireAuth, h(async (req, res) => {
  const [[fine]] = await pool.query('SELECT emp_id, amount, status, fine_code FROM FINE WHERE fine_id = ?', [req.params.id]);
  if (!fine) return res.status(404).json({ message: 'ไม่พบรายการค่าปรับ' });
  if (req.user.role !== 'admin' && fine.emp_id !== req.user.emp_id) return res.status(403).json({ message: 'ไม่มีสิทธิ์' });
  if (fine.status !== 'unpaid') return res.status(409).json({ message: 'รายการนี้ไม่ได้อยู่ในสถานะรอชำระ' });
  if (!process.env.PROMPTPAY_ID) {
    return res.status(503).json({ message: 'ระบบยังไม่ได้ตั้งค่าบัญชีรับชำระเงิน กรุณาติดต่อผู้ดูแลระบบ' });
  }
  let payload;
  try { payload = buildPromptPayPayload(process.env.PROMPTPAY_ID, Number(fine.amount)); }
  catch (e) { console.error('[fines] promptpay:', e.message); return res.status(503).json({ message: 'ตั้งค่าบัญชีรับชำระเงินไม่ถูกต้อง กรุณาติดต่อผู้ดูแลระบบ' }); }
  res.json({ payload, amount: Number(fine.amount), account_name: process.env.PROMPTPAY_NAME || '', fine_code: fine.fine_code });
}));

// แนบสลิป (เจ้าของรายการเท่านั้น)
router.post('/:id/slip', requireAuth, (req, res) => {
  uploadSlip.single('slip')(req, res, async (err) => {
    const file = req.file;
    const cleanup = () => { if (file) fs.unlink(file.path, () => {}); };
    if (err) {
      return res.status(400).json({ message: err.code === 'LIMIT_FILE_SIZE' ? 'ไฟล์ใหญ่เกิน 5MB' : (err.message || 'อัปโหลดไม่สำเร็จ') });
    }
    if (!file) return res.status(400).json({ message: 'กรุณาแนบรูปสลิป' });
    try {
      const id = Number(req.params.id);
      const [[fine]] = await pool.query('SELECT * FROM FINE WHERE fine_id = ? AND emp_id = ?', [id, req.user.emp_id]);
      if (!fine) { cleanup(); return res.status(404).json({ message: 'ไม่พบรายการค่าปรับ' }); }
      if (fine.status !== 'unpaid') { cleanup(); return res.status(409).json({ message: 'รายการนี้ไม่อยู่ในสถานะที่แนบสลิปได้' }); }

      const buf = await fs.promises.readFile(file.path);
      if (!looksLikeImage(buf)) { cleanup(); return res.status(400).json({ message: 'ไฟล์ไม่ใช่รูปภาพที่ถูกต้อง' }); }
      const hash = crypto.createHash('sha256').update(buf).digest('hex');
      const [dups] = await pool.query('SELECT fine_id FROM FINE WHERE slip_hash = ? AND fine_id <> ?', [hash, id]);
      if (dups.length > 0) { cleanup(); return res.status(409).json({ message: 'สลิปนี้เคยถูกใช้กับรายการอื่นแล้ว' }); }

      const [upd] = await pool.query(
        `UPDATE FINE SET status = 'slip_submitted', slip_file = ?, slip_hash = ?, slip_uploaded_at = NOW(), review_note = NULL
         WHERE fine_id = ? AND emp_id = ? AND status = 'unpaid'`,
        [file.filename, hash, id, req.user.emp_id]
      );
      if (upd.affectedRows === 0) { cleanup(); return res.status(409).json({ message: 'ไม่สามารถแนบสลิปได้ กรุณารีเฟรชหน้า' }); }

      const [[emp]] = await pool.query('SELECT first_name, last_name FROM EMPLOYEE WHERE emp_id = ?', [req.user.emp_id]);
      const who = emp ? `${emp.first_name} ${emp.last_name}` : 'พนักงาน';
      await notifyAdmins(pool, {
        type: 'slip_submitted',
        title: 'มีสลิปค่าปรับรอตรวจสอบ',
        message: `${who} ส่งสลิปค่าปรับ ${fine.fine_code} จำนวน ${fmtMoney(fine.amount)} บาท`,
        link: '/admin/fines',
      });
      sendNotifyEmail({
        to: process.env.ADMIN_EMAIL,
        subject: `สลิปค่าปรับรอตรวจสอบ ${fine.fine_code}`,
        heading: 'มีสลิปค่าปรับรอตรวจสอบ',
        lines: [`ผู้ชำระ: ${who}`, `รายการ: ${fine.fine_code}`, `จำนวน: ${fmtMoney(fine.amount)} บาท`],
        link: `${frontendUrl()}/admin/fines`,
        linkText: 'ไปตรวจสอบสลิป',
      }).catch((e) => console.error('[fines] admin email:', e.message));

      res.json({ message: 'ส่งสลิปเรียบร้อย รอผู้ดูแลระบบตรวจสอบ' });
    } catch (e) {
      cleanup();
      console.error('[fines] slip:', e);
      res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
    }
  });
});

// ดูสลิป (เจ้าของรายการหรือ admin เท่านั้น)
router.get('/:id/slip', requireAuth, h(async (req, res) => {
  const [[fine]] = await pool.query('SELECT emp_id, slip_file FROM FINE WHERE fine_id = ?', [req.params.id]);
  if (!fine || !fine.slip_file) return res.status(404).json({ message: 'ไม่พบสลิป' });
  if (req.user.role !== 'admin' && fine.emp_id !== req.user.emp_id) return res.status(403).json({ message: 'ไม่มีสิทธิ์' });
  res.set('Cache-Control', 'private, no-store');
  res.sendFile(path.join(SLIP_DIR, path.basename(fine.slip_file)), (e) => {
    if (e && !res.headersSent) res.status(404).json({ message: 'ไม่พบไฟล์สลิป' });
  });
}));

// ---------------- admin ----------------
router.get('/pending-count', requireAuth, requireRole('admin'), h(async (req, res) => {
  const [[r]] = await pool.query("SELECT COUNT(*) AS n FROM FINE WHERE status = 'slip_submitted'");
  res.json({ count: Number(r.n) });
}));

router.get('/', requireAuth, requireRole('admin'), h(async (req, res) => {
  const { status } = req.query;
  const params = [];
  let where = '';
  if (status && STATUSES.includes(status)) { where = 'WHERE f.status = ?'; params.push(status); }
  const [rows] = await pool.query(`${SELECT_FINE} ${where} ORDER BY f.created_at DESC LIMIT 300`, params);
  const [cnt] = await pool.query('SELECT status, COUNT(*) AS n FROM FINE GROUP BY status');
  const counts = { unpaid: 0, slip_submitted: 0, paid: 0, cancelled: 0 };
  cnt.forEach((c) => { counts[c.status] = Number(c.n); });
  res.json({ items: rows.map(shape), counts });
}));

// สร้างค่าปรับให้พนักงาน (เช่น พบความเสียหายภายหลัง)
router.post('/', requireAuth, requireRole('admin'), h(async (req, res) => {
  const emp_id = Number(req.body.emp_id);
  const fine_type = req.body.fine_type;
  const amount = Math.round(Number(req.body.amount) * 100) / 100;
  const reason = clean(req.body.reason).slice(0, 255);
  const detail_id = req.body.detail_id ? Number(req.body.detail_id) : null;

  if (!emp_id || !FINE_TYPES.includes(fine_type) || !reason) {
    return res.status(400).json({ message: 'กรุณาเลือกพนักงาน ประเภทค่าปรับ และระบุเหตุผล' });
  }
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000) {
    return res.status(400).json({ message: 'จำนวนเงินไม่ถูกต้อง' });
  }
  const [[emp]] = await pool.query("SELECT emp_id FROM EMPLOYEE WHERE emp_id = ? AND status = 'active'", [emp_id]);
  if (!emp) return res.status(404).json({ message: 'ไม่พบพนักงาน' });
  if (detail_id) {
    const [[d]] = await pool.query(
      `SELECT 1 AS ok FROM BORROW_DETAIL bd JOIN BORROW_REQUEST br ON br.borrow_id = bd.borrow_id
       WHERE bd.detail_id = ? AND br.emp_id = ?`, [detail_id, emp_id]);
    if (!d) return res.status(400).json({ message: 'รายการยืมไม่ตรงกับพนักงานที่เลือก' });
  }
  const fine = await createFine(pool, { emp_id, detail_id, fine_type, amount, reason, created_by: req.user.emp_id });
  emailFineCreated(emp_id, { fine_code: fine.fine_code, fine_type, amount, reason });
  res.status(201).json({ ...fine, message: 'สร้างค่าปรับและแจ้งเตือนพนักงานแล้ว' });
}));

// ตรวจสลิป: approve = ยืนยันชำระแล้ว, reject = ปฏิเสธ (พนักงานแนบใหม่ได้)
router.patch('/:id/review', requireAuth, requireRole('admin'), h(async (req, res) => {
  const id = Number(req.params.id);
  const action = req.body.action;
  const note = clean(req.body.note).slice(0, 255);
  if (!['approve', 'reject'].includes(action)) return res.status(400).json({ message: 'action ไม่ถูกต้อง' });
  if (action === 'reject' && !note) return res.status(400).json({ message: 'กรุณาระบุเหตุผลที่ปฏิเสธสลิป' });

  const [[fine]] = await pool.query('SELECT * FROM FINE WHERE fine_id = ?', [id]);
  if (!fine) return res.status(404).json({ message: 'ไม่พบรายการค่าปรับ' });
  if (fine.status !== 'slip_submitted') return res.status(409).json({ message: 'รายการนี้ไม่ได้อยู่ในสถานะรอตรวจสลิป' });

  let upd;
  if (action === 'approve') {
    [upd] = await pool.query(
      `UPDATE FINE SET status = 'paid', paid_at = NOW(), reviewed_by = ?, review_note = NULL
       WHERE fine_id = ? AND status = 'slip_submitted'`, [req.user.emp_id, id]);
  } else {
    [upd] = await pool.query(
      `UPDATE FINE SET status = 'unpaid', review_note = ?, reviewed_by = ?,
              slip_file = NULL, slip_hash = NULL, slip_uploaded_at = NULL
       WHERE fine_id = ? AND status = 'slip_submitted'`, [note, req.user.emp_id, id]);
    if (upd.affectedRows > 0) removeSlip(fine.slip_file);
  }
  if (upd.affectedRows === 0) return res.status(409).json({ message: 'รายการถูกดำเนินการไปแล้ว' });

  const approved = action === 'approve';
  await notify(pool, fine.emp_id, approved
    ? { type: 'fine_paid', title: 'ยืนยันการชำระค่าปรับแล้ว', message: `ค่าปรับ ${fine.fine_code} จำนวน ${fmtMoney(fine.amount)} บาท ชำระเรียบร้อย ขอบคุณครับ`, link: '/my-fines' }
    : { type: 'fine_rejected', title: 'สลิปไม่ผ่านการตรวจสอบ', message: `ค่าปรับ ${fine.fine_code}: ${note} — กรุณาแนบสลิปใหม่`, link: '/my-fines' });

  const [[emp]] = await pool.query('SELECT email, first_name FROM EMPLOYEE WHERE emp_id = ?', [fine.emp_id]);
  if (emp && emp.email) {
    sendNotifyEmail({
      to: emp.email,
      subject: approved ? `ชำระค่าปรับ ${fine.fine_code} เรียบร้อยแล้ว` : `สลิปค่าปรับ ${fine.fine_code} ไม่ผ่านการตรวจสอบ`,
      heading: `เรียน คุณ${emp.first_name}`,
      lines: approved
        ? [`ผู้ดูแลระบบยืนยันการชำระค่าปรับ ${fine.fine_code} จำนวน ${fmtMoney(fine.amount)} บาท เรียบร้อยแล้ว`]
        : [`สลิปของค่าปรับ ${fine.fine_code} ไม่ผ่านการตรวจสอบ`, `เหตุผล: ${note}`, 'กรุณาแนบสลิปใหม่อีกครั้ง'],
      link: `${frontendUrl()}/my-fines`,
      linkText: 'ไปหน้าค่าปรับของฉัน',
    }).catch((e) => console.error('[fines] email:', e.message));
  }
  res.json({ message: approved ? 'ยืนยันการชำระแล้ว และแจ้งพนักงานเรียบร้อย' : 'ปฏิเสธสลิปแล้ว และแจ้งพนักงานให้แนบใหม่' });
}));

// ยกเลิกค่าปรับ (กรณีบันทึกผิด)
router.patch('/:id/cancel', requireAuth, requireRole('admin'), h(async (req, res) => {
  const id = Number(req.params.id);
  const [[fine]] = await pool.query('SELECT * FROM FINE WHERE fine_id = ?', [id]);
  if (!fine) return res.status(404).json({ message: 'ไม่พบรายการค่าปรับ' });
  const [upd] = await pool.query(
    `UPDATE FINE SET status = 'cancelled', reviewed_by = ?, slip_file = NULL, slip_hash = NULL
     WHERE fine_id = ? AND status IN ('unpaid', 'slip_submitted')`, [req.user.emp_id, id]);
  if (upd.affectedRows === 0) return res.status(409).json({ message: 'ยกเลิกไม่ได้ รายการนี้ชำระแล้วหรือถูกยกเลิกไปแล้ว' });
  removeSlip(fine.slip_file);
  await notify(pool, fine.emp_id, {
    type: 'fine_cancelled', title: 'ยกเลิกค่าปรับ',
    message: `ค่าปรับ ${fine.fine_code} จำนวน ${fmtMoney(fine.amount)} บาท ถูกยกเลิกแล้ว ไม่ต้องชำระ`, link: '/my-fines',
  });
  res.json({ message: 'ยกเลิกค่าปรับแล้ว' });
}));

module.exports = router;
