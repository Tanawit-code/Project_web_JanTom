<script setup>
import { ref, onMounted } from 'vue';
import api from '../../services/api';

const assets = ref([]);
const categories = ref([]);
const search = ref('');
const error = ref(''); const success = ref('');
const emptyForm = { asset_id: null, asset_code: '', asset_name: '', brand: '', model: '', serial_number: '', purchase_date: '', price: '', status: 'available', location: '', cat_id: '', image_url: '' };
const form = ref({ ...emptyForm });
const isEditing = ref(false);
const imageFile = ref(null);
const imagePreview = ref('');
const uploading = ref(false);

async function loadAssets() {
  const { data } = await api.get('/assets', { params: { q: search.value || undefined } });
  assets.value = data;
}
async function loadCategories() {
  const { data } = await api.get('/categories');
  categories.value = data;
}
function startEdit(a) {
  form.value = { ...a, purchase_date: a.purchase_date?.slice(0,10) };
  isEditing.value = true;
  imageFile.value = null;
  imagePreview.value = a.image_url || '';
}
function resetForm() {
  form.value = { ...emptyForm };
  isEditing.value = false;
  imageFile.value = null;
  imagePreview.value = '';
}

function onFileChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  imageFile.value = file;
  imagePreview.value = URL.createObjectURL(file);
}

async function uploadImageIfNeeded() {
  if (!imageFile.value) return form.value.image_url || '';
  uploading.value = true;
  try {
    const fd = new FormData();
    fd.append('image', imageFile.value);
    const { data } = await api.post('/assets/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.image_url;
  } finally {
    uploading.value = false;
  }
}

const todayStr = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);

async function submit() {
  error.value = ''; success.value = '';
  const pd = form.value.purchase_date;
  if (pd && (pd < '1990-01-01' || pd > todayStr)) {
    error.value = 'วันที่ซื้อไม่ถูกต้อง ต้องเป็นปี ค.ศ. และไม่เกินวันนี้ (เช่น 2025-06-10) ตรวจสอบว่าไม่ได้ใส่ปี พ.ศ.';
    return;
  }
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
    resetForm(); loadAssets();
  } catch (e) { error.value = e.response?.data?.message || 'บันทึกไม่สำเร็จ'; }
}

async function remove(a) {
  if (!confirm(`ลบทรัพย์สิน "${a.asset_name}" ?`)) return;
  try { await api.delete(`/assets/${a.asset_id}`); loadAssets(); }
  catch (e) { error.value = e.response?.data?.message || 'ลบไม่สำเร็จ'; }
}

onMounted(() => { loadAssets(); loadCategories(); });
</script>

<template>
  <section>
    <h2>จัดการทรัพย์สิน</h2>
    <div class="card" style="margin-bottom:20px;">
      <h3>{{ isEditing ? 'แก้ไขทรัพย์สิน' : 'เพิ่มทรัพย์สินใหม่' }}</h3>
      <p v-if="error" class="error-text">{{ error }}</p>
      <p v-if="success" class="success-text">{{ success }}</p>
      <form @submit.prevent="submit" style="display:grid; grid-template-columns:1fr 1fr; gap:0 16px;">
        <input v-model="form.asset_code" placeholder="รหัสทรัพย์สิน" required :disabled="isEditing" />
        <input v-model="form.asset_name" placeholder="ชื่อทรัพย์สิน" required />
        <input v-model="form.brand" placeholder="ยี่ห้อ" />
        <input v-model="form.model" placeholder="รุ่น" />
        <input v-model="form.serial_number" placeholder="Serial Number" />
        <input v-model="form.purchase_date" type="date" min="1990-01-01" :max="todayStr" />
        <input v-model="form.price" type="number" step="0.01" placeholder="ราคา" />
        <input v-model="form.location" placeholder="สถานที่จัดเก็บ" />
        <select v-model="form.cat_id">
          <option value="">-- เลือกประเภท --</option>
          <option v-for="c in categories" :key="c.cat_id" :value="c.cat_id">{{ c.cat_name }}</option>
        </select>
        <select v-if="isEditing" v-model="form.status">
          <option value="available">ว่าง</option>
          <option value="borrowed">ถูกยืม</option>
          <option value="repair">ส่งซ่อม</option>
          <option value="retired">จำหน่ายออก</option>
        </select>

        <div style="grid-column:1/3; margin-bottom:12px;">
          <label style="font-size:13px; color:var(--muted); display:block; margin-bottom:6px;">รูปภาพทรัพย์สิน</label>
          <input type="file" accept="image/png, image/jpeg, image/webp, image/gif" @change="onFileChange" style="margin-bottom:10px;" />
          <div v-if="imagePreview" style="display:flex; align-items:center; gap:12px;">
            <img :src="imagePreview" alt="preview" style="width:100px; height:100px; object-fit:cover; border-radius:8px; border:1px solid #d7dae0;" />
            <span style="font-size:13px; color:var(--muted);">{{ uploading ? 'กำลังอัปโหลด...' : 'ตัวอย่างรูปภาพ' }}</span>
          </div>
        </div>

        <div style="grid-column:1/3; display:flex; gap:10px;">
          <button class="btn" type="submit" :disabled="uploading">
            {{ uploading ? 'กำลังอัปโหลดรูป...' : (isEditing ? 'บันทึกการแก้ไข' : 'เพิ่มทรัพย์สิน') }}
          </button>
          <button v-if="isEditing" class="btn secondary" type="button" @click="resetForm">ยกเลิก</button>
        </div>
      </form>
    </div>

    <div style="display:flex; gap:10px; margin-bottom:14px;">
      <input v-model="search" placeholder="ค้นหาทรัพย์สิน..." @keyup.enter="loadAssets" style="margin-bottom:0;" />
      <button class="btn secondary" @click="loadAssets">ค้นหา</button>
    </div>

    <div class="card">
      <table>
        <thead><tr><th></th><th>รหัส</th><th>ชื่อ</th><th>ประเภท</th><th>สถานะ</th><th></th></tr></thead>
        <tbody>
          <tr v-for="a in assets" :key="a.asset_id">
            <td>
              <img v-if="a.image_url" :src="a.image_url" :alt="a.asset_name"
                   style="width:48px; height:48px; object-fit:cover; border-radius:6px;" />
              <div v-else style="width:48px; height:48px; border-radius:6px; background:#e5e9f0;"></div>
            </td>
            <td>{{ a.asset_code }}</td>
            <td>{{ a.asset_name }}</td>
            <td>{{ a.cat_name }}</td>
            <td><span class="badge" :class="a.status">{{ a.status }}</span></td>
            <td style="display:flex; gap:8px;">
              <button class="btn secondary" @click="startEdit(a)">แก้ไข</button>
              <button class="btn danger" @click="remove(a)">ลบ</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="assets.length === 0" style="color:var(--muted);">ไม่พบทรัพย์สิน</p>
    </div>
  </section>
</template>
