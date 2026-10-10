// สร้างข้อความ PromptPay QR (EMV QRCPS) แบบระบุจำนวนเงิน — สแกนด้วยแอปธนาคารได้
function tlv(tag, value) {
  return tag + String(value.length).padStart(2, '0') + value;
}

// CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF)
function crc16(str) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// id = เบอร์โทร 10 หลัก (0812345678) หรือเลขบัตรประชาชน/เลขผู้เสียภาษี 13 หลัก
function buildPromptPayPayload(id, amount) {
  const digits = String(id || '').replace(/\D/g, '');
  let target;
  if (digits.length === 10 && digits.startsWith('0')) target = tlv('01', '0066' + digits.slice(1));
  else if (digits.length === 13) target = tlv('02', digits);
  else throw new Error('PROMPTPAY_ID ต้องเป็นเบอร์โทร 10 หลัก หรือเลข 13 หลัก');

  const merchant = tlv('00', 'A000000677010111') + target;
  let payload = tlv('00', '01') + tlv('01', amount ? '12' : '11') + tlv('29', merchant) + tlv('53', '764');
  if (amount) payload += tlv('54', Number(amount).toFixed(2));
  payload += tlv('58', 'TH') + '6304';
  return payload + crc16(payload);
}

module.exports = { buildPromptPayPayload, crc16 };
