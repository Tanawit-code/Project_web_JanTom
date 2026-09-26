<script setup>
import { ref, onMounted } from 'vue';
import api from '../../services/api';

const pending = ref([]);
const error = ref(''); const success = ref('');
const returnForm = ref({});

async function load() {
  const { data } = await api.get('/returns/pending');
  pending.value = data;
}

async function submitReturn(item) {
  error.value = ''; success.value = '';
  const f = returnForm.value[item.detail_id] || {};
  try {
    await api.post('/returns', {
      detail_id: item.detail_id,
      condition_in: f.condition_in || '',
      fine_amount: f.fine_amount || 0,
    });
    success.value = `บันทึกการคืน "${item.asset_name}" สำเร็จ`;
    load();
  } catch (e) { error.value = e.response?.data?.message || 'บันทึกไม่สำเร็จ'; }
}

onMounted(load);
</script>

<template>
  <section>
    <h2>รับคืนทรัพย์สิน</h2>
    <p v-if="error" class="error-text">{{ error }}</p>
    <p v-if="success" class="success-text">{{ success }}</p>
    <div v-for="item in pending" :key="item.detail_id" class="card" style="margin-bottom:16px; display:grid; grid-template-columns:1fr 1fr; gap:12px; align-items:end;">
      <div>
        <strong>{{ item.asset_name }}</strong> ({{ item.asset_code }})<br/>
        <span style="font-size:13px; color:var(--muted);">
          ผู้ยืม: {{ item.first_name }} {{ item.last_name }} · เลขที่ {{ item.borrow_code }} · ครบกำหนด {{ item.due_date?.slice(0,10) }}
        </span>
      </div>
      <div style="display:flex; gap:10px; align-items:center;">
        <input :value="returnForm[item.detail_id]?.condition_in"
               @input="e => { returnForm[item.detail_id] = { ...(returnForm[item.detail_id]||{}), condition_in: e.target.value } }"
               placeholder="สภาพตอนคืน" style="margin-bottom:0;" />
        <input :value="returnForm[item.detail_id]?.fine_amount"
               @input="e => { returnForm[item.detail_id] = { ...(returnForm[item.detail_id]||{}), fine_amount: e.target.value } }"
               type="number" step="0.01" placeholder="ค่าปรับ" style="margin-bottom:0; max-width:120px;" />
        <button class="btn" @click="submitReturn(item)">บันทึกคืน</button>
      </div>
    </div>
    <p v-if="pending.length === 0" style="color:var(--muted);">ไม่มีรายการค้างคืน</p>
  </section>
</template>