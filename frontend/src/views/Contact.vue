<script setup>
const teamMembers = [
  { name: 'ธนวิทย์ ชาวปราการ สมาชิกคนที่ 1', studentId: 'รหัสนักศึกษา 116710906046-3', role: 'Full-Stack', image: '/team-avatar-1.svg', number: '01', theme: 'blue' },
  { name: 'ธีรภัทร พูลท้วม สมาชิกคนที่ 2', studentId: 'รหัสนักศึกษา 116710906062-0', role: 'Full-Stack', image: '/team-avatar-2.svg', number: '02', theme: 'violet' },
];

const contactInfo = [
  { icon: '📍', label: 'ที่อยู่', value: 'มหาวิทยาลัยเทคโนโลยีราชมงคลธัญบุรี (RMUTT) จ.ปทุมธานี' },
  { icon: '✉️', label: 'อีเมล', value: 'rmutt_news@rmutt.ac.th' },
  { icon: '📞', label: 'โทรศัพท์', value: '02-xxx-xxxx' },
];
</script>

<template>
  <section class="page narrow contact-page">
    <div class="page-head">
      <div>
        <span class="eyebrow">THAIASSET · SUPPORT</span>
        <h2>ติดต่อเรา</h2>
        <p class="page-sub">พบปัญหาการใช้งานหรือต้องการสอบถาม ติดต่อทีมงานได้ตามช่องทางด้านล่าง</p>
      </div>
    </div>

    <div class="info">
      <div v-for="c in contactInfo" :key="c.label" class="box">
        <span class="ico">{{ c.icon }}</span>
        <div><small>{{ c.label }}</small><b>{{ c.value }}</b></div>
      </div>
    </div>

    <div class="team-heading">
      <div><span class="eyebrow">OUR TEAM</span><h3>สมาชิกในกลุ่มผู้พัฒนา</h3></div>
      <span class="team-count">{{ teamMembers.length }} คน</span>
    </div>
    <div class="team">
      <article v-for="m in teamMembers" :key="m.studentId + m.name" class="member">
        <div class="member-art" :class="m.theme">
          <span class="member-number">{{ m.number }}</span>
          <span class="art-caption">DEVELOPER</span>
          <img :src="m.image" :alt="`ภาพวาดประกอบ ${m.name}`" />
        </div>
        <div class="member-info">
          <span class="member-label">สมาชิกทีมพัฒนา</span>
          <b>{{ m.name }}</b>
          <small>{{ m.studentId }}</small>
          <span class="chip">{{ m.role }}</span>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.contact-page { max-width:980px; }
.page-head { margin-bottom:20px; }
.eyebrow { display:inline-flex; color:var(--primary); font-size:10px; font-weight:800; letter-spacing:1px; }
.page-head h2 { margin:4px 0 4px; font-size:28px; }
.info { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:14px; }
.box { display:flex; gap:13px; align-items:flex-start; min-height:76px; background:#fff; border:1px solid #e9edf4; border-radius:16px; padding:16px; box-shadow:var(--shadow); transition:transform .16s,box-shadow .16s; }
.box:hover { transform:translateY(-2px); box-shadow:var(--shadow-hover); }
.ico { width:42px; height:42px; flex:0 0 42px; border-radius:13px; background:var(--primary-soft); display:flex; align-items:center; justify-content:center; font-size:19px; }
.box div { display:flex; flex-direction:column; min-width:0; gap:2px; }.box small { color:var(--muted); font-size:12px; }.box b { font-size:13px; line-height:1.55; font-weight:650; overflow-wrap:anywhere; }
.team-heading { display:flex; align-items:flex-end; justify-content:space-between; gap:12px; margin:30px 0 13px; }.team-heading h3 { margin:3px 0 0; font-size:18px; }.team-count { padding:5px 10px; border-radius:999px; color:var(--primary-dark); background:var(--primary-soft); font-size:12px; font-weight:700; }
.team { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:18px; }
.member { overflow:hidden; background:#fff; border:1px solid #e8edf5; border-radius:20px; box-shadow:var(--shadow); transition:transform .18s,box-shadow .18s; }.member:hover { transform:translateY(-3px); box-shadow:var(--shadow-hover); }
.member-art { position:relative; display:flex; justify-content:center; height:170px; overflow:hidden; }
.member-art.blue { background:linear-gradient(135deg,#edf5ff,#dceaff); }.member-art.violet { background:linear-gradient(135deg,#f3f0ff,#e8e3fa); }
.member-art::before,.member-art::after { content:""; position:absolute; border:1px solid rgba(71,112,166,.12); border-radius:50%; }
.member-art::before { width:210px; height:210px; top:63px; }.member-art::after { width:270px; height:270px; top:84px; }
.member-art img { position:relative; z-index:1; align-self:flex-end; width:168px; height:168px; object-fit:contain; }
.member-number { position:absolute; z-index:2; top:15px; left:17px; color:#426b9c; font-size:12px; font-weight:800; letter-spacing:1px; }
.art-caption { position:absolute; z-index:1; right:17px; top:17px; color:rgba(47,83,128,.55); font-size:9px; font-weight:800; letter-spacing:1.5px; }
.member-info { display:flex; flex-direction:column; align-items:center; text-align:center; gap:6px; padding:17px 18px 20px; }.member-label { color:var(--primary); font-size:10px; font-weight:800; letter-spacing:.7px; }.member-info b { font-size:15px; line-height:1.5; }.member small { color:var(--muted); font-size:12px; }.member .chip { margin-top:3px; }
@media(max-width:620px) { .team { grid-template-columns:1fr; }.member { display:grid; grid-template-columns:132px 1fr; min-height:150px; }.member-art { height:100%; min-height:150px; }.member-art img { width:130px; height:130px; }.member-art::before { width:145px;height:145px;top:64px; }.member-art::after { width:185px;height:185px;top:80px; }.member-info { align-items:flex-start; text-align:left; padding:15px 12px; justify-content:center; }.member-info b { font-size:13px; }.member-info small { font-size:10px; } }
</style>
