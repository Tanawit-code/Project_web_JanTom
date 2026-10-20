<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../services/api';
import { authState, hasRole } from '../services/auth';

const requests = ref([]);
const fine = ref({ unpaid_count: 0, unpaid_total: 0 });
const loaded = ref(false);

const ROLE_TH = { admin: 'ผู้ดูแลระบบ', approver: 'ผู้อนุมัติ', employee: 'พนักงาน' };
const money = (n) => Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// รายการที่ยืมอยู่ = คำขอที่อนุมัติแล้ว และยังคืนไม่ครบ
const borrowing = computed(() => requests.value
  .filter((r) => r.status === 'approved')
  .reduce((s, r) => s + (r.items || []).filter((i) => !i.return_id).length, 0));
const pending = computed(() => requests.value.filter((r) => r.status === 'pending').length);

const actions = computed(() => {
  const list = [
    { to: '/assets', icon: '🔎', title: 'เลือกยืมทรัพย์สิน', desc: 'ดูรายการที่ว่างและส่งคำขอยืม' },
    { to: '/my-borrows', icon: '📝', title: 'คำขอของฉัน', desc: 'ติดตามสถานะและกำหนดคืน' },
    { to: '/my-fines', icon: '💸', title: 'ค่าปรับของฉัน', desc: 'ดูและชำระค่าปรับค้างชำระ' },
  ];
  if (hasRole('approver', 'admin')) {
    list.push(
      { to: '/approvals', icon: '✅', title: 'อนุมัติคำขอ', desc: 'พิจารณาคำขอยืมที่รออนุมัติ', staff: true },
      { to: '/admin/returns', icon: '📦', title: 'รับคืนทรัพย์สิน', desc: 'บันทึกการคืนและค่าปรับ', staff: true },
    );
  }
  if (hasRole('admin')) {
    list.push(
      { to: '/admin/assets', icon: '🗂️', title: 'จัดการทรัพย์สิน', desc: 'เพิ่ม แก้ไข ลบ ข้อมูลทรัพย์สิน', staff: true },
      { to: '/admin/employees', icon: '👥', title: 'จัดการพนักงาน', desc: 'บัญชีผู้ใช้และสิทธิ์การใช้งาน', staff: true },
    );
  }
  return list;
});

onMounted(async () => {
  try {
    const [r, f] = await Promise.all([api.get('/borrow-requests/mine'), api.get('/fines/mine/summary')]);
    requests.value = r.data; fine.value = f.data;
  } catch { /* แสดงหน้าได้แม้โหลดสถิติไม่สำเร็จ */ }
  loaded.value = true;
});
</script>

<template>
  <section class="page">
    <div class="hero">
      <div class="hero-copy">
        <p class="role">{{ ROLE_TH[authState.user?.role] || '' }}</p>
        <h1>สวัสดี {{ authState.user?.first_name }} 👋</h1>
        <p class="lead">ระบบยืมคืนทรัพย์สินบริษัท เลือกรายการด้านล่างเพื่อเริ่มใช้งาน</p>
              <router-link to="/assets" class="btn go">+ ยืมทรัพย์สิน</router-link>
      </div>
      <div class="hero-visual"><img src="/asset-management-illustration.svg" alt="ภาพประกอบระบบจัดการและยืมคืนทรัพย์สิน" /></div>
    </div>

    <div class="stats">
      <router-link to="/my-borrows" class="stat">
        <span class="s-label">กำลังยืมอยู่</span>
        <span class="s-value">{{ loaded ? borrowing : '–' }}<small> รายการ</small></span>
      </router-link>
      <router-link to="/my-borrows" class="stat">
        <span class="s-label">คำขอรออนุมัติ</span>
        <span class="s-value">{{ loaded ? pending : '–' }}<small> คำขอ</small></span>
      </router-link>
      <router-link to="/my-fines" class="stat" :class="{ alert: fine.unpaid_count > 0 }">
        <span class="s-label">ค่าปรับค้างชำระ</span>
        <span class="s-value">{{ loaded ? '฿' + money(fine.unpaid_total) : '–' }}</span>
      </router-link>
    </div>

    <h3 class="sec">เมนูลัด</h3>
    <div class="grid">
      <router-link v-for="a in actions" :key="a.to" :to="a.to" class="act" :class="{ staff: a.staff }">
        <span class="ico">{{ a.icon }}</span>
        <span class="txt"><b>{{ a.title }}</b><small>{{ a.desc }}</small></span>
        <span class="go-arrow">→</span>
      </router-link>
    </div>
  </section>
</template>

<style scoped>
.hero { position:relative; display:grid; grid-template-columns:minmax(0,1.05fr) minmax(280px,.95fr); align-items:center; gap:18px; overflow:hidden; background:linear-gradient(125deg,#1e477d 0%,#2e5f9f 54%,#4b7bc7 100%); color:#fff; border-radius:24px; padding:26px 36px 24px 40px; margin-bottom:20px; min-height:250px; box-shadow:0 14px 34px rgba(37,79,133,.18); }
.hero::before { content:""; position:absolute; width:360px; height:360px; right:20%; top:-280px; border:1px solid rgba(255,255,255,.1); border-radius:50%; box-shadow:0 0 0 38px rgba(255,255,255,.025),0 0 0 76px rgba(255,255,255,.02); pointer-events:none; }
.hero-copy { position:relative; z-index:1; }
.hero h1 { margin:10px 0 8px; font-size:clamp(26px,3vw,34px); line-height:1.2; letter-spacing:-.5px; }
.role { display:inline-flex; margin:0; padding:5px 11px; font-size:12px; font-weight:700; color:#e5f0ff; background:rgba(255,255,255,.13); border:1px solid rgba(255,255,255,.16); border-radius:999px; letter-spacing:.3px; }
.lead { max-width:490px; margin:0; color:#e2edfc; font-size:14px; line-height:1.75; }
.hero-visual { display:flex; justify-content:flex-end; align-items:center; min-width:0; }
.hero-visual img { display:block; width:min(100%,390px); height:auto; filter:drop-shadow(0 14px 18px rgba(8,30,59,.16)); }
.go { display:inline-flex; align-items:center; gap:12px; margin-top:22px; background:#fff; color:var(--primary-dark); padding:11px 19px; border:1px solid rgba(255,255,255,.8); border-radius:11px; font-size:14px; font-weight:700; box-shadow:0 5px 14px rgba(10,33,65,.12); }
.go:hover { background:#eef5ff; transform:translateY(-1px); }

.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-bottom: 26px; }
.stat { background:#fff; border-radius:16px; padding:17px 20px; box-shadow:var(--shadow); display:flex; flex-direction:column; gap:3px; border:1px solid #edf0f5; transition:transform .15s,box-shadow .15s; }
.stat:hover { transform: translateY(-2px); box-shadow: var(--shadow-hover); }
.stat.alert { background:linear-gradient(135deg,#fff7f5,#fdecea); border-color:#f1b8b2; }
.s-label { font-size: 13px; color: var(--muted); }
.s-value { font-size: 28px; font-weight: 800; color: var(--primary-dark); }
.stat.alert .s-value { color: var(--danger-text); }
.s-value small { font-size: 13px; font-weight: 500; color: var(--muted); }

.sec { margin: 0 0 12px; font-size: 16px; color: var(--muted); font-weight: 600; }
.grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:14px; }
.act { display:flex; align-items:center; gap:14px; background:#fff; border-radius:16px; padding:16px 18px; box-shadow:var(--shadow); border:1px solid #edf0f5; transition:transform .15s,box-shadow .15s,border-color .15s; }
.act:hover { transform: translateY(-3px); box-shadow: var(--shadow-hover); border-color: #bcd0f0; }
.ico { width: 46px; height: 46px; flex: 0 0 46px; border-radius: 12px; background: var(--primary-soft); display: flex; align-items: center; justify-content: center; font-size: 22px; }
.act.staff .ico { background: #efeafb; }
.txt { flex: 1; display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.txt b { font-size: 15px; }
.txt small { color: var(--muted); font-size: 13px; }
.go-arrow { color: #9aa3b2; font-size: 18px; transition: transform .15s, color .15s; }
.act:hover .go-arrow { transform: translateX(3px); color: var(--primary); }
@media(max-width:700px) { .hero { grid-template-columns:1fr; padding:25px 24px 18px; gap:4px; min-height:0; }.hero-visual { justify-content:center; max-height:210px; overflow:hidden; }.hero-visual img { width:min(100%,330px); }.hero h1 { font-size:27px; }.go { margin-top:17px; } }
</style>
