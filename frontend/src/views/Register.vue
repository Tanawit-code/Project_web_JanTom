<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';

const router = useRouter();
const form = ref({ username: '', email: '', password: '', confirmPassword: '' });
const error = ref('');
const success = ref('');
const loading = ref(false);

async function submit() {
  error.value = '';
  success.value = '';
  if (form.value.password !== form.value.confirmPassword) {
    error.value = 'รหัสผ่านทั้งสองช่องไม่ตรงกัน';
    return;
  }
  loading.value = true;
  try {
    const { data } = await api.post('/auth/register', {
      username: form.value.username,
      email: form.value.email,
      password: form.value.password,
    });
    success.value = data.message;
    setTimeout(() => router.push('/login'), 1200);
  } catch (e) {
    error.value = e.response?.data?.message || 'สมัครสมาชิกไม่สำเร็จ';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="card" style="max-width:420px; margin:0 auto;">
    <h2>สมัครสมาชิก</h2>
    <p v-if="error" class="error-text">{{ error }}</p>
    <p v-if="success" class="success-text">{{ success }}</p>
    <form @submit.prevent="submit">
      <input v-model="form.username" placeholder="Username" required />
      <input v-model="form.email" type="email" placeholder="Email" required />
      <input v-model="form.password" type="password" placeholder="Password" required />
      <input v-model="form.confirmPassword" type="password" placeholder="ยืนยัน Password" required />
      <p style="font-size:13px; color:var(--muted); margin-top:-6px;">
        รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร มีตัวพิมพ์เล็ก พิมพ์ใหญ่ ตัวเลข และอักขระพิเศษ
      </p>
      <button class="btn" type="submit" :disabled="loading" style="width:100%;">
        {{ loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก' }}
      </button>
    </form>
    <p style="margin-top:14px;">มีบัญชีอยู่แล้ว? <router-link to="/login">เข้าสู่ระบบ</router-link></p>
  </div>
</template>
