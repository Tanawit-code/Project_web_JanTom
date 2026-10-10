<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue';
import api from '../../services/api';

const TABS = [
  { key: 'slip_submitted', label: 'รอตรวจสลิป' },
  { key: 'unpaid', label: 'ค้างชำระ' },
  { key: 'paid', label: 'ชำระแล้ว' },
  { key: 'cancelled', label: 'ยกเลิก' },
];
const tab = ref('slip_submitted');
const items = ref([]);
const counts = ref({ unpaid: 0, slip_submitted: 0, paid: 0, cancelled: 0 });
const loading = ref(true);
const error = ref(''); const success = ref('');

const money = (n) => Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const TYPE_LABEL = { late: 'ส่งคืนล่าช้า', damaged: 'ชำรุด/เสียหาย', other: 'อื่น ๆ' };

async function load() {
  loading.value = true;
  try {
    const { data } = await api.get('/fines', { params: { status: tab.value } });
    items.value = data.items;
    counts.value = data.counts;
  } catch (e) { error.value = e.response?.data?.message || 'โหลดข้อมูลไม่สำเร็จ'; }
  finally { loading.value = false; }
}
function pick(k) { tab.value = k; success.value = ''; error.value = ''; load(); }

// ---------- dialog (ดูสลิป / ปฏิเสธ / ยกเลิก) ----------
const dlg = reactive({ mode: '', fine: null, imgUrl: '', imgErr: '', note: '', busy: false, err: '' });
function closeDlg() {
  if (dlg.imgUrl) URL.revokeObjectURL(dlg.imgUrl);
  Object.assign(dlg, { mode: '', fine: null, imgUrl: '', imgErr: '', note: '', busy: false, err: '' });
}
async function openSlip(f) {
  Object.assign(dlg, { mode: 'slip', fine: f, imgUrl: '', imgErr: '', note: '', busy: false, err: '' });
  try {
    const res = await api.get(`/fines/${f.fine_id}/slip`, { responseType: 'blob' });
    dlg.imgUrl = URL.createObjectURL(res.data);
  } catch { dlg.imgErr = 'โหลดรูปสลิปไม่สำเร็จ'; }
}
function openReject(f) { dlg.mode = 'reject'; dlg.fine = f; dlg.note = ''; dlg.err = ''; }
function openCancel(f) { Object.assign(dlg, { mode: 'cancel', fine: f, note: '', err: '', busy: false }); }

async function review(action) {
  if (action === 'reject' && !dlg.note.trim()) { dlg.err = 'กรุณาระบุเหตุผลที่ปฏิเสธ'; return; }
  dlg.busy = true; dlg.err = '';
  try {
    const { data } = await api.patch(`/fines/${dlg.fine.fine_id}/review`, { action, note: dlg.note });
    success.value = data.message;
    closeDlg();
    load();
  } catch (e) { dlg.err = e.response?.data?.message || 'ดำเนินการไม่สำเร็จ'; dlg.busy = false; }
}
async function doCancel() {
  dlg.busy = true; dlg.err = '';
  try {
    const { data } = await api.patch(`/fines/${dlg.fine.fine_id}/cancel`);
    success.value = data.message;
    closeDlg();
    load();
  } catch (e) { dlg.err = e.response?.data?.message || 'ยกเลิกไม่สำเร็จ'; dlg.busy = false; }
}

// ---------- สร้างค่าปรับใหม่ ----------
const employees = ref([]);
const showCreate = ref(false);
const form = ref({ emp_id: '', fine_type: 'damaged', amount: '', reason: '' });
const creating = ref(false);
const createErr = ref('');
const activeEmployees = computed(() => employees.value.filter((e) => e.status === 'active'));

async function toggleCreate() {
  showCreate.value = !showCreate.value;
  if (showCreate.value && employees.value.length === 0) {
    try { employees.value = (await api.get('/employees')).data; } catch { createErr.value = 'โหลดรายชื่อพนักงานไม่สำเร็จ'; }
  }
}
async function createFine() {
  createErr.value = ''; success.value = '';
  if (!form.value.emp_id || !form.value.reason.trim() || !(Number(form.value.amount) > 0)) {
    createErr.value = 'กรุณาเลือกพนักงาน ระบุจำนวนเงิน และเหตุผล';
    return;
  }
  creating.value = true;
  try {
    const { data } = await api.post('/fines', form.value);
    success.value = `${data.message} (${data.fine_code})`;
    form.value = { emp_id: '', fine_type: 'damaged', amount: '', reason: '' };
    showCreate.value = false;
    tab.value = 'unpaid';
    load();
  } catch (e) { createErr.value = e.response?.data?.message || 'สร้างค่าปรับไม่สำเร็จ'; }
  finally { creating.value = false; }
}

let timer;
onMounted(() => { load(); timer = setInterval(load, 30000); });
onBeforeUnmount(() => { clearInterval(timer); if (dlg.imgUrl) URL.revokeObjectURL(dlg.imgUrl); });
</script>

<template>
  <section class="wrap">
    <div class="head">
      <h2>จัดการค่าปรับ</h2>
      <button class="btn" @click="toggleCreate">{{ showCreate ? 'ปิดแบบฟอร์ม' : '+ สร้างค่าปรับ' }}</button>
    </div>

    <p v-if="success" class="ok-box">{{ success }}</p>
    <p v-if="error" class="error-text">{{ error }}</p>

    <div v-if="showCreate" class="create">
      <h3>สร้างค่าปรับให้พนักงาน</h3>
      <p class="hint">ใช้เมื่อพบความเสียหายภายหลัง หรือค่าปรับอื่นที่ไม่ได้บันทึกตอนรับคืน (ถ้าบันทึกตอนรับคืน ให้ใส่ที่หน้า "รับคืน" ได้เลย)</p>
      <div class="grid">
        <select v-model="form.emp_id">
          <option value="">— เลือกพนักงาน —</option>
          <option v-for="e in activeEmployees" :key="e.emp_id" :value="e.emp_id">{{ e.emp_code }} · {{ e.first_name }} {{ e.last_name }}</option>
        </select>
        <select v-model="form.fine_type">
          <option value="late">ส่งคืนล่าช้า</option>
          <option value="damaged">ทรัพย์สินชำรุด/เสียหาย</option>
          <option value="other">อื่น ๆ</option>
        </select>
        <input v-model="form.amount" type="number" min="1" step="0.01" placeholder="จำนวนเงิน (บาท)" />
        <input v-model="form.reason" placeholder="เหตุผล เช่น หน้าจอโน้ตบุ๊กแตก" maxlength="255" />
      </div>
      <p v-if="createErr" class="error-text">{{ createErr }}</p>
      <button class="btn" :disabled="creating" @click="createFine">{{ creating ? 'กำลังบันทึก...' : 'บันทึกและแจ้งพนักงาน' }}</button>
    </div>

    <div class="tabs">
      <button v-for="t in TABS" :key="t.key" class="tab" :class="{ on: tab === t.key }" @click="pick(t.key)">
        {{ t.label }}<span class="n" :class="{ hot: t.key === 'slip_submitted' && counts[t.key] > 0 }">{{ counts[t.key] }}</span>
      </button>
    </div>

    <p v-if="loading && items.length === 0" class="empty">กำลังโหลด...</p>
    <p v-else-if="items.length === 0" class="empty">ไม่มีรายการในหมวดนี้</p>

    <div v-for="f in items" :key="f.fine_id" class="row">
      <div class="info">
        <div class="line1">
          <b>{{ f.first_name }} {{ f.last_name }}</b>
          <span class="muted">({{ f.emp_code }})</span>
          <span class="chip">{{ TYPE_LABEL[f.fine_type] }}</span>
        </div>
        <div class="reason">{{ f.reason }}</div>
        <div class="muted small">
          {{ f.fine_code }} · สร้างเมื่อ {{ f.created_at }}
          <template v-if="f.asset_name"> · {{ f.asset_name }} ({{ f.borrow_code }})</template>
          <template v-if="f.slip_uploaded_at"> · ส่งสลิป {{ f.slip_uploaded_at }}</template>
          <template v-if="f.paid_at"> · ชำระเมื่อ {{ f.paid_at }}</template>
        </div>
        <div v-if="f.status === 'unpaid' && f.review_note" class="small bad">สลิปล่าสุดถูกปฏิเสธ: {{ f.review_note }}</div>
      </div>
      <div class="side">
        <div class="amount">฿{{ money(f.amount) }}</div>
        <div class="btns">
          <button v-if="f.status === 'slip_submitted'" class="btn" @click="openSlip(f)">ตรวจสลิป</button>
          <button v-if="f.status === 'unpaid' || f.status === 'slip_submitted'" class="btn secondary" @click="openCancel(f)">ยกเลิก</button>
        </div>
      </div>
    </div>

    <!-- Dialog -->
    <transition name="fade">
      <div v-if="dlg.mode" class="overlay" @click.self="closeDlg">
        <div class="modal" :class="{ wide: dlg.mode === 'slip' }">
          <template v-if="dlg.mode === 'slip'">
            <h3>ตรวจสลิปการโอนเงิน</h3>
            <p class="muted small">{{ dlg.fine.first_name }} {{ dlg.fine.last_name }} · {{ dlg.fine.fine_code }}</p>
            <div class="expect">ยอดที่ต้องได้รับ <b>฿{{ money(dlg.fine.amount) }}</b></div>
            <div class="slipbox">
              <p v-if="dlg.imgErr" class="error-text">{{ dlg.imgErr }}</p>
              <p v-else-if="!dlg.imgUrl" class="muted">กำลังโหลดสลิป...</p>
              <img v-else :src="dlg.imgUrl" alt="สลิป" />
            </div>
            <p class="hint">ตรวจสอบว่ายอดเงิน บัญชีผู้รับ วันและเวลาโอน ตรงกับค่าปรับนี้ก่อนยืนยัน</p>
            <p v-if="dlg.err" class="error-text">{{ dlg.err }}</p>
            <div class="actions">
              <button class="btn secondary" :disabled="dlg.busy" @click="closeDlg">ปิด</button>
              <button class="btn danger" :disabled="dlg.busy" @click="openReject(dlg.fine)">ปฏิเสธสลิป</button>
              <button class="btn ok" :disabled="dlg.busy" @click="review('approve')">{{ dlg.busy ? 'กำลังบันทึก...' : 'ยืนยันว่าชำระแล้ว' }}</button>
            </div>
          </template>

          <template v-else-if="dlg.mode === 'reject'">
            <h3>ปฏิเสธสลิป</h3>
            <p class="muted">ระบุเหตุผล พนักงานจะได้รับแจ้งเตือนและต้องแนบสลิปใหม่</p>
            <textarea v-model="dlg.note" rows="3" maxlength="255" placeholder="เช่น ยอดโอนไม่ตรง / สลิปไม่ชัด / บัญชีผู้รับไม่ถูกต้อง"></textarea>
            <p v-if="dlg.err" class="error-text">{{ dlg.err }}</p>
            <div class="actions">
              <button class="btn secondary" :disabled="dlg.busy" @click="closeDlg">ยกเลิก</button>
              <button class="btn danger" :disabled="dlg.busy" @click="review('reject')">{{ dlg.busy ? 'กำลังบันทึก...' : 'ยืนยันปฏิเสธ' }}</button>
            </div>
          </template>

          <template v-else-if="dlg.mode === 'cancel'">
            <h3>ยกเลิกค่าปรับนี้?</h3>
            <p class="muted">ค่าปรับ {{ dlg.fine.fine_code }} จำนวน ฿{{ money(dlg.fine.amount) }} ของ {{ dlg.fine.first_name }} จะถูกยกเลิก พนักงานไม่ต้องชำระและจะได้รับแจ้งเตือน</p>
            <p v-if="dlg.err" class="error-text">{{ dlg.err }}</p>
            <div class="actions">
              <button class="btn secondary" :disabled="dlg.busy" @click="closeDlg">ไม่ยกเลิก</button>
              <button class="btn danger" :disabled="dlg.busy" @click="doCancel">{{ dlg.busy ? 'กำลังบันทึก...' : 'ยืนยันยกเลิก' }}</button>
            </div>
          </template>
        </div>
      </div>
    </transition>
  </section>
</template>

<style scoped>
.wrap { max-width: 900px; margin: 0 auto; }
.head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.head h2 { margin: 0; }
.ok-box { background: #e3f4ea; color: #1f6b3d; padding: 10px 14px; border-radius: 10px; font-size: 14px; }
.hint { color: var(--muted); font-size: 13px; margin: 4px 0 10px; }
.muted { color: var(--muted); }
.small { font-size: 12px; }
.bad { color: var(--danger); margin-top: 4px; }

.create { background: #fff; border-radius: 14px; padding: 18px 20px; margin-bottom: 18px; box-shadow: 0 2px 10px rgba(0, 0, 0, .06); }
.create h3 { margin: 0 0 4px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0 4px; }
.grid input, .grid select { margin: 0; }
@media (max-width: 640px) { .grid { grid-template-columns: 1fr; } }

.tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
.tab { border: 1.5px solid #d7dae0; background: #fff; border-radius: 999px; padding: 7px 16px; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; }
.tab.on { background: var(--primary); border-color: var(--primary); color: #fff; }
.n { background: #eef0f4; color: var(--text); border-radius: 999px; min-width: 22px; text-align: center; font-size: 12px; padding: 1px 7px; }
.tab.on .n { background: rgba(255, 255, 255, .25); color: #fff; }
.n.hot { background: #e11d48; color: #fff; }
.empty { text-align: center; color: var(--muted); padding: 30px 0; }

.row { display: flex; justify-content: space-between; gap: 16px; background: #fff; border-radius: 14px; padding: 14px 18px; margin-bottom: 12px; box-shadow: 0 2px 10px rgba(0, 0, 0, .06); flex-wrap: wrap; }
.line1 { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.chip { background: #e6eefb; color: var(--primary-dark); font-size: 12px; padding: 2px 10px; border-radius: 999px; }
.reason { margin: 6px 0 4px; font-size: 14px; }
.side { text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
.amount { font-size: 20px; font-weight: 800; }
.btns { display: flex; gap: 8px; }
.btn.ok { background: #2c6e49; }
.btn.ok:hover { background: #245a3c; }

.overlay { position: fixed; inset: 0; background: rgba(17, 24, 39, .55); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; padding: 16px; z-index: 100; }
.modal { background: #fff; width: 100%; max-width: 420px; border-radius: 16px; padding: 24px; box-shadow: 0 20px 50px rgba(0, 0, 0, .25); max-height: 92vh; overflow-y: auto; }
.modal.wide { max-width: 520px; }
.modal h3 { margin: 0 0 6px; }
.modal textarea { margin: 8px 0; }
.expect { background: #f6f8fc; border-radius: 10px; padding: 10px 14px; margin: 10px 0; font-size: 15px; }
.expect b { font-size: 20px; color: var(--primary-dark); }
.slipbox { background: #f1f3f7; border-radius: 12px; min-height: 120px; display: flex; align-items: center; justify-content: center; padding: 8px; }
.slipbox img { max-width: 100%; max-height: 420px; border-radius: 8px; }
.actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 16px; flex-wrap: wrap; }
.fade-enter-active, .fade-leave-active { transition: opacity .18s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
