<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';

const requests = ref([]);
async function load() {
  const { data } = await api.get('/borrow-requests/mine');
  requests.value = data;
}
onMounted(load);

const statusLabel = { pending: 'รออนุมัติ', approved: 'อนุมัติแล้ว', rejected: 'ถูกปฏิเสธ', returned: 'คืนแล้ว', cancelled: 'ยกเลิก' };
</script>

<template>
  <section>
    <h2>คำขอยืมของฉัน</h2>
    <div v-for="r in requests" :key="r.borrow_id" class="card" style="margin-bottom:16px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <strong>{{ r.borrow_code }}</strong>
          <span style="color:var(--muted); font-size:13px;"> — ครบกำหนด {{ r.due_date?.slice(0,10) }}</span>
        </div>
        <span class="badge" :class="r.status">{{ statusLabel[r.status] || r.status }}</span>
      </div>
      <p v-if="r.purpose" style="font-size:14px; color:var(--muted); margin:6px 0;">วัตถุประสงค์: {{ r.purpose }}</p>
      <table style="margin-top:8px;">
        <thead><tr><th>ทรัพย์สิน</th><th>รหัส</th><th>สถานะการคืน</th></tr></thead>
        <tbody>
          <tr v-for="it in r.items" :key="it.detail_id">
            <td>{{ it.asset_name }}</td>
            <td>{{ it.asset_code }}</td>
            <td>{{ it.return_id ? 'คืนแล้ว ' + it.return_date?.slice(0,10) : 'ยังไม่คืน' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="requests.length === 0" style="color:var(--muted);">ยังไม่มีคำขอยืม</p>
  </section>
</template>
