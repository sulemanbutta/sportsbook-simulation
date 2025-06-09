<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'
import ServiceStartup from './ServiceStartup.vue'

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
      <v-text-field
        v-model="email"
        label="Email"
        type="email"
        required
        :disabled="auth.isLoading"
      />
      <v-text-field
        v-model="password"
        label="Password"
        type="password"
        required
        :disabled="auth.isLoading"
      />
      <v-alert v-if="error" type="error" dense>{{ error }}</v-alert>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn text @click="$emit('close')" :disabled="auth.isLoading">
        Cancel
      </v-btn>
      <v-btn
        color="primary"
        @click="handleLogin"
        :loading="auth.isLoading && !auth.isServiceStarting"
        :disabled="auth.isLoading"
      >
        <span v-if="!auth.isLoading">Login</span>
        <span v-else-if="auth.isServiceStarting">Starting...</span>
        <span v-else>Logging in...</span>
      </v-btn>
    </v-card-actions>
  </v-card>

  <!-- Service startup modal -->
  <ServiceStartup
    :show="auth.isServiceStarting"
    :attempt="auth.retryAttempt"
    :message="auth.startupMessage"
  />
</template>
