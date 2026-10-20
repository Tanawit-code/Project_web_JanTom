const pool = require('../config/db');

function safeJson(value) {
  if (value === undefined || value === null) return null;
  return JSON.stringify(value);
}

async function recordActivity(req, entry, db = pool) {
  const user = req.user || entry.actor || {};
  const actorName = user.username || `employee#${user.emp_id || 'unknown'}`;
  await db.query(
    `INSERT INTO ACTIVITY_LOG
       (actor_emp_id, actor_name, action, entity_type, entity_id, summary, before_data, after_data, ip_address)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [user.emp_id || null, actorName, entry.action, entry.entityType,
      entry.entityId == null ? null : String(entry.entityId), entry.summary,
      safeJson(entry.before), safeJson(entry.after), req.ip || null]
  );
}

module.exports = { recordActivity };
