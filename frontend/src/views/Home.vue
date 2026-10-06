<script setup>
import { authState, hasRole } from '../services/auth';
</script>

<template>
  <section>
    <div class="card" style="background:linear-gradient(135deg,#2b5797,#4b7bc7); color:#fff; padding:40px;">
      <h1 style="margin:0 0 8px;">สวัสดี {{ authState.user?.first_name }}</h1>
      <p style="opacity:.9;">ระบบยืมคืนทรัพย์สินบริษัท — เลือกเมนูด้านบนเพื่อเริ่มใช้งาน</p>
    </div>

    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px,1fr)); gap:20px; margin-top:24px;">
      <router-link to="/assets" class="card" style="text-decoration:none;">
        <h3>ทรัพย์สินทั้งหมด</h3>
        <p style="color:var(--muted);">ดูรายการทรัพย์สินที่ว่าง และส่งคำขอยืม</p>
      </router-link>
      <router-link to="/my-borrows" class="card" style="text-decoration:none;">
        <h3>คำขอของฉัน</h3>
        <p style="color:var(--muted);">ติดตามสถานะคำขอยืมที่เคยส่ง</p>
      </router-link>
      <router-link v-if="hasRole('approver','admin')" to="/approvals" class="card" style="text-decoration:none;">
        <h3>อนุมัติคำขอ</h3>
        <p style="color:var(--muted);">พิจารณาคำขอยืมที่รออนุมัติ</p>
      </router-link>
      <router-link v-if="hasRole('admin')" to="/admin/assets" class="card" style="text-decoration:none;">
        <h3>จัดการทรัพย์สิน</h3>
        <p style="color:var(--muted);">เพิ่ม/แก้ไข/ลบ ข้อมูลทรัพย์สิน</p>
      </router-link>
    </div>
  </section>
</template>
