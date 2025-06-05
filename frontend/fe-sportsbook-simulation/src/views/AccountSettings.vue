<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'
import axios from 'axios'


const auth = useAuthStore()
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const passwordSuccess = ref('')
const passwordError = ref('')

onMounted(() => {
  if (!auth.user) {
    auth.fetchUser()
  }
})

console.log(auth.user)
function formatDate(isoString) {
  const date = new Date(isoString)
  return date.toLocaleDateString('en-US', {
    year: '2-digit',
    month: '2-digit',
    day: 'numeric',
  })
}

const updatePassword = async () => {
  passwordSuccess.value = ''
  passwordError.value = ''

  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = 'Passwords do not match'
    return
  }

  try {
    const AUTH_API = import.meta.env.VITE_AUTH_API_URL;
    const res = await axios.post(
      `${AUTH_API}/auth/change-password`,
      {
        currentPassword: currentPassword.value,
        newPassword: newPassword.value,
      },
      {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      },
    )
    passwordSuccess.value = res.data.message || 'Password updated successfully.'
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (err) {
    passwordError.value = err.response?.data?.message || 'Failed to update password.'
  }
}
</script>

<template>
  <v-container>
    <v-card class="pa-6">
      <v-card-title class="text-h5">Account Settings</v-card-title>
      <v-divider class="my-4" />

      <v-row>
        <v-col cols="12" sm="6">
          <v-list-item>
            <v-list-item-title>User ID</v-list-item-title>
            <v-list-item-subtitle>{{ auth.user?.user_id || 'N/A' }}</v-list-item-subtitle>
          </v-list-item>
        </v-col>

        <v-col cols="12" sm="6">
          <v-list-item>
            <v-list-item-title>Email</v-list-item-title>
            <v-list-item-subtitle>{{ auth.user?.email || 'N/A' }}</v-list-item-subtitle>
          </v-list-item>
        </v-col>

        <v-col cols="12" sm="6">
          <v-list-item>
            <v-list-item-title>Username</v-list-item-title>
            <v-list-item-subtitle>{{ auth.user?.username || 'N/A' }}</v-list-item-subtitle>
          </v-list-item>
        </v-col>

        <v-col cols="12" sm="6">
          <v-list-item>
            <v-list-item-title>Creation Date</v-list-item-title>
            <v-list-item-subtitle>{{
              formatDate(auth.user?.created_at) || 'N/A'
            }}</v-list-item-subtitle>
          </v-list-item>
        </v-col>
      </v-row>

      <v-divider class="my-6" />

      <h3>Change Password</h3>
      <v-text-field
        v-model="currentPassword"
        label="Current Password"
        type="password"
        autocomplete="current-password"
      />
      <v-text-field
        v-model="newPassword"
        label="New Password"
        type="password"
        autocomplete="new-password"
      />
      <v-text-field
        v-model="confirmPassword"
        label="Confirm New Password"
        type="password"
        autocomplete="new-password"
      />
      <v-btn color="primary" @click="updatePassword">Update Password</v-btn>
      <v-alert v-if="passwordSuccess" type="success" class="mt-2">{{ passwordSuccess }}</v-alert>
      <v-alert v-if="passwordError" type="error" class="mt-2">{{ passwordError }}</v-alert>
    </v-card>
  </v-container>
</template>
