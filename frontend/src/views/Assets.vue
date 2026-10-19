<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import api from '../services/api';

const allAssets = ref([]); // แสดงทั้งทรัพย์สินพร้อมให้ยืมและทรัพย์สินที่กำลังซ่อม
const sortBy = ref('name');
const categories = ref([]);
const activeCat = ref('');
const search = ref('');
const loading = ref(true);
const selected = ref([]); // เก็บทั้ง object เพื่อให้ชื่อไม่หายตอนเปลี่ยนหมวด
const days = ref(3);
const mode = ref('borrow');
const pickupDate = ref('');
const purpose = ref('');
const error = ref('');
const success = ref('');
const submitting = ref(false);
const historyAsset = ref(null);
const historyRows = ref([]);
const historyLoading = ref(false);
const historyError = ref('');
let resettingAfterSubmit = false;

watch([mode, pickupDate, days, purpose, selected], () => {
  if (resettingAfterSubmit) {
    resettingAfterSubmit = false;
    return;
  }
  success.value = '';
}, { deep: true });

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
const reservationDueText = computed(() => pickupDate.value
  ? fmt(new Date(Date.parse(`${pickupDate.value}T00:00:00Z`) + days.value * 86400000))
  : '-');
const todayIso = () => new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
const maxPickupDate = computed(() => new Date(Date.parse(`${todayIso()}T00:00:00Z`) + 7 * 86400000).toISOString().slice(0, 10));
const ASSET_STATUS = { available: 'ว่าง', reserved: 'ถูกจอง', borrowed: 'ถูกยืม', repair: 'ส่งซ่อม', retired: 'จำหน่ายออก' };

async function load() {
  loading.value = true;
  try {
    const { data } = await api.get('/assets');
    // แสดงเฉพาะทรัพย์สินที่พร้อมให้ยืมและที่กำลังซ่อม ส่วนสถานะอื่นไม่แสดงในหน้านี้
    allAssets.value = data.filter((a) => ['available', 'repair', 'reserved'].includes(a.status));
    // ถ้าทรัพย์สินที่ถูกเลือกเปลี่ยนสถานะเป็นซ่อม ให้เอาออกจากรายการที่เลือกทันที
    selected.value = selected.value.filter((picked) => allAssets.value.some((a) => a.asset_id === picked.asset_id && a.status === 'available'));
  } finally { loading.value = false; }
}

const repairAssets = computed(() => searched.value.filter((a) => a.status === 'repair'));
const reservedAssets = computed(() => searched.value.filter((a) => a.status === 'reserved'));
const borrowableAssets = computed(() => searched.value.filter((a) => a.status === 'available'));

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
  if (a.status !== 'available') return;
  const i = selected.value.findIndex((x) => x.asset_id === a.asset_id);
  if (i === -1) selected.value.push({ asset_id: a.asset_id, asset_name: a.asset_name, asset_code: a.asset_code }); else selected.value.splice(i, 1);
}

async function showHistory(asset) {
  historyAsset.value = asset;
  historyRows.value = [];
  historyError.value = '';
  historyLoading.value = true;
  try { historyRows.value = (await api.get(`/assets/${asset.asset_id}/history`)).data; }
  catch (e) { historyError.value = e.response?.data?.message || 'โหลดประวัติไม่สำเร็จ'; }
  finally { historyLoading.value = false; }
}

const fmtBorrowedAt = (value) => value ? new Date(value).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : '-';
const HISTORY_STATUS = { pending: 'รออนุมัติ', reserved: 'จองแล้ว', approved: 'กำลังยืม', rejected: 'ไม่อนุมัติ', returned: 'คืนแล้ว', cancelled: 'ยกเลิก' };

async function submitRequest() {
  error.value = ''; success.value = '';
  if (selected.value.length === 0) { error.value = 'กรุณาเลือกทรัพย์สินอย่างน้อย 1 รายการ'; return; }
  if (mode.value === 'reserve') {
    const minDate = todayIso();
    const maxDate = new Date(Date.parse(`${minDate}T00:00:00Z`) + 7 * 86400000).toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(pickupDate.value) || pickupDate.value < minDate || pickupDate.value > maxDate) {
      error.value = 'วันที่รับต้องเป็นวันนี้หรือภายใน 7 วันข้างหน้า';
      return;
    }
  }
  submitting.value = true;
  try {
    const { data } = await api.post('/borrow-requests', {
      mode: mode.value, pickup_date: mode.value === 'reserve' ? pickupDate.value : undefined,
      days: days.value, purpose: purpose.value, asset_ids: selected.value.map((a) => a.asset_id),
    });
    const sentLabel = mode.value === 'reserve' ? 'ส่งคำขอจองแล้ว' : 'ส่งคำขอยืมแล้ว';
    success.value = `${sentLabel} · ${data.message} (เลขที่คำขอ ${data.borrow_code})`;
    resettingAfterSubmit = true;
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
      <div v-if="repairAssets.length" class="repair-notice" role="status">
        <strong>🛠️ มีทรัพย์สินกำลังซ่อมแซม {{ repairAssets.length }} รายการ</strong>
        <span>ทรัพย์สินเหล่านี้แสดงไว้เพื่อตรวจสอบ แต่ไม่สามารถเลือกยืมได้จนกว่าจะซ่อมเสร็จ</span>
        <div class="repair-list"><span v-for="a in repairAssets" :key="a.asset_id">{{ a.asset_name }} ({{ a.asset_code }})</span></div>
      </div>
      <div v-if="reservedAssets.length" class="reserved-notice" role="status">
        <strong>📅 มีทรัพย์สินถูกจอง {{ reservedAssets.length }} รายการ</strong>
        <span>แสดงไว้เพื่อตรวจสอบ แต่ไม่สามารถเลือกยืมได้จนกว่าจะยกเลิกหรือสิ้นสุดการจอง</span>
        <div class="reserved-list"><span v-for="a in reservedAssets" :key="a.asset_id">{{ a.asset_name }} ({{ a.asset_code }})</span></div>
      </div>
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
              <article v-for="a in g.items" :key="a.asset_id" class="item" :class="{ on: isSelected(a.asset_id), repairing: a.status === 'repair', reserved: a.status === 'reserved' }"
                       :tabindex="a.status === 'available' ? 0 : -1" :aria-disabled="a.status !== 'available'" @click="toggle(a)" @keydown.enter.prevent="toggle(a)" @keydown.space.prevent="toggle(a)">
                <div class="pic">
                  <img v-if="a.image_url" :src="a.image_url" :alt="a.asset_name" loading="lazy" />
                  <span v-else class="nopic">ไม่มีรูปภาพ</span>
                  <span v-if="isSelected(a.asset_id)" class="tick">✓</span>
                  <span v-if="a.status === 'repair'" class="repair-overlay">🛠️ กำลังซ่อมแซม</span>
                  <span v-else-if="a.status === 'reserved'" class="reserved-overlay">📅 ถูกจอง — เลือกไม่ได้</span>
                </div>
                <div class="info">
                  <h4>{{ a.asset_name }}</h4>
                  <p v-if="a.brand || a.model" class="bm">{{ [a.brand, a.model].filter(Boolean).join(' · ') }}</p>
                  <p class="meta"><span>{{ a.asset_code }}</span><span>📍 {{ a.location || '-' }}</span></p>
                  <span class="pickbtn" :class="{ disabled: a.status !== 'available' }">{{ a.status === 'repair' ? '🛠️ กำลังซ่อม — เลือกไม่ได้' : a.status === 'reserved' ? '📅 ถูกจอง — เลือกไม่ได้' : (isSelected(a.asset_id) ? '✓ เลือกแล้ว' : '+ เลือกยืม') }}</span>
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

        <p class="lbl">วิธีรับทรัพย์สิน</p>
        <div class="durations">
          <button type="button" class="dur" :class="{ on: mode === 'borrow' }" @click="mode = 'borrow'">ยืมทันที</button>
          <button type="button" class="dur" :class="{ on: mode === 'reserve' }" @click="mode = 'reserve'">จองล่วงหน้า</button>
        </div>
        <label v-if="mode === 'reserve'" class="lbl reserve-date">วันที่ต้องการมารับ
          <input v-model="pickupDate" type="date" :min="todayIso()" :max="maxPickupDate" required />
          <small>จองล่วงหน้าได้ไม่เกิน 7 วัน</small>
        </label>

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

        <div v-if="mode === 'borrow'" class="dates">
          <div><span class="muted">วันที่ยืม</span><b>{{ borrowDateText }}</b><small>ตามเวลาที่ส่งคำขอ</small></div>
          <div class="arrow">→</div>
          <div><span class="muted">กำหนดคืน</span><b>{{ dueDateText }}</b><small>ภายในสิ้นวัน</small></div>
        </div>
        <div v-if="mode === 'reserve' && pickupDate" class="dates">
          <div><span class="muted">วันที่นัดรับ</span><b>{{ fmt(new Date(`${pickupDate}T00:00:00`)) }}</b></div>
          <div class="arrow">→</div>
          <div><span class="muted">กำหนดคืน</span><b>{{ reservationDueText }}</b></div>
        </div>

        <p class="lbl">วัตถุประสงค์การยืม</p>
        <textarea v-model="purpose" rows="3" placeholder="เช่น ใช้ประชุมลูกค้านอกสถานที่"></textarea>

        <button class="btn submit" :class="{ sent: !!success }" :disabled="submitting || selected.length === 0 || (mode === 'reserve' && !pickupDate)" @click="submitRequest">
          {{ submitting ? 'กำลังส่ง...' : success ? (mode === 'reserve' ? 'ส่งคำขอจองแล้ว ✓' : 'ส่งคำขอยืมแล้ว ✓') : mode === 'reserve' ? `จองทรัพย์สิน (${selected.length} รายการ)` : `ส่งคำขอยืม (${selected.length} รายการ)` }}
        </button>
      </aside>
    </div>
    <div v-if="historyAsset" class="history-overlay" role="presentation" @click.self="historyAsset = null">
      <section class="history-dialog" role="dialog" aria-modal="true" :aria-label="`ประวัติ ${historyAsset.asset_name}`">
        <header class="history-head">
          <div><h3>ประวัติการยืม</h3><p>{{ historyAsset.asset_name }} · {{ historyAsset.asset_code }}</p></div>
          <button type="button" class="history-close" aria-label="ปิด" @click="historyAsset = null">×</button>
        </header>
        <p v-if="historyLoading" class="empty">กำลังโหลดประวัติ...</p>
        <p v-else-if="historyError" class="error-text">{{ historyError }}</p>
        <p v-else-if="historyRows.length === 0" class="empty">ยังไม่มีประวัติการยืมทรัพย์สินชิ้นนี้</p>
        <div v-else class="history-list">
          <article v-for="h in historyRows" :key="h.borrow_id" class="history-entry">
            <div class="history-entry-top">
              <b>{{ h.first_name }} {{ h.last_name }}</b>
              <span class="history-status">{{ HISTORY_STATUS[h.status] || h.status }}</span>
            </div>
            <p>ยืมเมื่อ {{ fmtBorrowedAt(h.borrowed_at) }}</p>
            <p v-if="h.return_date">คืนเมื่อ {{ fmtBorrowedAt(h.return_date) }}</p>
            <p v-if="h.condition_out">สภาพก่อนยืม: {{ h.condition_out }}</p>
            <p v-if="h.condition_in">สภาพตอนคืน: {{ h.condition_in }}</p>
            <b v-if="h.has_defect === 1 || h.has_defect === true" class="defect">พบตำหนิ</b>
            <b v-else-if="h.has_defect === 0 || h.has_defect === false" class="good-condition">ไม่พบตำหนิ</b>
            <span v-else class="uninspected">ยังไม่คืนหรือยังไม่ได้บันทึกสภาพ</span>
          </article>
        </div>
      </section>
    </div>
  </section>
</template>

<style scoped>
.head h2 { margin: 0 0 4px; }
.reserve-date { display: flex; flex-direction: column; gap: 6px; }
.reserve-date input { font: inherit; }
.history-link { margin-top: 8px; padding: 5px 0; border: 0; background: none; color: var(--primary); font: inherit; font-size: 13px; cursor: pointer; }
.history-link:hover { text-decoration: underline; }
.history-overlay { position: fixed; inset: 0; z-index: 1000; display: grid; place-items: center; padding: 18px; background: rgba(15, 23, 42, .52); }
.history-dialog { width: min(620px, 100%); max-height: min(80vh, 760px); overflow: auto; padding: 22px; border-radius: 16px; background: #fff; box-shadow: 0 20px 60px rgba(0,0,0,.25); }
.history-head, .history-entry-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.history-head { margin-bottom: 14px; }
.history-head h3, .history-head p { margin: 0; }
.history-head p { margin-top: 4px; color: var(--muted); }
.history-close { border: 0; background: none; font-size: 28px; line-height: 1; cursor: pointer; color: var(--muted); }
.history-entry { padding: 14px 0; border-top: 1px solid var(--line); }
.history-entry p { margin: 7px 0 0; font-size: 14px; }
.history-status { color: var(--muted); font-size: 13px; }
.defect, .good-condition, .uninspected { display: inline-block; margin-top: 8px; font-size: 13px; }
.defect { color: var(--danger); }
.good-condition { color: var(--ok-text); }
.uninspected { color: var(--muted); }
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
.item.unavailable { cursor: default; opacity: .82; }
.item.unavailable:hover { transform: none; box-shadow: 0 2px 10px rgba(0, 0, 0, .06); }
.item:focus-visible { outline: none; border-color: var(--primary); }
.item.on { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(43, 87, 151, .15); }
.item.reserved { cursor: not-allowed; opacity: .84; }
.item.reserved:hover { transform: none; box-shadow: 0 2px 10px rgba(0, 0, 0, .06); }
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
.asset-status { width: fit-content; margin-bottom: 6px; padding: 3px 9px; border-radius: 999px; background: #eef1f6; color: #526075; font-size: 12px; }
.asset-status.available { background: var(--ok-soft); color: var(--ok-text); }
.asset-status.reserved, .asset-status.borrowed { background: var(--warn-soft); color: var(--warn-text); }
.item:hover .pickbtn { background: #dfe9f8; }
.item.on .pickbtn { background: var(--primary); color: #fff; }
.item.repairing { cursor: not-allowed; opacity: .82; }
.item.repairing:hover { transform: none; box-shadow: 0 2px 10px rgba(0, 0, 0, .06); }
.pickbtn.disabled { background: #fff0e8; color: #a34b16; cursor: not-allowed; }
.repair-overlay { position: absolute; inset: auto 8px 8px; border-radius: 8px; background: rgba(139, 61, 13, .94); color: #fff; text-align: center; padding: 8px 5px; font-size: 13px; font-weight: 700; }
.reserved-overlay { position: absolute; inset: auto 8px 8px; border-radius: 8px; background: rgba(91, 62, 145, .94); color: #fff; text-align: center; padding: 8px 5px; font-size: 13px; font-weight: 700; }
.item.reserved .pickbtn.disabled { background: #f1eafe; color: #6d28d9; }
.repair-notice { display: flex; flex-direction: column; gap: 6px; margin: 12px 0 18px; padding: 12px 14px; border: 1px solid #f0c18e; border-radius: 12px; background: #fff7ed; color: #8a4314; font-size: 13px; }
.repair-list { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 2px; }
.repair-list span { background: #ffedd5; border-radius: 6px; padding: 4px 8px; }
.reserved-notice { display: flex; flex-direction: column; gap: 6px; margin: 12px 0 18px; padding: 12px 14px; border: 1px solid #d8c8f2; border-radius: 12px; background: #faf7ff; color: #5b3e91; font-size: 13px; }
.reserved-list { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 2px; }
.reserved-list span { background: #f1eafe; border-radius: 6px; padding: 4px 8px; }

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
.submit.sent:disabled { opacity: 1; background: #238458; cursor: default; }
.success-box { background: #e3f4ea; color: var(--ok); padding: 10px 12px; border-radius: 10px; font-size: 14px; margin: 0 0 12px; }

@media (max-width: 860px) {
  .layout { grid-template-columns: 1fr; }
  .panel { position: static; max-height: none; }
  .toolbar { flex-direction: column; }
  .sort { flex: none; width: 100% !important; padding: 10px 12px; }
}
</style>
