<template>
  <section class="guest-page">
    <div class="welcome-card">
      <div class="eyebrow"><span class="status-dot"></span> ระบบภายในสำหรับบุคลากร</div>
      <div class="welcome-grid">
        <div class="intro">
          <div class="brand-mark" aria-hidden="true">TA</div>
          <h1>จัดการการยืมทรัพย์สิน<br><span>ได้ง่ายในที่เดียว</span></h1>
          <p class="lead">ระบบยืมคืนทรัพย์สินสำหรับบุคลากร ช่วยส่งคำขอ ติดตามการอนุมัติ และตรวจสอบกำหนดคืนได้สะดวก</p>
          <div class="actions">
            <router-link to="/login" class="btn primary">เข้าสู่ระบบ <span aria-hidden="true">→</span></router-link>
            <router-link to="/register" class="btn secondary">สมัครสมาชิก</router-link>
          </div>
          <p class="note">การสมัครใช้งานสำหรับบุคลากร และต้องรอผู้ดูแลระบบตรวจสอบบัญชี</p>
        </div>
        <div class="features" aria-label="ความสามารถของระบบ">
          <article class="feature"><span class="feature-icon">01</span><div><b>ส่งคำขอยืม</b><p>เลือกทรัพย์สินและระบุวันที่ต้องการใช้งาน</p></div></article>
          <article class="feature"><span class="feature-icon">02</span><div><b>ติดตามสถานะ</b><p>ดูผลพิจารณาและกำหนดคืนได้จากบัญชีของคุณ</p></div></article>
          <article class="feature"><span class="feature-icon">03</span><div><b>จัดการเป็นระบบ</b><p>ดูประวัติการยืมและการแจ้งเตือนในที่เดียว</p></div></article>
          <div class="privacy"><span aria-hidden="true">🔒</span> รายการทรัพย์สินและข้อมูลภายในจะแสดงหลังเข้าสู่ระบบ</div>
        </div>
      </div>
    </div>
    <footer>THAIASSET <span>·</span> Asset Management System</footer>
  </section>
</template>

<style scoped>
.guest-page { max-width:1080px; margin:22px auto 0; }
.welcome-card { position:relative; overflow:hidden; background:linear-gradient(135deg,#173b6d 0%,#285b9b 58%,#3976b8 100%); color:#fff; border-radius:24px; padding:clamp(26px,5vw,58px); box-shadow:0 20px 55px rgba(24,59,105,.2); }
.welcome-card::after { content:""; position:absolute; width:420px; height:420px; border:1px solid rgba(255,255,255,.12); border-radius:50%; right:-130px; top:-190px; box-shadow:0 0 0 45px rgba(255,255,255,.035),0 0 0 90px rgba(255,255,255,.025); pointer-events:none; }
.eyebrow { display:flex; align-items:center; gap:9px; width:fit-content; padding:7px 12px; border:1px solid rgba(255,255,255,.22); border-radius:999px; background:rgba(255,255,255,.09); color:#e2edff; font-size:13px; }
.status-dot { width:8px; height:8px; border-radius:50%; background:#65d6a3; box-shadow:0 0 0 4px rgba(101,214,163,.16); }
.welcome-grid { display:grid; grid-template-columns:1.2fr .8fr; gap:clamp(28px,6vw,76px); align-items:center; margin-top:38px; }
.brand-mark { display:grid; place-items:center; width:48px; height:48px; border-radius:15px; background:#fff; color:#24558e; font-weight:900; letter-spacing:-1px; box-shadow:0 8px 18px rgba(9,29,58,.2); }
h1 { margin:22px 0 14px; font-size:clamp(32px,5vw,52px); line-height:1.16; letter-spacing:-1.2px; }
h1 span { color:#b8d9ff; }
.lead { max-width:540px; color:#d9e8fb; font-size:16px; line-height:1.8; margin:0; }
.actions { display:flex; flex-wrap:wrap; gap:11px; margin-top:26px; }
.actions .btn { display:inline-flex; align-items:center; gap:14px; padding:12px 20px; border-radius:11px; font-size:15px; font-weight:700; text-decoration:none; }
.actions .primary { color:#204c83; background:#fff; border:1px solid #fff; }
.actions .primary:hover { background:#edf5ff; }
.actions .secondary { color:#fff; background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.38); }
.actions .secondary:hover { background:rgba(255,255,255,.18); }
.note { color:#bed3ed; font-size:12px; line-height:1.6; margin:16px 0 0; }
.features { display:grid; gap:12px; padding:18px; border:1px solid rgba(255,255,255,.2); border-radius:19px; background:rgba(11,36,70,.25); backdrop-filter:blur(8px); }
.feature { display:flex; align-items:flex-start; gap:13px; padding:13px; border-radius:13px; background:rgba(255,255,255,.075); }
.feature-icon { display:grid; place-items:center; flex:0 0 34px; height:34px; border-radius:10px; background:rgba(182,216,255,.17); color:#c9e1ff; font-size:12px; font-weight:800; }
.feature b { display:block; font-size:14px; }.feature p { margin:4px 0 0; color:#d4e3f5; font-size:12px; line-height:1.55; }
.privacy { display:flex; gap:8px; align-items:flex-start; color:#c8d9ed; font-size:11px; line-height:1.5; padding:8px 4px 0; }
footer { text-align:center; padding:22px 10px; color:var(--muted); font-size:12px; letter-spacing:.3px; }
footer span { margin:0 5px; color:#aab7ca; }
@media(max-width:760px) { .guest-page { margin-top:10px; }.welcome-card { border-radius:18px; }.welcome-grid { grid-template-columns:1fr; margin-top:28px; }.features { max-width:none; }.lead { font-size:15px; } }
</style>
