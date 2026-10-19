<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../../services/api';

const rows = ref([]);
const assets = ref([]);
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const success = ref('');
const query = ref('');
const filter = ref('');
const showForm = ref(false);
const form = ref({ asset_id: '', problem_detail: '' });
const edit = ref(null);
const statuses = [
  { value: 'pending', label: 'รอซ่อม' },
  { value: 'in_progress', label: 'กำลังซ่อม' },
  { value: 'done', label: 'ซ่อมเสร็จ' },
  { value: 'cannot_repair', label: 'ไม่สามารถซ่อมได้' },
];
const statusLabel = (s) => statuses.find(x => x.value === s)?.label || s;
const money = (n) => Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const availableAssets = computed(() => assets.value.filter(a => a.status === 'available'));

async function load() {
  loading.value = true; error.value = '';
  try {
    const [r, a] = await Promise.all([
      api.get('/repairs', { params: { status: filter.value || undefined, q: query.value || undefined } }),
      api.get('/assets')
    ]);
    rows.value = r.data;
    assets.value = a.data;
  } catch (e) { error.value = e.response?.data?.message || 'โหลดข้อมูลงานซ่อมไม่สำเร็จ'; }
  finally { loading.value = false; }
}
async function report() {
  error.value = ''; success.value = '';
  if (!form.value.asset_id || !form.value.problem_detail.trim()) { error.value = 'กรุณาเลือกทรัพย์สินและระบุอาการเสีย'; return; }
  saving.value = true;
  try {
    const { data } = await api.post('/repairs', form.value);
    success.value = data.message;
    form.value = { asset_id: '', problem_detail: '' }; showForm.value = false;
    await load();
  } catch (e) { error.value = e.response?.data?.message || 'แจ้งซ่อมไม่สำเร็จ'; }
  finally { saving.value = false; }
}
function openEdit(row) {
  edit.value = { repair_id: row.repair_id, repair_status: row.repair_status, cost: row.cost ?? '', problem_detail: row.problem_detail, repair_date: row.repair_date || new Date().toISOString().slice(0, 10) };
}
async function saveEdit() {
  error.value = ''; success.value = '';
  if (edit.value.cost !== '' && (Number(edit.value.cost) < 0 || !Number.isFinite(Number(edit.value.cost)))) { error.value = 'กรุณาระบุค่าซ่อมเป็นตัวเลขตั้งแต่ 0 บาทขึ้นไป'; return; }
  saving.value = true;
  try {
    const { data } = await api.patch(`/repairs/${edit.value.repair_id}`, edit.value);
    success.value = data.message; edit.value = null; await load();
  } catch (e) { error.value = e.response?.data?.message || 'บันทึกงานซ่อมไม่สำเร็จ'; }
  finally { saving.value = false; }
}
onMounted(load);
</script>

<template>
  <section class="repairs">
    <div class="heading">
      <div><p class="eyebrow">ASSET MANAGEMENT</p><h1>จัดการงานซ่อมบำรุง</h1><p class="sub">แจ้งซ่อม ติดตามความคืบหน้า และบันทึกค่าใช้จ่ายในการซ่อม</p></div>
      <button class="primary" @click="showForm = !showForm">{{ showForm ? 'ปิดแบบฟอร์ม' : '+ แจ้งซ่อม' }}</button>
    </div>
    <div class="stats">
      <div class="stat"><span>งานทั้งหมด</span><strong>{{ rows.length }}</strong></div>
      <div class="stat"><span>รอซ่อม</span><strong>{{ rows.filter(r => r.repair_status === 'pending').length }}</strong></div>
      <div class="stat"><span>กำลังซ่อม</span><strong>{{ rows.filter(r => r.repair_status === 'in_progress').length }}</strong></div>
      <div class="stat"><span>ซ่อมเสร็จ</span><strong>{{ rows.filter(r => r.repair_status === 'done').length }}</strong></div>
    </div>
    <p v-if="success" class="notice success">{{ success }}</p>
    <p v-if="error" class="notice error">{{ error }}</p>

    <form v-if="showForm" class="panel" @submit.prevent="report">
      <h2>แจ้งซ่อมทรัพย์สิน</h2>
      <div class="formgrid">
        <label>ทรัพย์สิน
          <select v-model="form.asset_id" required>
            <option value="">เลือกทรัพย์สินที่ต้องการแจ้งซ่อม</option>
            <option v-for="a in availableAssets" :key="a.asset_id" :value="a.asset_id">{{ a.asset_code }} · {{ a.asset_name }}</option>
          </select>
        </label>
        <label class="wide">อาการเสีย / รายละเอียดปัญหา
          <textarea v-model="form.problem_detail" maxlength="255" rows="3" required placeholder="เช่น เปิดเครื่องไม่ติด, หน้าจอแตก"></textarea>
        </label>
      </div>
      <p class="hint">เมื่อแจ้งซ่อมสำเร็จ ระบบจะเปลี่ยนสถานะทรัพย์สินเป็น “กำลังซ่อม” และไม่ให้ยืมระหว่างซ่อม</p>
      <button class="primary" type="submit" :disabled="saving">{{ saving ? 'กำลังบันทึก...' : 'บันทึกแจ้งซ่อม' }}</button>
    </form>

    <div class="toolbar">
      <input v-model="query" placeholder="ค้นหารหัส ชื่อทรัพย์สิน หรืออาการเสีย" @keyup.enter="load">
      <select v-model="filter" @change="load">
        <option value="">ทุกสถานะ</option>
        <option v-for="s in statuses" :key="s.value" :value="s.value">{{ s.label }}</option>
      </select>
      <button class="secondary" @click="load">ค้นหา</button>
    </div>

    <div v-if="edit" class="panel edit-panel">
      <div class="edithead"><h2>อัปเดตงานซ่อม #{{ edit.repair_id }}</h2><button class="close" @click="edit = null">✕</button></div>
      <div class="formgrid">
        <label>สถานะงานซ่อม
          <select v-model="edit.repair_status">
            <option v-for="s in statuses" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>
        </label>
        <label>ค่าซ่อม (บาท)
          <input v-model="edit.cost" type="number" min="0" step="0.01" placeholder="0.00">
        </label>
        <label>วันที่ซ่อมเสร็จ / วันที่ดำเนินการ
          <input v-model="edit.repair_date" type="date">
        </label>
        <label class="wide">รายละเอียดการซ่อม
          <textarea v-model="edit.problem_detail" maxlength="255" rows="2"></textarea>
        </label>
      </div>
      <p class="hint">เลือก “ซ่อมเสร็จ” แล้วบันทึก ระบบจะเปลี่ยนสถานะทรัพย์สินกลับเป็น “ว่าง” อัตโนมัติ</p>
      <button class="primary" :disabled="saving" @click="saveEdit">{{ saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง' }}</button>
    </div>

    <div class="tablewrap">
      <table>
        <thead><tr><th>ทรัพย์สิน</th><th>อาการเสีย</th><th>วันที่แจ้ง</th><th>สถานะงานซ่อม</th><th>ค่าซ่อม</th><th>จัดการ</th></tr></thead>
        <tbody>
          <tr v-if="loading"><td colspan="6" class="empty">กำลังโหลดข้อมูล...</td></tr>
          <tr v-else-if="!rows.length"><td colspan="6" class="empty">ไม่พบรายการซ่อม</td></tr>
          <tr v-for="r in rows" :key="r.repair_id">
            <td><b>{{ r.asset_name }}</b><small>{{ r.asset_code }} · งาน #{{ r.repair_id }}</small></td>
            <td class="problem">{{ r.problem_detail }}</td>
            <td>{{ r.report_date ? String(r.report_date).slice(0,10) : '-' }}</td>
            <td><span class="status" :class="r.repair_status">{{ statusLabel(r.repair_status) }}</span></td>
            <td class="cost">{{ r.cost == null ? '—' : '฿' + money(r.cost) }}</td>
            <td><button class="secondary smallbtn" @click="openEdit(r)">อัปเดต / บันทึกค่าซ่อม</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.repairs{color:var(--text,#172033)}.heading{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-bottom:24px}.eyebrow{font-size:11px;letter-spacing:2px;color:#64748b;font-weight:800;margin:0 0 5px}.heading h1{font-size:28px;margin:0}.sub,.hint{color:#64748b;font-size:13px;margin:7px 0 0}.primary,.secondary{border:0;border-radius:9px;padding:10px 15px;font:inherit;font-weight:650;cursor:pointer}.primary{background:var(--primary,#2563eb);color:white}.secondary{background:#eef2f7;color:#334155}.primary:disabled{opacity:.6;cursor:wait}.stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:20px}.stat,.panel{background:white;border:1px solid #e5eaf1;border-radius:14px;padding:18px}.stat span{display:block;color:#64748b;font-size:13px}.stat strong{display:block;font-size:27px;margin-top:6px}.panel{margin:18px 0;box-shadow:0 5px 18px #0f172a08}.panel h2{font-size:18px;margin:0 0 16px}.formgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.formgrid label{display:flex;flex-direction:column;gap:7px;font-size:13px;font-weight:650}.wide{grid-column:1/-1}.formgrid input,.formgrid select,.formgrid textarea,.toolbar input,.toolbar select{box-sizing:border-box;width:100%;padding:10px 12px;border:1px solid #d8dee8;border-radius:8px;background:#fff;color:#172033;font:inherit;font-weight:400}.panel>.primary{margin-top:14px}.toolbar{display:flex;gap:10px;margin:22px 0 14px}.toolbar input{flex:1}.notice{padding:12px 14px;border-radius:9px;font-size:14px}.success{background:#ecfdf5;color:#047857}.error{background:#fff1f2;color:#be123c}.tablewrap{overflow-x:auto;background:#fff;border:1px solid #e5eaf1;border-radius:13px}table{width:100%;border-collapse:collapse;min-width:780px}th,td{text-align:left;padding:14px 12px;border-bottom:1px solid #edf0f5;font-size:13px}th{background:#f8fafc;color:#64748b;font-weight:700;white-space:nowrap}td b,td small{display:block}td small{color:#64748b;margin-top:4px}.problem{max-width:240px;white-space:normal}.cost{font-weight:700;white-space:nowrap}.status{display:inline-block;border-radius:999px;padding:5px 9px;font-size:12px;font-weight:700;white-space:nowrap}.status.pending{background:#fff7ed;color:#c2410c}.status.in_progress{background:#eff6ff;color:#1d4ed8}.status.done{background:#ecfdf5;color:#047857}.status.cannot_repair{background:#fff1f2;color:#be123c}.smallbtn{font-size:12px;white-space:nowrap;padding:8px 10px}.empty{text-align:center;color:#64748b;padding:30px}.edithead{display:flex;justify-content:space-between;align-items:center}.close{border:0;background:transparent;cursor:pointer;font-size:18px;color:#64748b}@media(max-width:720px){.heading{align-items:flex-start;flex-direction:column}.stats{grid-template-columns:repeat(2,minmax(0,1fr))}.formgrid{grid-template-columns:1fr}.wide{grid-column:auto}.toolbar{flex-wrap:wrap}.toolbar input{flex-basis:100%}.heading h1{font-size:24px}}
</style>
