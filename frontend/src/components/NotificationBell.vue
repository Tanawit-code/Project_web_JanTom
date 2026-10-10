<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';

const router = useRouter();
const open = ref(false);
const items = ref([]);
const unread = ref(0);
const root = ref(null);
let timer = null;

async function refreshCount() {
  try { unread.value = (await api.get('/notifications/unread-count')).data.count; } catch { /* ignore */ }
}
async function loadList() {
  try { items.value = (await api.get('/notifications')).data; } catch { /* ignore */ }
}
async function toggle() {
  open.value = !open.value;
  if (open.value) { await loadList(); refreshCount(); }
}
async function openItem(n) {
  if (!n.is_read) {
    await api.post(`/notifications/${n.notif_id}/read`).catch(() => {});
    n.is_read = 1;
    unread.value = Math.max(0, unread.value - 1);
  }
  open.value = false;
  if (n.link) router.push(n.link);
}
async function readAll() {
  await api.post('/notifications/read-all').catch(() => {});
  items.value.forEach((n) => { n.is_read = 1; });
  unread.value = 0;
}
function onDocClick(e) {
  if (root.value && !root.value.contains(e.target)) open.value = false;
}
const ICON = { fine_created: '⚠️', slip_submitted: '🧾', fine_paid: '✅', fine_rejected: '❌', fine_cancelled: '➖' };

onMounted(() => {
  refreshCount();
  timer = setInterval(refreshCount, 30000);
  document.addEventListener('click', onDocClick);
});
onBeforeUnmount(() => {
  clearInterval(timer);
  document.removeEventListener('click', onDocClick);
});
</script>

<template>
  <div ref="root" class="bell-wrap">
    <button class="bell" type="button" aria-label="การแจ้งเตือน" @click="toggle">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" />
      </svg>
      <span v-if="unread > 0" class="count">{{ unread > 9 ? '9+' : unread }}</span>
    </button>

    <div v-if="open" class="panel">
      <div class="panel-head">
        <b>การแจ้งเตือน</b>
        <button v-if="unread > 0" type="button" class="link" @click="readAll">อ่านทั้งหมด</button>
      </div>
      <p v-if="items.length === 0" class="empty">ยังไม่มีการแจ้งเตือน</p>
      <ul v-else>
        <li v-for="n in items" :key="n.notif_id" :class="{ unread: !n.is_read }" @click="openItem(n)">
          <span class="ico">{{ ICON[n.type] || '🔔' }}</span>
          <span class="body">
            <b>{{ n.title }}</b>
            <span v-if="n.message" class="msg">{{ n.message }}</span>
            <small>{{ n.created_at }}</small>
          </span>
          <span v-if="!n.is_read" class="dot"></span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.bell-wrap { position: relative; }
.bell { position: relative; background: transparent; border: none; color: #fff; cursor: pointer; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.bell:hover { background: rgba(255, 255, 255, .15); }
.count { position: absolute; top: 2px; right: 0; min-width: 18px; height: 18px; padding: 0 5px; box-sizing: border-box; border-radius: 999px; background: #e11d48; color: #fff; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.panel { position: absolute; right: 0; top: 46px; width: 340px; max-width: 90vw; background: #fff; color: var(--text); border-radius: 14px; box-shadow: 0 12px 40px rgba(0, 0, 0, .25); z-index: 50; overflow: hidden; }
.panel-head { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #eef0f4; }
.link { background: none; border: none; color: var(--primary); font-size: 13px; cursor: pointer; }
.empty { text-align: center; color: var(--muted); padding: 28px 0; margin: 0; font-size: 14px; }
ul { list-style: none; margin: 0; padding: 0; max-height: 380px; overflow-y: auto; }
li { display: flex; gap: 10px; align-items: flex-start; padding: 12px 16px; cursor: pointer; border-bottom: 1px solid #f3f4f7; }
li:hover { background: #f6f8fc; }
li.unread { background: #eef4ff; }
.ico { font-size: 18px; line-height: 1.3; }
.body { flex: 1; display: flex; flex-direction: column; gap: 2px; font-size: 14px; }
.msg { color: var(--muted); font-size: 13px; line-height: 1.5; }
small { color: #9aa3b2; font-size: 11px; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: var(--primary); margin-top: 6px; flex-shrink: 0; }
</style>
