const pool = require('../config/db');
const { bangkokDatePlusDays } = require('./dates');
const { sendDueReminderEmail } = require('./mailer');

let running = false;

async function sendDueReminders() {
  if (running) return;
  running = true;
  try {
    // Recover claims left behind if the process stopped during SMTP delivery.
    await pool.query(
      `DELETE FROM BORROW_DUE_REMINDER WHERE status = 'sending' AND created_at < DATE_SUB(NOW(), INTERVAL 30 MINUTE)`
    );
    const dueDate = bangkokDatePlusDays(1);
    const [rows] = await pool.query(
      `SELECT br.borrow_id, br.borrow_code, br.due_date,
              e.email, e.first_name, e.last_name,
              GROUP_CONCAT(a.asset_name ORDER BY a.asset_name SEPARATOR ', ') AS items
       FROM BORROW_REQUEST br
       JOIN EMPLOYEE e ON e.emp_id = br.emp_id
       JOIN BORROW_DETAIL bd ON bd.borrow_id = br.borrow_id
       JOIN ASSET a ON a.asset_id = bd.asset_id
       LEFT JOIN BORROW_DUE_REMINDER sent ON sent.borrow_id = br.borrow_id
       WHERE br.status = 'approved' AND br.due_date = ?
         AND e.email IS NOT NULL AND e.email <> '' AND sent.borrow_id IS NULL
       GROUP BY br.borrow_id, br.borrow_code, br.due_date, e.email, e.first_name, e.last_name`,
      [dueDate]
    );

    for (const row of rows) {
      // Reserve this request before sending to avoid duplicate messages across instances.
      const [claim] = await pool.query(
        `INSERT IGNORE INTO BORROW_DUE_REMINDER (borrow_id, status) VALUES (?, 'sending')`,
        [row.borrow_id]
      );
      if (!claim.affectedRows) continue;
      try {
        const sent = await sendDueReminderEmail({
          to: row.email,
          name: `${row.first_name} ${row.last_name}`,
          borrowCode: row.borrow_code,
          dueDate: String(row.due_date).slice(0, 10),
          items: row.items ? row.items.split(', ') : [],
        });
        if (sent) {
          await pool.query(
            `UPDATE BORROW_DUE_REMINDER SET status = 'sent', sent_at = NOW() WHERE borrow_id = ?`,
            [row.borrow_id]
          );
        } else {
          await pool.query('DELETE FROM BORROW_DUE_REMINDER WHERE borrow_id = ?', [row.borrow_id]);
        }
      } catch (err) {
        await pool.query('DELETE FROM BORROW_DUE_REMINDER WHERE borrow_id = ?', [row.borrow_id]);
        console.error(`[due-reminder] failed for ${row.borrow_code}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[due-reminder] job failed:', err.message);
  } finally {
    running = false;
  }
}

function startDueReminderJob() {
  // Run on startup and then every 15 minutes; the due-date filter is Bangkok local date.
  sendDueReminders();
  return setInterval(sendDueReminders, 15 * 60 * 1000);
}

module.exports = { startDueReminderJob, sendDueReminders };
