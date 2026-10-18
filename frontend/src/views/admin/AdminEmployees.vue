<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import api from '../../services/api';
import PasswordInput from '../../components/PasswordInput.vue';

const employees = ref([]);
const departments = ref([]);
const loading = ref(true);
const error = ref(''); const success = ref('');
const emptyForm = { emp_id: null, emp_code: '', first_name: '', last_name: '', position: '', phone: '', email: '', username: '', password: '', role: 'employee', dept_id: '' };
const form = ref({ ...emptyForm });
const isEditing = ref(false);
const showForm = ref(false);
const saving = ref(false);
const deleting = ref(null); // พนักงานที่กำลังจะลบ (เปิดกล่องยืนยัน)
const search = ref('');
const roleFilter = ref('all');
const formCard = ref(null);

const ROLE_TH = { admin: 'ผู้ดูแลระบบ', approver: 'ผู้อนุมัติ', employee: 'พนักงาน' };
const deptName = (id) => departments.value.find((d) => d.dept_id === id)?.dept_name || '';

async function load() {
  try {
    const [e, d] = await Promise.all([api.get('/employees'), api.get('/departments')]);
    employees.value = e.data; departments.value = d.data;
  } finally { loading.value = false; }
}

const roleCounts = computed(() => {
  const c = { all: employees.value.length, employee: 0, approver: 0, admin: 0 };
  employees.value.forEach((e) => { c[e.role] = (c[e.role] || 0) + 1; });
  return c;
});
const shown = computed(() => {
  const q = search.value.trim().toLowerCase();
  return employees.value.filter((e) =>
    (roleFilter.value === 'all' || e.role === roleFilter.value) &&
    (!q || [e.emp_code, e.first_name, e.last_name, e.position, e.email].some((v) => (v || '').toLowerCase().includes(q))));
});

async function openForm() {
  resetForm(); showForm.value = true;
  await nextTick(); formCard.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
async function startEdit(e) {
  form.value = { ...emptyForm, ...e, password: '', dept_id: e.dept_id ?? '' };
  isEditing.value = true; showForm.value = true; error.value = ''; success.value = '';
  await nextTick(); formCard.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function resetForm() { form.value = { ...emptyForm }; isEditing.value = false; }
function closeForm() { resetForm(); showForm.value = false; error.value = ''; }

async function submit() {
  error.value = ''; success.value = ''; saving.value = true;
  try {
    if (isEditing.value) {
      await api.put(`/employees/${form.value.emp_id}`, form.value);
      success.value = 'แก้ไขข้อมูลพนักงานสำเร็จ';
    } else {
      await api.post('/employees', form.value);
      success.value = 'เพิ่มพนักงานสำเร็จ';
    }
    closeForm(); await load();
  } catch (e) { error.value = e.response?.data?.message || 'บันทึกไม่สำเร็จ'; }
  finally { saving.value = false; }
}

async function confirmDelete() {
  const e = deleting.value; error.value = ''; success.value = '';
  try {
    const { data } = await api.delete(`/employees/${e.emp_id}`);
    success.value = data?.message || `ลบพนักงาน "${e.first_name} ${e.last_name}" แล้ว`;
    deleting.value = null; await load();
  } catch (err) { error.value = err.response?.data?.message || 'ลบไม่สำเร็จ'; deleting.value = null; }
}

onMounted(load);
</script>

<template>
  <section class="page">
    <div class="page-head">
      <div>
        <h2>จัดการพนักงาน / บัญชีผู้ใช้</h2>
        <p class="page-sub">เพิ่ม แก้ไข และกำหนดสิทธิ์การใช้งานของพนักงาน</p>
      </div>
      <button v-if="!showForm" class="btn" @click="openForm">+ เพิ่มพนักงาน</button>
    </div>

    <p v-if="success" class="success-text">{{ success }}</p>
    <p v-if="error && !showForm" class="error-text">{{ error }}</p>

    <!-- ฟอร์มเพิ่ม/แก้ไข -->
    <div v-if="showForm" ref="formCard" class="card formcard">
      <h3 class="section-title">{{ isEditing ? `แก้ไขพนักงาน: ${form.first_name} ${form.last_name}` : 'เพิ่มพนักงานใหม่' }}</h3>
      <p v-if="error" class="error-text">{{ error }}</p>
      <form class="fgrid" autocomplete="off" @submit.prevent="submit">
        <div class="fsection">ข้อมูลพนักงาน</div>
        <label class="field"><span>รหัสพนักงาน <em>*</em></span><input v-model="form.emp_code" name="emp_code" placeholder="เช่น EMP-0004" required :disabled="isEditing" autocomplete="off" /></label>
        <label class="field"><span>ตำแหน่ง</span><input v-model="form.position" name="position" placeholder="เช่น เจ้าหน้าที่ไอที" autocomplete="off" /></label>
        <label class="field"><span>ชื่อ <em>*</em></span><input v-model="form.first_name" name="first_name" required autocomplete="off" /></label>
        <label class="field"><span>นามสกุล <em>*</em></span><input v-model="form.last_name" name="last_name" required autocomplete="off" /></label>
        <label class="field"><span>แผนก</span>
          <select v-model="form.dept_id" name="dept_id">
            <option value="">— ไม่ระบุ —</option>
            <option v-for="d in departments" :key="d.dept_id" :value="d.dept_id">{{ d.dept_name }}</option>
          </select>
        </label>
        <label class="field"><span>เบอร์โทร</span><input v-model="form.phone" name="phone" type="tel" placeholder="08x-xxx-xxxx" autocomplete="off" /></label>
        <label class="field full"><span>อีเมล</span><input v-model="form.email" name="email" type="email" placeholder="name@company.com" autocomplete="off" /></label>

        <div class="fsection">บัญชีและสิทธิ์การใช้งาน</div>
        <label class="field"><span>สิทธิ์</span>
          <select v-model="form.role" name="role">
            <option value="employee">พนักงาน (ยืมทรัพย์สิน)</option>
            <option value="approver">ผู้อนุมัติ (อนุมัติคำขอ/รับคืน)</option>
            <option value="admin">ผู้ดูแลระบบ (จัดการทั้งหมด)</option>
          </select>
        </label>
        <template v-if="!isEditing">
          <label class="field"><span>Username <em>*</em></span><input v-model="form.username" name="new_username" placeholder="ชื่อสำหรับเข้าสู่ระบบ" required autocomplete="off" /></label>
          <div class="field full">
            <span>รหัสผ่านเริ่มต้น <em>*</em></span>
            <PasswordInput v-model="form.password" autocomplete="new-password" />
            <small>อย่างน้อย 8 ตัวอักษร มีตัวพิมพ์เล็ก พิมพ์ใหญ่ ตัวเลข และอักขระพิเศษ</small>
          </div>
        </template>
        <p v-else class="full hint">การแก้ไขนี้ไม่เปลี่ยน Username และรหัสผ่านของพนักงาน (พนักงานเปลี่ยนรหัสผ่านเองได้ที่ "จัดการบัญชี")</p>

        <div class="form-actions full">
          <button class="btn secondary" type="button" @click="closeForm">ยกเลิก</button>
          <button class="btn" type="submit" :disabled="saving">{{ saving ? 'กำลังบันทึก...' : (isEditing ? 'บันทึกการแก้ไข' : 'เพิ่มพนักงาน') }}</button>
        </div>
      </form>
    </div>

    <!-- ค้นหา + ตัวกรองสิทธิ์ -->
    <div class="toolbar">
      <input v-model="search" class="grow" placeholder="ค้นหาชื่อ รหัส ตำแหน่ง หรืออีเมล..." autocomplete="off" />
    </div>
    <div class="seg">
      <button :class="{ on: roleFilter === 'all' }" @click="roleFilter = 'all'">ทั้งหมด<span class="n">{{ roleCounts.all }}</span></button>
      <button v-for="(label, k) in ROLE_TH" :key="k" :class="{ on: roleFilter === k }" @click="roleFilter = k">{{ label }}<span class="n">{{ roleCounts[k] || 0 }}</span></button>
    </div>

    <div class="card list">
      <p v-if="loading" class="empty-state">กำลังโหลด...</p>
      <p v-else-if="shown.length === 0" class="empty-state">ไม่พบพนักงานตามเงื่อนไข</p>
      <div v-else class="table-wrap">
        <table>
          <thead><tr><th>พนักงาน</th><th>ตำแหน่ง / แผนก</th><th>ติดต่อ</th><th>สิทธิ์</th><th class="actions"></th></tr></thead>
          <tbody>
            <tr v-for="e in shown" :key="e.emp_id">
              <td>
                <div class="who">
                  <span class="avatar">{{ (e.first_name || '?').charAt(0) }}</span>
                  <div><b>{{ e.first_name }} {{ e.last_name }}</b><small>{{ e.emp_code }}</small></div>
                </div>
              </td>
              <td><div class="two"><span>{{ e.position || '-' }}</span><small>{{ deptName(e.dept_id) || '-' }}</small></div></td>
              <td><div class="two"><span>{{ e.email || '-' }}</span><small>{{ e.phone || '' }}</small></div></td>
              <td>
                <span class="role" :class="e.role">{{ ROLE_TH[e.role] || e.role }}</span>
                <span v-if="e.status === 'pending'" class="badge pending" style="margin-left:6px;">รออนุมัติ</span>
              </td>
              <td class="actions">
                <div class="row-actions">
                  <button class="btn secondary sm" @click="startEdit(e)">แก้ไข</button>
                  <button class="btn danger sm" @click="deleting = e">ลบ</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ยืนยันการลบ -->
    <div v-if="deleting" class="overlay" @click.self="deleting = null">
      <div class="modal">
        <h3>ลบพนักงาน?</h3>
        <p class="hint">ต้องการลบ <b>{{ deleting.first_name }} {{ deleting.last_name }}</b> ({{ deleting.emp_code }}) ใช่หรือไม่ ถ้าพนักงานมีประวัติการยืม ระบบจะปิดการใช้งานบัญชีแทนการลบข้อมูล</p>
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
.list { padding: 8px 12px; }
.who { display: flex; align-items: center; gap: 12px; }
.who div, .two { display: flex; flex-direction: column; min-width: 0; }
small { color: var(--muted); font-size: 12.5px; }
.role { display: inline-block; font-size: 12.5px; font-weight: 600; padding: 3px 11px; border-radius: 999px; background: #eef0f4; color: #4b5563; }
.role.admin { background: #efeafb; color: #53389e; }
.role.approver { background: var(--primary-soft); color: var(--primary-dark); }
</style>
