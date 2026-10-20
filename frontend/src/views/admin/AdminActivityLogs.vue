<script setup>
import { computed, onMounted, ref } from 'vue';
import api from '../../services/api';

const rows = ref([]); const page = ref(1); const limit = 25; const total = ref(0);
const search = ref(''); const action = ref(''); const loading = ref(false); const error = ref('');
const pages = computed(() => Math.max(1, Math.ceil(total.value / limit)));
const actionNames = { approve: 'อนุมัติ', reject: 'ปฏิเสธ', create: 'สร้าง', update: 'แก้ไข', delete: 'ลบ', cancel: 'ยกเลิก' };
const entityNames = { borrow_request: 'คำขอยืม', reservation: 'การจอง', asset: 'ทรัพย์สิน', employee: 'พนักงาน', category: 'หมวดหมู่', department: 'แผนก', fine: 'ค่าปรับ' };
async function load() {
  loading.value = true; error.value = '';
  try {
    const { data } = await api.get('/activity-logs', { params: { page: page.value, limit, search: search.value, action: action.value } });
    rows.value = data.rows; total.value = data.total;
  } catch (e) { error.value = e.response?.data?.message || 'โหลดประวัติกิจกรรมไม่สำเร็จ'; }
  finally { loading.value = false; }
}
function decode(value) { if (!value) return null; if (typeof value === 'object') return value; try { return JSON.parse(value); } catch { return value; } }
function fmtDate(value) { const d = new Date(String(value).replace(' ', 'T')); return Number.isNaN(d.getTime()) ? value : d.toLocaleString('th-TH'); }
function applyFilter() { page.value = 1; load(); }
onMounted(load);
</script>

<template>
  <section class="page">
    <div class="page-head"><div><h2>บันทึกกิจกรรม</h2><p class="page-sub">ตรวจสอบผู้ดำเนินการ รายการที่เปลี่ยนแปลง และเวลา</p></div><button class="btn secondary" :disabled="loading" @click="load">รีเฟรช</button></div>
    <div class="card filters">
      <input v-model="search" class="filter-input" placeholder="ค้นหาผู้ใช้ รายการ หรือรหัสข้อมูล" @keyup.enter="applyFilter">
      <select v-model="action" class="filter-input" @change="applyFilter"><option value="">ทุกกิจกรรม</option><option value="approve">อนุมัติ</option><option value="reject">ปฏิเสธ</option><option value="create">สร้าง</option><option value="update">แก้ไข</option><option value="delete">ลบ</option><option value="cancel">ยกเลิก</option></select>
      <button class="btn primary" @click="applyFilter">ค้นหา</button>
    </div>
    <p v-if="error" class="error-text">{{ error }}</p>
    <div v-if="loading" class="card empty-state">กำลังโหลดประวัติกิจกรรม...</div>
    <div v-else-if="!rows.length" class="card empty-state">ยังไม่มีบันทึกกิจกรรม</div>
    <div v-else class="log-list">
      <article v-for="row in rows" :key="row.log_id" class="card log-card">
        <div class="log-top"><div><b>{{ row.actor_name }}</b><span class="muted"> · {{ fmtDate(row.created_at) }}</span></div><span class="log-tag">{{ actionNames[row.action] || row.action }}</span></div>
        <p class="log-summary">{{ row.summary }}</p><small class="muted">{{ entityNames[row.entity_type] || row.entity_type }} #{{ row.entity_id || '-' }} · {{ row.ip_address || 'ไม่พบ IP' }}</small>
        <details v-if="row.before_data || row.after_data" class="log-details"><summary>ดูข้อมูลก่อนและหลัง</summary><div class="json-grid"><div><b>ก่อน</b><pre>{{ JSON.stringify(decode(row.before_data), null, 2) || 'ไม่มีข้อมูล' }}</pre></div><div><b>หลัง</b><pre>{{ JSON.stringify(decode(row.after_data), null, 2) || 'ไม่มีข้อมูล' }}</pre></div></div></details>
      </article>
    </div>
    <div v-if="total > 0" class="pagination"><span>ทั้งหมด {{ total }} รายการ · หน้า {{ page }} / {{ pages }}</span><div><button class="btn secondary" :disabled="page <= 1 || loading" @click="page--; load()">ก่อนหน้า</button><button class="btn secondary" :disabled="page >= pages || loading" @click="page++; load()">ถัดไป</button></div></div>
  </section>
</template>

<style scoped>
.filters { display:flex; gap:10px; align-items:center; margin-bottom:16px; padding:14px; }.filter-input { min-width:180px; padding:10px 12px; border:1px solid #d7deea; border-radius:10px; font:inherit; }.filters input { flex:1; }.log-list { display:grid; gap:12px; }.log-card { padding:18px; }.log-top { display:flex; justify-content:space-between; align-items:center; gap:12px; }.log-tag { background:#e8effb; color:var(--primary-dark); border-radius:999px; padding:4px 10px; font-size:12px; font-weight:700; }.log-summary { margin:10px 0 5px; font-weight:600; }.log-details { margin-top:12px; border-top:1px solid #edf0f5; padding-top:10px; }.log-details summary { cursor:pointer; color:var(--primary-dark); font-weight:600; }.json-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; margin-top:10px; }.json-grid pre { overflow:auto; max-height:280px; padding:12px; background:#f5f7fa; border-radius:8px; font-size:12px; }.pagination { display:flex; justify-content:space-between; align-items:center; margin:16px 0; }.pagination div { display:flex; gap:8px; }
@media (max-width:640px) { .filters,.pagination { align-items:stretch; flex-direction:column; }.json-grid { grid-template-columns:1fr; } }
</style>
