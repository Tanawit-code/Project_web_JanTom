<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import api from '../../services/api';
import { authState } from '../../services/auth';

const d = ref(null);
const error = ref('');
const loading = ref(true);
const refreshing = ref(false);
let timer;

async function load(manual = false) {
  if (manual) refreshing.value = true;
  try {
    d.value = (await api.get('/dashboard')).data;
    error.value = '';
  } catch (e) {
    error.value = e.response?.data?.message || 'โหลดข้อมูลแดชบอร์ดไม่สำเร็จ';
  } finally { loading.value = false; refreshing.value = false; }
}
onMounted(() => { load(); timer = setInterval(load, 60000); });
onBeforeUnmount(() => clearInterval(timer));

const money = (n) => Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const todayText = new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const updatedText = computed(() => (d.value ? new Date(d.value.generated_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : ''));

const STATUS = {
  pending: { t: 'รออนุมัติ', c: 'b-pending' }, approved: { t: 'อนุมัติแล้ว', c: 'b-approved' },
  rejected: { t: 'ปฏิเสธ', c: 'b-rejected' }, returned: { t: 'คืนแล้ว', c: 'b-returned' }, cancelled: { t: 'ยกเลิก', c: 'b-cancel' },
};

// ---- การ์ดต้องดำเนินการ ----
const attention = computed(() => !d.value ? [] : [
  { key: 'pending', icon: '📝', label: 'คำขอรออนุมัติ', value: d.value.requests.pending, unit: 'รายการ', to: '/approvals', tone: 'blue' },
  { key: 'overdue', icon: '⏰', label: 'เกินกำหนดคืน', value: d.value.overdue.count, unit: 'รายการ', to: '/admin/returns', tone: 'red' },
  { key: 'review', icon: '🧾', label: 'สลิปรอตรวจสอบ', value: d.value.fines.review_count, unit: 'รายการ', to: '/admin/fines', tone: 'amber' },
  { key: 'unpaid', icon: '💸', label: 'ค่าปรับค้างชำระ', value: `฿${money(d.value.fines.unpaid_total)}`, sub: `${d.value.fines.unpaid_count} รายการ`, raw: d.value.fines.unpaid_count, to: '/admin/fines', tone: 'red' },
]);
const isZero = (a) => (a.raw !== undefined ? a.raw === 0 : a.value === 0);

// ---- Donut สถานะทรัพย์สิน ----
const R = 54; const C = 2 * Math.PI * R;
const ASSET_SEG = [
  { key: 'available', label: 'ว่าง', color: '#2c9a63' },
  { key: 'borrowed', label: 'ถูกยืม', color: '#2b5797' },
  { key: 'repair', label: 'ซ่อมบำรุง', color: '#e08a1e' },
  { key: 'retired', label: 'ปลดระวาง', color: '#9aa3b2' },
];
const donut = computed(() => {
  if (!d.value) return [];
  const total = d.value.assets.total || 1;
  let offset = 0;
  return ASSET_SEG.map((s) => {
    const n = d.value.assets[s.key];
    const len = (n / total) * C;
    const seg = { ...s, n, len, offset };
    offset += len;
    return seg;
  });
});
const usePct = computed(() => (d.value && d.value.assets.total ? Math.round((d.value.assets.borrowed / d.value.assets.total) * 100) : 0));

// ---- กราฟแท่งคำขอยืม 14 วัน ----
const CH = { w: 600, h: 190, l: 30, r: 10, t: 22, b: 28 };
const bars = computed(() => {
  if (!d.value) return { items: [], ticks: [], max: 0 };
  const data = d.value.trend;
  const maxRaw = Math.max(...data.map((x) => x.count), 0);
  const max = Math.max(4, Math.ceil(maxRaw / 2) * 2);
  const innerW = CH.w - CH.l - CH.r;
  const innerH = CH.h - CH.t - CH.b;
  const slot = innerW / data.length;
  const bw = Math.min(26, slot * 0.6);
  const items = data.map((x, i) => {
    const h = (x.count / max) * innerH;
    return {
      x: CH.l + i * slot + (slot - bw) / 2, y: CH.t + innerH - h, w: bw, h,
      count: x.count, label: `${x.date.slice(8)}/${x.date.slice(5, 7)}`, cx: CH.l + i * slot + slot / 2,
      showLabel: i % 2 === (data.length - 1) % 2,
    };
  });
  const ticks = [0, max / 2, max].map((v) => ({ v, y: CH.t + innerH - (v / max) * innerH }));
  return { items, ticks, max };
});
const trendTotal = computed(() => (d.value ? d.value.trend.reduce((s, x) => s + x.count, 0) : 0));

const topMax = computed(() => (d.value && d.value.top_assets.length ? d.value.top_assets[0].times : 1));
</script>

<template>
  <section class="dash">
    <div class="hero">
      <div>
        <h1>แดชบอร์ดผู้ดูแลระบบ</h1>
        <p>สวัสดี {{ authState.user?.first_name }} · {{ todayText }}<template v-if="updatedText"> · อัปเดต {{ updatedText }}</template></p>
      </div>
      <div class="hero-actions">
        <router-link to="/admin/returns" class="hbtn">รับคืนทรัพย์สิน</router-link>
        <router-link to="/approvals" class="hbtn">อนุมัติคำขอ</router-link>
        <router-link to="/admin/fines" class="hbtn">ตรวจสลิปค่าปรับ</router-link>
        <button class="hbtn ghost" :disabled="refreshing" @click="load(true)">{{ refreshing ? 'กำลังรีเฟรช...' : '↻ รีเฟรช' }}</button>
      </div>
    </div>

    <p v-if="loading" class="state">กำลังโหลดข้อมูล...</p>
    <p v-else-if="error && !d" class="state err">{{ error }}</p>

    <template v-if="d">
      <!-- ต้องดำเนินการ -->
      <div class="attn-grid">
        <router-link v-for="a in attention" :key="a.key" :to="a.to" class="attn" :class="isZero(a) ? 'calm' : a.tone">
          <span class="a-ico">{{ a.icon }}</span>
          <span class="a-body">
            <span class="a-label">{{ a.label }}</span>
            <span class="a-value">{{ a.value }}<small v-if="a.unit"> {{ a.unit }}</small></span>
            <span v-if="a.sub" class="a-sub">{{ a.sub }}</span>
          </span>
          <span class="a-go">{{ isZero(a) ? '✓' : '→' }}</span>
        </router-link>
      </div>

      <!-- KPI -->
      <div class="kpi-grid">
        <div class="kpi"><span class="k-label">ทรัพย์สินทั้งหมด</span><span class="k-value">{{ d.assets.total }}</span><span class="k-sub">ว่าง {{ d.assets.available }} · ถูกยืม {{ d.assets.borrowed }}</span></div>
        <div class="kpi"><span class="k-label">อัตราการใช้งาน</span><span class="k-value">{{ usePct }}%</span><div class="bar"><i :style="{ width: usePct + '%' }"></i></div></div>
        <div class="kpi"><span class="k-label">คำขอยืมทั้งหมด</span><span class="k-value">{{ d.requests.total }}</span><span class="k-sub">คืนแล้ว {{ d.requests.returned_total }} · ยังไม่คืน {{ d.requests.approved_open }}</span></div>
        <div class="kpi"><span class="k-label">พนักงานที่ใช้งาน</span><span class="k-value">{{ d.employees.active }}</span><span class="k-sub">รอ admin อนุมัติ {{ d.employees.pending }} คน</span></div>
        <div class="kpi"><span class="k-label">รับค่าปรับเดือนนี้</span><span class="k-value">฿{{ money(d.fines.paid_month_total) }}</span><span class="k-sub">{{ d.fines.paid_month_count }} รายการ · สะสม ฿{{ money(d.fines.paid_total) }}</span></div>
      </div>

      <div class="cols">
        <div class="col">
          <!-- กราฟคำขอ -->
          <div class="panel">
            <div class="p-head"><h3>คำขอยืม 14 วันล่าสุด</h3><span class="chip">รวม {{ trendTotal }} คำขอ</span></div>
            <svg :viewBox="`0 0 ${CH.w} ${CH.h}`" class="chart" role="img" aria-label="กราฟแท่งจำนวนคำขอยืมรายวัน">
              <g v-for="t in bars.ticks" :key="t.v">
                <line :x1="CH.l" :x2="CH.w - CH.r" :y1="t.y" :y2="t.y" stroke="#e5e9f0" stroke-dasharray="3 3" />
                <text :x="CH.l - 6" :y="t.y + 4" text-anchor="end" font-size="11" fill="#8b93a1">{{ t.v }}</text>
              </g>
              <g v-for="b in bars.items" :key="b.label">
                <rect :x="b.x" :y="b.count ? b.y : CH.h - CH.b - 2" :width="b.w" :height="b.count ? b.h : 2" rx="4" :fill="b.count ? '#2b5797' : '#d7dae0'" />
                <text v-if="b.count" :x="b.cx" :y="b.y - 5" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3d6b">{{ b.count }}</text>
                <text v-if="b.showLabel" :x="b.cx" :y="CH.h - 8" text-anchor="middle" font-size="11" fill="#8b93a1">{{ b.label }}</text>
              </g>
            </svg>
          </div>

          <!-- เกินกำหนด -->
          <div class="panel">
            <div class="p-head"><h3>ทรัพย์สินที่เกินกำหนดคืน</h3><router-link to="/admin/returns" class="more">ไปหน้ารับคืน →</router-link></div>
            <p v-if="d.overdue.items.length === 0" class="empty ok">🎉 ไม่มีรายการเกินกำหนด</p>
            <div v-for="o in d.overdue.items" :key="o.detail_id" class="li">
              <div class="li-main"><b>{{ o.asset_name }}</b><span class="muted">{{ o.first_name }} {{ o.last_name }} · {{ o.borrow_code }} · ครบกำหนด {{ o.due_date }}</span></div>
              <span class="late">เกิน {{ o.days_late }} วัน</span>
            </div>
            <p v-if="d.overdue.count > d.overdue.items.length" class="muted more-note">และอีก {{ d.overdue.count - d.overdue.items.length }} รายการ</p>
          </div>

          <!-- คำขอล่าสุด -->
          <div class="panel">
            <div class="p-head"><h3>คำขอยืมล่าสุด</h3></div>
            <p v-if="d.recent_requests.length === 0" class="empty">ยังไม่มีคำขอ</p>
            <div v-for="r in d.recent_requests" :key="r.borrow_code" class="li">
              <div class="li-main"><b>{{ r.first_name }} {{ r.last_name }}</b><span class="muted">{{ r.borrow_code }} · {{ r.items }} รายการ · {{ r.request_date }}</span></div>
              <span class="badge" :class="STATUS[r.status]?.c">{{ STATUS[r.status]?.t || r.status }}</span>
            </div>
          </div>
        </div>

        <div class="col">
          <!-- สถานะทรัพย์สิน -->
          <div class="panel">
            <div class="p-head"><h3>สถานะทรัพย์สิน</h3></div>
            <div class="donut-wrap">
              <svg viewBox="0 0 140 140" class="donut" role="img" aria-label="สัดส่วนสถานะทรัพย์สิน">
                <circle cx="70" cy="70" :r="R" fill="none" stroke="#eef0f4" stroke-width="18" />
                <circle v-for="s in donut" v-show="s.n > 0" :key="s.key" cx="70" cy="70" :r="R" fill="none" :stroke="s.color" stroke-width="18"
                        :stroke-dasharray="`${s.len} ${C - s.len}`" :stroke-dashoffset="-s.offset" transform="rotate(-90 70 70)" />
                <text x="70" y="68" text-anchor="middle" font-size="24" font-weight="800" fill="#1f2937">{{ d.assets.total }}</text>
                <text x="70" y="86" text-anchor="middle" font-size="11" fill="#8b93a1">ชิ้นทั้งหมด</text>
              </svg>
              <ul class="legend">
                <li v-for="s in donut" :key="s.key"><i :style="{ background: s.color }"></i>{{ s.label }}<b>{{ s.n }}</b></li>
              </ul>
            </div>
          </div>

          <!-- ค่าปรับ -->
          <div class="panel">
            <div class="p-head"><h3>ค่าปรับ</h3><router-link to="/admin/fines" class="more">จัดการ →</router-link></div>
            <div class="fine-row"><span>ค้างชำระ</span><b class="red">฿{{ money(d.fines.unpaid_total) }}</b><small>{{ d.fines.unpaid_count }} รายการ</small></div>
            <div class="fine-row"><span>รอตรวจสลิป</span><b class="amber">฿{{ money(d.fines.review_total) }}</b><small>{{ d.fines.review_count }} รายการ</small></div>
            <div class="fine-row"><span>รับแล้วเดือนนี้</span><b class="green">฿{{ money(d.fines.paid_month_total) }}</b><small>{{ d.fines.paid_month_count }} รายการ</small></div>
          </div>

          <!-- รออนุมัติ -->
          <div class="panel">
            <div class="p-head"><h3>รออนุมัติ</h3><router-link to="/approvals" class="more">ดูทั้งหมด →</router-link></div>
            <p v-if="d.pending_requests.length === 0" class="empty ok">ไม่มีคำขอค้างอนุมัติ</p>
            <div v-for="r in d.pending_requests" :key="r.borrow_id" class="li">
              <div class="li-main"><b>{{ r.first_name }} {{ r.last_name }}</b><span class="muted">{{ r.borrow_code }} · {{ r.request_date }}</span></div>
            </div>
          </div>

          <!-- ยอดนิยม -->
          <div class="panel">
            <div class="p-head"><h3>ทรัพย์สินที่ถูกยืมบ่อย</h3></div>
            <p v-if="d.top_assets.length === 0" class="empty">ยังไม่มีประวัติการยืม</p>
            <div v-for="(t, i) in d.top_assets" :key="t.asset_code" class="top-row">
              <span class="rank">{{ i + 1 }}</span>
              <div class="top-main">
                <div class="top-name"><span>{{ t.asset_name }}</span><b>{{ t.times }} ครั้ง</b></div>
                <div class="bar"><i :style="{ width: (t.times / topMax) * 100 + '%' }"></i></div>
              </div>
            </div>
          </div>

          <!-- หมวดหมู่ -->
          <div class="panel">
            <div class="p-head"><h3>ตามหมวดหมู่</h3></div>
            <div v-for="c in d.categories" :key="c.cat_name" class="cat-row">
              <div class="top-name"><span>{{ c.cat_name }}</span><b>{{ c.borrowed }}/{{ c.total }} ถูกยืม</b></div>
              <div class="bar"><i :style="{ width: c.total ? (c.borrowed / c.total) * 100 + '%' : '0%' }"></i></div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.dash { max-width: 1180px; margin: 0 auto; }
.hero { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%); color: #fff; border-radius: 18px; padding: 24px 28px; margin-bottom: 18px; box-shadow: 0 8px 28px rgba(30, 61, 107, .25); }
.hero h1 { margin: 0 0 4px; font-size: 24px; }
.hero p { margin: 0; opacity: .85; font-size: 14px; }
.hero-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.hbtn { background: rgba(255, 255, 255, .18); color: #fff; border: 1px solid rgba(255, 255, 255, .3); padding: 8px 16px; border-radius: 999px; font-size: 14px; cursor: pointer; transition: background .15s; }
.hbtn:hover { background: rgba(255, 255, 255, .3); }
.hbtn.ghost { background: transparent; }
.state { text-align: center; color: var(--muted); padding: 40px 0; }
.state.err { color: var(--danger); }

.attn-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 14px; margin-bottom: 14px; }
.attn { display: flex; align-items: center; gap: 14px; padding: 16px 18px; border-radius: 16px; background: #fff; border: 2px solid transparent; box-shadow: 0 2px 10px rgba(0, 0, 0, .06); transition: transform .15s, box-shadow .15s; text-decoration: none; color: var(--text); }
.attn:hover { transform: translateY(-3px); box-shadow: 0 8px 22px rgba(30, 61, 107, .15); }
.attn.blue { border-color: #bcd0f0; background: #f2f7ff; }
.attn.red { border-color: #f1b8b2; background: #fff4f2; }
.attn.amber { border-color: #f1d9a3; background: #fffaf0; }
.attn.calm { background: #f4faf6; border-color: #cfe9d9; }
.a-ico { font-size: 28px; }
.a-body { flex: 1; display: flex; flex-direction: column; gap: 1px; }
.a-label { font-size: 13px; color: var(--muted); }
.a-value { font-size: 24px; font-weight: 800; line-height: 1.2; }
.a-value small { font-size: 13px; font-weight: 500; color: var(--muted); }
.a-sub { font-size: 12px; color: var(--muted); }
.a-go { font-size: 18px; color: var(--muted); }
.attn.calm .a-go { color: #2c9a63; font-weight: 700; }

.kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 14px; margin-bottom: 18px; }
.kpi { background: #fff; border-radius: 16px; padding: 16px 18px; box-shadow: 0 2px 10px rgba(0, 0, 0, .06); display: flex; flex-direction: column; gap: 4px; }
.k-label { font-size: 13px; color: var(--muted); }
.k-value { font-size: 26px; font-weight: 800; color: var(--primary-dark); }
.k-sub { font-size: 12px; color: var(--muted); }

.cols { display: grid; grid-template-columns: minmax(0, 1.7fr) minmax(0, 1fr); gap: 18px; align-items: start; }
.col { display: flex; flex-direction: column; gap: 18px; min-width: 0; }
@media (max-width: 900px) { .cols { grid-template-columns: 1fr; } }

.panel { background: #fff; border-radius: 16px; padding: 18px 20px; box-shadow: 0 2px 10px rgba(0, 0, 0, .06); }
.p-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 12px; }
.p-head h3 { margin: 0; font-size: 16px; }
.more { font-size: 13px; color: var(--primary); }
.more:hover { text-decoration: underline; }
.chip { background: #e6eefb; color: var(--primary-dark); font-size: 12px; padding: 3px 12px; border-radius: 999px; font-weight: 600; }
.chart { width: 100%; height: auto; display: block; }

.li { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 10px 0; border-top: 1px solid #f0f2f6; }
.li:first-of-type { border-top: none; }
.li-main { display: flex; flex-direction: column; gap: 2px; min-width: 0; font-size: 14px; }
.muted { color: var(--muted); font-size: 12px; }
.more-note { margin: 8px 0 0; text-align: center; }
.empty { text-align: center; color: var(--muted); padding: 16px 0; margin: 0; font-size: 14px; }
.empty.ok { color: #1f6b3d; }
.late { background: #fdecea; color: #8a1c14; font-size: 12px; font-weight: 700; padding: 3px 12px; border-radius: 999px; white-space: nowrap; }
.badge { font-size: 12px; font-weight: 600; padding: 3px 12px; border-radius: 999px; white-space: nowrap; }
.b-pending { background: #fdf3dc; color: #8a5a00; } .b-approved { background: #e3ecfb; color: #1e3d6b; }
.b-rejected { background: #fdecea; color: #8a1c14; } .b-returned { background: #e3f4ea; color: #1f6b3d; } .b-cancel { background: #eef0f4; color: #6b7280; }

.donut-wrap { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; justify-content: center; }
.donut { width: 150px; height: 150px; flex-shrink: 0; }
.legend { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; flex: 1; min-width: 140px; }
.legend li { display: flex; align-items: center; gap: 8px; font-size: 14px; }
.legend i { width: 12px; height: 12px; border-radius: 4px; flex-shrink: 0; }
.legend b { margin-left: auto; }

.fine-row { display: grid; grid-template-columns: 1fr auto; gap: 0 12px; align-items: baseline; padding: 10px 0; border-top: 1px solid #f0f2f6; font-size: 14px; }
.fine-row:first-of-type { border-top: none; }
.fine-row b { font-size: 18px; text-align: right; }
.fine-row small { grid-column: 2; text-align: right; color: var(--muted); font-size: 12px; }
.red { color: #c0392b; } .amber { color: #b7791f; } .green { color: #2c6e49; }

.top-row { display: flex; gap: 12px; align-items: center; padding: 8px 0; }
.rank { width: 26px; height: 26px; border-radius: 50%; background: #e6eefb; color: var(--primary-dark); font-weight: 700; font-size: 13px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.top-main { flex: 1; min-width: 0; }
.top-name { display: flex; justify-content: space-between; gap: 10px; font-size: 14px; margin-bottom: 5px; }
.top-name span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.top-name b { white-space: nowrap; font-size: 13px; color: var(--primary-dark); }
.cat-row { padding: 8px 0; }
.bar { height: 8px; background: #eef0f4; border-radius: 999px; overflow: hidden; }
.bar i { display: block; height: 100%; background: linear-gradient(90deg, var(--primary), #4b7bc7); border-radius: 999px; transition: width .4s ease; }
</style>
