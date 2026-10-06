<script setup>
import { ref, onMounted } from 'vue';
import api from '../../services/api';

const assets = ref([]);
const categories = ref([]);
const search = ref('');
const error = ref(''); const success = ref('');
const emptyForm = { asset_id: null, asset_code: '', asset_name: '', brand: '', model: '', serial_number: '', purchase_date: '', price: '', status: 'available', location: '', cat_id: '' };
const form = ref({ ...emptyForm });
const isEditing = ref(false);

async function loadAssets() {
  const { data } = await api.get('/assets', { params: { q: search.value || undefined } });
  assets.value = data;
}
async function loadCategories() {
  const { data } = await api.get('/categories');
  categories.value = data;
}
function startEdit(a) { form.value = { ...a, purchase_date: a.purchase_date?.slice(0,10) }; isEditing.value = true; }
function resetForm() { form.value = { ...emptyForm }; isEditing.value = false; }

async function submit() {
  error.value = ''; success.value = '';
  try {
    if (isEditing.value) {
      await api.put(`/assets/${form.value.asset_id}`, form.value);
      success.value = 'แก้ไขทรัพย์สินสำเร็จ';
    } else {
      await api.post('/assets', form.value);
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
        <input v-model="form.purchase_date" type="date" />
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
        <div style="grid-column:1/3; display:flex; gap:10px;">
          <button class="btn" type="submit">{{ isEditing ? 'บันทึกการแก้ไข' : 'เพิ่มทรัพย์สิน' }}</button>
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
        <thead><tr><th>รหัส</th><th>ชื่อ</th><th>ประเภท</th><th>สถานะ</th><th></th></tr></thead>
        <tbody>
          <tr v-for="a in assets" :key="a.asset_id">
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
