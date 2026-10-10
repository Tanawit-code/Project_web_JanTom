const pool = require('../config/db');
const { notify } = require('./notify');
const { bangkokToday } = require('./dates');
const { sendNotifyEmail } = require('./mailer');

const FINE_TYPES = ['late', 'damaged', 'other'];
const STATUSES = ['unpaid', 'slip_submitted', 'paid', 'cancelled'];
const TYPE_LABEL = { late: 'ส่งคืนล่าช้า', damaged: 'ทรัพย์สินชำรุด/เสียหาย', other: 'ค่าปรับอื่น ๆ' };
const fmtMoney = (n) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const frontendUrl = () => process.env.FRONTEND_URL || 'http://localhost:5180';

function genFineCode() {
  return `FN-${bangkokToday().replace(/-/g, '')}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

// สร้างค่าปรับ + แจ้งเตือนในเว็บให้พนักงาน (db = pool หรือ connection ใน transaction)
async function createFine(db, { emp_id, detail_id = null, fine_type, amount, reason, created_by }) {
  let lastErr;
  for (let i = 0; i < 5; i++) {
    const fine_code = genFineCode();
    try {
      const [r] = await db.query(
        `INSERT INTO FINE (fine_code, emp_id, detail_id, fine_type, amount, reason, created_by) VALUES (?,?,?,?,?,?,?)`,
        [fine_code, emp_id, detail_id, fine_type, amount, reason, created_by]
      );
      await notify(db, emp_id, {
        type: 'fine_created',
        title: `ตรวจพบ: ${TYPE_LABEL[fine_type]}`,
        message: `${reason} — ค่าปรับ ${fmtMoney(amount)} บาท กรุณาชำระผ่าน QR แล้วแนบสลิป`,
        link: '/my-fines',
      });
      return { fine_id: r.insertId, fine_code };
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') { lastErr = e; continue; }
      throw e;
    }
  }
  throw lastErr;
}

// อีเมลแจ้งพนักงาน (best effort — เรียกหลัง commit และไม่ต้อง await)
async function emailFineCreated(emp_id, { fine_code, fine_type, amount, reason }) {
  try {
    const [[emp]] = await pool.query('SELECT email, first_name FROM EMPLOYEE WHERE emp_id = ?', [emp_id]);
    if (!emp || !emp.email) return;
    await sendNotifyEmail({
      to: emp.email,
      subject: `แจ้งค่าปรับ ${fine_code}: ${TYPE_LABEL[fine_type]}`,
      heading: `เรียน คุณ${emp.first_name}`,
      lines: [
        `ตรวจพบ: ${TYPE_LABEL[fine_type]}`,
        `รายละเอียด: ${reason}`,
        `ค่าปรับ: ${fmtMoney(amount)} บาท`,
        'กรุณาเข้าสู่ระบบ ชำระผ่าน QR Code และแนบสลิปการโอนเงิน',
      ],
      link: `${frontendUrl()}/my-fines`,
      linkText: 'ไปหน้าชำระค่าปรับ',
    });
  } catch (e) {
    console.error('[fine] email failed:', e.message);
  }
}

module.exports = { FINE_TYPES, STATUSES, TYPE_LABEL, fmtMoney, frontendUrl, createFine, emailFineCreated };
