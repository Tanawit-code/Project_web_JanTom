<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import api from '../services/api';
import { setSession } from '../services/auth';
import AuthCard from '../components/AuthCard.vue';
import AuthField from '../components/AuthField.vue';

const router = useRouter();
const route = useRoute();
const form = ref({ username: '', password: '' });
const error = ref('');
const loading = ref(false);

async function submit() {
  error.value = ''; loading.value = true;
  try {
    const { data } = await api.post('/auth/login', form.value);
    setSession(data.token, data.user);
    const redirect = route.query.redirect;
    router.push(typeof redirect === 'string' && redirect.startsWith('/') ? redirect : '/');
  } catch (e) {
    error.value = e.response?.data?.message || 'เข้าสู่ระบบไม่สำเร็จ';
  } finally { loading.value = false; }
}
</script>

<template>
  <AuthCard title="เข้าสู่ระบบ" subtitle="ระบบยืมคืนทรัพย์สินบริษัท">
    <div v-if="error" class="alert">{{ error }}</div>
    <form @submit.prevent="submit">
      <AuthField v-model="form.username" label="Username" icon="user" placeholder="ชื่อผู้ใช้" autocomplete="username" />
      <AuthField v-model="form.password" label="Password" icon="lock" type="password" placeholder="รหัสผ่าน" autocomplete="current-password" />
      <div class="forgot"><router-link to="/forgot-password">ลืมรหัสผ่าน?</router-link></div>
      <button class="btn submit" type="submit" :disabled="loading">
        {{ loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ' }}
      </button>
    </form>
    <p class="note">ใช้ได้เฉพาะบัญชีที่ผู้ดูแลระบบอนุมัติแล้ว</p>
    <p class="switch">ยังไม่มีบัญชี? <router-link to="/register">สมัครสมาชิก</router-link></p>
  </AuthCard>
</template>

<style scoped>
.alert { background: #fbe7e4; color: var(--danger); border-radius: 10px; padding: 10px 14px; font-size: 14px; margin-bottom: 14px; }
.forgot { text-align: right; margin: -6px 0 12px; font-size: 13px; }
.forgot a { color: var(--primary); }
.forgot a:hover { text-decoration: underline; }
.submit { width: 100%; padding: 12px; font-size: 15px; border-radius: 10px; margin-top: 4px; }
.note { text-align: center; font-size: 13px; color: var(--muted); margin: 14px 0 0; }
.switch { text-align: center; font-size: 14px; margin: 10px 0 0; }
.switch a { color: var(--primary); font-weight: 600; }
.switch a:hover { text-decoration: underline; }
</style>
