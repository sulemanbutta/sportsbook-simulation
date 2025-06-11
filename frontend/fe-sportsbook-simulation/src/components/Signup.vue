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

// Validation rules
const usernameRules = [
  v => !!v || 'Username is required',
  v => v.length >= 3 || 'Username must be at least 3 characters',
  v => v.length <= 20 || 'Username must be less than 20 characters',
  v => /^[a-zA-Z0-9_]+$/.test(v) || 'Username can only contain letters, numbers, and underscores'
]

const emailRules = [
  v => !!v || 'Email is required',
  v => /.+@.+\..+/.test(v) || 'Email must be valid'
]

const passwordRules = [
  v => !!v || 'Password is required',
  v => v.length >= 8 || 'Password must be at least 8 characters',
  v => /(?=.*[a-z])/.test(v) || 'Password must contain at least one lowercase letter',
  v => /(?=.*[A-Z])/.test(v) || 'Password must contain at least one uppercase letter',
  v => /(?=.*\d)/.test(v) || 'Password must contain at least one number',
  v => /(?=.*[@$!%*?&])/.test(v) || 'Password must contain at least one special character (@$!%*?&)'
]

const confirmPasswordRules = [
  v => !!v || 'Please confirm your password',
  v => v === password.value || 'Passwords do not match'
]

// Form validation
const form = ref(null)
const isFormValid = ref(false)

// Check if all fields are valid
const canSubmit = computed(() => {
  return isFormValid.value &&
    username.value &&
    email.value &&
    password.value &&
    confirmPassword.value &&
    password.value == confirmPassword.value
})

const handleSignup = async () => {
  error.value = null

  // Validate form
  const { valid } = await form.value.validate()
  if (!valid) {
    error.value = 'Please fix the errors above'
    return
  }
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
      <v-form ref="form" v-model="isFormValid" @submit.prevent="handleSignup">
        <v-text-field
          v-model="username"
          label="Username"
          :rules="usernameRules"
          validate-on="blur"
          required
        />
        <v-text-field
          v-model="email"
          label="Email"
          type="email"
          :rules="emailRules"
          validate-on="blur"
          required
        />
        <v-text-field
          v-model="password"
          label="Password"
          type="password"
          :rules="passwordRules"
          validate-on="blur"
          required
        />
        <v-text-field
          v-model="confirmPassword"
          label="Confirm Password"
          type="password"
          :rules="confirmPasswordRules"
          validate-on="blur"
          required
        />
        <v-alert v-if="error" type="error" dense>{{ error }}</v-alert>
      </v-form>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn text @click="$emit('close')" :disabled="auth.isLoading">
        Cancel
      </v-btn>
      <v-btn color="primary" @click="handleSignup" :disabled="!canSubmit || auth.isLoading" :loading="auth.isLoading">
        Sign Up
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
