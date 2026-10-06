<script setup>
import { ref, onMounted } from 'vue';
import api from '../../services/api';

const products = ref([]);
const search = ref('');
const error = ref('');
const success = ref('');

const emptyForm = { id: null, name: '', description: '', price: '', stock: '', category: '', image_url: '' };
const form = ref({ ...emptyForm });
const isEditing = ref(false);

async function loadProducts() {
  const { data } = await api.get('/products', { params: { q: search.value || undefined } });
  products.value = data;
}

function startEdit(p) {
  form.value = { ...p };
  isEditing.value = true;
}

function resetForm() {
  form.value = { ...emptyForm };
  isEditing.value = false;
}

async function submit() {
  error.value = '';
  success.value = '';
  try {
    if (isEditing.value) {
      await api.put(`/products/${form.value.id}`, form.value);
      success.value = 'แก้ไขสินค้าสำเร็จ';
    } else {
      await api.post('/products', form.value);
      success.value = 'เพิ่มสินค้าสำเร็จ';
    }
    resetForm();
    loadProducts();
  } catch (e) {
    error.value = e.response?.data?.message || 'บันทึกไม่สำเร็จ';
  }
}

async function remove(p) {
  if (!confirm(`ลบสินค้า "${p.name}" ?`)) return;
  try {
    await api.delete(`/products/${p.id}`);
    loadProducts();
  } catch (e) {
    error.value = e.response?.data?.message || 'ลบไม่สำเร็จ';
  }
}

onMounted(loadProducts);
</script>

<template>
  <section>
    <h2>จัดการสินค้า (ผู้ดูแลระบบ)</h2>

    <div class="card" style="margin-bottom:20px;">
      <h3>{{ isEditing ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่' }}</h3>
      <p v-if="error" class="error-text">{{ error }}</p>
      <p v-if="success" class="success-text">{{ success }}</p>
      <form @submit.prevent="submit" style="display:grid; grid-template-columns:1fr 1fr; gap:0 16px;">
        <input v-model="form.name" placeholder="ชื่อสินค้า" required />
        <input v-model="form.category" placeholder="หมวดหมู่" />
        <input v-model="form.price" type="number" step="0.01" placeholder="ราคา" required />
        <input v-model="form.stock" type="number" placeholder="จำนวนคงเหลือ" required />
        <input v-model="form.image_url" placeholder="URL รูปภาพ" style="grid-column:1/3;" />
        <textarea v-model="form.description" placeholder="รายละเอียดสินค้า" style="grid-column:1/3;"></textarea>
        <div style="grid-column:1/3; display:flex; gap:10px;">
          <button class="btn" type="submit">{{ isEditing ? 'บันทึกการแก้ไข' : 'เพิ่มสินค้า' }}</button>
          <button v-if="isEditing" class="btn secondary" type="button" @click="resetForm">ยกเลิก</button>
        </div>
      </form>
    </div>

    <div style="display:flex; gap:10px; margin-bottom:14px;">
      <input v-model="search" placeholder="ค้นหาสินค้า..." @keyup.enter="loadProducts" style="margin-bottom:0;" />
      <button class="btn secondary" @click="loadProducts">ค้นหา</button>
    </div>

    <div class="card">
      <table>
        <thead>
          <tr><th>ชื่อสินค้า</th><th>หมวดหมู่</th><th>ราคา</th><th>คงเหลือ</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="p in products" :key="p.id">
            <td>{{ p.name }}</td>
            <td>{{ p.category }}</td>
            <td>{{ Number(p.price).toLocaleString() }}</td>
            <td>{{ p.stock }}</td>
            <td style="display:flex; gap:8px;">
              <button class="btn secondary" @click="startEdit(p)">แก้ไข</button>
              <button class="btn danger" @click="remove(p)">ลบ</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="products.length === 0" style="color:var(--muted);">ไม่พบสินค้า</p>
    </div>
  </section>
</template>
