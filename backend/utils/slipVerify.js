// ตรวจสลิปโอนเงินอัตโนมัติ
// - provider "slipok" : ส่งรูปสลิปไปตรวจกับธนาคารผ่าน SlipOK API (https://slipok.com/api-documentation/)
// - provider "mock"   : จำลองผลลัพธ์ไว้ทดสอบระบบโดยไม่เสียโควต้า/ไม่ต้องมี API key
// - provider "none"   : ปิดระบบอัตโนมัติ (admin ตรวจสลิปด้วยตาเหมือนเดิม)

const provider = () => (process.env.SLIP_PROVIDER || 'none').trim().toLowerCase();
const enabled = () => provider() !== 'none';

const TOLERANCE_MIN = 10; // ยอมให้เวลานาฬิกาเครื่องกับธนาคารคลาดเคลื่อนได้กี่นาที

// ---------------- เรียก API ผู้ให้บริการ ----------------
// คืนค่า { ok: true, data } หรือ { ok: false, kind, code, message }
// kind: 'invalid' (สลิปไม่ถูกต้อง) | 'duplicate' | 'delay' (ธนาคารยังไม่พร้อมให้ตรวจ) | 'unavailable' (ตรวจไม่ได้ ให้ admin ตรวจเอง)
async function callSlipOk(buffer, filename, mime) {
  const branch = process.env.SLIPOK_BRANCH_ID;
  const key = process.env.SLIPOK_API_KEY;
  if (!branch || !key) return { ok: false, kind: 'unavailable', code: 'config', message: 'ยังไม่ได้ตั้งค่า SLIPOK_BRANCH_ID / SLIPOK_API_KEY' };

  const base = (process.env.SLIPOK_BASE_URL || 'https://api.slipok.com').replace(/\/+$/, '');
  const form = new FormData();
  form.append('files', new Blob([buffer], { type: mime || 'image/jpeg' }), filename || 'slip.jpg');
  // ไม่ส่ง amount/log เพื่อให้ได้ข้อมูลสลิปกลับมาครบ แล้วเทียบยอด/บัญชี/ซ้ำเองในระบบนี้

  let res;
  try {
    res = await fetch(`${base}/api/line/apikey/${encodeURIComponent(branch)}`, {
      method: 'POST',
      headers: { 'x-authorization': key },
      body: form,
      signal: AbortSignal.timeout(20000),
    });
  } catch (e) {
    return { ok: false, kind: 'unavailable', code: 'network', message: `เชื่อมต่อบริการตรวจสลิปไม่ได้ (${e.name})` };
  }

  const json = await res.json().catch(() => null);
  if (json && json.success && json.data && json.data.success) return { ok: true, data: json.data };

  const code = Number(json && json.code);
  const message = (json && json.message) || `HTTP ${res.status}`;
  if ([1005, 1006, 1007, 1008, 1011].includes(code)) return { ok: false, kind: 'invalid', code, message };
  if (code === 1010) return { ok: false, kind: 'delay', code, message };
  if (code === 1012) return { ok: false, kind: 'duplicate', code, message };
  // 1000-1004 (ตั้งค่า/แพ็กเกจ/โควต้า), 1009 (ธนาคารขัดข้อง), 1013/1014 และอื่น ๆ -> ตรวจอัตโนมัติไม่ได้ ส่งให้ admin
  return { ok: false, kind: 'unavailable', code: Number.isFinite(code) ? code : 'http', message };
}

// ผลจำลองสำหรับทดสอบ: SLIP_MOCK_MODE = ok (ค่าเริ่มต้น) | wrong_amount | wrong_receiver | invalid | delay | error
function callMock(buffer, ctx) {
  const mode = (process.env.SLIP_MOCK_MODE || 'ok').trim().toLowerCase();
  if (mode === 'invalid') return { ok: false, kind: 'invalid', code: 1007, message: 'รูปภาพไม่มี QR Code (mock)' };
  if (mode === 'delay') return { ok: false, kind: 'delay', code: 1010, message: 'ธนาคารยังไม่พร้อมให้ตรวจ (mock)' };
  if (mode === 'error') return { ok: false, kind: 'unavailable', code: 'mock', message: 'จำลองบริการตรวจสลิปล่ม (mock)' };
  const id = String(process.env.PROMPTPAY_ID || '').replace(/\D/g, '');
  const masked = id.length >= 7 ? id.slice(0, 3) + 'x'.repeat(id.length - 7) + id.slice(-4) : id;
  const crypto = require('crypto');
  return {
    ok: true,
    data: {
      success: true,
      transRef: 'MOCK' + crypto.createHash('sha1').update(buffer).digest('hex').slice(0, 20).toUpperCase(),
      transTimestamp: new Date().toISOString(),
      amount: mode === 'wrong_amount' ? Number(ctx.expectedAmount) - 10 : Number(ctx.expectedAmount),
      sendingBank: '004', receivingBank: '014',
      receiver: {
        displayName: process.env.SLIP_RECEIVER_NAME || 'mock receiver',
        name: process.env.SLIP_RECEIVER_NAME || 'mock receiver',
        proxy: { type: 'MSISDN', value: mode === 'wrong_receiver' ? masked.replace(/\d$/, (d) => String((Number(d) + 1) % 10)) : masked },
        account: { type: 'BANKAC', value: 'xxx-x-x1234-x' },
      },
    },
  };
}

async function verifySlipImage(buffer, filename, mime, ctx = {}) {
  const p = provider();
  if (p === 'slipok') return callSlipOk(buffer, filename, mime);
  if (p === 'mock') return callMock(buffer, ctx);
  return { ok: false, kind: 'unavailable', code: 'off', message: 'ปิดระบบตรวจสลิปอัตโนมัติ' };
}

// ---------------- ตรวจชื่อ/เลขบัญชีผู้รับ ----------------
// ค่าบนสลิปถูกปิดบังบางหลัก เช่น 086xxx7894 เทียบกับเลขจริงทีละตำแหน่ง
// คืน 'match' | 'mismatch' | 'unknown'
function matchMasked(masked, real) {
  // รองรับเบอร์แบบ +66 / 66 ที่ขึ้นต้นด้วยรหัสประเทศ ให้เทียบเป็นรูปแบบ 0xxxxxxxxx
  const norm = (v) => { const t = String(v || '').replace(/[^0-9xX*•]/g, ''); return /^66[0-9xX*•]{9}$/.test(t) ? '0' + t.slice(2) : t; };
  const m = norm(masked);
  const r = norm(real).replace(/\D/g, '');
  if (!m || !r || m.length !== r.length) return 'unknown';
  let visible = 0;
  for (let i = 0; i < m.length; i++) {
    if (/[xX*•]/.test(m[i])) continue;
    visible++;
    if (m[i] !== r[i]) return 'mismatch';
  }
  return visible >= 3 ? 'match' : 'unknown';
}

const PREFIX = /^(นาย|นางสาว|น\.ส\.|นาง|เด็กชาย|เด็กหญิง|ด\.ช\.|ด\.ญ\.|mr\.?|mrs\.?|miss|ms\.?)\s*/i;
const normName = (s) => String(s || '').toLowerCase().replace(PREFIX, '').replace(/[\s.]+/g, ' ').trim();

// ชื่อบนสลิปมักถูกตัดท้าย (เช่น "ธนาทร ร") จึงเทียบเฉพาะคำแรก
function nameMatches(slipName, configName) {
  const cfg = normName(configName).replace(/\s/g, '');
  const first = normName(slipName).split(' ')[0];
  return !!cfg && !!first && first.length >= 2 && cfg.includes(first);
}

function receiverCheck(receiver) {
  const id = String(process.env.PROMPTPAY_ID || '').replace(/\D/g, '');
  const cfgName = process.env.SLIP_RECEIVER_NAME || process.env.PROMPTPAY_NAME || '';
  if (!id && !cfgName) return 'unknown';
  const r = receiver || {};
  const proxy = id ? matchMasked(r.proxy && r.proxy.value, id) : 'unknown';
  if (proxy !== 'unknown') return proxy;
  const names = [r.displayName, r.name].filter(Boolean);
  if (cfgName && names.some((n) => nameMatches(n, cfgName))) return 'match';
  return 'unknown';
}

// ---------------- ตัดสินผล ----------------
// fine: { amount }, ctx: { fineAgeMin, duplicateRef }
// คืน { action: 'approve' | 'reject' | 'review', message, note }
//  approve = ชำระแล้วอัตโนมัติ | reject = ปฏิเสธทันที (พนักงานแนบใหม่) | review = ส่งให้ admin ตรวจเอง
function evaluateSlip(result, fine, ctx = {}) {
  const money = (n) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (!result.ok) {
    switch (result.kind) {
      case 'invalid':
        return { action: 'reject', message: 'ตรวจสลิปไม่ผ่าน: ไม่พบ QR บนสลิป หรือสลิปไม่ถูกต้อง กรุณาแนบรูปสลิปเต็มใบที่เห็น QR มุมขวาล่างชัดเจน' };
      case 'duplicate':
        return { action: 'reject', message: 'สลิปนี้เคยถูกใช้แล้ว' };
      case 'delay':
        return { action: 'reject', message: 'ธนาคารยังไม่พร้อมให้ตรวจสลิปนี้ กรุณารอสักครู่แล้วแนบสลิปอีกครั้ง' };
      default:
        return { action: 'review', verify_result: 'unavailable', note: `ตรวจอัตโนมัติไม่ได้ (${result.message}) กรุณาตรวจสลิปเอง` };
    }
  }

  const d = result.data;
  const amount = Number(d.amount);
  const ref = String(d.transRef || '');
  if (!ref || !Number.isFinite(amount)) {
    return { action: 'review', verify_result: 'unavailable', note: 'ข้อมูลที่ได้จากบริการตรวจสลิปไม่ครบ กรุณาตรวจสลิปเอง' };
  }
  if (ctx.duplicateRef) return { action: 'reject', message: 'สลิปนี้เคยใช้ชำระรายการอื่นแล้ว' };

  const owed = Math.round(Number(fine.amount) * 100);
  const paid = Math.round(amount * 100);
  if (paid < owed) {
    return { action: 'reject', message: `ยอดในสลิป ${money(amount)} บาท น้อยกว่าค่าปรับ ${money(fine.amount)} บาท กรุณาโอนให้ครบตามยอด` };
  }

  const ts = d.transTimestamp ? new Date(d.transTimestamp).getTime() : NaN;
  if (Number.isFinite(ts) && Number.isFinite(ctx.fineAgeMin)) {
    const slipAgeMin = (Date.now() - ts) / 60000;
    if (slipAgeMin > ctx.fineAgeMin + TOLERANCE_MIN) {
      return { action: 'reject', message: 'สลิปนี้โอนก่อนที่จะมีค่าปรับรายการนี้ กรุณาโอนใหม่ตาม QR ในหน้าชำระค่าปรับ' };
    }
  }

  const rc = receiverCheck(d.receiver);
  if (rc === 'mismatch') {
    return { action: 'reject', message: 'บัญชีผู้รับในสลิปไม่ตรงกับบัญชีของบริษัท กรุณาโอนโดยสแกน QR ในหน้าชำระค่าปรับ' };
  }

  const base = { transRef: ref, amount };
  if (paid > owed) {
    return { action: 'review', verify_result: 'needs_review', ...base, note: `สลิปจริง แต่โอนเกิน: ${money(amount)} บาท (ค่าปรับ ${money(fine.amount)} บาท) กรุณาตรวจสอบ` };
  }
  if (rc === 'unknown') {
    return { action: 'review', verify_result: 'needs_review', ...base, note: `สลิปจริง ยอดตรง ${money(amount)} บาท แต่ยืนยันบัญชีผู้รับอัตโนมัติไม่ได้ กรุณาตรวจชื่อ/เลขบัญชีผู้รับ` };
  }
  return { action: 'approve', verify_result: 'verified', ...base, note: `ตรวจอัตโนมัติผ่าน: ยอด ${money(amount)} บาท ตรงกัน อ้างอิง ${ref}` };
}

module.exports = { enabled, provider, verifySlipImage, evaluateSlip, matchMasked, nameMatches, receiverCheck, TOLERANCE_MIN };
