<script setup>
// TODO: แก้ไขรายชื่อสมาชิกในกลุ่มและข้อมูลติดต่อของทีมให้ตรงกับกลุ่มของคุณ
const teamMembers = [
  { name: 'ชื่อ-นามสกุล สมาชิกคนที่ 1', studentId: 'รหัสนักศึกษา', role: 'หัวหน้ากลุ่ม / Backend' },
  { name: 'ชื่อ-นามสกุล สมาชิกคนที่ 2', studentId: 'รหัสนักศึกษา', role: 'Frontend' },
  { name: 'ชื่อ-นามสกุล สมาชิกคนที่ 3', studentId: 'รหัสนักศึกษา', role: 'Database' },
];

const contactInfo = {
  address: 'มหาวิทยาลัยเทคโนโลยีราชมงคลธัญบุรี (RMUTT) จ.ปทุมธานี',
  email: 'contact@myshop.example.com',
  phone: '02-xxx-xxxx',
};
</script>

<template>
  <section>
    <div class="card">
      <h2>ติดต่อเรา</h2>
      <p><strong>ที่อยู่:</strong> {{ contactInfo.address }}</p>
      <p><strong>อีเมล:</strong> {{ contactInfo.email }}</p>
      <p><strong>โทรศัพท์:</strong> {{ contactInfo.phone }}</p>
    </div>

    <div class="card" style="margin-top:20px;">
      <h2>สมาชิกในกลุ่ม</h2>
      <table>
        <thead>
          <tr><th>ชื่อ-นามสกุล</th><th>รหัสนักศึกษา</th><th>หน้าที่รับผิดชอบ</th></tr>
        </thead>
        <tbody>
          <tr v-for="m in teamMembers" :key="m.studentId">
            <td>{{ m.name }}</td>
            <td>{{ m.studentId }}</td>
            <td>{{ m.role }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
