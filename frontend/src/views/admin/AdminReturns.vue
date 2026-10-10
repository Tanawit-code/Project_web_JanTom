<script setup>
import { ref, onMounted } from 'vue';
import api from '../../services/api';

const pending = ref([]);
const error = ref(''); const success = ref('');
const forms = ref({});
const busyId = ref(null);

const money = (n) => Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

async function load() {
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
}

function onTypeChange(it) {
  const f = forms.value[it.detail_id];
  if (f.fine_type === 'none') { f.fine_amount = ''; f.fine_reason = ''; }
  else if (f.fine_type === 'late' && it.days_late > 0) { f.fine_amount = it.suggested_late_fine; f.fine_reason = `ส่งคืนล่าช้า ${it.days_late} วัน`; }
  else if (f.fine_type === 'damaged' && !f.fine_reason) f.fine_reason = 'ทรัพย์สินชำรุด/เสียหาย';
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
  <section class="wrap">
    <h2>รับคืนทรัพย์สิน</h2>
    <p class="sub">หากส่งคืนล่าช้าหรือพบความชำรุด ใส่ค่าปรับได้เลย ระบบจะแจ้งเตือนพนักงานให้ชำระผ่าน QR Code</p>
    <p v-if="error" class="error-text">{{ error }}</p>
    <p v-if="success" class="ok-box">{{ success }}</p>

    <div v-for="item in pending" :key="item.detail_id" class="card item">
      <div class="top">
        <div>
          <strong>{{ item.asset_name }}</strong> <span class="muted">({{ item.asset_code }})</span>
          <div class="muted small">
            ผู้ยืม: {{ item.first_name }} {{ item.last_name }} · เลขที่ {{ item.borrow_code }} · ครบกำหนด {{ item.due_date?.slice(0, 10) }}
          </div>
        </div>
        <span v-if="item.days_late > 0" class="late">เกินกำหนด {{ item.days_late }} วัน</span>
        <span v-else class="ontime">ยังไม่เกินกำหนด</span>
      </div>

      <div v-if="forms[item.detail_id]" class="form">
        <input v-model="forms[item.detail_id].condition_in" placeholder="สภาพตอนคืน เช่น ปกติ / หน้าจอร้าว" />
        <select v-model="forms[item.detail_id].fine_type" @change="onTypeChange(item)">
          <option value="none">ไม่มีค่าปรับ</option>
          <option value="late">ค่าปรับส่งคืนล่าช้า</option>
          <option value="damaged">ค่าปรับชำรุด/เสียหาย</option>
          <option value="other">ค่าปรับอื่น ๆ</option>
        </select>
        <template v-if="forms[item.detail_id].fine_type !== 'none'">
          <input v-model="forms[item.detail_id].fine_amount" type="number" min="1" step="0.01" placeholder="จำนวนเงิน (บาท)" />
          <input v-model="forms[item.detail_id].fine_reason" placeholder="เหตุผล/รายละเอียดค่าปรับ" maxlength="255" />
          <p v-if="forms[item.detail_id].fine_type === 'late' && item.days_late > 0" class="hint">
            คำนวณจากวันละ ฿{{ money(item.fine_per_day) }} × {{ item.days_late }} วัน (แก้ตัวเลขได้)
          </p>
        </template>
        <button class="btn" :disabled="busyId === item.detail_id" @click="submitReturn(item)">
          {{ busyId === item.detail_id ? 'กำลังบันทึก...' : 'บันทึกคืน' }}
        </button>
      </div>
    </div>
    <p v-if="pending.length === 0" class="muted">ไม่มีรายการค้างคืน</p>
  </section>
</template>

<style scoped>
.sub { color: var(--muted); font-size: 14px; margin: -4px 0 16px; }
.ok-box { background: #e3f4ea; color: #1f6b3d; padding: 10px 14px; border-radius: 10px; font-size: 14px; }
.item { margin-bottom: 16px; }
.top { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; flex-wrap: wrap; }
.muted { color: var(--muted); }
.small { font-size: 13px; margin-top: 2px; }
.late { background: #fdecea; color: #8a1c14; font-size: 13px; font-weight: 700; padding: 3px 12px; border-radius: 999px; }
.ontime { background: #e3f4ea; color: #1f6b3d; font-size: 13px; padding: 3px 12px; border-radius: 999px; }
.form { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 14px; align-items: start; }
.form input, .form select { margin: 0; }
.hint { grid-column: 1 / -1; margin: -2px 0 0; font-size: 12px; color: var(--muted); }
.form .btn { grid-column: 1 / -1; justify-self: end; padding: 10px 26px; }
@media (max-width: 640px) { .form { grid-template-columns: 1fr; } }
</style>
