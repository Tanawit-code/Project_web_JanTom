<script setup>
import NavBar from './components/NavBar.vue';
</script>
<template>
  <NavBar />
  <main class="container" style="padding: 30px 20px;">
    <router-view />
  </main>
</template>
