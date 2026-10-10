<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import api from '../services/api';

const route = useRoute();
const token = route.query.token;
const applicant = ref(null);
const error = ref('');
const result = ref(null); // { type: 'approve' | 'reject', message, emailSent, email }
const loading = ref(true);
const busy = ref(false);
const showRejectModal = ref(false);

onMounted(async () => {
  if (!token) { error.value = 'ไม่พบ token ในลิงก์'; loading.value = false; return; }
  try {
    const { data } = await api.get(`/auth/registration/${token}`);
    applicant.value = data;
  } catch (e) {
    error.value = e.response?.data?.message || 'เกิดข้อผิดพลาด';
  } finally { loading.value = false; }
});

async function decide(action) {
  busy.value = true;
  error.value = '';
  try {
    const { data } = await api.post(`/auth/registration/${token}`, { action });
    result.value = { type: action, message: data.message, emailSent: data.emailSent, email: data.email };
    applicant.value = null;
    showRejectModal.value = false;
  } catch (e) {
    showRejectModal.value = false;
    error.value = e.response?.data?.message || 'เกิดข้อผิดพลาด';
  } finally { busy.value = false; }
}

const initial = () => (applicant.value?.first_name || '?').charAt(0).toUpperCase();
</script>

<template>
  <div class="wrap">
    <div class="panel">
      <p v-if="loading" class="muted center">กำลังโหลด...</p>

      <!-- error / ลิงก์ใช้ไม่ได้ -->
      <div v-else-if="error && !applicant" class="state">
        <div class="icon err">!</div>
        <h2>ไม่สามารถดำเนินการได้</h2>
        <p class="muted">{{ error }}</p>
        <router-link to="/" class="btn secondary">กลับหน้าแรก</router-link>
      </div>

      <!-- ผลลัพธ์หลังตัดสินใจ -->
      <div v-else-if="result" class="state">
        <div class="icon" :class="result.type === 'approve' ? 'ok' : 'err'">
          {{ result.type === 'approve' ? '✓' : '✕' }}
        </div>
        <h2>{{ result.type === 'approve' ? 'อนุมัติเรียบร้อย' : 'ปฏิเสธคำขอเรียบร้อย' }}</h2>
        <p class="muted">{{ result.message }}</p>
        <div class="notice" :class="result.emailSent ? 'notice-ok' : 'notice-warn'">
          <span class="notice-icon">{{ result.emailSent ? '✉' : '⚠' }}</span>
          <span v-if="result.emailSent">ส่งอีเมลแจ้งผลไปที่ <b>{{ result.email }}</b> เรียบร้อยแล้ว</span>
          <span v-else>ส่งอีเมลแจ้งผู้สมัครไม่สำเร็จ กรุณาแจ้งผู้สมัครด้วยตนเอง ({{ result.email }})</span>
        </div>
        <router-link to="/admin/employees" class="btn">ไปหน้าจัดการพนักงาน</router-link>
      </div>

      <!-- หน้าตรวจสอบ -->
      <div v-else-if="applicant">
        <h2 class="title">ตรวจสอบคำขอสมัครสมาชิก</h2>
        <p class="muted">กรุณาตรวจสอบว่าบุคคลนี้เป็นพนักงานจริงหรือไม่ก่อนอนุมัติ</p>

        <div class="profile">
          <div class="avatar">{{ initial() }}</div>
          <div>
            <div class="name">{{ applicant.first_name }} {{ applicant.last_name }}</div>
            <span class="pill">รอตรวจสอบ</span>
          </div>
        </div>

        <dl class="info">
          <dt>รหัสพนักงาน</dt><dd>{{ applicant.emp_code }}</dd>
          <dt>Username</dt><dd>{{ applicant.username }}</dd>
          <dt>อีเมล</dt><dd>{{ applicant.email }}</dd>
        </dl>

        <p v-if="error" class="error-text">{{ error }}</p>

        <div class="actions">
          <button class="btn big" :disabled="busy" @click="decide('approve')">
            {{ busy ? 'กำลังดำเนินการ...' : 'อนุมัติ' }}
          </button>
          <button class="btn big danger" :disabled="busy" @click="showRejectModal = true">ปฏิเสธ</button>
        </div>
      </div>
    </div>

    <!-- Modal ยืนยันการปฏิเสธ -->
    <transition name="fade">
      <div v-if="showRejectModal" class="overlay" @click.self="showRejectModal = false">
        <div class="modal">
          <div class="icon warn">!</div>
          <h3>ยืนยันการปฏิเสธคำขอ?</h3>
          <p class="muted">
            คำขอของ <b>{{ applicant?.first_name }} {{ applicant?.last_name }}</b> จะถูกลบออกจากระบบ
            และระบบจะส่งอีเมลแจ้งผู้สมัคร การกระทำนี้ย้อนกลับไม่ได้
          </p>
          <div class="actions">
            <button class="btn secondary big" :disabled="busy" @click="showRejectModal = false">ยกเลิก</button>
            <button class="btn danger big" :disabled="busy" @click="decide('reject')">
              {{ busy ? 'กำลังดำเนินการ...' : 'ยืนยันปฏิเสธ' }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.wrap { padding: 40px 16px; }
.panel { max-width: 480px; margin: 0 auto; background: var(--card-bg); border-radius: 16px; padding: 28px; box-shadow: 0 4px 20px rgba(0,0,0,.08); }
.title { margin: 0 0 6px; }
.muted { color: var(--muted); font-size: 14px; line-height: 1.6; }
.center { text-align: center; }

.profile { display: flex; align-items: center; gap: 14px; margin: 20px 0 8px; }
.avatar { width: 52px; height: 52px; border-radius: 50%; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 600; }
.name { font-size: 18px; font-weight: 600; margin-bottom: 4px; }
.pill { display: inline-block; font-size: 12px; padding: 2px 10px; border-radius: 999px; background: #fdf3dc; color: var(--warn); }

.info { display: grid; grid-template-columns: 120px 1fr; gap: 0; margin: 12px 0 20px; border: 1px solid #e5e9f0; border-radius: 10px; overflow: hidden; }
.info dt, .info dd { margin: 0; padding: 11px 14px; font-size: 14px; border-bottom: 1px solid #e5e9f0; }
.info dt { background: #f7f9fc; color: var(--muted); }
.info dt:nth-last-of-type(1), .info dd:last-of-type { border-bottom: none; }
.info dd { word-break: break-all; }

.actions { display: flex; gap: 10px; }
.actions .btn { flex: 1; text-align: center; }
.btn.big { padding: 12px 16px; font-size: 15px; }

.state { text-align: center; padding: 8px 0; }
.state h2 { margin: 14px 0 6px; }
.state .btn { margin-top: 16px; }

.icon { width: 56px; height: 56px; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; font-size: 26px; font-weight: 700; }
.icon.ok { background: #e3f4ea; color: var(--ok); }
.icon.err { background: #fbe7e4; color: var(--danger); }
.icon.warn { background: #fdf3dc; color: var(--warn); }

.overlay { position: fixed; inset: 0; background: rgba(17,24,39,.55); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; padding: 16px; z-index: 100; }
.modal { background: #fff; width: 100%; max-width: 400px; border-radius: 16px; padding: 28px 24px 22px; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,.25); }
.modal h3 { margin: 14px 0 6px; font-size: 18px; }
.modal .actions { margin-top: 20px; }

.notice { display: flex; align-items: center; gap: 10px; text-align: left; margin: 16px 0 0; padding: 12px 14px; border-radius: 10px; font-size: 14px; }
.notice-ok { background: #e3f4ea; color: #1f6b3d; }
.notice-warn { background: #fdf3dc; color: #8a5a00; }
.notice-icon { font-size: 18px; }
.notice b { word-break: break-all; }

.fade-enter-active, .fade-leave-active { transition: opacity .18s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>