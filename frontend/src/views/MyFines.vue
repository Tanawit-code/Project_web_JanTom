<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import QRCode from 'qrcode';
import api from '../services/api';

const fines = ref([]);
const loading = ref(true);
const ui = reactive({}); // fine_id -> { open, qrUrl, qrName, qrErr, qrLoading, file, preview, uploading, msg, err }

const money = (n) => Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const STATUS = {
  unpaid: { text: 'รอชำระ', cls: 'st-unpaid' },
  slip_submitted: { text: 'รอตรวจสลิป', cls: 'st-review' },
  paid: { text: 'ชำระแล้ว', cls: 'st-paid' },
  cancelled: { text: 'ยกเลิก', cls: 'st-cancel' },
};
const TYPE_ICON = { late: '⏰', damaged: '🛠️', other: '📄' };

const outstanding = computed(() => fines.value.filter((f) => f.status === 'unpaid').reduce((s, f) => s + f.amount, 0));
const unpaidCount = computed(() => fines.value.filter((f) => f.status === 'unpaid').length);

function state(id) {
  if (!ui[id]) ui[id] = { open: false, qrUrl: '', qrName: '', qrErr: '', qrLoading: false, file: null, preview: '', uploading: false, msg: '', err: '' };
  return ui[id];
}

async function load() {
  loading.value = true;
  try {
    fines.value = (await api.get('/fines/mine')).data;
    const first = fines.value.find((f) => f.status === 'unpaid');
    if (first) togglePay(first, true);
  } finally { loading.value = false; }
}

async function togglePay(f, forceOpen = false) {
  const s = state(f.fine_id);
  s.open = forceOpen ? true : !s.open;
  if (s.open && !s.qrUrl && !s.qrErr) {
    s.qrLoading = true;
    try {
      const { data } = await api.get(`/fines/${f.fine_id}/qr`);
      s.qrName = data.account_name;
      s.qrUrl = await QRCode.toDataURL(data.payload, { width: 280, margin: 1, errorCorrectionLevel: 'M' });
    } catch (e) {
      s.qrErr = e.response?.data?.message || 'สร้าง QR ไม่สำเร็จ';
    } finally { s.qrLoading = false; }
  }
}

function onFile(f, e) {
  const file = e.target.files[0];
  const s = state(f.fine_id);
  s.err = ''; s.msg = '';
  if (!file) return;
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { s.err = 'รองรับเฉพาะรูปภาพ jpg, png, webp'; e.target.value = ''; return; }
  if (file.size > 5 * 1024 * 1024) { s.err = 'ไฟล์ใหญ่เกิน 5MB'; e.target.value = ''; return; }
  s.file = file;
  s.preview = URL.createObjectURL(file);
}

async function sendSlip(f) {
  const s = state(f.fine_id);
  s.err = ''; s.msg = '';
  if (!s.file) { s.err = 'กรุณาเลือกรูปสลิปก่อน'; return; }
  s.uploading = true;
  try {
    const fd = new FormData();
    fd.append('slip', s.file);
    const { data } = await api.post(`/fines/${f.fine_id}/slip`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    s.msg = data.message;
    delete ui[f.fine_id];
    await load();
  } catch (e) {
    s.err = e.response?.data?.message || 'ส่งสลิปไม่สำเร็จ';
  } finally { s.uploading = false; }
}

onMounted(load);
</script>

<template>
  <section class="wrap">
    <div class="head">
      <h2>ค่าปรับของฉัน</h2>
      <div v-if="unpaidCount > 0" class="sum">
        <span>ค้างชำระ {{ unpaidCount }} รายการ</span>
        <b>฿{{ money(outstanding) }}</b>
      </div>
    </div>

    <p v-if="loading" class="empty">กำลังโหลด...</p>
    <div v-else-if="fines.length === 0" class="empty-card">
      <div class="big">🎉</div>
      <p>ไม่มีค่าปรับ ขอบคุณที่ใช้ทรัพย์สินอย่างดีและส่งคืนตรงเวลา</p>
    </div>

    <div v-for="f in fines" :key="f.fine_id" class="fine" :class="f.status">
      <div class="top">
        <div class="left">
          <span class="ico">{{ TYPE_ICON[f.fine_type] }}</span>
          <div>
            <div class="title">{{ f.type_label }}</div>
            <div class="code">{{ f.fine_code }} · {{ f.created_at }}</div>
          </div>
        </div>
        <div class="right">
          <div class="amount">฿{{ money(f.amount) }}</div>
          <span class="st" :class="STATUS[f.status].cls">{{ STATUS[f.status].text }}</span>
        </div>
      </div>

      <p class="reason">{{ f.reason }}</p>
      <p v-if="f.asset_name" class="meta">ทรัพย์สิน: {{ f.asset_name }} ({{ f.asset_code }}) · คำขอ {{ f.borrow_code }}</p>

      <!-- รอชำระ -->
      <template v-if="f.status === 'unpaid'">
        <div v-if="f.review_note" class="note-bad">
          <b>สลิปที่ส่งไปไม่ผ่านการตรวจสอบ:</b> {{ f.review_note }}<br />กรุณาชำระและแนบสลิปใหม่
        </div>
        <button class="btn pay-btn" @click="togglePay(f)">{{ state(f.fine_id).open ? 'ซ่อนวิธีชำระเงิน' : 'ชำระค่าปรับ' }}</button>

        <div v-if="state(f.fine_id).open" class="pay-box">
          <div class="step">
            <div class="step-no">1</div>
            <div class="step-body">
              <b>สแกน QR เพื่อโอนเงิน</b>
              <p class="hint">เปิดแอปธนาคาร เลือกสแกน QR ยอดเงินจะถูกกรอกให้อัตโนมัติ</p>
              <p v-if="state(f.fine_id).qrLoading" class="hint">กำลังสร้าง QR...</p>
              <p v-else-if="state(f.fine_id).qrErr" class="err">{{ state(f.fine_id).qrErr }}</p>
              <div v-else-if="state(f.fine_id).qrUrl" class="qr">
                <img :src="state(f.fine_id).qrUrl" alt="QR PromptPay" />
                <div class="qr-info">
                  <div class="qr-amount">฿{{ money(f.amount) }}</div>
                  <div v-if="state(f.fine_id).qrName" class="hint">ชื่อบัญชี: {{ state(f.fine_id).qrName }}</div>
                  <div class="hint">PromptPay</div>
                </div>
              </div>
            </div>
          </div>

          <div class="step">
            <div class="step-no">2</div>
            <div class="step-body">
              <b>แนบสลิปการโอนเงิน</b>
              <p class="hint">รูป jpg, png หรือ webp ขนาดไม่เกิน 5MB</p>
              <input type="file" accept="image/jpeg,image/png,image/webp" @change="onFile(f, $event)" />
              <img v-if="state(f.fine_id).preview" :src="state(f.fine_id).preview" class="preview" alt="ตัวอย่างสลิป" />
              <p v-if="state(f.fine_id).err" class="err">{{ state(f.fine_id).err }}</p>
              <button class="btn send" :disabled="state(f.fine_id).uploading || !state(f.fine_id).file" @click="sendSlip(f)">
                {{ state(f.fine_id).uploading ? 'กำลังส่ง...' : 'ส่งสลิปให้ผู้ดูแลระบบตรวจสอบ' }}
              </button>
            </div>
          </div>
        </div>
      </template>

      <div v-else-if="f.status === 'slip_submitted'" class="note-wait">
        ⏳ ส่งสลิปเมื่อ {{ f.slip_uploaded_at }} — รอผู้ดูแลระบบตรวจสอบ เมื่อตรวจแล้วจะแจ้งเตือนในระบบและทางอีเมล
      </div>
      <div v-else-if="f.status === 'paid'" class="note-ok">✅ ชำระเรียบร้อยเมื่อ {{ f.paid_at }}</div>
      <div v-else class="note-cancel">รายการนี้ถูกยกเลิก ไม่ต้องชำระ</div>
    </div>
  </section>
</template>

<style scoped>
.wrap { max-width: 760px; margin: 0 auto; }
.head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }
.head h2 { margin: 0; }
.sum { display: flex; flex-direction: column; align-items: flex-end; background: #fdecea; color: #8a1c14; padding: 8px 16px; border-radius: 12px; font-size: 13px; }
.sum b { font-size: 20px; }
.empty { color: var(--muted); text-align: center; padding: 30px 0; }
.empty-card { background: #fff; border-radius: 16px; text-align: center; padding: 36px 20px; color: var(--muted); box-shadow: 0 2px 10px rgba(0, 0, 0, .06); }
.empty-card .big { font-size: 40px; }

.fine { background: #fff; border-radius: 16px; padding: 18px 20px; margin-bottom: 16px; box-shadow: 0 2px 10px rgba(0, 0, 0, .06); border-left: 5px solid #d7dae0; }
.fine.unpaid { border-left-color: #c0392b; }
.fine.slip_submitted { border-left-color: #b7791f; }
.fine.paid { border-left-color: #2c6e49; }
.top { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.left { display: flex; gap: 12px; align-items: center; }
.ico { font-size: 26px; }
.title { font-weight: 700; font-size: 16px; }
.code { font-size: 12px; color: var(--muted); }
.right { text-align: right; }
.amount { font-size: 22px; font-weight: 800; }
.st { display: inline-block; font-size: 12px; padding: 2px 12px; border-radius: 999px; color: #fff; font-weight: 600; }
.st-unpaid { background: #c0392b; } .st-review { background: #b7791f; } .st-paid { background: #2c6e49; } .st-cancel { background: #8b93a1; }
.reason { margin: 12px 0 4px; font-size: 15px; }
.meta { margin: 0 0 10px; font-size: 13px; color: var(--muted); }

.note-bad { background: #fdecea; color: #8a1c14; border-radius: 10px; padding: 10px 14px; font-size: 14px; margin: 10px 0; line-height: 1.6; }
.note-wait { background: #fdf3dc; color: #8a5a00; border-radius: 10px; padding: 10px 14px; font-size: 14px; margin-top: 10px; }
.note-ok { background: #e3f4ea; color: #1f6b3d; border-radius: 10px; padding: 10px 14px; font-size: 14px; margin-top: 10px; }
.note-cancel { background: #f1f3f7; color: var(--muted); border-radius: 10px; padding: 10px 14px; font-size: 14px; margin-top: 10px; }

.pay-btn { margin-top: 6px; border-radius: 10px; padding: 10px 22px; }
.pay-box { margin-top: 14px; border-top: 1px dashed #d7dae0; padding-top: 14px; display: flex; flex-direction: column; gap: 18px; }
.step { display: flex; gap: 14px; }
.step-no { flex: 0 0 30px; height: 30px; border-radius: 50%; background: var(--primary); color: #fff; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.step-body { flex: 1; min-width: 0; }
.hint { color: var(--muted); font-size: 13px; margin: 2px 0 8px; }
.err { color: var(--danger); font-size: 13px; margin: 6px 0; }
.qr { display: flex; gap: 18px; align-items: center; flex-wrap: wrap; background: #f6f8fc; border-radius: 14px; padding: 14px; }
.qr img { width: 200px; height: 200px; background: #fff; border-radius: 10px; padding: 6px; }
.qr-amount { font-size: 26px; font-weight: 800; color: var(--primary-dark); }
input[type='file'] { margin: 4px 0 10px; padding: 8px; background: #f6f8fc; border-radius: 10px; }
.preview { display: block; max-width: 220px; max-height: 280px; border-radius: 10px; border: 1px solid #e5e9f0; margin-bottom: 10px; }
.send { border-radius: 10px; padding: 10px 20px; }
.send:disabled { opacity: .5; cursor: not-allowed; }
</style>
