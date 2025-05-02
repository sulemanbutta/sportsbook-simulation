<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'

const emit = defineEmits(['close'])

const email = ref('')
const password = ref('')
const error = ref(null)
const auth = useAuthStore()

const handleLogin = async () => {
  error.value = null
  try {
    await auth.login({ email: email.value, password: password.value })
    emit('close')
  } catch (err) {
    console.log(err)
    error.value = err.response?.data?.message || 'Login Failed'
  }
}
</script>

<template>
  <v-card>
    <v-card-title class="text-h6">Login</v-card-title>
    <v-card-text>
      <v-text-field v-model="email" label="Email" type="email" required />
      <v-text-field v-model="password" label="Password" type="password" required />
      <v-alert v-if="error" type="error" dense>{{ error }}</v-alert>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn text @click="$emit('close')">Cancel</v-btn>
      <v-btn color="primary" @click="handleLogin">Login</v-btn>
    </v-card-actions>
  </v-card>
</template>
