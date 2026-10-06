<script setup>
import { useRouter } from 'vue-router';
import { authState, clearSession, hasRole } from '../services/auth';

const router = useRouter();
function logout() { clearSession(); router.push('/login'); }
</script>

<template>
  <header style="background:var(--primary); color:#fff;">
    <nav class="container" style="display:flex; align-items:center; justify-content:space-between; padding:14px 20px; flex-wrap:wrap; gap:10px;">
      <router-link to="/" style="font-weight:bold; font-size:18px; color:#fff;">ระบบยืมคืนทรัพย์สินบริษัท</router-link>
      <div style="display:flex; gap:16px; align-items:center; flex-wrap:wrap;">
        <template v-if="authState.user">
          <router-link to="/assets" style="color:#fff;">ทรัพย์สิน</router-link>
          <router-link to="/my-borrows" style="color:#fff;">คำขอของฉัน</router-link>
          <router-link v-if="hasRole('approver','admin')" to="/approvals" style="color:#fff;">อนุมัติคำขอ</router-link>
          <router-link v-if="hasRole('admin','approver')" to="/admin/returns" style="color:#fff;">รับคืน</router-link>
          <router-link v-if="hasRole('admin')" to="/admin/assets" style="color:#fff;">จัดการทรัพย์สิน</router-link>
          <router-link v-if="hasRole('admin')" to="/admin/employees" style="color:#fff;">จัดการพนักงาน</router-link>
          <span style="color:#dbe4f5;">{{ authState.user.first_name }} ({{ authState.user.role }})</span>
          <button class="btn secondary" @click="logout">ออกจากระบบ</button>
        </template>
        <router-link v-else to="/login" style="color:#fff;">เข้าสู่ระบบ</router-link>
      </div>
    </nav>
  </header>
</template>
