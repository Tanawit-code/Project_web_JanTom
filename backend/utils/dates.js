// วันที่ปัจจุบันตามเวลาไทย (UTC+7) ไม่ขึ้นกับ time zone ของเครื่อง/MySQL
const BKK_OFFSET_MS = 7 * 60 * 60 * 1000;

function bangkokToday() {
  return new Date(Date.now() + BKK_OFFSET_MS).toISOString().slice(0, 10); // YYYY-MM-DD
}

function bangkokDatePlusDays(days) {
  return new Date(Date.now() + BKK_OFFSET_MS + days * 86400000).toISOString().slice(0, 10);
}

// ตรวจว่าเป็น YYYY-MM-DD ที่มีอยู่จริง และปีเป็น ค.ศ. ที่สมเหตุสมผล
// (กันกรณีเบราว์เซอร์ส่งปี พ.ศ. เช่น 2569 เข้ามาเก็บเป็น ค.ศ.)
function isValidCeDate(str, { minYear = 1990, maxYear = new Date().getFullYear() + 10 } = {}) {
  if (typeof str !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(str)) return false;
  const [y, m, d] = str.slice(0, 10).split('-').map(Number);
  if (y < minYear || y > maxYear) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

module.exports = { bangkokToday, bangkokDatePlusDays, isValidCeDate };
