<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import api from '../../services/api';
import QRCode from 'qrcode';

const assets = ref([]);
const categories = ref([]);
const loading = ref(true);
const search = ref('');
const catFilter = ref('');
const statusFilter = ref('');
const error = ref(''); const success = ref('');
const emptyForm = { asset_id: null, asset_code: '', asset_name: '', brand: '', model: '', serial_number: '', purchase_date: '', price: '', status: 'available', location: '', cat_id: '', image_url: '' };
const form = ref({ ...emptyForm });
const isEditing = ref(false);
const showForm = ref(false);
const imageFile = ref(null);
const imagePreview = ref('');
const uploading = ref(false);
const saving = ref(false);
const deleting = ref(null);
const formCard = ref(null);
const qrAsset = ref(null);
const qrImage = ref('');
const qrUrl = ref('');
const qrError = ref('');

const STATUS_TH = { available: 'ว่าง', reserved: 'ถูกจอง', borrowed: 'ถูกยืม', repair: 'ส่งซ่อม', retired: 'จำหน่ายออก' };
const todayStr = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
const money = (n) => (n == null || n === '' ? '-' : Number(n).toLocaleString('th-TH', { maximumFractionDigits: 0 }));

async function load() {
  try {
    const [a, c] = await Promise.all([api.get('/assets'), api.get('/categories')]);
    assets.value = a.data; categories.value = c.data;
  } finally { loading.value = false; }
}

const shown = computed(() => {
  const q = search.value.trim().toLowerCase();
  return assets.value.filter((a) =>
    (!catFilter.value || a.cat_id === catFilter.value) &&
    (!statusFilter.value || a.status === statusFilter.value) &&
    (!q || [a.asset_name, a.asset_code, a.brand, a.model, a.serial_number, a.location].some((v) => (v || '').toLowerCase().includes(q))));
});
const statusCounts = computed(() => {
  const c = {}; assets.value.forEach((a) => { c[a.status] = (c[a.status] || 0) + 1; }); return c;
});

async function scrollToForm() { await nextTick(); formCard.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
function openForm() { resetForm(); showForm.value = true; error.value = ''; success.value = ''; scrollToForm(); }
function startEdit(a) {
  form.value = { ...emptyForm, ...a, purchase_date: a.purchase_date?.slice(0, 10) || '', cat_id: a.cat_id ?? '', price: a.price ?? '' };
  isEditing.value = true; showForm.value = true; error.value = ''; success.value = '';
  imageFile.value = null; imagePreview.value = a.image_url || '';
  scrollToForm();
}
function resetForm() { form.value = { ...emptyForm }; isEditing.value = false; imageFile.value = null; imagePreview.value = ''; }
function closeForm() { resetForm(); showForm.value = false; error.value = ''; }

function onFileChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  imageFile.value = file;
  imagePreview.value = URL.createObjectURL(file);
}
function removeImage() { imageFile.value = null; imagePreview.value = ''; form.value.image_url = ''; }

async function uploadImageIfNeeded() {
  if (!imageFile.value) return form.value.image_url || '';
  uploading.value = true;
  try {
    const fd = new FormData();
    fd.append('image', imageFile.value);
    const { data } = await api.post('/assets/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    return data.image_url;
  } finally { uploading.value = false; }
}

async function submit() {
  error.value = ''; success.value = '';
  const pd = form.value.purchase_date;
  if (pd && (pd < '1990-01-01' || pd > todayStr)) {
    error.value = 'วันที่ซื้อไม่ถูกต้อง ต้องเป็นปี ค.ศ. และไม่เกินวันนี้ (เช่น 2025-06-10) ตรวจสอบว่าไม่ได้ใส่ปี พ.ศ.';
    return;
  }
  saving.value = true;
  try {
    const image_url = await uploadImageIfNeeded();
    const payload = { ...form.value, image_url };
    if (isEditing.value) {
      await api.put(`/assets/${form.value.asset_id}`, payload);
      success.value = 'แก้ไขทรัพย์สินสำเร็จ';
    } else {
      await api.post('/assets', payload);
      success.value = 'เพิ่มทรัพย์สินสำเร็จ';
    }
    closeForm(); await load();
  } catch (e) { error.value = e.response?.data?.message || 'บันทึกไม่สำเร็จ'; }
  finally { saving.value = false; }
}

async function confirmDelete() {
  const a = deleting.value; error.value = ''; success.value = '';
  try {
    await api.delete(`/assets/${a.asset_id}`);
    success.value = `ลบทรัพย์สิน "${a.asset_name}" แล้ว`;
    deleting.value = null; await load();
  } catch (e) { error.value = e.response?.data?.message || 'ลบไม่สำเร็จ'; deleting.value = null; }
}

async function showQr(asset) {
  qrAsset.value = asset;
  qrImage.value = '';
  qrError.value = '';
  qrUrl.value = `${window.location.origin}/assets/${asset.asset_id}`;
  try {
    qrImage.value = await QRCode.toDataURL(qrUrl.value, { width: 420, margin: 2, errorCorrectionLevel: 'H' });
  } catch (e) {
    qrError.value = 'สร้าง QR Code ไม่สำเร็จ';
    console.error('[asset-qr] failed to generate:', e);
  }
}

onMounted(load);
</script>

<template>
  <section class="page">
    <div class="page-head">
      <div>
        <h2>จัดการทรัพย์สิน</h2>
        <p class="page-sub">ทั้งหมด {{ assets.length }} รายการ · ว่าง {{ statusCounts.available || 0 }} · ถูกจอง {{ statusCounts.reserved || 0 }} · ถูกยืม {{ statusCounts.borrowed || 0 }}</p>
      </div>
      <button v-if="!showForm" class="btn" @click="openForm">+ เพิ่มทรัพย์สิน</button>
    </div>

    <p v-if="success" class="success-text">{{ success }}</p>
    <p v-if="error && !showForm" class="error-text">{{ error }}</p>

    <!-- ฟอร์มเพิ่ม/แก้ไข -->
    <div v-if="showForm" ref="formCard" class="card formcard">
      <h3 class="section-title">{{ isEditing ? `แก้ไขทรัพย์สิน: ${form.asset_name}` : 'เพิ่มทรัพย์สินใหม่' }}</h3>
      <p v-if="error" class="error-text">{{ error }}</p>
      <form class="layout" autocomplete="off" @submit.prevent="submit">
        <!-- รูปภาพ -->
        <div class="pic">
          <span class="lbl">รูปภาพ</span>
          <div class="preview">
            <img v-if="imagePreview" :src="imagePreview" alt="ตัวอย่างรูป" />
            <span v-else>ยังไม่มีรูป</span>
          </div>
          <label class="btn secondary sm up">
            {{ imagePreview ? 'เปลี่ยนรูป' : 'เลือกรูปภาพ' }}
            <input type="file" accept="image/png, image/jpeg, image/webp, image/gif" hidden @change="onFileChange" />
          </label>
          <button v-if="imagePreview" type="button" class="link" @click="removeImage">ลบรูป</button>
          <small>jpg / png / webp / gif ไม่เกิน 5MB</small>
        </div>

        <div class="fgrid">
          <label class="field"><span>รหัสทรัพย์สิน <em>*</em></span><input v-model="form.asset_code" placeholder="เช่น AST-0100" required :disabled="isEditing" autocomplete="off" /></label>
          <label class="field"><span>ชื่อทรัพย์สิน <em>*</em></span><input v-model="form.asset_name" required autocomplete="off" /></label>
          <label class="field"><span>ประเภท</span>
            <select v-model="form.cat_id">
              <option value="">— ไม่ระบุ —</option>
              <option v-for="c in categories" :key="c.cat_id" :value="c.cat_id">{{ c.cat_name }}</option>
            </select>
          </label>
          <label v-if="isEditing" class="field"><span>สถานะ</span>
            <select v-model="form.status">
              <option v-for="(t, k) in STATUS_TH" :key="k" :value="k">{{ t }}</option>
            </select>
          </label>
          <label v-else class="field"><span>สถานที่จัดเก็บ</span><input v-model="form.location" placeholder="เช่น คลังไอที" autocomplete="off" /></label>
          <label class="field"><span>ยี่ห้อ</span><input v-model="form.brand" autocomplete="off" /></label>
          <label class="field"><span>รุ่น</span><input v-model="form.model" autocomplete="off" /></label>
          <label class="field"><span>Serial Number</span><input v-model="form.serial_number" autocomplete="off" /></label>
          <label class="field"><span>ราคา (บาท)</span><input v-model="form.price" type="number" min="0" step="0.01" placeholder="0.00" /></label>
          <label class="field"><span>วันที่ซื้อ</span><input v-model="form.purchase_date" type="date" min="1990-01-01" :max="todayStr" /><small>ใช้ปี ค.ศ.</small></label>
          <label v-if="isEditing" class="field"><span>สถานที่จัดเก็บ</span><input v-model="form.location" autocomplete="off" /></label>
          <div class="form-actions full">
            <button class="btn secondary" type="button" @click="closeForm">ยกเลิก</button>
            <button class="btn" type="submit" :disabled="saving || uploading">
              {{ uploading ? 'กำลังอัปโหลดรูป...' : saving ? 'กำลังบันทึก...' : (isEditing ? 'บันทึกการแก้ไข' : 'เพิ่มทรัพย์สิน') }}
            </button>
          </div>
        </div>
      </form>
    </div>

    <!-- ตัวกรอง -->
    <div class="toolbar">
      <input v-model="search" class="grow" placeholder="ค้นหาชื่อ รหัส ยี่ห้อ รุ่น หรือสถานที่..." autocomplete="off" />
      <select v-model="catFilter" aria-label="ประเภท">
        <option value="">ทุกประเภท</option>
        <option v-for="c in categories" :key="c.cat_id" :value="c.cat_id">{{ c.cat_name }}</option>
      </select>
      <select v-model="statusFilter" aria-label="สถานะ">
        <option value="">ทุกสถานะ</option>
        <option v-for="(t, k) in STATUS_TH" :key="k" :value="k">{{ t }}</option>
      </select>
    </div>

    <div class="card list">
      <p v-if="loading" class="empty-state">กำลังโหลด...</p>
      <p v-else-if="shown.length === 0" class="empty-state">ไม่พบทรัพย์สินตามเงื่อนไข</p>
      <div v-else class="table-wrap">
        <table>
          <thead><tr><th></th><th>ทรัพย์สิน</th><th>ประเภท</th><th>สถานที่</th><th>ราคา</th><th>สถานะ</th><th class="actions"></th></tr></thead>
          <tbody>
            <tr v-for="a in shown" :key="a.asset_id">
              <td class="thumbcell">
                <img v-if="a.image_url" :src="a.image_url" :alt="a.asset_name" class="thumb" loading="lazy" />
                <div v-else class="thumb none">–</div>
              </td>
              <td>
                <div class="two"><b>{{ a.asset_name }}</b><small>{{ a.asset_code }}<template v-if="a.brand || a.model"> · {{ [a.brand, a.model].filter(Boolean).join(' ') }}</template></small></div>
              </td>
              <td>{{ a.cat_name || '-' }}</td>
              <td>{{ a.location || '-' }}</td>
              <td>{{ money(a.price) }}</td>
              <td><span class="badge" :class="a.status">{{ STATUS_TH[a.status] || a.status }}</span></td>
              <td class="actions">
                <div class="row-actions">
                  <button class="btn secondary sm" @click="showQr(a)">QR Code</button>
                  <button class="btn secondary sm" @click="startEdit(a)">แก้ไข</button>
                  <button class="btn danger sm" @click="deleting = a">ลบ</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="qrAsset" class="overlay" @click.self="qrAsset = null">
      <div class="modal qr-modal">
        <h3>QR Code: {{ qrAsset.asset_name }}</h3>
        <p class="hint">สแกนเพื่อเปิดรายละเอียดและประวัติการยืมของทรัพย์สินชิ้นนี้</p>
        <p v-if="qrError" class="error-text">{{ qrError }}</p>
        <div v-else-if="qrImage" class="qr-content">
          <img :src="qrImage" :alt="`QR Code for ${qrAsset.asset_name}`" />
          <code>{{ qrUrl }}</code>
        </div>
        <p v-else class="hint">กำลังสร้าง QR Code...</p>
        <div class="form-actions">
          <button class="btn secondary" @click="qrAsset = null">ปิด</button>
          <a v-if="qrImage" class="btn" :href="qrImage" :download="`${qrAsset.asset_code}-QR.png`">ดาวน์โหลด PNG</a>
          <a v-if="qrImage" class="btn secondary" :href="qrUrl" target="_blank" rel="noopener">เปิดหน้ารายละเอียด</a>
        </div>
      </div>
    </div>

    <div v-if="deleting" class="overlay" @click.self="deleting = null">
      <div class="modal">
        <h3>ลบทรัพย์สิน?</h3>
        <p class="hint">ต้องการลบ <b>{{ deleting.asset_name }}</b> ({{ deleting.asset_code }}) ใช่หรือไม่</p>
        <div class="form-actions">
          <button class="btn secondary" @click="deleting = null">ยกเลิก</button>
          <button class="btn danger" @click="confirmDelete">ยืนยันลบ</button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.formcard { margin-bottom: 20px; border-top: 4px solid var(--primary); }
.layout { display: grid; grid-template-columns: 200px minmax(0, 1fr); gap: 24px; align-items: start; }
.pic { display: flex; flex-direction: column; align-items: stretch; gap: 8px; }
.lbl { font-size: 13px; font-weight: 600; }
.preview { aspect-ratio: 1; border: 2px dashed var(--line-strong); border-radius: 12px; background: #fafbfe; display: flex; align-items: center; justify-content: center; color: var(--muted); font-size: 13px; overflow: hidden; }
.preview img { width: 100%; height: 100%; object-fit: contain; padding: 6px; }
.up { cursor: pointer; }
.link { background: none; border: none; color: var(--danger); font: inherit; font-size: 13px; cursor: pointer; text-align: center; padding: 0; }
.link:hover { text-decoration: underline; }
.pic small { color: var(--muted); font-size: 12px; text-align: center; }
@media (max-width: 760px) { .layout { grid-template-columns: 1fr; } .pic { max-width: 220px; } }

.list { padding: 8px 12px; }
.qr-modal { max-width: 460px; }
.qr-content { display: grid; justify-items: center; gap: 10px; padding: 8px 0 18px; }
.qr-content img { width: min(300px, 100%); height: auto; image-rendering: pixelated; }
.qr-content code { max-width: 100%; overflow-wrap: anywhere; color: var(--muted); text-align: center; font-size: 12px; }
.thumbcell { width: 64px; }
.thumb { width: 52px; height: 52px; object-fit: contain; border-radius: 8px; border: 1px solid var(--line); background: #fff; display: block; }
.thumb.none { display: flex; align-items: center; justify-content: center; color: #b5bcc8; background: #f1f3f7; }
.two { display: flex; flex-direction: column; min-width: 0; }
small { color: var(--muted); font-size: 12.5px; }
</style>
