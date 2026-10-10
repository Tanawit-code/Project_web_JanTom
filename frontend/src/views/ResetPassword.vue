<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import api from '../services/api';
import AuthCard from '../components/AuthCard.vue';
import AuthField from '../components/AuthField.vue';

const route = useRoute();
const token = ref('');
const checking = ref(true);
const invalid = ref(false); // ลิงก์ใช้ไม่ได้/หมดอายุ
const newPassword = ref('');
const confirmPassword = ref('');
const error = ref('');
const done = ref(false);
const loading = ref(false);

const rules = computed(() => {
  const p = newPassword.value;
  return [
    { ok: p.length >= 8, text: '8 ตัวอักษรขึ้นไป' },
    { ok: /[a-z]/.test(p), text: 'พิมพ์เล็ก' },
    { ok: /[A-Z]/.test(p), text: 'พิมพ์ใหญ่' },
    { ok: /\d/.test(p), text: 'ตัวเลข' },
    { ok: /[^A-Za-z0-9]/.test(p), text: 'อักขระพิเศษ' },
  ];
});
const confirmState = computed(() => {
  if (!confirmPassword.value) return '';
  return confirmPassword.value === newPassword.value ? 'ok' : 'bad';
});

onMounted(async () => {
  token.value = typeof route.query.token === 'string' ? route.query.token : '';
  if (!token.value) { invalid.value = true; checking.value = false; return; }
  try {
    await api.get(`/auth/reset-password/${token.value}`);
  } catch {
    invalid.value = true;
  } finally { checking.value = false; }
});

async function submit() {
  error.value = '';
  if (newPassword.value !== confirmPassword.value) {
    error.value = 'รหัสผ่านทั้งสองช่องไม่ตรงกัน';
    return;
  }
  loading.value = true;
  try {
    await api.post('/auth/reset-password', { token: token.value, newPassword: newPassword.value });
    done.value = true;
  } catch (e) {
    error.value = e.response?.data?.message || 'รีเซ็ตรหัสผ่านไม่สำเร็จ';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AuthCard
    :title="done ? 'เปลี่ยนรหัสผ่านสำเร็จ' : invalid ? 'ลิงก์ใช้ไม่ได้' : 'ตั้งรหัสผ่านใหม่'"
    :subtitle="done || invalid || checking ? '' : 'กรอกรหัสผ่านใหม่ของคุณ'"
  >
    <p v-if="checking" class="muted center">กำลังตรวจสอบลิงก์...</p>

    <div v-else-if="invalid" class="state">
      <p class="muted">ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้อง ถูกใช้ไปแล้ว หรือหมดอายุ</p>
      <router-link to="/forgot-password" class="btn submit">ขอลิงก์ใหม่</router-link>
    </div>

    <div v-else-if="done" class="state">
      <p class="muted">ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่</p>
      <router-link to="/login" class="btn submit">ไปหน้าเข้าสู่ระบบ</router-link>
    </div>

    <template v-else>
      <div v-if="error" class="alert">{{ error }}</div>
      <form @submit.prevent="submit">
        <AuthField v-model="newPassword" label="รหัสผ่านใหม่" icon="lock" type="password" placeholder="ตั้งรหัสผ่านใหม่" autocomplete="new-password" />
        <div v-if="newPassword" class="rules">
          <span v-for="r in rules" :key="r.text" class="chip" :class="{ ok: r.ok }">{{ r.ok ? '✓' : '○' }} {{ r.text }}</span>
        </div>
        <AuthField v-model="confirmPassword" label="ยืนยันรหัสผ่านใหม่" icon="lock" type="password" placeholder="พิมพ์รหัสผ่านอีกครั้ง" autocomplete="new-password" />
        <p v-if="confirmState === 'bad'" class="match bad">รหัสผ่านยังไม่ตรงกัน</p>
        <p v-else-if="confirmState === 'ok'" class="match ok">รหัสผ่านตรงกัน ✓</p>
        <button class="btn submit" type="submit" :disabled="loading">
          {{ loading ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่' }}
        </button>
      </form>
    </template>
  </AuthCard>
</template>

<style scoped>
.alert { background: #fbe7e4; color: var(--danger); border-radius: 10px; padding: 10px 14px; font-size: 14px; margin-bottom: 14px; }
.submit { display: block; width: 100%; padding: 12px; font-size: 15px; border-radius: 10px; margin-top: 4px; text-align: center; }
.muted { color: var(--muted); font-size: 14px; line-height: 1.7; margin: 0 0 16px; }
.center, .state { text-align: center; }
.rules { display: flex; flex-wrap: wrap; gap: 6px; margin: -4px 0 14px; }
.chip { font-size: 12px; padding: 3px 10px; border-radius: 999px; background: #f1f3f7; color: var(--muted); }
.chip.ok { background: #e3f4ea; color: var(--ok); }
.match { font-size: 13px; margin: -6px 0 10px; }
.match.ok { color: var(--ok); }
.match.bad { color: var(--danger); }
</style>
