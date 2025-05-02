<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'

const emit = defineEmits(['close'])

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref(null)
const auth = useAuthStore()

const handleSignup = async () => {
  error.value = null
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }
  try {
    await auth.signup({
      username: username.value,
      email: email.value,
      password: password.value,
    })
    emit('close')
  } catch (err) {
    error.value = err.response?.data?.message || 'Signup failed'
  }
}
</script>

<template>
  <v-card>
    <v-card-title class="text-h6">Sign Up</v-card-title>
    <v-card-text>
      <v-text-field v-model="username" label="Username" required />
      <v-text-field v-model="email" label="Email" type="email" required />
      <v-text-field v-model="password" label="Password" type="password" required />
      <v-text-field v-model="confirmPassword" label="Confirm Password" type="password" required />
      <v-alert v-if="error" type="error" dense>{{ error }}</v-alert>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn text @click="$emit('close')">Cancel</v-btn>
      <v-btn color="primary" @click="handleSignup">Sign Up</v-btn>
    </v-card-actions>
  </v-card>
</template>
