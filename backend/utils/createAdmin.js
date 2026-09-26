// node utils/createAdmin.js <username> <email> <password>
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { validatePasswordStrength } = require('./password');

async function main() {
  const [username, email, password] = process.argv.slice(2);
  if (!username || !password) {
    console.log('Usage: node utils/createAdmin.js <username> <email> <password>');
    process.exit(1);
  }
  const check = validatePasswordStrength(password);
  if (!check.valid) { console.log('Password rejected:', check.message); process.exit(1); }

  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO EMPLOYEE (emp_code, first_name, last_name, username, password_hash, role)
     VALUES (?, 'ผู้ดูแล', 'ระบบ', ?, ?, 'admin')
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = 'admin'`,
    ['ADM-0001', username, hash]
  );
  console.log('Admin account ready:', username);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
