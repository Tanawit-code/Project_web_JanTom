<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';

const assets = ref([]);
const search = ref('');
const selectedIds = ref([]);
const dueDate = ref('');
const purpose = ref('');
const error = ref('');
const success = ref('');

async function load() {
  const { data } = await api.get('/assets', { params: { q: search.value || undefined, status: 'available' } });
  assets.value = data;
}

function toggle(id) {
  const i = selectedIds.value.indexOf(id);
  if (i === -1) selectedIds.value.push(id); else selectedIds.value.splice(i, 1);
}

async function submitRequest() {
  error.value = ''; success.value = '';
  if (selectedIds.value.length === 0) { error.value = 'กรุณาเลือกทรัพย์สินอย่างน้อย 1 รายการ'; return; }
  if (!dueDate.value) { error.value = 'กรุณาระบุวันครบกำหนดคืน'; return; }
  try {
    const { data } = await api.post('/borrow-requests', {
      due_date: dueDate.value, purpose: purpose.value, asset_ids: selectedIds.value,
    });
    success.value = `${data.message} (เลขที่คำขอ ${data.borrow_code})`;
    selectedIds.value = []; dueDate.value = ''; purpose.value = '';
    load();
  } catch (e) {
    error.value = e.response?.data?.message || 'ส่งคำขอไม่สำเร็จ';
  }
}

onMounted(load);
</script>

<template>
  <section>
    <h2>ทรัพย์สินที่พร้อมให้ยืม</h2>
    <div style="display:flex; gap:10px; margin-bottom:20px;">
      <input v-model="search" placeholder="ค้นหาทรัพย์สิน..." @keyup.enter="load" style="margin-bottom:0;" />
      <button class="btn secondary" @click="load">ค้นหา</button>
    </div>

    <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(220px,1fr)); gap:16px; margin-bottom:24px;">
      <label v-for="a in assets" :key="a.asset_id" class="card"
             :style="{ cursor:'pointer', padding:0, overflow:'hidden', border: selectedIds.includes(a.asset_id) ? '2px solid var(--primary)' : '2px solid transparent' }">
        <img v-if="a.image_url" :src="a.image_url" :alt="a.asset_name"
             style="width:100%; height:140px; object-fit:cover; display:block;" />
        <div v-else style="width:100%; height:140px; background:#e5e9f0; display:flex; align-items:center; justify-content:center; color:var(--muted); font-size:13px;">
          ไม่มีรูปภาพ
        </div>
        <div style="padding:16px;">
          <input type="checkbox" :checked="selectedIds.includes(a.asset_id)" @change="toggle(a.asset_id)" style="width:auto; margin-bottom:8px;" />
          <h3 style="margin:0 0 4px;">{{ a.asset_name }}</h3>
          <p style="font-size:13px; color:var(--muted); margin:0 0 4px;">{{ a.asset_code }} · {{ a.cat_name }}</p>
          <p style="font-size:13px; color:var(--muted);">ที่เก็บ: {{ a.location }}</p>
          <span class="badge available">ว่าง</span>
        </div>
      </label>
    </div>
    <p v-if="assets.length === 0" style="color:var(--muted);">ไม่พบทรัพย์สินที่ว่าง</p>

    <div class="card" style="max-width:480px;">
      <h3>ส่งคำขอยืม ({{ selectedIds.length }} รายการที่เลือก)</h3>
      <p v-if="error" class="error-text">{{ error }}</p>
      <p v-if="success" class="success-text">{{ success }}</p>
      <label style="font-size:13px; color:var(--muted);">วันครบกำหนดคืน</label>
      <input v-model="dueDate" type="date" />
      <label style="font-size:13px; color:var(--muted);">วัตถุประสงค์การยืม</label>
      <textarea v-model="purpose" placeholder="เช่น ใช้ประชุมลูกค้านอกสถานที่"></textarea>
      <button class="btn" style="width:100%;" @click="submitRequest">ส่งคำขอยืม</button>
    </div>
  </section>
</template>
