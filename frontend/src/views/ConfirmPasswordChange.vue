<script setup>
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import api from '../services/api';
const route = useRoute();
const token = typeof route.query.token === 'string' ? route.query.token : '';
const state = ref(token ? 'ready' : 'error');
const message = ref(token ? 'กดปุ่มด้านล่างเพื่อยืนยันการเปลี่ยนรหัสผ่านของคุณ' : 'ไม่พบลิงก์ยืนยัน');
const busy = ref(false);
async function confirm() {
  busy.value = true;
  try { message.value = (await api.post('/auth/confirm-password-change', { token })).data.message; state.value = 'success'; }
  catch (e) { message.value = e.response?.data?.message || 'ยืนยันไม่สำเร็จ'; state.value = 'error'; }
  finally { busy.value = false; }
}
</script>
<template>
  <section class="result">
    <h1>{{ state === 'success' ? 'เปลี่ยนรหัสผ่านสำเร็จ' : state === 'error' ? 'ยืนยันไม่สำเร็จ' : 'ยืนยันการเปลี่ยนรหัสผ่าน' }}</h1>
    <p>{{ message }}</p>
    <button v-if="state === 'ready'" :disabled="busy" @click="confirm">{{ busy ? 'กำลังยืนยัน…' : 'ยืนยันการเปลี่ยนรหัสผ่าน' }}</button>
    <router-link v-else to="/login">ไปหน้าเข้าสู่ระบบ</router-link>
  </section>
</template>
<style scoped>.result{max-width:560px;margin:50px auto;padding:32px;background:#fff;border-radius:16px;text-align:center;box-shadow:0 8px 30px #18324b12}.result p{line-height:1.7;color:var(--muted)}a{color:var(--primary)}button{border:0;border-radius:9px;padding:12px 22px;background:var(--primary);color:#fff;font:inherit;font-weight:600;cursor:pointer}button:disabled{opacity:.6}</style>
