<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../services/api';

const allAssets = ref([]); // ทรัพย์สินที่ว่างทั้งหมด กรองฝั่งหน้าเว็บให้ตอบสนองทันที
const sortBy = ref('name');
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
    const { data } = await api.get('/assets', { params: { status: 'available' } });
    allAssets.value = data;
  } finally { loading.value = false; }
}

const GENERAL = 'ทั่วไป';
const catOf = (a) => a.cat_name || GENERAL;

// ผลหลังกรองด้วยคำค้นหา (ยังไม่กรองหมวด) ใช้นับจำนวนในแต่ละหมวด
const searched = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return allAssets.value;
  return allAssets.value.filter((a) =>
    [a.asset_name, a.asset_code, a.brand, a.model].some((v) => (v || '').toLowerCase().includes(q)));
});

const catCounts = computed(() => {
  const m = {};
  for (const a of searched.value) m[a.cat_id ?? 0] = (m[a.cat_id ?? 0] || 0) + 1;
  return m;
});

const SORTERS = {
  name: (x, y) => x.asset_name.localeCompare(y.asset_name, 'th'),
  code: (x, y) => x.asset_code.localeCompare(y.asset_code),
  newest: (x, y) => y.asset_id - x.asset_id,
};

const visible = computed(() => {
  const list = activeCat.value === '' ? searched.value : searched.value.filter((a) => a.cat_id === activeCat.value);
  return [...list].sort(SORTERS[sortBy.value]);
});

// ดูทั้งหมดและไม่ได้ค้นหา -> แบ่งเป็นกลุ่มตามหมวด อ่านง่ายกว่ากองรวมกัน
const grouped = computed(() => activeCat.value === '' && !search.value.trim());
const groups = computed(() => {
  const m = new Map();
  for (const a of visible.value) {
    const k = catOf(a);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(a);
  }
  const order = (name) => { const i = categories.value.findIndex((c) => c.cat_name === name); return i === -1 ? 999 : i; };
  return [...m.entries()].sort((x, y) => order(x[0]) - order(y[0])).map(([name, items]) => ({ name, items }));
});

function pickCat(id) { activeCat.value = id; }

const isSelected = (id) => selected.value.some((a) => a.asset_id === id);
function toggle(a) {
  const i = selected.value.findIndex((x) => x.asset_id === a.asset_id);
  if (i === -1) selected.value.push({ asset_id: a.asset_id, asset_name: a.asset_name, asset_code: a.asset_code }); else selected.value.splice(i, 1);
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
  <section class="page">
    <div class="head">
      <h2>ทรัพย์สินที่พร้อมให้ยืม</h2>
      <p class="sub">เลือกทรัพย์สินที่ต้องการ แล้วระบุระยะเวลายืมทางด้านขวา</p>
    </div>

    <div class="toolbar">
      <div class="searchbar">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
        <input v-model="search" placeholder="ค้นหาชื่อ รหัส ยี่ห้อ หรือรุ่น..." />
        <button v-if="search" class="clear" type="button" aria-label="ล้างคำค้นหา" @click="search = ''">×</button>
      </div>
      <select v-model="sortBy" class="sort" aria-label="เรียงลำดับ">
        <option value="name">เรียงตามชื่อ ก-ฮ</option>
        <option value="code">เรียงตามรหัส</option>
        <option value="newest">เพิ่มล่าสุด</option>
      </select>
    </div>

    <div class="cats">
      <button class="cat" :class="{ on: activeCat === '' }" @click="pickCat('')">
        ทั้งหมด <span class="n">{{ searched.length }}</span>
      </button>
      <button v-for="c in categories" :key="c.cat_id" class="cat" :class="{ on: activeCat === c.cat_id, zero: !catCounts[c.cat_id] }"
              :disabled="!catCounts[c.cat_id] && activeCat !== c.cat_id" @click="pickCat(c.cat_id)">
        {{ c.cat_name }} <span class="n">{{ catCounts[c.cat_id] || 0 }}</span>
      </button>
    </div>

    <div class="layout">
      <!-- รายการทรัพย์สิน -->
      <div>
        <p v-if="loading" class="empty">กำลังโหลด...</p>
        <p v-else-if="visible.length === 0" class="empty">ไม่พบทรัพย์สินที่ว่างตามเงื่อนไขที่เลือก</p>
        <template v-else>
          <p class="count">แสดง {{ visible.length }} รายการ</p>
          <div v-for="g in (grouped ? groups : [{ name: null, items: visible }])" :key="g.name ?? 'all'" class="group">
            <h3 v-if="g.name" class="gtitle">{{ g.name }} <span>{{ g.items.length }} รายการ</span></h3>
            <div class="grid">
              <article v-for="a in g.items" :key="a.asset_id" class="item" :class="{ on: isSelected(a.asset_id) }"
                       tabindex="0" @click="toggle(a)" @keydown.enter.prevent="toggle(a)" @keydown.space.prevent="toggle(a)">
                <div class="pic">
                  <img v-if="a.image_url" :src="a.image_url" :alt="a.asset_name" loading="lazy" />
                  <span v-else class="nopic">ไม่มีรูปภาพ</span>
                  <span v-if="isSelected(a.asset_id)" class="tick">✓</span>
                </div>
                <div class="info">
                  <h4>{{ a.asset_name }}</h4>
                  <p v-if="a.brand || a.model" class="bm">{{ [a.brand, a.model].filter(Boolean).join(' · ') }}</p>
                  <p class="meta"><span>{{ a.asset_code }}</span><span>📍 {{ a.location || '-' }}</span></p>
                  <span class="pickbtn">{{ isSelected(a.asset_id) ? '✓ เลือกแล้ว' : '+ เลือกยืม' }}</span>
                </div>
              </article>
            </div>
          </div>
        </template>
      </div>

      <!-- แผงส่งคำขอ -->
      <aside class="panel">
        <h3>ส่งคำขอยืม</h3>
        <p v-if="error" class="error-text">{{ error }}</p>
        <p v-if="success" class="success-box">{{ success }}</p>

        <p class="lbl">รายการที่เลือก ({{ selected.length }})</p>
        <div class="picked">
          <p v-if="selected.length === 0" class="muted">ยังไม่ได้เลือกรายการ</p>
          <div v-for="a in selected" :key="a.asset_id" class="pick">
            <span class="pname">{{ a.asset_name }}<small>{{ a.asset_code }}</small></span>
            <button type="button" aria-label="เอาออก" @click="toggle(a)">×</button>
          </div>
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

.toolbar { display: flex; gap: 10px; margin-bottom: 12px; }
.searchbar { position: relative; flex: 1; }
.searchbar svg { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #9aa3b2; }
.searchbar input { margin: 0; width: 100%; box-sizing: border-box; padding: 11px 38px 11px 42px; border-radius: 10px; border: 1.5px solid #d7dae0; background: #fff; }
.searchbar input:focus, .sort:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(43, 87, 151, .15); }
.clear { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); width: 26px; height: 26px; border: 0; border-radius: 50%; background: #eef1f6; color: #555; cursor: pointer; font-size: 16px; line-height: 1; }
.sort { margin: 0; flex: 0 0 190px; width: 190px !important; padding: 0 12px; border-radius: 10px; border: 1.5px solid #d7dae0; background: #fff; font: inherit; font-size: 14px; cursor: pointer; }

/* หมวดหมู่: ขึ้นบรรทัดใหม่แทนการเลื่อนแนวนอน เห็นครบทุกหมวดทันที */
.cats { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
.cat { border: 1.5px solid #d7dae0; background: #fff; color: var(--text); padding: 6px 8px 6px 14px; border-radius: 999px; font-size: 14px; cursor: pointer; transition: all .15s; display: inline-flex; align-items: center; gap: 8px; }
.cat .n { background: #eef1f6; color: var(--muted); font-size: 12px; min-width: 22px; text-align: center; padding: 1px 7px; border-radius: 999px; font-weight: 600; }
.cat:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); }
.cat.on { background: var(--primary); border-color: var(--primary); color: #fff; }
.cat.on .n { background: rgba(255, 255, 255, .25); color: #fff; }
.cat:disabled { opacity: .45; cursor: not-allowed; }

.layout { display: grid; grid-template-columns: 1fr 340px; gap: 22px; align-items: start; }
.empty { color: var(--muted); padding: 30px 0; text-align: center; }
.count { margin: 0 0 10px; font-size: 13px; color: var(--muted); }
.group + .group { margin-top: 26px; }
.gtitle { margin: 0 0 12px; font-size: 17px; display: flex; align-items: baseline; gap: 10px; padding-bottom: 8px; border-bottom: 2px solid #e3e8f1; }
.gtitle span { font-size: 13px; font-weight: 400; color: var(--muted); }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }

.item { background: #fff; border-radius: 14px; overflow: hidden; cursor: pointer; border: 2px solid transparent; box-shadow: 0 2px 10px rgba(0, 0, 0, .06); transition: transform .15s, box-shadow .15s, border-color .15s; display: flex; flex-direction: column; }
.item:hover { transform: translateY(-3px); box-shadow: 0 8px 22px rgba(30, 61, 107, .15); }
.item:focus-visible { outline: none; border-color: var(--primary); }
.item.on { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(43, 87, 151, .15); }
/* รูปทุกใบสัดส่วนเดียวกัน แสดงเต็มภาพไม่โดนตัด */
.pic { position: relative; aspect-ratio: 4 / 3; background: #fff; border-bottom: 1px solid #eef1f6; display: flex; align-items: center; justify-content: center; }
.pic img { width: 100%; height: 100%; object-fit: contain; display: block; padding: 8px; box-sizing: border-box; }
.nopic { color: var(--muted); font-size: 13px; }
.tick { position: absolute; right: 10px; top: 10px; width: 28px; height: 28px; border-radius: 50%; background: var(--primary); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 15px; font-weight: 700; }
.info { padding: 12px 14px 14px; display: flex; flex-direction: column; flex: 1; }
.info h4 { margin: 0 0 4px; font-size: 15px; line-height: 1.35; }
.info .bm { margin: 0 0 6px; font-size: 13px; color: var(--text); opacity: .75; }
.info .meta { margin: 0 0 12px; display: flex; flex-direction: column; gap: 2px; font-size: 12.5px; color: var(--muted); }
.pickbtn { margin-top: auto; text-align: center; padding: 8px; border-radius: 9px; font-size: 14px; font-weight: 600; background: #eef3fb; color: var(--primary); transition: background .15s, color .15s; }
.item:hover .pickbtn { background: #dfe9f8; }
.item.on .pickbtn { background: var(--primary); color: #fff; }

.panel { position: sticky; top: 16px; max-height: calc(100vh - 32px); overflow-y: auto; background: #fff; border-radius: 16px; padding: 20px; box-shadow: 0 4px 20px rgba(30, 61, 107, .12); }
.panel h3 { margin: 0 0 12px; }
.muted { color: var(--muted); font-size: 13px; }
.lbl { font-size: 13px; font-weight: 600; margin: 16px 0 8px; }
.picked { display: flex; flex-direction: column; gap: 6px; max-height: 180px; overflow-y: auto; }
.picked .muted { margin: 4px 0; }
.pick { display: flex; align-items: center; justify-content: space-between; gap: 8px; background: #eef3fb; padding: 7px 8px 7px 12px; border-radius: 10px; }
.pname { font-size: 14px; color: var(--primary-dark); display: flex; flex-direction: column; line-height: 1.3; }
.pname small { font-size: 11.5px; color: var(--muted); }
.pick button { flex: 0 0 auto; border: none; background: rgba(43, 87, 151, .15); color: var(--primary-dark); width: 22px; height: 22px; border-radius: 50%; cursor: pointer; line-height: 1; font-size: 15px; }
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

textarea { margin: 0; width: 100%; box-sizing: border-box; border-radius: 10px; border: 1.5px solid #d7dae0; resize: vertical; font: inherit; }
textarea:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(43, 87, 151, .15); }
.submit { width: 100%; margin-top: 16px; padding: 12px; font-size: 15px; border-radius: 10px; }
.submit:disabled { opacity: .55; cursor: not-allowed; }
.success-box { background: #e3f4ea; color: var(--ok); padding: 10px 12px; border-radius: 10px; font-size: 14px; margin: 0 0 12px; }

@media (max-width: 860px) {
  .layout { grid-template-columns: 1fr; }
  .panel { position: static; max-height: none; }
  .toolbar { flex-direction: column; }
  .sort { flex: none; width: 100% !important; padding: 10px 12px; }
}
</style>