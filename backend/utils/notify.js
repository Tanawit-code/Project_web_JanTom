// แจ้งเตือนในเว็บ (ตาราง NOTIFICATION) — db คือ pool หรือ connection ก็ได้
async function notify(db, emp_id, { type, title, message = null, link = null }) {
  await db.query(
    'INSERT INTO NOTIFICATION (emp_id, type, title, message, link) VALUES (?,?,?,?,?)',
    [emp_id, type, String(title).slice(0, 150), message ? String(message).slice(0, 255) : null, link]
  );
}

async function notifyAdmins(db, payload) {
  const [admins] = await db.query("SELECT emp_id FROM EMPLOYEE WHERE role = 'admin' AND status = 'active'");
  for (const a of admins) await notify(db, a.emp_id, payload);
}

module.exports = { notify, notifyAdmins };
