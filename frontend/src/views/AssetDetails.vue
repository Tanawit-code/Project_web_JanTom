<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../services/api';

const route = useRoute();
const router = useRouter();
const asset = ref(null);
const history = ref([]);
const loading = ref(true);
const error = ref('');

const STATUS_TH = { available: 'ว่าง', reserved: 'ถูกจอง', borrowed: 'ถูกยืม', repair: 'ส่งซ่อม', retired: 'จำหน่ายออก' };
const HISTORY_STATUS = { pending: 'รออนุมัติ', reserved: 'จองแล้ว', approved: 'กำลังยืม', rejected: 'ไม่อนุมัติ', returned: 'คืนแล้ว', cancelled: 'ยกเลิก' };
const fmtDate = (value) => value ? new Date(value).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : '-';

onMounted(async () => {
  try {
    const id = route.params.id;
    const [assetResponse, historyResponse] = await Promise.all([
      api.get(`/assets/${id}`),
      api.get(`/assets/${id}/history`),
    ]);
    asset.value = assetResponse.data;
    history.value = historyResponse.data;
  } catch (e) {
    error.value = e.response?.data?.message || 'โหลดรายละเอียดทรัพย์สินไม่สำเร็จ';
  } finally { loading.value = false; }
});
</script>

<template>
  <section class="page asset-detail-page">
    <button class="btn secondary back" @click="router.push('/assets')">← กลับไปหน้าทรัพย์สิน</button>
    <p v-if="loading" class="empty">กำลังโหลดข้อมูลทรัพย์สิน...</p>
    <div v-else-if="error" class="card error-text">{{ error }}</div>
    <template v-else-if="asset">
      <article class="card asset-card">
        <img v-if="asset.image_url" class="asset-image" :src="asset.image_url" :alt="asset.asset_name" />
        <div class="asset-info">
          <span class="badge" :class="asset.status">{{ STATUS_TH[asset.status] || asset.status }}</span>
          <h1>{{ asset.asset_name }}</h1>
          <p class="asset-code">{{ asset.asset_code }}</p>
          <dl>
            <div v-if="asset.brand || asset.model"><dt>ยี่ห้อ / รุ่น</dt><dd>{{ [asset.brand, asset.model].filter(Boolean).join(' ') }}</dd></div>
            <div><dt>สถานที่จัดเก็บ</dt><dd>{{ asset.location || '-' }}</dd></div>
            <div><dt>Serial Number</dt><dd>{{ asset.serial_number || '-' }}</dd></div>
          </dl>
        </div>
      </article>

      <section class="history-section">
        <h2>ประวัติการยืม</h2>
        <p v-if="history.length === 0" class="card empty">ยังไม่มีประวัติการยืมทรัพย์สินชิ้นนี้</p>
        <div v-else class="history-list">
          <article v-for="item in history" :key="item.borrow_id" class="card history-item">
            <header><b>{{ item.first_name }} {{ item.last_name }}</b><span class="history-status">{{ HISTORY_STATUS[item.status] || item.status }}</span></header>
            <p>ยืมเมื่อ {{ fmtDate(item.borrowed_at) }}</p>
            <p v-if="item.return_date">คืนเมื่อ {{ fmtDate(item.return_date) }}</p>
            <p v-if="item.condition_out">สภาพก่อนยืม: {{ item.condition_out }}</p>
            <p v-if="item.condition_in">สภาพตอนคืน: {{ item.condition_in }}</p>
            <b v-if="item.has_defect === 1 || item.has_defect === true" class="defect">พบตำหนิ</b>
            <b v-else-if="item.has_defect === 0 || item.has_defect === false" class="good">ไม่พบตำหนิ</b>
            <span v-else class="muted">ยังไม่คืนหรือยังไม่ได้บันทึกสภาพ</span>
          </article>
        </div>
      </section>
    </template>
  </section>
</template>

<style scoped>
.asset-detail-page { max-width: 900px; margin: 0 auto; }
.back { margin-bottom: 16px; }
.asset-card { display: grid; grid-template-columns: minmax(180px, 320px) 1fr; gap: 24px; padding: 22px; }
.asset-image { width: 100%; max-height: 300px; object-fit: contain; background: #f8fafc; border-radius: 12px; }
.asset-info h1 { margin: 12px 0 2px; font-size: 26px; }
.asset-code { margin: 0 0 16px; color: var(--muted); }
dl { margin: 0; display: grid; gap: 10px; }
dl div { display: grid; grid-template-columns: 130px 1fr; gap: 10px; }
dt { color: var(--muted); }
dd { margin: 0; overflow-wrap: anywhere; }
.history-section { margin-top: 24px; }
.history-section h2 { margin-bottom: 12px; }
.history-list { display: grid; gap: 12px; }
.history-item { padding: 16px 20px; }
.history-item header { display: flex; justify-content: space-between; gap: 12px; }
.history-item p { margin: 8px 0 0; }
.history-status { color: var(--muted); font-size: 13px; }
.defect, .good { display: inline-block; margin-top: 10px; }
.defect { color: var(--danger); }
.good { color: var(--ok-text); }
@media (max-width: 600px) {
  .asset-card { grid-template-columns: 1fr; }
  .asset-image { max-height: 220px; }
}
</style>
