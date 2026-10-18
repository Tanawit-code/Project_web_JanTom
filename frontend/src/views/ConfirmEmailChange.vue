<script setup>
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import api from '../services/api';
import { authState } from '../services/auth';
const route = useRoute();
const state = ref('loading');
const message = ref('กำลังยืนยันอีเมล…');
onMounted(async () => {
  const token = typeof route.query.token === 'string' ? route.query.token : '';
  if (!token) { state.value = 'error'; message.value = 'ไม่พบลิงก์ยืนยัน'; return; }
  try {
    const { data } = await api.get(`/auth/confirm-email-change/${encodeURIComponent(token)}`);
    message.value = data.message;
    if (authState.user && data.email) { authState.user.email = data.email; localStorage.setItem('user', JSON.stringify(authState.user)); }
    state.value = 'success';
  }
  catch (e) { message.value = e.response?.data?.message || 'ยืนยันอีเมลไม่สำเร็จ'; state.value = 'error'; }
});
</script>
<template><section class="result"><h1>{{ state === 'success' ? 'ยืนยันสำเร็จ' : state === 'error' ? 'ยืนยันไม่สำเร็จ' : 'กำลังดำเนินการ' }}</h1><p>{{ message }}</p><router-link to="/profile">กลับไปหน้าจัดการบัญชี</router-link></section></template>
<style scoped>.result{max-width:560px;margin:50px auto;padding:32px;background:#fff;border-radius:16px;text-align:center;box-shadow:0 8px 30px #18324b12}.result p{line-height:1.7;color:var(--muted)}a{color:var(--primary)}</style>
