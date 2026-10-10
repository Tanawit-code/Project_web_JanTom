<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: String,
  type: { type: String, default: 'text' },
  placeholder: String,
  icon: String, // user | mail | lock | id
  autocomplete: String,
  required: { type: Boolean, default: true },
});
defineEmits(['update:modelValue']);

const show = ref(false);
const isPassword = computed(() => props.type === 'password');
const inputType = computed(() => (isPassword.value && show.value ? 'text' : props.type));

const ICONS = {
  user: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z'],
  mail: ['M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', 'M22 6l-10 7L2 6'],
  lock: ['M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z', 'M7 11V7a5 5 0 0 1 10 0v4'],
  id: ['M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z', 'M8 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', 'M5 16c.5-1.5 1.8-2 3-2s2.5.5 3 2', 'M14 9h5', 'M14 13h5'],
  eye: ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z', 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'],
  'eye-off': ['M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94', 'M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19', 'M14.12 14.12a3 3 0 1 1-4.24-4.24', 'M1 1l22 22'],
};
</script>

<template>
  <label class="field">
    <span v-if="label" class="label">{{ label }}</span>
    <span class="box">
      <svg v-if="icon" class="lead" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path v-for="d in ICONS[icon]" :key="d" :d="d" />
      </svg>
      <input
        :value="modelValue"
        :type="inputType"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :required="required"
        :class="{ 'has-icon': icon, 'has-toggle': isPassword }"
        @input="$emit('update:modelValue', $event.target.value)"
      />
      <button
        v-if="isPassword"
        type="button"
        class="toggle"
        :aria-label="show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'"
        :title="show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'"
        @click="show = !show"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path v-for="d in ICONS[show ? 'eye-off' : 'eye']" :key="d" :d="d" />
        </svg>
      </button>
    </span>
  </label>
</template>

<style scoped>
.field { display: block; margin-bottom: 14px; }
.label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: var(--text); }
.box { position: relative; display: block; }
.lead { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: #9aa3b2; pointer-events: none; }
input { margin: 0; padding: 11px 14px; border: 1.5px solid #d7dae0; border-radius: 10px; background: #fff; transition: border-color .15s, box-shadow .15s; }
input.has-icon { padding-left: 40px; }
input.has-toggle { padding-right: 44px; }
input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(43, 87, 151, .15); }
.box:focus-within .lead { color: var(--primary); }
.toggle { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); width: 34px; height: 34px; border: none; background: transparent; color: #7b8494; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.toggle:hover { background: #eef1f6; color: var(--primary); }
</style>
