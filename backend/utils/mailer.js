const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendResetEmail(toEmail, resetLink) {
  // If SMTP is not configured, log to console instead of throwing —
  // handy for local dev/demo without a real mail account.
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('[mailer] SMTP not configured. Reset link for', toEmail, '->', resetLink);
    return;
  }
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: toEmail,
    subject: 'รีเซ็ตรหัสผ่านบัญชีของคุณ',
    html: `<p>คลิกลิงก์ด้านล่างเพื่อตั้งรหัสผ่านใหม่ (หมดอายุใน 15 นาที)</p>
           <p><a href="${resetLink}">${resetLink}</a></p>`,
  });
}

module.exports = { sendResetEmail };
