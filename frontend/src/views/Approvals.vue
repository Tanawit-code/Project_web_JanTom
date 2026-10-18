<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';

const requests = ref([]);
const loading = ref(true);
const error = ref(''); const success = ref('');
const busyId = ref(null);
const rejecting = ref(null); // คำขอที่กำลังจะปฏิเสธ (เปิดกล่องเหตุผล)
const note = ref('');

async function load() {
  try { requests.value = (await api.get('/borrow-requests/pending')).data; }
  finally { loading.value = false; }
}

async function decide(r, decision, reason = '') {
  error.value = ''; success.value = '';
  busyId.value = r.borrow_id;
  try {
    await api.put(`/borrow-requests/${r.borrow_id}/decision`, { decision, note: reason });
    success.value = decision === 'approved' ? `อนุมัติคำขอ ${r.borrow_code} แล้ว` : `ปฏิเสธคำขอ ${r.borrow_code} แล้ว`;
    rejecting.value = null; note.value = '';
    await load();
  } catch (e) {
    error.value = e.response?.data?.message || 'ดำเนินการไม่สำเร็จ';
  } finally { busyId.value = null; }
}

const fmt = (d) => (d ? new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '-');
onMounted(load);
</script>

<template>
  <section class="page narrow">
    <div class="page-head">
      <div>
        <h2>คำขอยืมที่รออนุมัติ</h2>
        <p class="page-sub">ตรวจสอบรายการและวัตถุประสงค์ก่อนอนุมัติ</p>
      </div>
      <span v-if="requests.length" class="chip">รอพิจารณา {{ requests.length }} คำขอ</span>
    </div>

    <p v-if="error" class="error-text">{{ error }}</p>
    <p v-if="success" class="success-text">{{ success }}</p>

    <p v-if="loading" class="empty-state">กำลังโหลด...</p>
    <div v-else-if="requests.length === 0" class="card empty-state">
      <div class="big">🎉</div>
      <p>ไม่มีคำขอที่รออนุมัติ</p>
    </div>

    <article v-for="r in requests" :key="r.borrow_id" class="req">
      <header>
        <div class="who">
          <span class="avatar">{{ (r.first_name || '?').charAt(0) }}</span>
          <div>
            <b>{{ r.first_name }} {{ r.last_name }}</b>
            <small>{{ r.emp_code }} · คำขอ {{ r.borrow_code }}</small>
          </div>
        </div>
        <div class="when">
          <span>ส่งเมื่อ {{ fmt(r.request_date) }}</span>
          <b>ครบกำหนดคืน {{ fmt(r.due_date) }}</b>
        </div>
      </header>

      <p v-if="r.purpose" class="purpose"><span>วัตถุประสงค์:</span> {{ r.purpose }}</p>

      <div class="items">
        <span v-for="it in r.items" :key="it.detail_id" class="item">{{ it.asset_name }} <small>{{ it.asset_code }}</small></span>
      </div>

      <footer>
        <button class="btn danger" :disabled="busyId === r.borrow_id" @click="rejecting = r; note = ''">ปฏิเสธ</button>
        <button class="btn ok" :disabled="busyId === r.borrow_id" @click="decide(r, 'approved')">
          {{ busyId === r.borrow_id ? 'กำลังบันทึก...' : '✓ อนุมัติ' }}
        </button>
      </footer>
    </article>

    <!-- กล่องระบุเหตุผลการปฏิเสธ -->
    <div v-if="rejecting" class="overlay" @click.self="rejecting = null">
      <div class="modal">
        <h3>ปฏิเสธคำขอ {{ rejecting.borrow_code }}</h3>
        <p class="hint">ของ {{ rejecting.first_name }} {{ rejecting.last_name }} ระบุเหตุผล (ไม่บังคับ) เพื่อให้พนักงานทราบ</p>
        <textarea v-model="note" rows="3" maxlength="255" placeholder="เช่น ทรัพย์สินไม่ว่างในช่วงเวลาดังกล่าว"></textarea>
        <div class="form-actions">
          <button class="btn secondary" @click="rejecting = null">ยกเลิก</button>
          <button class="btn danger" :disabled="busyId === rejecting.borrow_id" @click="decide(rejecting, 'rejected', note)">ยืนยันปฏิเสธ</button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.req { background: #fff; border-radius: var(--radius); padding: 18px 20px; margin-bottom: 14px; box-shadow: var(--shadow); border-left: 5px solid var(--warn); }
header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
.who { display: flex; align-items: center; gap: 12px; }
.who div { display: flex; flex-direction: column; }
.who small { color: var(--muted); font-size: 12.5px; }
.when { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; font-size: 13px; color: var(--muted); }
.when b { color: var(--text); font-size: 14px; }
.purpose { margin: 12px 0 0; font-size: 14px; background: #f6f8fc; border-radius: 10px; padding: 9px 13px; }
.purpose span { color: var(--muted); }
.items { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.item { background: var(--primary-soft); color: var(--primary-dark); border-radius: 10px; padding: 6px 12px; font-size: 14px; font-weight: 600; }
.item small { font-weight: 400; opacity: .7; margin-left: 4px; }
footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--line); }
</style>
