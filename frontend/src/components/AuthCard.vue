<script setup>
defineProps({ title: String, subtitle: String });
</script>

<template>
  <div class="auth-wrap">
    <div class="auth-card">
      <div class="auth-head">
        <div class="auth-logo">
          <slot name="icon">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </slot>
        </div>
        <h2>{{ title }}</h2>
        <p v-if="subtitle">{{ subtitle }}</p>
      </div>
      <div class="auth-body"><slot /></div>
    </div>
  </div>
</template>

<style scoped>
.auth-wrap { max-width: 440px; margin: 32px auto; padding: 0 12px; }
.auth-card { background: var(--card-bg); border-radius: 18px; overflow: hidden; box-shadow: 0 10px 40px rgba(30, 61, 107, .15); }
.auth-head { background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%); color: #fff; text-align: center; padding: 28px 24px 24px; }
.auth-logo { width: 56px; height: 56px; margin: 0 auto 12px; border-radius: 16px; background: rgba(255, 255, 255, .18); display: flex; align-items: center; justify-content: center; }
.auth-head h2 { margin: 0; font-size: 22px; }
.auth-head p { margin: 6px 0 0; font-size: 14px; opacity: .85; }
.auth-body { padding: 24px; }
</style>
