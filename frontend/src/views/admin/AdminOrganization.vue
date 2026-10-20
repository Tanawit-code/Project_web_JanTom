<script setup>
import { computed, onMounted, ref } from 'vue';
import api from '../../services/api';

const section = ref('categories');
const categories = ref([]); const departments = ref([]);
const loading = ref(true); const saving = ref(false);
const error = ref(''); const success = ref(''); const editingId = ref(null); const deleting = ref(null);
const form = ref({ name: '', description: '' });
const isCategory = computed(() => section.value === 'categories');
const rows = computed(() => isCategory.value ? categories.value : departments.value);
const title = computed(() => isCategory.value ? 'หมวดหมู่ทรัพย์สิน' : 'แผนก');
const nameField = computed(() => isCategory.value ? 'cat_name' : 'dept_name');
const detailField = computed(() => isCategory.value ? 'description' : 'dept_location');
const detailLabel = computed(() => isCategory.value ? 'รายละเอียด' : 'สถานที่ตั้ง');

async function load() {
  loading.value = true; error.value = '';
  try {
    const [c, d] = await Promise.all([api.get('/categories'), api.get('/departments')]);
    categories.value = c.data; departments.value = d.data;
  } catch (e) { error.value = e.response?.data?.message || 'โหลดข้อมูลไม่สำเร็จ'; }
  finally { loading.value = false; }
}
function clearForm() { form.value = { name: '', description: '' }; editingId.value = null; }
function startEdit(item) {
  form.value = { name: item[nameField.value] || '', description: item[detailField.value] || '' };
  editingId.value = item[isCategory.value ? 'cat_id' : 'dept_id']; error.value = ''; success.value = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function changeSection(key) { section.value = key; clearForm(); error.value = ''; success.value = ''; }
async function submit() {
  const name = form.value.name.trim();
  if (!name) { error.value = `กรุณากรอก${isCategory.value ? 'ชื่อหมวดหมู่' : 'ชื่อแผนก'}`; return; }
  saving.value = true; error.value = ''; success.value = '';
  const payload = { [nameField.value]: name, [detailField.value]: form.value.description.trim() || null };
  const base = isCategory.value ? '/categories' : '/departments';
  try {
    if (editingId.value) { await api.put(`${base}/${editingId.value}`, payload); success.value = `แก้ไข${title.value}สำเร็จ`; }
    else { await api.post(base, payload); success.value = `เพิ่ม${title.value}สำเร็จ`; }
    clearForm(); await load();
  } catch (e) { error.value = e.response?.data?.message || 'บันทึกไม่สำเร็จ'; }
  finally { saving.value = false; }
}
async function confirmDelete() {
  const item = deleting.value;
  const id = item[isCategory.value ? 'cat_id' : 'dept_id'];
  const base = isCategory.value ? '/categories' : '/departments';
  error.value = ''; success.value = '';
  try {
    await api.delete(`${base}/${id}`); deleting.value = null;
    success.value = `ลบ${title.value} “${item[nameField.value]}” สำเร็จ`;
    if (editingId.value === id) clearForm();
    await load();
  } catch (e) { error.value = e.response?.data?.message || `ลบ${title.value}ไม่สำเร็จ อาจมีข้อมูลอื่นใช้งานอยู่`; deleting.value = null; }
}
onMounted(load);
</script>

<template>
  <section class="page">
    <div class="page-head"><div><h2>จัดการหมวดหมู่และแผนก</h2><p class="page-sub">ตั้งค่าหมวดหมู่ทรัพย์สินและแผนกที่ใช้ในข้อมูลพนักงาน</p></div><button class="btn secondary" :disabled="loading" @click="load">รีเฟรช</button></div>
    <p v-if="success" class="success-text">{{ success }}</p><p v-if="error" class="error-text">{{ error }}</p>
    <div class="seg tabs"><button :class="{ on: section === 'categories' }" @click="changeSection('categories')">หมวดหมู่ทรัพย์สิน <span class="n">{{ categories.length }}</span></button><button :class="{ on: section === 'departments' }" @click="changeSection('departments')">แผนก <span class="n">{{ departments.length }}</span></button></div>

    <form class="card editor" @submit.prevent="submit">
      <div class="editor-title"><div><h3>{{ editingId ? `แก้ไข${title}` : `เพิ่ม${title}` }}</h3><p>{{ editingId ? 'ปรับปรุงข้อมูลรายการนี้' : 'กรอกชื่อและรายละเอียดเพื่อเพิ่มรายการใหม่' }}</p></div><span class="count">{{ rows.length }} รายการ</span></div>
      <div class="form-grid"><label class="field"><span>{{ isCategory ? 'ชื่อหมวดหมู่' : 'ชื่อแผนก' }} <em>*</em></span><input v-model="form.name" required maxlength="100" :placeholder="isCategory ? 'เช่น อุปกรณ์คอมพิวเตอร์' : 'เช่น ฝ่ายเทคโนโลยีสารสนเทศ'"></label><label class="field"><span>{{ detailLabel }}</span><input v-model="form.description" maxlength="255" :placeholder="isCategory ? 'คำอธิบายเพิ่มเติม (ไม่บังคับ)' : 'อาคารหรือสถานที่ (ไม่บังคับ)'"></label></div>
      <div class="actions"><button v-if="editingId" type="button" class="btn secondary" @click="clearForm">ยกเลิกแก้ไข</button><button class="btn" type="submit" :disabled="saving">{{ saving ? 'กำลังบันทึก...' : editingId ? 'บันทึกการแก้ไข' : `เพิ่ม${title}` }}</button></div>
    </form>

    <div class="card table-card"><div v-if="loading" class="empty-state">กำลังโหลดข้อมูล...</div><div v-else-if="!rows.length" class="empty-state">ยังไม่มี{{ title }}</div><div v-else class="table-wrap"><table><thead><tr><th>{{ isCategory ? 'ชื่อหมวดหมู่' : 'ชื่อแผนก' }}</th><th>{{ detailLabel }}</th><th class="actions-col">จัดการ</th></tr></thead><tbody><tr v-for="item in rows" :key="item[isCategory ? 'cat_id' : 'dept_id']"><td><b>{{ item[nameField] }}</b></td><td>{{ item[detailField] || '-' }}</td><td class="actions-col"><div class="row-actions"><button class="btn secondary sm" @click="startEdit(item)">แก้ไข</button><button class="btn danger sm" @click="deleting = item">ลบ</button></div></td></tr></tbody></table></div></div>

    <div v-if="deleting" class="modal-backdrop" @click.self="deleting = null"><section class="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-title"><div class="dialog-icon">!</div><h3 id="delete-title">ยืนยันการลบ</h3><p>ต้องการลบ{{ title }} <b>{{ deleting[nameField] }}</b> ใช่หรือไม่</p><div class="dialog-actions"><button class="btn secondary" @click="deleting = null">กลับ</button><button class="btn danger" @click="confirmDelete">ยืนยันลบ</button></div></section></div>
  </section>
</template>

<style scoped>
.tabs { margin-bottom:16px; }.editor { padding:20px; margin-bottom:18px; border-top:4px solid var(--primary); }.editor-title { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:16px; }.editor-title h3 { margin:0; }.editor-title p { margin:4px 0 0; color:var(--muted); font-size:13px; }.count { background:var(--primary-soft); color:var(--primary-dark); padding:5px 11px; border-radius:999px; font-size:13px; font-weight:700; white-space:nowrap; }
.form-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; }.field { display:flex; flex-direction:column; gap:6px; }.field input { width:100%; box-sizing:border-box; padding:10px 12px; border:1px solid var(--line); border-radius:10px; font:inherit; }.field input:focus { outline:2px solid var(--primary-soft); border-color:var(--primary); }.actions { display:flex; justify-content:flex-end; gap:8px; margin-top:16px; }.table-card { padding:8px 12px; }.actions-col { text-align:right; white-space:nowrap; }.row-actions { justify-content:flex-end; }
.modal-backdrop { position:fixed; inset:0; z-index:100; display:grid; place-items:center; padding:18px; background:rgba(15,23,42,.56); backdrop-filter:blur(3px); }.confirm-dialog { width:min(440px,calc(100vw - 36px)); background:#fff; padding:24px; border-radius:var(--radius); box-shadow:0 20px 60px rgba(0,0,0,.24); }.confirm-dialog h3 { margin:0 0 10px; }.confirm-dialog p { color:var(--muted); line-height:1.6; }.dialog-actions { display:flex; justify-content:flex-end; gap:8px; margin-top:20px; }
@media(max-width:650px) { .form-grid { grid-template-columns:1fr; }.editor-title { align-items:flex-start; } }
</style>
