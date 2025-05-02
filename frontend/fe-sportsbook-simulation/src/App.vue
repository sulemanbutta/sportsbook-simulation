<script setup>
import NavBar from '@/components/NavBar.vue'
</script>

<template>
  <v-app>
    <NavBar />
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>
