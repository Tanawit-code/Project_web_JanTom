<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../services/api';

const assets = ref([]);
const categories = ref([]);
const activeCat = ref('');
const search = ref('');
const loading = ref(true);
const selected = ref([]); // เก็บทั้ง object เพื่อให้ชื่อไม่หายตอนเปลี่ยนหมวด
const days = ref(3);
const purpose = ref('');
const error = ref('');
const success = ref('');
const submitting = ref(false);

const DURATIONS = [
  { days: 1, label: '1 วัน' },
  { days: 3, label: '3 วัน' },
  { days: 7, label: '1 สัปดาห์' },
  { days: 14, label: '2 สัปดาห์' },
  { days: 30, label: '1 เดือน' },
];

const fmt = (d) => d.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
const borrowDateText = computed(() => fmt(new Date()));
const dueDateText = computed(() => fmt(new Date(Date.now() + days.value * 86400000)));

async function load() {
  loading.value = true;
  try {
    const { data } = await api.get('/assets', {
      params: { q: search.value || undefined, category: activeCat.value || undefined, status: 'available' },
    });
    assets.value = data;
  } finally { loading.value = false; }
}

function pickCat(id) { activeCat.value = id; load(); }

const isSelected = (id) => selected.value.some((a) => a.asset_id === id);
function toggle(a) {
  const i = selected.value.findIndex((x) => x.asset_id === a.asset_id);
  if (i === -1) selected.value.push({ asset_id: a.asset_id, asset_name: a.asset_name }); else selected.value.splice(i, 1);
}

async function submitRequest() {
  error.value = ''; success.value = '';
  if (selected.value.length === 0) { error.value = 'กรุณาเลือกทรัพย์สินอย่างน้อย 1 รายการ'; return; }
  submitting.value = true;
  try {
    const { data } = await api.post('/borrow-requests', {
      days: days.value, purpose: purpose.value, asset_ids: selected.value.map((a) => a.asset_id),
    });
    success.value = `${data.message} (เลขที่คำขอ ${data.borrow_code})`;
    selected.value = []; purpose.value = '';
    load();
  } catch (e) {
    error.value = e.response?.data?.message || 'ส่งคำขอไม่สำเร็จ';
  } finally { submitting.value = false; }
}

onMounted(async () => {
  try { categories.value = (await api.get('/categories')).data; } catch { /* ไม่มีหมวดก็ยังใช้งานได้ */ }
  load();
});
</script>

<template>
  <section>
    <div class="head">
      <h2>ทรัพย์สินที่พร้อมให้ยืม</h2>
      <p class="sub">เลือกทรัพย์สินที่ต้องการ แล้วระบุระยะเวลายืมทางด้านขวา</p>
    </div>

    <div class="searchbar">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
      <input v-model="search" placeholder="ค้นหาชื่อหรือรหัสทรัพย์สิน..." @keyup.enter="load" />
      <button class="btn" @click="load">ค้นหา</button>
    </div>

    <div class="cats">
      <button class="cat" :class="{ on: activeCat === '' }" @click="pickCat('')">ทั้งหมด</button>
      <button v-for="c in categories" :key="c.cat_id" class="cat" :class="{ on: activeCat === c.cat_id }" @click="pickCat(c.cat_id)">
        {{ c.cat_name }}
      </button>
    </div>

    <div class="layout">
      <!-- รายการทรัพย์สิน -->
      <div>
        <p v-if="loading" class="empty">กำลังโหลด...</p>
        <p v-else-if="assets.length === 0" class="empty">ไม่พบทรัพย์สินที่ว่างในหมวดนี้</p>
        <div v-else class="grid">
          <div v-for="a in assets" :key="a.asset_id" class="item" :class="{ on: isSelected(a.asset_id) }" @click="toggle(a)">
            <div class="pic">
              <img v-if="a.image_url" :src="a.image_url" :alt="a.asset_name" />
              <span v-else class="nopic">ไม่มีรูปภาพ</span>
              <span class="catchip">{{ a.cat_name || 'ทั่วไป' }}</span>
              <span class="tick">{{ isSelected(a.asset_id) ? '✓' : '' }}</span>
            </div>
            <div class="info">
              <h3>{{ a.asset_name }}</h3>
              <p class="code">{{ a.asset_code }}</p>
              <p class="loc">ที่เก็บ: {{ a.location || '-' }}</p>
              <span class="badge available">ว่าง</span>
            </div>
          </div>
        </div>
      </div>

      <!-- แผงส่งคำขอ -->
      <aside class="panel">
        <h3>ส่งคำขอยืม</h3>
        <p v-if="error" class="error-text">{{ error }}</p>
        <p v-if="success" class="success-box">{{ success }}</p>

        <div class="picked">
          <p v-if="selected.length === 0" class="muted">ยังไม่ได้เลือกรายการ</p>
          <span v-for="a in selected" :key="a.asset_id" class="pick">
            {{ a.asset_name }}
            <button type="button" aria-label="เอาออก" @click="toggle(a)">×</button>
          </span>
        </div>

        <p class="lbl">ระยะเวลาที่ยืม</p>
        <div class="durations">
          <button v-for="d in DURATIONS" :key="d.days" type="button" class="dur" :class="{ on: days === d.days }" @click="days = d.days">
            {{ d.label }}
          </button>
        </div>

        <div class="dates">
          <div><span class="muted">วันที่ยืม</span><b>{{ borrowDateText }}</b><small>ตามเวลาที่ส่งคำขอ</small></div>
          <div class="arrow">→</div>
          <div><span class="muted">กำหนดคืน</span><b>{{ dueDateText }}</b><small>ภายในสิ้นวัน</small></div>
        </div>

        <p class="lbl">วัตถุประสงค์การยืม</p>
        <textarea v-model="purpose" rows="3" placeholder="เช่น ใช้ประชุมลูกค้านอกสถานที่"></textarea>

        <button class="btn submit" :disabled="submitting || selected.length === 0" @click="submitRequest">
          {{ submitting ? 'กำลังส่ง...' : `ส่งคำขอยืม (${selected.length} รายการ)` }}
        </button>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.head h2 { margin: 0 0 4px; }
.sub { margin: 0 0 16px; color: var(--muted); font-size: 14px; }

.searchbar { position: relative; display: flex; gap: 10px; margin-bottom: 14px; }
.searchbar svg { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #9aa3b2; }
.searchbar input { margin: 0; padding: 11px 14px 11px 42px; border-radius: 10px; border: 1.5px solid #d7dae0; background: #fff; }
.searchbar input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(43, 87, 151, .15); }
.searchbar .btn { border-radius: 10px; padding: 0 22px; }

.cats { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; margin-bottom: 18px; }
.cat { flex-shrink: 0; border: 1.5px solid #d7dae0; background: #fff; color: var(--text); padding: 7px 16px; border-radius: 999px; font-size: 14px; cursor: pointer; transition: all .15s; }
.cat:hover { border-color: var(--primary); color: var(--primary); }
.cat.on { background: var(--primary); border-color: var(--primary); color: #fff; }

.layout { display: grid; grid-template-columns: 1fr 340px; gap: 22px; align-items: start; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 16px; }
.empty { color: var(--muted); padding: 30px 0; text-align: center; }

.item { background: #fff; border-radius: 14px; overflow: hidden; cursor: pointer; border: 2px solid transparent; box-shadow: 0 2px 10px rgba(0, 0, 0, .06); transition: transform .15s, box-shadow .15s, border-color .15s; }
.item:hover { transform: translateY(-3px); box-shadow: 0 8px 22px rgba(30, 61, 107, .15); }
.item.on { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(43, 87, 151, .15); }
.pic { position: relative; height: 150px; background: #f1f3f7; display: flex; align-items: center; justify-content: center; }
.pic img { width: 100%; height: 100%; object-fit: cover; display: block; }
.nopic { color: var(--muted); font-size: 13px; }
.catchip { position: absolute; left: 10px; top: 10px; background: rgba(255, 255, 255, .92); color: var(--primary-dark); font-size: 11px; padding: 3px 10px; border-radius: 999px; font-weight: 600; }
.tick { position: absolute; right: 10px; top: 10px; width: 26px; height: 26px; border-radius: 50%; background: rgba(255, 255, 255, .92); border: 2px solid #cfd6e2; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px; font-weight: 700; }
.item.on .tick { background: var(--primary); border-color: var(--primary); }
.info { padding: 12px 14px 14px; }
.info h3 { margin: 0 0 4px; font-size: 16px; }
.info p { margin: 0 0 3px; font-size: 13px; color: var(--muted); }
.info .badge { margin-top: 6px; }

.panel { position: sticky; top: 16px; background: #fff; border-radius: 16px; padding: 20px; box-shadow: 0 4px 20px rgba(30, 61, 107, .12); }
.panel h3 { margin: 0 0 12px; }
.muted { color: var(--muted); font-size: 13px; }
.lbl { font-size: 13px; font-weight: 600; margin: 14px 0 8px; }
.picked { display: flex; flex-wrap: wrap; gap: 6px; min-height: 28px; }
.picked .muted { margin: 4px 0; }
.pick { display: inline-flex; align-items: center; gap: 6px; background: #e6eefb; color: var(--primary-dark); font-size: 13px; padding: 4px 6px 4px 12px; border-radius: 999px; }
.pick button { border: none; background: rgba(43, 87, 151, .15); color: var(--primary-dark); width: 20px; height: 20px; border-radius: 50%; cursor: pointer; line-height: 1; font-size: 14px; }
.pick button:hover { background: var(--primary); color: #fff; }

.durations { display: flex; flex-wrap: wrap; gap: 8px; }
.dur { border: 1.5px solid #d7dae0; background: #fff; padding: 7px 14px; border-radius: 10px; font-size: 14px; cursor: pointer; transition: all .15s; }
.dur:hover { border-color: var(--primary); }
.dur.on { background: var(--primary); border-color: var(--primary); color: #fff; }

.dates { display: flex; align-items: center; gap: 10px; margin-top: 12px; padding: 12px; border-radius: 12px; background: #f6f8fc; }
.dates > div { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.dates b { font-size: 14px; }
.dates small { font-size: 11px; color: var(--muted); }
.arrow { flex: 0 0 auto !important; color: var(--primary); font-weight: 700; }

textarea { margin: 0; border-radius: 10px; border: 1.5px solid #d7dae0; resize: vertical; }
textarea:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(43, 87, 151, .15); }
.submit { width: 100%; margin-top: 16px; padding: 12px; font-size: 15px; border-radius: 10px; }
.submit:disabled { opacity: .55; cursor: not-allowed; }
.success-box { background: #e3f4ea; color: var(--ok); padding: 10px 12px; border-radius: 10px; font-size: 14px; margin: 0 0 12px; }

@media (max-width: 860px) {
  .layout { grid-template-columns: 1fr; }
  .panel { position: static; }
}
</style>
