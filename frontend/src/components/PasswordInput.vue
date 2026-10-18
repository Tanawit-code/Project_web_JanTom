<script setup>
import { ref } from 'vue';
defineProps({ modelValue: { type: String, default: '' }, autocomplete: String });
defineEmits(['update:modelValue']);
const show = ref(false);
</script>

<template>
  <span class="pw">
    <input :type="show ? 'text' : 'password'" :value="modelValue" :autocomplete="autocomplete"
           @input="$emit('update:modelValue', $event.target.value)">
    <button type="button" class="eye" :aria-label="show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'"
            :title="show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'" @click="show = !show">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <template v-if="show">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
          <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" /><path d="M1 1l22 22" />
        </template>
        <template v-else>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
        </template>
      </svg>
    </button>
  </span>
</template>

<style scoped>
.pw { position: relative; display: block; }
.pw input { width: 100%; box-sizing: border-box; padding: 11px 46px 11px 12px; border: 1px solid #d8dee8; border-radius: 9px; font: inherit; }
.pw .eye { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); width: 34px; height: 34px; padding: 0; border: 0; background: transparent; color: #7b8494; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.pw .eye:hover { background: #eef1f6; color: var(--primary); }
</style>
