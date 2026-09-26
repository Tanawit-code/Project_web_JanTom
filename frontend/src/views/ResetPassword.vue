<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../services/api';

const route = useRoute();
const router = useRouter();
const token = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const error = ref('');
const success = ref('');
const loading = ref(false);

onMounted(() => {
  token.value = route.query.token || '';
});

async function submit() {
  error.value = '';
  success.value = '';
  if (newPassword.value !== confirmPassword.value) {
    error.value = 'รหัสผ่านทั้งสองช่องไม่ตรงกัน';
    return;
  }
  loading.value = true;
  try {
    const { data } = await api.post('/auth/reset-password', {
      token: token.value,
      newPassword: newPassword.value,
    });
    success.value = data.message;
    setTimeout(() => router.push('/login'), 1200);
  } catch (e) {
    error.value = e.response?.data?.message || 'รีเซ็ตรหัสผ่านไม่สำเร็จ';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="card" style="max-width:380px; margin:0 auto;">
    <h2>ตั้งรหัสผ่านใหม่</h2>
    <p v-if="error" class="error-text">{{ error }}</p>
    <p v-if="success" class="success-text">{{ success }}</p>
    <form @submit.prevent="submit">
      <input v-model="newPassword" type="password" placeholder="รหัสผ่านใหม่" required />
      <input v-model="confirmPassword" type="password" placeholder="ยืนยันรหัสผ่านใหม่" required />
      <button class="btn" type="submit" :disabled="loading" style="width:100%;">
        {{ loading ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่' }}
      </button>
    </form>
  </div>
</template>
