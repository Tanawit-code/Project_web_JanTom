<script setup>
import { ref } from 'vue';
import api from '../services/api';

const email = ref('');
const message = ref('');
const loading = ref(false);

async function submit() {
  loading.value = true;
  message.value = '';
  try {
    const { data } = await api.post('/auth/forgot-password', { email: email.value });
    message.value = data.message;
  } catch (e) {
    message.value = e.response?.data?.message || 'เกิดข้อผิดพลาด';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="card" style="max-width:380px; margin:0 auto;">
    <h2>ลืมรหัสผ่าน</h2>
    <p style="color:var(--muted); font-size:14px;">กรอกอีเมลที่ใช้ลงทะเบียน ระบบจะส่งลิงก์รีเซ็ตรหัสผ่านไปให้</p>
    <p v-if="message" class="success-text">{{ message }}</p>
    <form @submit.prevent="submit">
      <input v-model="email" type="email" placeholder="Email" required />
      <button class="btn" type="submit" :disabled="loading" style="width:100%;">
        {{ loading ? 'กำลังส่ง...' : 'ส่งลิงก์รีเซ็ตรหัสผ่าน' }}
      </button>
    </form>
  </div>
</template>
