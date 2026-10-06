<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';

const requests = ref([]);
const error = ref('');

async function load() {
  const { data } = await api.get('/borrow-requests/pending');
  requests.value = data;
}

async function decide(id, decision) {
  error.value = '';
  const note = decision === 'rejected' ? prompt('เหตุผลที่ปฏิเสธ (ถ้ามี):') || '' : '';
  try {
    await api.put(`/borrow-requests/${id}/decision`, { decision, note });
    load();
  } catch (e) {
    error.value = e.response?.data?.message || 'ดำเนินการไม่สำเร็จ';
  }
}

onMounted(load);
</script>

<template>
  <section>
    <h2>คำขอยืมที่รออนุมัติ</h2>
    <p v-if="error" class="error-text">{{ error }}</p>
    <div v-for="r in requests" :key="r.borrow_id" class="card" style="margin-bottom:16px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <strong>{{ r.borrow_code }}</strong>
          — {{ r.first_name }} {{ r.last_name }} ({{ r.emp_code }})
          <span style="color:var(--muted); font-size:13px;"> · ครบกำหนด {{ r.due_date?.slice(0,10) }}</span>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btn" @click="decide(r.borrow_id, 'approved')">อนุมัติ</button>
          <button class="btn danger" @click="decide(r.borrow_id, 'rejected')">ปฏิเสธ</button>
        </div>
      </div>
      <p v-if="r.purpose" style="font-size:14px; color:var(--muted); margin:6px 0;">วัตถุประสงค์: {{ r.purpose }}</p>
      <ul style="margin:6px 0 0; padding-left:20px; font-size:14px;">
        <li v-for="it in r.items" :key="it.detail_id">{{ it.asset_name }} ({{ it.asset_code }})</li>
      </ul>
    </div>
    <p v-if="requests.length === 0" style="color:var(--muted);">ไม่มีคำขอที่รออนุมัติ</p>
  </section>
</template>
