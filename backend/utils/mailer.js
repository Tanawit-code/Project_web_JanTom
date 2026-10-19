const nodemailer = require('nodemailer');
require('dotenv').config();

const port = Number(process.env.SMTP_PORT) || 587;
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port,
  secure: port === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// กัน HTML injection จากข้อมูลที่ผู้สมัครกรอกเอง
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

async function sendMail({ to, subject, html, devLog }) {
  // ถ้ายังไม่ตั้งค่า SMTP ให้ log ลง console แทน (สะดวกตอนพัฒนา)
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('[mailer] SMTP not configured.', devLog || subject, '-> to:', to);
    return false;
  }
  await transporter.sendMail({ from: process.env.SMTP_USER, to, subject, html });
  return true;
}

async function sendResetEmail(toEmail, resetLink) {
  await sendMail({
    to: toEmail,
    subject: 'รีเซ็ตรหัสผ่านบัญชีของคุณ',
    html: `<p>เราได้รับคำขอรีเซ็ตรหัสผ่านของบัญชีนี้ กดปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่</p>
           <p><a href="${esc(resetLink)}" style="background:#2563eb;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">ตั้งรหัสผ่านใหม่</a></p>
           <p style="color:#666;font-size:12px;">ลิงก์ใช้ได้ครั้งเดียวและหมดอายุใน 15 นาที<br>
           หากคุณไม่ได้เป็นผู้ขอ สามารถเพิกเฉยต่ออีเมลนี้ได้ รหัสผ่านเดิมจะไม่ถูกเปลี่ยน</p>`,
    devLog: `Reset link: ${resetLink}`,
  });
}

async function sendEmailChangeConfirmation(oldEmail, newEmail, confirmLink) {
  return sendMail({
    to: oldEmail,
    subject: 'ยืนยันการเปลี่ยนอีเมลบัญชี',
    html: `<p>มีคำขอเปลี่ยนอีเมลบัญชีของคุณเป็น <b>${esc(newEmail)}</b></p><p>หากเป็นคุณ ให้ยืนยันภายใน 30 นาที:</p><p><a href="${esc(confirmLink)}">ยืนยันการเปลี่ยนอีเมล</a></p><p>หากคุณไม่ได้เป็นผู้ขอ โปรดเพิกเฉย อีเมลเดิมจะยังคงใช้งานได้</p>`,
    devLog: `Email change confirmation link: ${confirmLink}`,
  });
}

async function sendPasswordChangeConfirmation(toEmail, confirmLink) {
  return sendMail({
    to: toEmail,
    subject: 'ยืนยันการเปลี่ยนรหัสผ่านบัญชี',
    html: `<p>มีคำขอเปลี่ยนรหัสผ่านของบัญชีคุณ หากเป็นคุณ กดปุ่มด้านล่างเพื่อยืนยันภายใน 30 นาที</p>
           <p><a href="${esc(confirmLink)}" style="background:#2563eb;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">ยืนยันการเปลี่ยนรหัสผ่าน</a></p>
           <p style="color:#666;font-size:12px;">หากคุณไม่ได้เป็นผู้ขอ โปรดเพิกเฉย รหัสผ่านเดิมจะยังใช้งานได้ และควรเปลี่ยนรหัสผ่านทันทีหากสงสัยว่าบัญชีถูกใช้งานโดยผู้อื่น</p>`,
    devLog: `Password change confirmation link: ${confirmLink}`,
  });
}

// ส่งไปหา admin เมื่อมีคนสมัครใหม่
async function sendApprovalRequestEmail(applicant, reviewLink) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.log('[mailer] ADMIN_EMAIL not set. Review link ->', reviewLink);
    return;
  }
  await sendMail({
    to: adminEmail,
    subject: `คำขอสมัครสมาชิกใหม่: ${applicant.first_name} ${applicant.last_name} (${applicant.emp_code})`,
    html: `<p>มีผู้สมัครใช้งานระบบยืมคืนทรัพย์สิน กรุณาตรวจสอบว่าเป็นพนักงานจริงหรือไม่</p>
           <ul>
             <li>รหัสพนักงาน: ${esc(applicant.emp_code)}</li>
             <li>ชื่อ-นามสกุล: ${esc(applicant.first_name)} ${esc(applicant.last_name)}</li>
             <li>Username: ${esc(applicant.username)}</li>
             <li>อีเมล: ${esc(applicant.email)}</li>
           </ul>
           <p><a href="${esc(reviewLink)}" style="background:#2563eb;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">เปิดหน้าตรวจสอบเพื่ออนุมัติ / ปฏิเสธ</a></p>
           <p style="color:#666;font-size:12px;">ลิงก์ใช้ได้ครั้งเดียวและหมดอายุใน 7 วัน</p>`,
    devLog: `Review link: ${reviewLink}`,
  });
}

// แจ้งผู้สมัครเมื่อ admin ตัดสินแล้ว
// คืนค่า true ถ้าส่งออกจริง, false ถ้ายังไม่ได้ตั้งค่า SMTP (throw ถ้าส่งไม่สำเร็จ)
async function sendRegistrationResultEmail(toEmail, approved) {
  if (!toEmail) return false;
  return sendMail({
    to: toEmail,
    subject: approved ? 'บัญชีของคุณได้รับการอนุมัติแล้ว' : 'คำขอสมัครสมาชิกไม่ได้รับการอนุมัติ',
    html: approved
      ? `<p>ผู้ดูแลระบบอนุมัติบัญชีของคุณแล้ว สามารถเข้าสู่ระบบได้ทันที</p>
         <p><a href="${esc(process.env.FRONTEND_URL || '')}/login">เข้าสู่ระบบ</a></p>`
      : `<p>ขออภัย คำขอสมัครสมาชิกของคุณไม่ได้รับการอนุมัติ หากเห็นว่าเป็นความผิดพลาด กรุณาติดต่อผู้ดูแลระบบ</p>`,
    devLog: approved ? 'Approved notice' : 'Rejected notice',
  });
}

// อีเมลแจ้งเตือนทั่วไป (ค่าปรับ/ผลตรวจสลิป) คืน false ถ้าไม่มีผู้รับหรือยังไม่ตั้ง SMTP
async function sendNotifyEmail({ to, subject, heading, lines = [], link, linkText }) {
  if (!to) return false;
  const html = `<h3>${esc(heading)}</h3>` +
    lines.map((l) => `<p>${esc(l)}</p>`).join('') +
    (link ? `<p><a href="${esc(link)}" style="background:#2563eb;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">${esc(linkText || 'เปิดดูรายละเอียด')}</a></p>` : '');
  return sendMail({ to, subject, html, devLog: `${subject}${link ? ' -> ' + link : ''}` });
}

async function sendDueReminderEmail({ to, name, borrowCode, dueDate, items }) {
  return sendMail({
    to,
    subject: `แจ้งเตือน: ใกล้ถึงกำหนดคืนทรัพย์สิน ${borrowCode}`,
    html: `<h3>แจ้งเตือนกำหนดคืนทรัพย์สิน</h3>
      <p>เรียน ${esc(name || 'ผู้ยืม')}</p>
      <p>รายการยืม <b>${esc(borrowCode)}</b> มีกำหนดคืนวันที่ <b>${esc(dueDate)}</b></p>
      <p>ทรัพย์สิน: ${items.map(esc).join(', ')}</p>
      <p>กรุณาดำเนินการคืนภายในกำหนด ขอบคุณครับ</p>`,
    devLog: `Due reminder ${borrowCode}`,
  });
}

module.exports = { sendNotifyEmail, sendDueReminderEmail, sendResetEmail, sendApprovalRequestEmail, sendRegistrationResultEmail, sendEmailChangeConfirmation, sendPasswordChangeConfirmation };
