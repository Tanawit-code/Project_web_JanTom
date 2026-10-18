<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../../services/api';

const pending = ref([]);
const loading = ref(true);
const error = ref(''); const success = ref('');
const forms = ref({});
const busyId = ref(null);
const search = ref('');

const money = (n) => Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt = (d) => (d ? new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '-');

async function load() {
  try {
    const { data } = await api.get('/returns/pending');
    pending.value = data;
    // ตั้งค่าเริ่มต้น: ถ้าเกินกำหนด ให้เสนอค่าปรับล่าช้าตามจำนวนวัน (แก้ไขได้)
    data.forEach((it) => {
      if (!forms.value[it.detail_id]) {
        forms.value[it.detail_id] = it.days_late > 0
          ? { condition_in: '', fine_type: 'late', fine_amount: it.suggested_late_fine, fine_reason: `ส่งคืนล่าช้า ${it.days_late} วัน` }
          : { condition_in: '', fine_type: 'none', fine_amount: '', fine_reason: '' };
      }
    });
  } finally { loading.value = false; }
}

const lateCount = computed(() => pending.value.filter((i) => i.days_late > 0).length);
const shown = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return pending.value;
  return pending.value.filter((i) => [i.asset_name, i.asset_code, i.first_name, i.last_name, i.borrow_code, i.emp_code].some((v) => (v || '').toLowerCase().includes(q)));
});

function onTypeChange(it) {
  const f = forms.value[it.detail_id];
  if (f.fine_type === 'none') { f.fine_amount = ''; f.fine_reason = ''; }
  else if (f.fine_type === 'late' && it.days_late > 0) { f.fine_amount = it.suggested_late_fine; f.fine_reason = `ส่งคืนล่าช้า ${it.days_late} วัน`; }
  else if (f.fine_type === 'damaged') {
    f.fine_amount = '';
    if (!f.fine_reason) f.fine_reason = 'ทรัพย์สินชำรุด/เสียหาย';
  }
}

async function submitReturn(item) {
  error.value = ''; success.value = '';
  const f = forms.value[item.detail_id];
  const hasFine = f.fine_type !== 'none';
  if (hasFine && !(Number(f.fine_amount) > 0)) { error.value = 'กรุณาระบุจำนวนค่าปรับ หรือเลือก "ไม่มีค่าปรับ"'; return; }
  busyId.value = item.detail_id;
  try {
    const { data } = await api.post('/returns', {
      detail_id: item.detail_id,
      condition_in: f.condition_in || '',
      fine_type: hasFine ? f.fine_type : undefined,
      fine_amount: hasFine ? Number(f.fine_amount) : 0,
      fine_reason: hasFine ? f.fine_reason : undefined,
    });
    success.value = `"${item.asset_name}": ${data.message}`;
    delete forms.value[item.detail_id];
    await load();
  } catch (e) { error.value = e.response?.data?.message || 'บันทึกไม่สำเร็จ'; }
  finally { busyId.value = null; }
}

onMounted(load);
</script>

<template>
  <section class="page narrow">
    <div class="page-head">
      <div>
        <h2>รับคืนทรัพย์สิน</h2>
        <p class="page-sub">เลือกรายการที่พนักงานนำมาคืน หากล่าช้าหรือชำรุดให้ระบุค่าปรับ ระบบจะแจ้งพนักงานให้ชำระผ่าน QR Code</p>
      </div>
      <div v-if="pending.length" class="sum">
        <span class="chip">ค้างคืน {{ pending.length }} รายการ</span>
        <span v-if="lateCount" class="chip late">เกินกำหนด {{ lateCount }}</span>
      </div>
    </div>

    <p v-if="error" class="error-text">{{ error }}</p>
    <p v-if="success" class="success-text">{{ success }}</p>

    <div v-if="pending.length > 3" class="toolbar">
      <input v-model="search" class="grow" placeholder="ค้นหาชื่อทรัพย์สิน รหัส หรือชื่อผู้ยืม..." autocomplete="off" />
    </div>

    <p v-if="loading" class="empty-state">กำลังโหลด...</p>
    <div v-else-if="pending.length === 0" class="card empty-state">
      <div class="big">✅</div>
      <p>ไม่มีรายการค้างคืน</p>
    </div>
    <p v-else-if="shown.length === 0" class="empty-state">ไม่พบรายการที่ค้นหา</p>

    <article v-for="item in shown" :key="item.detail_id" class="item" :class="{ overdue: item.days_late > 0 }">
      <header>
        <div class="main">
          <b class="name">{{ item.asset_name }}</b>
          <span class="code">{{ item.asset_code }}</span>
        </div>
        <span v-if="item.days_late > 0" class="status late">เกินกำหนด {{ item.days_late }} วัน</span>
        <span v-else class="status ok">อยู่ในกำหนด</span>
      </header>
      <div class="meta">
        <span>👤 {{ item.first_name }} {{ item.last_name }} <small>({{ item.emp_code }})</small></span>
        <span>🧾 {{ item.borrow_code }}</span>
        <span>📅 ครบกำหนด {{ fmt(item.due_date) }}</span>
      </div>

      <div v-if="forms[item.detail_id]" class="form">
        <label class="field full"><span>สภาพตอนคืน</span>
          <input v-model="forms[item.detail_id].condition_in" placeholder="เช่น ปกติ / หน้าจอร้าว" autocomplete="off" />
        </label>
        <label class="field"><span>ค่าปรับ</span>
          <select v-model="forms[item.detail_id].fine_type" @change="onTypeChange(item)">
            <option value="none">ไม่มีค่าปรับ</option>
            <option value="late" :disabled="item.days_late <= 0">ส่งคืนล่าช้า</option>
            <option value="damaged">ชำรุด/เสียหาย</option>
            <option value="other">อื่น ๆ</option>
          </select>
        </label>
        <label v-if="forms[item.detail_id].fine_type !== 'none'" class="field"><span>จำนวนเงิน (บาท)</span>
          <input v-model="forms[item.detail_id].fine_amount" type="number" min="1" step="0.01" placeholder="0.00"
            :readonly="forms[item.detail_id].fine_type === 'late' && item.days_late > 0" />
        </label>
        <label v-if="forms[item.detail_id].fine_type !== 'none'" class="field full"><span>เหตุผล / รายละเอียดค่าปรับ</span>
          <input v-model="forms[item.detail_id].fine_reason" maxlength="255" autocomplete="off" />
          <small v-if="forms[item.detail_id].fine_type === 'late' && item.days_late > 0">
            คำนวณอัตโนมัติ: วันละ ฿{{ money(item.fine_per_day) }} × {{ item.days_late }} วัน = ฿{{ money(item.suggested_late_fine) }}
          </small>
        </label>
        <div class="form-actions full">
          <button class="btn ok" :disabled="busyId === item.detail_id" @click="submitReturn(item)">
            {{ busyId === item.detail_id ? 'กำลังบันทึก...' : '✓ บันทึกรับคืน' }}
          </button>
        </div>
      </div>
    </article>
  </section>
</template>

<style scoped>
.sum { display: flex; gap: 8px; }
.chip.late { background: var(--danger-soft); color: var(--danger-text); }
.item { background: #fff; border-radius: var(--radius); padding: 18px 20px; margin-bottom: 14px; box-shadow: var(--shadow); border-left: 5px solid var(--ok); }
.item.overdue { border-left-color: var(--danger); }
header { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.main { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.name { font-size: 17px; }
.code { color: var(--muted); font-size: 13px; }
.status { font-size: 13px; font-weight: 700; padding: 3px 12px; border-radius: 999px; }
.status.late { background: var(--danger-soft); color: var(--danger-text); }
.status.ok { background: var(--ok-soft); color: var(--ok-text); font-weight: 600; }
.meta { display: flex; flex-wrap: wrap; gap: 6px 20px; margin-top: 8px; font-size: 13.5px; color: var(--muted); }
.meta small { color: var(--muted); }
.form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 14px; margin-top: 16px; padding-top: 16px; border-top: 1px dashed var(--line-strong); }
.form .full { grid-column: 1 / -1; }
.form input, .form select { margin: 0; }
@media (max-width: 640px) { .form { grid-template-columns: 1fr; } }
</style>
