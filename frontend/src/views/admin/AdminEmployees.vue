<script setup>
import { ref, onMounted } from 'vue';
import api from '../../services/api';

const employees = ref([]);
const departments = ref([]);
const error = ref(''); const success = ref('');
const emptyForm = { emp_id: null, emp_code: '', first_name: '', last_name: '', position: '', phone: '', email: '', username: '', password: '', role: 'employee', dept_id: '' };
const form = ref({ ...emptyForm });
const isEditing = ref(false);

async function loadEmployees() { const { data } = await api.get('/employees'); employees.value = data; }
async function loadDepartments() { const { data } = await api.get('/departments'); departments.value = data; }
function startEdit(e) { form.value = { ...e, password: '' }; isEditing.value = true; }
function resetForm() { form.value = { ...emptyForm }; isEditing.value = false; }

async function submit() {
  error.value = ''; success.value = '';
  try {
    if (isEditing.value) {
      await api.put(`/employees/${form.value.emp_id}`, form.value);
      success.value = 'แก้ไขข้อมูลพนักงานสำเร็จ';
    } else {
      await api.post('/employees', form.value);
      success.value = 'เพิ่มพนักงานสำเร็จ';
    }
    resetForm(); loadEmployees();
  } catch (e) { error.value = e.response?.data?.message || 'บันทึกไม่สำเร็จ'; }
}

async function remove(e) {
  if (!confirm(`ลบพนักงาน "${e.first_name} ${e.last_name}" ?`)) return;
  try { await api.delete(`/employees/${e.emp_id}`); loadEmployees(); }
  catch (err) { error.value = err.response?.data?.message || 'ลบไม่สำเร็จ'; }
}

onMounted(() => { loadEmployees(); loadDepartments(); });
</script>

<template>
  <section>
    <h2>จัดการพนักงาน / บัญชีผู้ใช้</h2>
    <div class="card" style="margin-bottom:20px;">
      <h3>{{ isEditing ? 'แก้ไขพนักงาน' : 'เพิ่มพนักงานใหม่' }}</h3>
      <p v-if="error" class="error-text">{{ error }}</p>
      <p v-if="success" class="success-text">{{ success }}</p>
      <form @submit.prevent="submit" style="display:grid; grid-template-columns:1fr 1fr; gap:0 16px;">
        <input v-model="form.emp_code" placeholder="รหัสพนักงาน" required :disabled="isEditing" />
        <input v-model="form.first_name" placeholder="ชื่อ" required />
        <input v-model="form.last_name" placeholder="นามสกุล" required />
        <input v-model="form.position" placeholder="ตำแหน่ง" />
        <input v-model="form.phone" placeholder="เบอร์โทร" />
        <input v-model="form.email" type="email" placeholder="อีเมล" />
        <select v-model="form.dept_id">
          <option value="">-- เลือกแผนก --</option>
          <option v-for="d in departments" :key="d.dept_id" :value="d.dept_id">{{ d.dept_name }}</option>
        </select>
        <select v-model="form.role">
          <option value="employee">พนักงาน</option>
          <option value="approver">ผู้อนุมัติ</option>
          <option value="admin">ผู้ดูแลระบบ</option>
        </select>
        <input v-if="!isEditing" v-model="form.username" placeholder="Username" required />
        <input v-if="!isEditing" v-model="form.password" type="password" placeholder="Password" required />
        <p v-if="!isEditing" style="grid-column:1/3; font-size:13px; color:var(--muted); margin-top:-6px;">
          รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร มีพิมพ์เล็ก พิมพ์ใหญ่ ตัวเลข และอักขระพิเศษ
        </p>
        <div style="grid-column:1/3; display:flex; gap:10px;">
          <button class="btn" type="submit">{{ isEditing ? 'บันทึกการแก้ไข' : 'เพิ่มพนักงาน' }}</button>
          <button v-if="isEditing" class="btn secondary" type="button" @click="resetForm">ยกเลิก</button>
        </div>
      </form>
    </div>

    <div class="card">
      <table>
        <thead><tr><th>รหัส</th><th>ชื่อ-สกุล</th><th>ตำแหน่ง</th><th>สิทธิ์</th><th></th></tr></thead>
        <tbody>
          <tr v-for="e in employees" :key="e.emp_id">
            <td>{{ e.emp_code }}</td>
            <td>{{ e.first_name }} {{ e.last_name }}</td>
            <td>{{ e.position }}</td>
            <td>{{ e.role }}</td>
            <td style="display:flex; gap:8px;">
              <button class="btn secondary" @click="startEdit(e)">แก้ไข</button>
              <button class="btn danger" @click="remove(e)">ลบ</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="employees.length === 0" style="color:var(--muted);">ไม่พบพนักงาน</p>
    </div>
  </section>
</template>
