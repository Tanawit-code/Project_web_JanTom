<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';

const products = ref([]);
const search = ref('');
const selected = ref(null); // product chosen for "purchase" (checkout itself is project2)

async function loadProducts() {
  const { data } = await api.get('/products', { params: { q: search.value || undefined } });
  products.value = data;
}

function selectForOrder(p) {
  selected.value = p;
}

onMounted(loadProducts);
</script>

<template>
  <section>
    <div style="display:flex; gap:10px; margin-bottom:20px;">
      <input v-model="search" placeholder="ค้นหาสินค้า..." @keyup.enter="loadProducts" style="margin-bottom:0;" />
      <button class="btn" @click="loadProducts">ค้นหา</button>
    </div>

    <div v-if="selected" class="card" style="margin-bottom:20px; background:#eef6ef;">
      เลือกสินค้าเพื่อสั่งซื้อ: <strong>{{ selected.name }}</strong> ({{ Number(selected.price).toLocaleString() }} บาท)
      — ขั้นตอนการสั่งซื้อจะดำเนินการต่อใน project2
    </div>

    <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap:20px;">
      <div v-for="p in products" :key="p.id" class="card">
        <img :src="p.image_url" :alt="p.name" style="width:100%; border-radius:8px; margin-bottom:10px;" />
        <h3 style="margin:0 0 4px;">{{ p.name }}</h3>
        <p style="color:var(--muted); font-size:14px; min-height:36px;">{{ p.description }}</p>
        <p style="font-weight:bold; color:var(--primary-dark);">{{ Number(p.price).toLocaleString() }} บาท</p>
        <p style="font-size:13px; color:var(--muted);">คงเหลือ: {{ p.stock }} ชิ้น</p>
        <button class="btn" style="width:100%;" :disabled="p.stock === 0" @click="selectForOrder(p)">
          {{ p.stock === 0 ? 'สินค้าหมด' : 'เลือกสั่งซื้อ' }}
        </button>
      </div>
    </div>
    <p v-if="products.length === 0" style="color:var(--muted);">ไม่พบสินค้า</p>
  </section>
</template>
