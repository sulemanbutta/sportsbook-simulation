<script setup>
import NavBar from '@/components/NavBar.vue'
import { ref, onMounted } from 'vue'

const showExpiredToast = ref(false)

onMounted(() => {
  const expired = localStorage.getItem('sessionExpired')
  if (expired === 'true') {
    showExpiredToast.value = true
    localStorage.removeItem('sessionExpired')
  }
})
</script>

<template>
  <v-app>
    <NavBar />
    <v-main>
      <router-view />

      <v-snackbar v-model="showExpiredToast" color="error" timeout="4000">
        Your session has expired. Please log in again.
      </v-snackbar>
    </v-main>
  </v-app>
</template>
