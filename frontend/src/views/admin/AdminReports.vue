
<template>
  <div class="reports">
    <h1>รายงานและส่งออก</h1>

    <div class="filters">
      <label>
        เดือน
        <select v-model="month">
          <option v-for="m in 12" :key="m" :value="m">
            {{ m }}
          </option>
        </select>
      </label>

      <label>
        ปี
        <input v-model.number="year" type="number" />
      </label>
    </div>

    <div class="report-buttons">
      <button
        v-for="r in reportTypes"
        :key="r.key"
        @click="loadReport(r.key)"
      >
        {{ r.label }}
      </button>
    </div>

    <h2>{{ title }}</h2>
    <p v-if="loading">กำลังโหลด...</p>
    <p v-else-if="error">{{ error }}</p>

    <div class="table-wrap" v-if="rows.length">
      <table>
        <thead>
          <tr>
            <th v-for="key in columns" :key="key">{{ key }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in rows" :key="i">
            <td v-for="key in columns" :key="key">
              {{ row[key] ?? '-' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-else-if="!loading && !error">ไม่พบข้อมูล</p>

    <div class="exports">
      <button @click="download('excel')">ส่งออก Excel</button>
      <button @click="download('pdf')">ส่งออก PDF</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import api from '../../services/api';

const month = ref(new Date().getMonth() + 1);
const year = ref(new Date().getFullYear());
const rows = ref([]);
const title = ref('');
const loading = ref(false);
const error = ref('');
const currentReport = ref('monthly');

const reportTypes = [
  { key: 'monthly', label: 'รายการยืมรายเดือน' },
  { key: 'popular', label: 'ทรัพย์สินที่ถูกยืมบ่อย' },
  { key: 'fines', label: 'ค่าปรับที่เก็บได้' },
  { key: 'overdue', label: 'รายการค้างคืน' }
];

const columns = computed(() =>
  rows.value.length ? Object.keys(rows.value[0]) : []
);

async function loadReport(type) {
  currentReport.value = type;
  loading.value = true;
  error.value = '';
  rows.value = [];

  try {
    const params = ['monthly', 'fines'].includes(type)
      ? { month: month.value, year: year.value }
      : {};

    const response = await api.get(`/reports/${type}`, { params });
    rows.value = response.data.rows;
    title.value = response.data.title;
  } catch (err) {
    error.value =
      err.response?.data?.message || 'โหลดรายงานไม่สำเร็จ';
  } finally {
    loading.value = false;
  }
}

async function download(format) {
  try {
    const params = ['monthly', 'fines'].includes(currentReport.value)
      ? { month: month.value, year: year.value }
      : {};

    const response = await api.get(
      `/reports/${currentReport.value}/${format}`,
      { params, responseType: 'blob' }
    );

    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentReport.value}-report.${
      format === 'excel' ? 'xlsx' : 'pdf'
    }`;
    link.click();
    URL.revokeObjectURL(url);
  } catch {
    error.value = 'ส่งออกไฟล์ไม่สำเร็จ';
  }
}

loadReport('monthly');
</script>

<style scoped>
.reports {
  padding: 24px;
  color: #243047;
}
.filters, .report-buttons, .exports {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 18px 0;
}
label {
  display: grid;
  gap: 6px;
}
button, input, select {
  padding: 10px 14px;
  border: 1px solid #d7dce5;
  border-radius: 8px;
}
button {
  cursor: pointer;
}
.table-wrap {
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  padding: 12px;
  border: 1px solid #e0e5ec;
  text-align: left;
}
th {
  background: #f1f5f9;
}
</style>
