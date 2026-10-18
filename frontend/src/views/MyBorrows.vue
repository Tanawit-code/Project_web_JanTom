<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../services/api';

const requests = ref([]);
const loading = ref(true);
const filter = ref('all');

async function load() {
  try { requests.value = (await api.get('/borrow-requests/mine')).data; }
  finally { loading.value = false; }
}
onMounted(load);

const STATUS_TH = { pending: 'รออนุมัติ', approved: 'อนุมัติแล้ว', rejected: 'ถูกปฏิเสธ', returned: 'คืนแล้ว', cancelled: 'ยกเลิก' };
const FILTERS = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'pending', label: 'รออนุมัติ' },
  { key: 'approved', label: 'กำลังยืม' },
  { key: 'returned', label: 'คืนแล้ว' },
  { key: 'rejected', label: 'ไม่อนุมัติ' },
];
const counts = computed(() => {
  const c = { all: requests.value.length };
  for (const r of requests.value) c[r.status] = (c[r.status] || 0) + 1;
  return c;
});
const shown = computed(() => (filter.value === 'all' ? requests.value : requests.value.filter((r) => r.status === filter.value)));

const fmt = (d) => (d ? new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '-');
const today = () => new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
// เกินกำหนด = กำลังยืมอยู่ และเลยวันครบกำหนดแล้ว
const overdue = (r) => r.status === 'approved' && r.due_date && r.due_date.slice(0, 10) < today() && (r.items || []).some((i) => !i.return_id);
</script>

<template>
  <section class="page narrow">
    <div class="page-head">
      <div>
        <h2>คำขอยืมของฉัน</h2>
        <p class="page-sub">ติดตามสถานะคำขอและกำหนดคืนทรัพย์สิน</p>
      </div>
      <router-link to="/assets" class="btn">+ ส่งคำขอยืมใหม่</router-link>
    </div>

    <div class="seg">
      <button v-for="f in FILTERS" :key="f.key" :class="{ on: filter === f.key }" @click="filter = f.key">
        {{ f.label }}<span class="n">{{ counts[f.key] || 0 }}</span>
      </button>
    </div>

    <p v-if="loading" class="empty-state">กำลังโหลด...</p>
    <div v-else-if="shown.length === 0" class="card empty-state">
      <div class="big">📭</div>
      <p>{{ requests.length === 0 ? 'ยังไม่มีคำขอยืม' : 'ไม่มีคำขอในสถานะนี้' }}</p>
      <router-link v-if="requests.length === 0" to="/assets" class="btn" style="margin-top:14px;">เลือกยืมทรัพย์สิน</router-link>
    </div>

    <article v-for="r in shown" :key="r.borrow_id" class="req" :class="r.status">
      <header>
        <div>
          <b class="code">{{ r.borrow_code }}</b>
          <span v-if="overdue(r)" class="late">เกินกำหนดคืน</span>
        </div>
        <span class="badge" :class="r.status">{{ STATUS_TH[r.status] || r.status }}</span>
      </header>

      <div class="dates">
        <div><span>วันที่ส่งคำขอ</span><b>{{ fmt(r.request_date) }}</b></div>
        <div><span>กำหนดคืน</span><b :class="{ red: overdue(r) }">{{ fmt(r.due_date) }}</b></div>
      </div>

      <p v-if="r.purpose" class="purpose"><span>วัตถุประสงค์:</span> {{ r.purpose }}</p>

      <ul class="items">
        <li v-for="it in r.items" :key="it.detail_id">
          <span class="nm">{{ it.asset_name }} <small>{{ it.asset_code }}</small></span>
          <span v-if="it.return_id" class="ret done">✓ คืนแล้ว {{ fmt(it.return_date) }}</span>
          <span v-else-if="r.status === 'approved'" class="ret wait">ยังไม่คืน</span>
        </li>
      </ul>
    </article>
  </section>
</template>

<style scoped>
.req { background: #fff; border-radius: var(--radius); padding: 18px 20px; margin-bottom: 14px; box-shadow: var(--shadow); border-left: 5px solid #d7dae0; }
.req.pending { border-left-color: var(--warn); }
.req.approved { border-left-color: var(--primary); }
.req.returned { border-left-color: var(--ok); }
.req.rejected { border-left-color: var(--danger); }
header { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.code { font-size: 16px; }
.late { margin-left: 10px; background: var(--danger-soft); color: var(--danger-text); font-size: 12px; font-weight: 700; padding: 2px 10px; border-radius: 999px; }
.dates { display: flex; gap: 32px; flex-wrap: wrap; margin: 12px 0 4px; }
.dates div { display: flex; flex-direction: column; gap: 1px; }
.dates span { font-size: 12px; color: var(--muted); }
.dates b { font-size: 14px; }
.dates b.red { color: var(--danger); }
.purpose { margin: 10px 0 0; font-size: 14px; }
.purpose span { color: var(--muted); }
.items { list-style: none; margin: 12px 0 0; padding: 0; border-top: 1px solid var(--line); }
.items li { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 1px dashed var(--line); font-size: 14px; }
.items li:last-child { border-bottom: none; padding-bottom: 0; }
.nm small { color: var(--muted); margin-left: 6px; }
.ret { font-size: 13px; font-weight: 600; white-space: nowrap; }
.ret.done { color: var(--ok-text); }
.ret.wait { color: var(--warn-text); }
</style>
