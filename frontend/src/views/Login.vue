<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';
import { setSession } from '../services/auth';

const router = useRouter();
const form = ref({ username: '', password: '' });
const error = ref('');
const loading = ref(false);

async function submit() {
  error.value = ''; loading.value = true;
  try {
    const { data } = await api.post('/auth/login', form.value);
    setSession(data.token, data.user);
    router.push('/');
  } catch (e) {
    error.value = e.response?.data?.message || 'เข้าสู่ระบบไม่สำเร็จ';
  } finally { loading.value = false; }
}
</script>

<template>
  <div class="card" style="max-width:380px; margin:40px auto;">
    <h2>เข้าสู่ระบบ</h2>
    <p style="color:var(--muted); font-size:14px;">ระบบยืมคืนทรัพย์สินบริษัท — ใช้บัญชีพนักงานที่ผู้ดูแลระบบสร้างให้</p>
    <p v-if="error" class="error-text">{{ error }}</p>
    <form @submit.prevent="submit">
      <input v-model="form.username" placeholder="Username" required />
      <input v-model="form.password" type="password" placeholder="Password" required />
      <button class="btn" type="submit" :disabled="loading" style="width:100%;">
        {{ loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ' }}
      </button>
    </form>
  </div>
</template>
