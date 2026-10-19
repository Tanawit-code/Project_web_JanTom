<script setup>
import { ref, onMounted } from 'vue';
import api from '../../services/api';

const reservations = ref([]);
const loading = ref(true);
const error = ref('');
const success = ref('');
const busyId = ref(null);
const confirming = ref(null);

const dateParts = (value) => {
  if (!value) return null;
  const [date, time] = String(value).split(' ');
  const [year, month, day] = date.slice(0, 10).split('-').map(Number);
  return { date: new Date(year, month - 1, day), time };
};
const fmtDate = (value) => {
  const parts = dateParts(value);
  return parts ? parts.date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
};
const fmtDateTime = (value) => {
  const parts = dateParts(value);
  return parts ? `${parts.date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })} ${parts.time || ''}`.trim() : '-';
};

async function load() {
  loading.value = true;
  error.value = '';
  try {
    reservations.value = (await api.get('/borrow-requests/reservations')).data;
  } catch (e) {
    error.value = e.response?.data?.message || 'โหลดรายการจองไม่สำเร็จ';
  } finally {
    loading.value = false;
  }
}

async function cancelReservation() {
  const reservation = confirming.value;
  if (!reservation) return;
  error.value = '';
  success.value = '';
  busyId.value = reservation.borrow_id;
  try {
    const { data } = await api.delete(`/borrow-requests/${reservation.borrow_id}/reservation`);
    confirming.value = null;
    success.value = data.message;
    await load();
  } catch (e) {
    confirming.value = null;
    error.value = e.response?.data?.message || 'ยกเลิกการจองไม่สำเร็จ';
  } finally {
    busyId.value = null;
  }
}

onMounted(load);
</script>

<template>
  <section class="page narrow">
    <div class="page-head">
      <div>
        <h2>รายการจองอุปกรณ์</h2>
        <p class="page-sub">ตรวจสอบผู้จอง วันนัดรับ และอุปกรณ์ที่ถูกจอง</p>
      </div>
      <div class="head-actions">
        <span class="chip">กำลังจอง {{ reservations.length }} รายการ</span>
        <button class="btn secondary" :disabled="loading" @click="load">รีเฟรช</button>
      </div>
    </div>

    <p v-if="error" class="error-text">{{ error }}</p>
    <p v-if="success" class="success-text">{{ success }}</p>
    <p v-if="loading" class="empty-state">กำลังโหลดรายการจอง...</p>
    <div v-else-if="reservations.length === 0" class="card empty-state">
      <div class="big">📅</div>
      <p>ยังไม่มีรายการจองอุปกรณ์</p>
    </div>

    <article v-for="r in reservations" :key="r.borrow_id" class="reservation">
      <header class="reservation-head">
        <div>
          <b>{{ r.first_name }} {{ r.last_name }}</b>
          <span class="muted">รหัสพนักงาน {{ r.emp_code }} · เลขที่จอง {{ r.borrow_code }}</span>
        </div>
        <span class="status">จองอยู่</span>
      </header>

      <div class="dates">
        <div><span>จองเมื่อ</span><b>{{ fmtDateTime(r.request_date) }}</b></div>
        <div><span>วันนัดรับ</span><b>{{ fmtDate(r.pickup_date) }}</b></div>
        <div><span>กำหนดคืน</span><b>{{ fmtDate(r.due_date) }}</b></div>
      </div>

      <ul class="items">
        <li v-for="item in r.items" :key="item.detail_id">
          <span>{{ item.asset_name }}</span><small>{{ item.asset_code }}</small>
        </li>
      </ul>
      <p v-if="r.purpose" class="purpose"><b>วัตถุประสงค์:</b> {{ r.purpose }}</p>

      <footer>
        <button class="btn danger" @click="confirming = r">ยกเลิกการจอง</button>
      </footer>
    </article>

    <div v-if="confirming" class="modal-backdrop" @click.self="confirming = null">
      <section class="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="cancel-title">
        <div class="dialog-icon">!</div>
        <h3 id="cancel-title">ยืนยันยกเลิกการจอง</h3>
        <p class="dialog-intro">
          ต้องการยกเลิกการจอง <b>{{ confirming.borrow_code }}</b>
          ของ <b>{{ confirming.first_name }} {{ confirming.last_name }}</b> หรือไม่
        </p>
        <div class="dialog-items">
          <div v-for="item in confirming.items" :key="item.detail_id">
            <span>📦 {{ item.asset_name }}</span><small>{{ item.asset_code }}</small>
          </div>
        </div>
        <p class="dialog-note">อุปกรณ์ที่ยังถูกจองจะกลับไปอยู่ในสถานะว่าง</p>
        <div class="dialog-actions">
          <button class="btn secondary" :disabled="busyId === confirming.borrow_id" @click="confirming = null">กลับไป</button>
          <button class="btn danger" :disabled="busyId === confirming.borrow_id" @click="cancelReservation">
            {{ busyId === confirming.borrow_id ? 'กำลังยกเลิก...' : 'ยืนยันยกเลิก' }}
          </button>
        </div>
      </section>
    </div>
  </section>
</template>

<style scoped>
.head-actions { display: flex; align-items: center; gap: 10px; }
.reservation { background: #fff; border-radius: var(--radius); padding: 18px 20px; margin-bottom: 14px; box-shadow: var(--shadow); border-left: 5px solid #8b5cf6; }
.reservation-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.reservation-head > div { display: flex; flex-direction: column; gap: 3px; }
.muted, .dates span { color: var(--muted); font-size: 13px; }
.status { background: #f1eafe; color: #6d28d9; border-radius: 999px; padding: 4px 10px; font-size: 12px; font-weight: 700; white-space: nowrap; }
.dates { display: flex; flex-wrap: wrap; gap: 16px 32px; margin: 16px 0 10px; }
.dates div { display: flex; flex-direction: column; gap: 2px; }
.dates b { font-size: 14px; }
.items { list-style: none; margin: 0; padding: 8px 0; border-top: 1px solid var(--line); }
.items li { display: flex; justify-content: space-between; gap: 12px; padding: 5px 0; font-size: 14px; }
.items small { color: var(--muted); }
.purpose { margin: 4px 0 12px; font-size: 13px; color: var(--muted); }
footer { display: flex; justify-content: flex-end; border-top: 1px solid var(--line); padding-top: 12px; }
.modal-backdrop { position: fixed; inset: 0; z-index: 100; display: grid; place-items: center; padding: 18px; background: rgba(15, 23, 42, .56); backdrop-filter: blur(3px); }
.confirm-dialog { width: min(100%, 460px); box-sizing: border-box; padding: 26px; border-radius: 20px; background: #fff; box-shadow: 0 24px 80px rgba(15, 23, 42, .28); animation: dialog-in .18s ease-out; }
.dialog-icon { width: 46px; height: 46px; display: grid; place-items: center; border-radius: 14px; background: #fff1ed; color: #c24130; font-size: 24px; font-weight: 800; }
.confirm-dialog h3 { margin: 16px 0 8px; font-size: 20px; color: var(--text); }
.dialog-intro { margin: 0; color: var(--muted); line-height: 1.65; font-size: 14px; }
.dialog-intro b { color: var(--text); }
.dialog-items { display: grid; gap: 8px; margin-top: 16px; padding: 12px; border: 1px solid var(--line); border-radius: 12px; background: #f8fafc; }
.dialog-items div { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; }
.dialog-items small { color: var(--muted); white-space: nowrap; }
.dialog-note { margin: 14px 0 0; color: #8a5a00; font-size: 13px; }
.dialog-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; }
.dialog-actions .btn { min-width: 112px; }
@keyframes dialog-in { from { opacity: 0; transform: translateY(8px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
@media (max-width: 600px) { .head-actions { align-items: flex-end; flex-direction: column; } .dates { gap: 12px 20px; } }
</style>
