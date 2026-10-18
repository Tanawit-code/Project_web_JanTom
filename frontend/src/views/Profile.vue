<script setup>
import { reactive, ref, computed, onMounted } from 'vue';
import api from '../services/api';
import { authState } from '../services/auth';
import PasswordInput from '../components/PasswordInput.vue';

const me = ref(null);
const password = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' });
const email = ref('');
const busy = ref('');
const error = ref('');
const notice = ref('');

const fullName = computed(() => (me.value ? `${me.value.first_name} ${me.value.last_name}` : `${authState.user?.first_name || ''} ${authState.user?.last_name || ''}`.trim()));
const currentEmail = computed(() => me.value?.email || authState.user?.email || '');

onMounted(async () => {
  try {
    me.value = (await api.get('/auth/profile')).data;
    if (authState.user && me.value.email !== authState.user.email) {
      authState.user.email = me.value.email;
      localStorage.setItem('user', JSON.stringify(authState.user));
    }
  } catch { /* ใช้ข้อมูลจาก session แทน */ }
});

async function changePassword() {
  error.value = ''; notice.value = '';
  if (password.newPassword !== password.confirmPassword) { error.value = 'รหัสผ่านใหม่ไม่ตรงกัน'; return; }
  busy.value = 'password';
  try {
    const { data } = await api.patch('/auth/profile', { currentPassword: password.currentPassword, newPassword: password.newPassword });
    password.currentPassword = ''; password.newPassword = ''; password.confirmPassword = '';
    notice.value = data.message;
  } catch (e) { error.value = e.response?.data?.message || 'เปลี่ยนรหัสผ่านไม่สำเร็จ'; }
  finally { busy.value = ''; }
}

async function requestEmailChange() {
  error.value = ''; notice.value = ''; busy.value = 'email';
  try {
    notice.value = (await api.post('/auth/profile/email-change', { email: email.value })).data.message;
    email.value = '';
  } catch (e) { error.value = e.response?.data?.message || 'ส่งคำขอไม่สำเร็จ'; }
  finally { busy.value = ''; }
}
</script>

<template>
  <section class="page narrow">
    <div class="page-head">
      <div>
        <h2>จัดการบัญชี</h2>
        <p class="page-sub">ดูข้อมูลของคุณ เปลี่ยนรหัสผ่าน และเปลี่ยนอีเมล</p>
      </div>
    </div>

    <p v-if="error" class="error-text">{{ error }}</p>
    <p v-if="notice" class="success-text">{{ notice }}</p>

    <!-- ข้อมูลส่วนตัว (อ่านอย่างเดียว) -->
    <div class="card block">
      <div class="who">
        <span class="avatar big">{{ (fullName || '?').charAt(0).toUpperCase() }}</span>
        <div>
          <b class="name">{{ fullName }}</b>
          <small v-if="me?.emp_code">รหัสพนักงาน {{ me.emp_code }}<template v-if="me.position"> · {{ me.position }}</template></small>
        </div>
      </div>
      <dl class="info">
        <div><dt>ชื่อ-นามสกุล</dt><dd>{{ fullName }}</dd></div>
        <div><dt>อีเมลที่ใช้อยู่</dt><dd>{{ currentEmail || 'ยังไม่ได้ระบุ' }}</dd></div>
      </dl>
      <p class="hint">ชื่อ-นามสกุลเปลี่ยนเองไม่ได้ หากต้องการแก้ไขให้ติดต่อผู้ดูแลระบบ</p>
    </div>

    <!-- เปลี่ยนรหัสผ่าน -->
    <form class="card block" autocomplete="off" @submit.prevent="changePassword">
      <h3 class="section-title">เปลี่ยนรหัสผ่าน</h3>
      <p class="hint steps">กรอกรหัสผ่านเดิมและรหัสใหม่ จากนั้นระบบจะส่งลิงก์ยืนยันไปที่ <b>{{ currentEmail || 'อีเมลของคุณ' }}</b> รหัสผ่านจะเปลี่ยนเมื่อกดลิงก์ในอีเมลเท่านั้น</p>
      <div class="stack">
        <label class="field"><span>รหัสผ่านเดิม</span><PasswordInput v-model="password.currentPassword" autocomplete="current-password" /></label>
        <label class="field"><span>รหัสผ่านใหม่</span><PasswordInput v-model="password.newPassword" autocomplete="new-password" />
          <small>อย่างน้อย 8 ตัวอักษร มีตัวพิมพ์เล็ก ตัวพิมพ์ใหญ่ ตัวเลข และอักขระพิเศษ</small></label>
        <label class="field"><span>ยืนยันรหัสผ่านใหม่</span><PasswordInput v-model="password.confirmPassword" autocomplete="new-password" /></label>
      </div>
      <div class="form-actions">
        <button class="btn" :disabled="busy === 'password' || !password.currentPassword || !password.newPassword">
          {{ busy === 'password' ? 'กำลังส่งอีเมล…' : 'ส่งลิงก์ยืนยันการเปลี่ยนรหัสผ่าน' }}
        </button>
      </div>
    </form>

    <!-- เปลี่ยนอีเมล -->
    <form class="card block" autocomplete="off" @submit.prevent="requestEmailChange">
      <h3 class="section-title">เปลี่ยนอีเมล</h3>
      <p class="hint steps">ระบบจะส่งลิงก์ยืนยันไปที่อีเมลปัจจุบัน <b>{{ currentEmail || '(ยังไม่ได้ระบุ)' }}</b> อีเมลจะเปลี่ยนเมื่อกดลิงก์ยืนยัน</p>
      <label class="field"><span>อีเมลใหม่</span><input v-model="email" type="email" required maxlength="100" autocomplete="off" placeholder="name@company.com" style="margin:0" /></label>
      <div class="form-actions" style="margin-top:14px;">
        <button class="btn" :disabled="busy === 'email' || !email">{{ busy === 'email' ? 'กำลังส่ง…' : 'ส่งลิงก์ยืนยัน' }}</button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.block { margin-bottom: 18px; }
.who { display: flex; align-items: center; gap: 14px; }
.who > div { display: flex; flex-direction: column; }
.avatar.big { width: 56px; height: 56px; flex-basis: 56px; font-size: 22px; }
.name { font-size: 18px; }
small { color: var(--muted); font-size: 12.5px; }
.info { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; margin: 18px 0 10px; }
.info div { background: #f6f8fc; border-radius: 10px; padding: 10px 14px; }
dt { font-size: 12px; color: var(--muted); margin-bottom: 2px; }
dd { margin: 0; font-weight: 600; font-size: 14.5px; overflow-wrap: anywhere; }
.steps { margin: -6px 0 16px; line-height: 1.6; }
.stack { display: flex; flex-direction: column; gap: 14px; }
.stack .field :deep(input) { margin: 0; }
.form-actions { margin-top: 18px; }
</style>
