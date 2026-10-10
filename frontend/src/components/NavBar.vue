<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import api from '../services/api';
import { authState, clearSession, hasRole } from '../services/auth';
import NotificationBell from './NotificationBell.vue';

const router = useRouter();
const route = useRoute();
const unpaid = ref({ count: 0, total: 0 });
const toReview = ref(0); // admin: จำนวนสลิปที่รอตรวจ
const menu = ref('');    // '' | 'manage' | 'user'
const mobileOpen = ref(false);
let timer = null;

const isAdmin = computed(() => hasRole('admin'));
const isStaff = computed(() => hasRole('approver', 'admin'));
const initial = computed(() => (authState.user?.first_name || '?').charAt(0).toUpperCase());
const ROLE_TH = { admin: 'ผู้ดูแลระบบ', approver: 'ผู้อนุมัติ', employee: 'พนักงาน' };

// เมนู "จัดการ" แสดงเท่าที่สิทธิ์เข้าถึงได้
const manageItems = computed(() => {
  const items = [
    { to: '/approvals', icon: '✅', label: 'อนุมัติคำขอ' },
    { to: '/admin/returns', icon: '📦', label: 'รับคืนทรัพย์สิน' },
  ];
  if (isAdmin.value) {
    items.push(
      { to: '/admin/fines', icon: '💸', label: 'จัดการค่าปรับ', badge: toReview.value },
      { to: '/admin/assets', icon: '🗂️', label: 'จัดการทรัพย์สิน' },
      { to: '/admin/employees', icon: '👥', label: 'จัดการพนักงาน' },
    );
  }
  return items;
});
const manageActive = computed(() => manageItems.value.some((i) => route.path.startsWith(i.to)));

function toggle(name) { menu.value = menu.value === name ? '' : name; }
function logout() { menu.value = ''; clearSession(); router.push('/login'); }

async function refresh() {
  if (!authState.user) return;
  try {
    const { data } = await api.get('/fines/mine/summary');
    unpaid.value = { count: data.unpaid_count, total: data.unpaid_total };
  } catch { /* ignore */ }
  if (hasRole('admin')) {
    try { toReview.value = (await api.get('/fines/pending-count')).data.count; } catch { /* ignore */ }
  }
}

watch(() => authState.user, (u) => {
  clearInterval(timer);
  if (u) { refresh(); timer = setInterval(refresh, 30000); }
  else { unpaid.value = { count: 0, total: 0 }; toReview.value = 0; }
}, { immediate: true });
watch(() => route.fullPath, () => { menu.value = ''; mobileOpen.value = false; refresh(); });

const closeAll = () => { menu.value = ''; };
const onKey = (e) => { if (e.key === 'Escape') closeAll(); };
onMounted(() => { document.addEventListener('click', closeAll); document.addEventListener('keydown', onKey); });
onBeforeUnmount(() => {
  clearInterval(timer);
  document.removeEventListener('click', closeAll);
  document.removeEventListener('keydown', onKey);
});

const money = (n) => Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
</script>

<template>
  <header class="top">
    <nav class="bar">
      <router-link to="/" class="brand">ระบบยืมคืนทรัพย์สินบริษัท</router-link>

      <template v-if="authState.user">
        <button class="burger" type="button" aria-label="เมนู" @click.stop="mobileOpen = !mobileOpen">{{ mobileOpen ? '✕' : '☰' }}</button>

        <div class="links" :class="{ open: mobileOpen }">
          <router-link v-if="isAdmin" to="/admin/dashboard" class="nl">แดชบอร์ด</router-link>
          <router-link to="/assets" class="nl">ทรัพย์สิน</router-link>
          <template v-if="!isAdmin">
            <router-link to="/my-borrows" class="nl">คำขอของฉัน</router-link>
            <router-link to="/my-fines" class="nl">ค่าปรับของฉัน<span v-if="unpaid.count > 0" class="pill">{{ unpaid.count }}</span></router-link>
          </template>

          <div v-if="isStaff" class="dd">
            <button type="button" class="nl dd-btn" :class="{ on: menu === 'manage' || manageActive }" @click.stop="toggle('manage')">
              จัดการ <span class="caret">▾</span><span v-if="toReview > 0" class="pill">{{ toReview }}</span>
            </button>
            <div v-if="menu === 'manage'" class="panel" @click.stop>
              <router-link v-for="i in manageItems" :key="i.to" :to="i.to" class="item">
                <span class="ico">{{ i.icon }}</span>{{ i.label }}<span v-if="i.badge > 0" class="pill dark">{{ i.badge }}</span>
              </router-link>
            </div>
          </div>
        </div>

        <div class="right">
          <NotificationBell />
          <div class="dd">
            <button type="button" class="me" aria-label="เมนูบัญชี" @click.stop="toggle('user')">
              <span class="avatar">{{ initial }}</span>
              <span class="me-name">{{ authState.user.first_name }}</span>
              <span class="caret">▾</span>
            </button>
            <div v-if="menu === 'user'" class="panel right-panel" @click.stop>
              <div class="who">
                <b>{{ authState.user.first_name }} {{ authState.user.last_name }}</b>
                <span class="role">{{ ROLE_TH[authState.user.role] || authState.user.role }}</span>
              </div>
              <template v-if="isAdmin">
                <router-link to="/my-borrows" class="item"><span class="ico">📝</span>คำขอของฉัน</router-link>
                <router-link to="/my-fines" class="item"><span class="ico">💸</span>ค่าปรับของฉัน<span v-if="unpaid.count > 0" class="pill dark">{{ unpaid.count }}</span></router-link>
              </template>
              <router-link to="/contact" class="item"><span class="ico">📞</span>ติดต่อเรา</router-link>
              <button type="button" class="item danger" @click="logout"><span class="ico">⎋</span>ออกจากระบบ</button>
            </div>
          </div>
        </div>
      </template>

      <router-link v-else to="/login" class="nl">เข้าสู่ระบบ</router-link>
    </nav>

    <!-- แถบเตือนค่าปรับค้างชำระ -->
    <div v-if="authState.user && unpaid.count > 0 && route.path !== '/my-fines'" class="fine-banner">
      <span>⚠️ คุณมีค่าปรับค้างชำระ <b>{{ unpaid.count }}</b> รายการ รวม <b>฿{{ money(unpaid.total) }}</b></span>
      <router-link to="/my-fines" class="pay">ชำระค่าปรับ</router-link>
    </div>
  </header>
</template>

<style scoped>
.top { background: var(--primary); color: #fff; position: relative; z-index: 40; }
.bar { display: flex; align-items: center; gap: 8px; width: 100%; box-sizing: border-box; padding: 10px 24px; }
.brand { font-weight: 700; font-size: 18px; color: #fff; margin-right: 18px; white-space: nowrap; }
.links { display: flex; align-items: center; gap: 4px; flex: 1; }
.right { display: flex; align-items: center; gap: 8px; margin-left: auto; }

.nl { display: inline-flex; align-items: center; gap: 4px; color: rgba(255, 255, 255, .88); padding: 8px 14px; border-radius: 999px; font-size: 15px; background: none; border: none; cursor: pointer; font-family: inherit; white-space: nowrap; transition: background .15s, color .15s; }
.nl:hover { background: rgba(255, 255, 255, .14); color: #fff; }
.nl.router-link-active, .nl.on { background: rgba(255, 255, 255, .22); color: #fff; font-weight: 600; }

.pill { display: inline-block; margin-left: 6px; min-width: 18px; padding: 0 6px; box-sizing: border-box; border-radius: 999px; background: #e11d48; color: #fff; font-size: 11px; font-weight: 700; text-align: center; line-height: 18px; }
.caret { font-size: 11px; opacity: .8; }

.dd { position: relative; }
.panel { position: absolute; left: 0; top: calc(100% + 8px); min-width: 220px; background: #fff; color: var(--text); border-radius: 14px; box-shadow: 0 12px 40px rgba(0, 0, 0, .25); padding: 6px; z-index: 60; }
.right-panel { left: auto; right: 0; }
.item { display: flex; align-items: center; gap: 10px; width: 100%; box-sizing: border-box; padding: 10px 12px; border-radius: 10px; color: var(--text); font-size: 14px; background: none; border: none; cursor: pointer; font-family: inherit; text-align: left; }
.item:hover { background: #f1f4f9; }
.item.router-link-active { background: #e6eefb; color: var(--primary-dark); font-weight: 600; }
.item.danger { color: #c0392b; border-top: 1px solid #eef0f4; border-radius: 0 0 10px 10px; margin-top: 4px; padding-top: 12px; }
.item.danger:hover { background: #fdecea; }
.ico { width: 20px; text-align: center; }
.pill.dark { margin-left: auto; }

.me { display: flex; align-items: center; gap: 8px; background: rgba(255, 255, 255, .12); border: none; color: #fff; padding: 4px 12px 4px 4px; border-radius: 999px; cursor: pointer; font-family: inherit; font-size: 14px; }
.me:hover { background: rgba(255, 255, 255, .22); }
.avatar { width: 30px; height: 30px; border-radius: 50%; background: #fff; color: var(--primary-dark); font-weight: 700; display: flex; align-items: center; justify-content: center; }
.who { display: flex; flex-direction: column; gap: 2px; padding: 10px 12px 12px; border-bottom: 1px solid #eef0f4; margin-bottom: 4px; }
.role { font-size: 12px; color: var(--muted); }

.burger { display: none; margin-left: auto; background: rgba(255, 255, 255, .14); border: none; color: #fff; width: 38px; height: 38px; border-radius: 10px; font-size: 18px; cursor: pointer; }

.fine-banner { display: flex; align-items: center; justify-content: center; gap: 14px; flex-wrap: wrap; background: #fdecea; color: #8a1c14; padding: 9px 16px; font-size: 14px; }
.pay { background: #c0392b; color: #fff; padding: 4px 14px; border-radius: 999px; font-size: 13px; font-weight: 600; }
.pay:hover { background: #a93226; }

/* มือถือ/จอแคบ: ซ่อนลิงก์ไว้หลังปุ่ม ☰ */
@media (max-width: 860px) {
  .bar { flex-wrap: wrap; padding: 10px 16px; }
  .burger { display: block; order: 2; }
  .right { order: 3; margin-left: 0; }
  .links { display: none; order: 5; flex-basis: 100%; flex-direction: column; align-items: stretch; gap: 2px; padding: 8px 0 4px; }
  .links.open { display: flex; }
  .links .nl { border-radius: 10px; }
  .links .dd .panel { position: static; box-shadow: none; background: rgba(255, 255, 255, .1); color: #fff; margin-top: 4px; }
  .links .dd .item { color: #fff; }
  .links .dd .item:hover { background: rgba(255, 255, 255, .15); }
  .links .dd .item.router-link-active { background: rgba(255, 255, 255, .22); color: #fff; }
  .brand { margin-right: 0; font-size: 16px; }
  .burger { margin-left: auto; }
  .me-name { display: none; }
}
</style>
