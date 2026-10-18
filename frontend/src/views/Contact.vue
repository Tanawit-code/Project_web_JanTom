<script setup>
// TODO: แก้ไขรายชื่อสมาชิกในกลุ่มและข้อมูลติดต่อของทีมให้ตรงกับกลุ่มของคุณ
const teamMembers = [
  { name: 'ธนวิทย์ ชาวปราการ  สมาชิกคนที่ 1', studentId: 'รหัสนักศึกษา 116710906046-3', role: 'Full-Stack' },
  { name: 'ธีรภัทร พูลท้วม  สมาชิกคนที่ 2', studentId: 'รหัสนักศึกษา 116710906062-0', role: 'Full-Stack' },
];

const contactInfo = [
  { icon: '📍', label: 'ที่อยู่', value: 'มหาวิทยาลัยเทคโนโลยีราชมงคลธัญบุรี (RMUTT) จ.ปทุมธานี' },
  { icon: '✉️', label: 'อีเมล', value: 'rmutt_news@rmutt.ac.th' },
  { icon: '📞', label: 'โทรศัพท์', value: '02-xxx-xxxx' },
];
</script>

<template>
  <section class="page narrow">
    <div class="page-head">
      <div>
        <h2>ติดต่อเรา</h2>
        <p class="page-sub">พบปัญหาการใช้งานหรือต้องการสอบถาม ติดต่อได้ตามช่องทางด้านล่าง</p>
      </div>
    </div>

    <div class="info">
      <div v-for="c in contactInfo" :key="c.label" class="box">
        <span class="ico">{{ c.icon }}</span>
        <div><small>{{ c.label }}</small><b>{{ c.value }}</b></div>
      </div>
    </div>

    <h3 class="section-title" style="margin-top:28px;">สมาชิกในกลุ่มผู้พัฒนา</h3>
    <div class="team">
      <div v-for="m in teamMembers" :key="m.studentId + m.name" class="member">
        <span class="avatar big">{{ m.name.charAt(0) }}</span>
        <b>{{ m.name }}</b>
        <small>{{ m.studentId }}</small>
        <span class="chip">{{ m.role }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.info { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; }
.box { display: flex; gap: 14px; align-items: flex-start; background: #fff; border-radius: var(--radius); padding: 16px 18px; box-shadow: var(--shadow); }
.ico { width: 42px; height: 42px; flex: 0 0 42px; border-radius: 12px; background: var(--primary-soft); display: flex; align-items: center; justify-content: center; font-size: 20px; }
.box div { display: flex; flex-direction: column; min-width: 0; }
.box small { color: var(--muted); font-size: 12.5px; }
.box b { font-size: 14px; font-weight: 600; overflow-wrap: anywhere; }
.team { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; }
.member { background: #fff; border-radius: var(--radius); padding: 22px 16px; box-shadow: var(--shadow); text-align: center; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.avatar.big { width: 60px; height: 60px; flex-basis: 60px; font-size: 24px; margin-bottom: 6px; }
.member small { color: var(--muted); }
.member .chip { margin-top: 6px; }
</style>
