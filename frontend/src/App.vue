<script setup>
import NavBar from './components/NavBar.vue';
</script>
<template>
  <NavBar />
  <main class="container" style="padding-top: 28px; padding-bottom: 48px;">
    <router-view />
  </main>
</template>
