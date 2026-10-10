<script setup>
import { ref, computed } from 'vue';
import api from '../services/api';
import AuthCard from '../components/AuthCard.vue';
import AuthField from '../components/AuthField.vue';

const form = ref({ emp_code: '', first_name: '', last_name: '', username: '', email: '', password: '', confirmPassword: '' });
const error = ref('');
const loading = ref(false);
const submittedEmail = ref(''); // มีค่า = สมัครสำเร็จแล้ว แสดงหน้าแจ้งให้ตรวจสอบอีเมล

const rules = computed(() => {
  const p = form.value.password;
  return [
    { ok: p.length >= 8, text: '8 ตัวอักษรขึ้นไป' },
    { ok: /[a-z]/.test(p), text: 'พิมพ์เล็ก' },
    { ok: /[A-Z]/.test(p), text: 'พิมพ์ใหญ่' },
    { ok: /\d/.test(p), text: 'ตัวเลข' },
    { ok: /[^A-Za-z0-9]/.test(p), text: 'อักขระพิเศษ' },
  ];
});
const confirmState = computed(() => {
  if (!form.value.confirmPassword) return '';
  return form.value.confirmPassword === form.value.password ? 'ok' : 'bad';
});

async function submit() {
  error.value = '';
  if (form.value.password !== form.value.confirmPassword) {
    error.value = 'รหัสผ่านทั้งสองช่องไม่ตรงกัน';
    return;
  }
  loading.value = true;
  try {
    await api.post('/auth/register', {
      emp_code: form.value.emp_code,
      first_name: form.value.first_name,
      last_name: form.value.last_name,
      username: form.value.username,
      email: form.value.email,
      password: form.value.password,
    });
    submittedEmail.value = form.value.email;
    form.value.password = '';
    form.value.confirmPassword = '';
  } catch (e) {
    error.value = e.response?.data?.message || 'สมัครสมาชิกไม่สำเร็จ';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AuthCard
    :title="submittedEmail ? 'ส่งคำขอสมัครแล้ว' : 'สมัครสมาชิก'"
    :subtitle="submittedEmail ? '' : 'กรอกข้อมูลพนักงานเพื่อขอเข้าใช้งานระบบ'"
  >
    <template #icon>
      <svg v-if="submittedEmail" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" /><path d="M22 6l-10 7L2 6" />
      </svg>
      <svg v-else viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><path d="M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" /><path d="M19 8v6M22 11h-6" />
      </svg>
    </template>

    <!-- หลังสมัครสำเร็จ -->
    <div v-if="submittedEmail" class="done">
      <p class="lead">กรุณาตรวจสอบอีเมลของคุณ</p>
      <p class="email-box">{{ submittedEmail }}</p>
      <p class="muted">
        ผู้ดูแลระบบกำลังตรวจสอบว่าคุณเป็นพนักงานจริงหรือไม่ เมื่ออนุมัติแล้ว
        ระบบจะส่งอีเมลแจ้งผลไปที่อีเมลนี้ และคุณจะเข้าสู่ระบบได้ทันที
      </p>
      <ol class="steps">
        <li class="done-step"><span>✓</span> ส่งคำขอสมัครแล้ว</li>
        <li><span>2</span> ผู้ดูแลระบบตรวจสอบและอนุมัติ</li>
        <li><span>3</span> รับอีเมลแจ้งผล แล้วเข้าสู่ระบบ</li>
      </ol>
      <p class="hint">ไม่พบอีเมล? ลองดูในโฟลเดอร์ Spam หรือ Junk</p>
      <router-link to="/login" class="btn submit">กลับไปหน้าเข้าสู่ระบบ</router-link>
    </div>

    <!-- ฟอร์มสมัคร -->
    <template v-else>
      <div v-if="error" class="alert">{{ error }}</div>
      <form @submit.prevent="submit">
        <AuthField v-model="form.emp_code" label="รหัสพนักงาน" icon="id" placeholder="เช่น 000123" />
        <div class="row">
          <AuthField v-model="form.first_name" label="ชื่อ" icon="user" placeholder="ชื่อ" autocomplete="given-name" />
          <AuthField v-model="form.last_name" label="นามสกุล" placeholder="นามสกุล" autocomplete="family-name" />
        </div>
        <AuthField v-model="form.username" label="Username" icon="user" placeholder="ชื่อผู้ใช้สำหรับเข้าสู่ระบบ" autocomplete="username" />
        <AuthField v-model="form.email" label="Email" icon="mail" type="email" placeholder="name@company.com" autocomplete="email" />
        <AuthField v-model="form.password" label="Password" icon="lock" type="password" placeholder="ตั้งรหัสผ่าน" autocomplete="new-password" />

        <div v-if="form.password" class="rules">
          <span v-for="r in rules" :key="r.text" class="chip" :class="{ ok: r.ok }">{{ r.ok ? '✓' : '○' }} {{ r.text }}</span>
        </div>

        <AuthField v-model="form.confirmPassword" label="ยืนยัน Password" icon="lock" type="password" placeholder="พิมพ์รหัสผ่านอีกครั้ง" autocomplete="new-password" />
        <p v-if="confirmState === 'bad'" class="match bad">รหัสผ่านยังไม่ตรงกัน</p>
        <p v-else-if="confirmState === 'ok'" class="match ok">รหัสผ่านตรงกัน ✓</p>

        <p class="note">หลังสมัคร ผู้ดูแลระบบจะตรวจสอบว่าเป็นพนักงานจริงก่อนจึงจะเข้าสู่ระบบได้</p>
        <button class="btn submit" type="submit" :disabled="loading">
          {{ loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก' }}
        </button>
      </form>
      <p class="switch">มีบัญชีอยู่แล้ว? <router-link to="/login">เข้าสู่ระบบ</router-link></p>
    </template>
  </AuthCard>
</template>

<style scoped>
.alert { background: #fbe7e4; color: var(--danger); border-radius: 10px; padding: 10px 14px; font-size: 14px; margin-bottom: 14px; }
.row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.submit { display: block; width: 100%; padding: 12px; font-size: 15px; border-radius: 10px; margin-top: 4px; text-align: center; }
.note { font-size: 13px; color: var(--muted); margin: 4px 0 12px; line-height: 1.6; }
.switch { text-align: center; font-size: 14px; margin: 16px 0 0; }
.switch a { color: var(--primary); font-weight: 600; }
.switch a:hover { text-decoration: underline; }

.rules { display: flex; flex-wrap: wrap; gap: 6px; margin: -4px 0 14px; }
.chip { font-size: 12px; padding: 3px 10px; border-radius: 999px; background: #f1f3f7; color: var(--muted); }
.chip.ok { background: #e3f4ea; color: var(--ok); }
.match { font-size: 13px; margin: -6px 0 10px; }
.match.ok { color: var(--ok); }
.match.bad { color: var(--danger); }

.done { text-align: center; }
.lead { font-size: 17px; font-weight: 600; margin: 0 0 8px; }
.email-box { display: inline-block; max-width: 100%; word-break: break-all; margin: 0 0 12px; padding: 8px 16px; border-radius: 999px; background: #f1f4f9; font-weight: 600; }
.muted { color: var(--muted); font-size: 14px; line-height: 1.7; margin: 0 0 16px; }
.steps { list-style: none; padding: 0; margin: 0 0 16px; text-align: left; }
.steps li { display: flex; align-items: center; gap: 12px; padding: 8px 4px; font-size: 14px; color: var(--muted); }
.steps li span { width: 26px; height: 26px; border-radius: 50%; border: 1.5px solid #cfd6e2; display: flex; align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0; }
.steps li.done-step { color: var(--ok); font-weight: 600; }
.steps li.done-step span { background: var(--ok); border-color: var(--ok); color: #fff; }
.hint { font-size: 13px; color: var(--muted); margin: 0 0 14px; }

@media (max-width: 420px) { .row { grid-template-columns: 1fr; gap: 0; } }
</style>
