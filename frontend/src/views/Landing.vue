<script setup>
import { computed } from 'vue';
import { authState } from '../services/auth';
import Home from './Home.vue';
import GuestHome from './GuestHome.vue';

const page = computed(() => authState.user ? Home : GuestHome);
</script>

<template><component :is="page" /></template>
