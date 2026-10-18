<script setup>
import { reactive, ref } from 'vue';
import api from '../services/api';
import { authState } from '../services/auth';

const profile = reactive({ first_name: authState.user?.first_name || '', last_name: authState.user?.last_name || '' });
const password = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' });
const email = ref('');
const busy = ref(false);
const error = ref('');
const notice = ref('');

async function saveProfile() {
  error.value = ''; notice.value = '';
  if (password.newPassword && password.newPassword !== password.confirmPassword) { error.value = 'รหัสผ่านใหม่ไม่ตรงกัน'; return; }
  busy.value = true;
  try {
    const { data } = await api.patch('/auth/profile', { ...profile, currentPassword: password.currentPassword, newPassword: password.newPassword });
    Object.assign(authState.user, data.user);
    localStorage.setItem('user', JSON.stringify(authState.user));
    password.currentPassword = ''; password.newPassword = ''; password.confirmPassword = '';
    notice.value = data.message;
  } catch (e) { error.value = e.response?.data?.message || 'บันทึกข้อมูลไม่สำเร็จ'; }
  finally { busy.value = false; }
}

async function requestEmailChange() {
  error.value = ''; notice.value = ''; busy.value = true;
  try { notice.value = (await api.post('/auth/profile/email-change', { email: email.value })).data.message; email.value = ''; }
  catch (e) { error.value = e.response?.data?.message || 'ส่งคำขอไม่สำเร็จ'; }
  finally { busy.value = false; }
}
</script>

<template>
  <section class="profile-card">
    <h1>จัดการบัญชี</h1>
    <p class="muted">แก้ไขชื่อ รหัสผ่าน และอีเมลของคุณ</p>
    <div v-if="error" class="alert">{{ error }}</div>
    <div v-if="notice" class="success">{{ notice }}</div>

    <form @submit.prevent="saveProfile">
      <h2>ข้อมูลส่วนตัว</h2>
      <label>ชื่อ<input v-model="profile.first_name" required maxlength="50"></label>
      <label>นามสกุล<input v-model="profile.last_name" required maxlength="50"></label>
      <h2>เปลี่ยนรหัสผ่าน</h2>
      <p class="muted">เว้นว่างไว้หากไม่ต้องการเปลี่ยนรหัสผ่าน</p>
      <label>รหัสผ่านเดิม<input v-model="password.currentPassword" type="password" autocomplete="current-password"></label>
      <label>รหัสผ่านใหม่<input v-model="password.newPassword" type="password" autocomplete="new-password"></label>
      <small>อย่างน้อย 8 ตัวอักษร และมีตัวพิมพ์เล็ก ตัวพิมพ์ใหญ่ ตัวเลข และอักขระพิเศษ</small>
      <label>ยืนยันรหัสผ่านใหม่<input v-model="password.confirmPassword" type="password" autocomplete="new-password"></label>
      <button :disabled="busy">{{ busy ? 'กำลังบันทึก…' : 'บันทึกข้อมูล' }}</button>
    </form>

    <form class="email-form" @submit.prevent="requestEmailChange">
      <h2>เปลี่ยนอีเมล</h2>
      <p class="muted">อีเมลปัจจุบัน: {{ authState.user?.email || 'ยังไม่ได้ระบุ' }}. เราจะส่งลิงก์ยืนยันไปยังอีเมลปัจจุบัน</p>
      <label>อีเมลใหม่<input v-model="email" type="email" required maxlength="100" autocomplete="email"></label>
      <button :disabled="busy">ส่งลิงก์ยืนยัน</button>
    </form>
  </section>
</template>

<style scoped>
.profile-card{max-width:620px;margin:24px auto;background:#fff;padding:30px;border-radius:18px;box-shadow:0 8px 30px #18324b12}h1{margin:0 0 6px}h2{font-size:18px;margin:24px 0 12px}.muted,small{color:var(--muted);line-height:1.6}.profile-card form{display:grid;gap:12px}.profile-card label{display:grid;gap:6px;font-size:14px;font-weight:600}.profile-card input{padding:11px 12px;border:1px solid #d8dee8;border-radius:9px;font:inherit}.profile-card button{border:0;border-radius:9px;padding:12px;background:var(--primary);color:#fff;font:inherit;font-weight:600;cursor:pointer}.profile-card button:disabled{opacity:.6}.email-form{border-top:1px solid #e8ebf0;margin-top:28px;padding-top:8px}.alert,.success{padding:11px 14px;border-radius:9px;margin:12px 0}.alert{background:#fbe7e4;color:#a93226}.success{background:#e3f4ea;color:#176b3a}
</style>
