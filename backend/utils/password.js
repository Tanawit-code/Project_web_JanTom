const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function validatePasswordStrength(password) {
  if (typeof password !== 'string' || !STRONG_PASSWORD_REGEX.test(password)) {
    return {
      valid: false,
      message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร ประกอบด้วยตัวพิมพ์เล็ก ตัวพิมพ์ใหญ่ ตัวเลข และอักขระพิเศษอย่างน้อยอย่างละ 1 ตัว',
    };
  }
  return { valid: true };
}

module.exports = { validatePasswordStrength };
