<script setup>
import { ref } from 'vue';
import api from '../services/api';
import AuthCard from '../components/AuthCard.vue';
import AuthField from '../components/AuthField.vue';

const email = ref('');
const error = ref('');
const sentTo = ref('');
const loading = ref(false);

async function submit() {
  loading.value = true;
  error.value = '';
  try {
    await api.post('/auth/forgot-password', { email: email.value });
    sentTo.value = email.value;
  } catch (e) {
    error.value = e.response?.data?.message || 'เกิดข้อผิดพลาด';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AuthCard :title="sentTo ? 'ตรวจสอบอีเมลของคุณ' : 'ลืมรหัสผ่าน'" :subtitle="sentTo ? '' : 'กรอกอีเมลที่ใช้ลงทะเบียน เราจะส่งลิงก์รีเซ็ตรหัสผ่านไปให้'">
    <template #icon>
      <svg v-if="sentTo" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" /><path d="M22 6l-10 7L2 6" />
      </svg>
      <svg v-else viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 2l-2 2m-7.6 7.6a5.5 5.5 0 1 1-7.8 7.8 5.5 5.5 0 0 1 7.8-7.8z" /><path d="M15.5 7.5l3 3L22 7l-3-3" />
      </svg>
    </template>

    <div v-if="sentTo" class="done">
      <p class="email-box">{{ sentTo }}</p>
      <p class="muted">
        หากอีเมลนี้ลงทะเบียนไว้ในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปให้แล้ว<br />
        ลิงก์ใช้ได้ครั้งเดียวและหมดอายุใน 15 นาที
      </p>
      <p class="hint">ไม่พบอีเมล? ลองดูในโฟลเดอร์ Spam หรือ Junk</p>
      <router-link to="/login" class="btn submit">กลับไปหน้าเข้าสู่ระบบ</router-link>
    </div>

    <template v-else>
      <div v-if="error" class="alert">{{ error }}</div>
      <form @submit.prevent="submit">
        <AuthField v-model="email" label="Email" icon="mail" type="email" placeholder="name@company.com" autocomplete="email" />
        <button class="btn submit" type="submit" :disabled="loading">
          {{ loading ? 'กำลังส่ง...' : 'ส่งลิงก์รีเซ็ตรหัสผ่าน' }}
        </button>
      </form>
      <p class="switch"><router-link to="/login">← กลับไปหน้าเข้าสู่ระบบ</router-link></p>
    </template>
  </AuthCard>
</template>

<style scoped>
.alert { background: #fbe7e4; color: var(--danger); border-radius: 10px; padding: 10px 14px; font-size: 14px; margin-bottom: 14px; }
.submit { display: block; width: 100%; padding: 12px; font-size: 15px; border-radius: 10px; margin-top: 4px; text-align: center; }
.switch { text-align: center; font-size: 14px; margin: 16px 0 0; }
.switch a { color: var(--primary); font-weight: 600; }
.done { text-align: center; }
.email-box { display: inline-block; max-width: 100%; word-break: break-all; margin: 0 0 12px; padding: 8px 16px; border-radius: 999px; background: #f1f4f9; font-weight: 600; }
.muted { color: var(--muted); font-size: 14px; line-height: 1.7; margin: 0 0 14px; }
.hint { font-size: 13px; color: var(--muted); margin: 0 0 16px; }
</style>
