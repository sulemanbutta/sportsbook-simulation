<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import Login from '@/components/Login.vue'
import Signup from '@/components/Signup.vue'

const router = useRouter()
const goTo = (path) => router.push(path)

const auth = useAuthStore()

const showLoginDialog = ref(false)
const showSignupDialog = ref(false)

const closeDialog = () => {
  showLoginDialog.value = false
  showSignupDialog.value = false
}
</script>

<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" md="8" lg="6">
        <!-- Not Logged In -->
        <div v-if="!auth.isAuthenticated">
          <v-card class="pa-6 text-center">
            <v-card-title class="text-h4 font-weight-bold"
              >Welcome to the Sportsbook Simulator</v-card-title
            >
            <v-card-text class="text-subtitle-1 mb-6">
              Explore betting odds, but sign up or log in to place bets!
            </v-card-text>
            <v-row justify="center" class="mt-4">
              <v-btn color="primary" class="mr-4" @click="showLoginDialog = true">Login</v-btn>
              <v-btn color="success" @click="showSignupDialog = true">Sign Up</v-btn>
            </v-row>
          </v-card>
        </div>

        <!-- Logged In -->
        <div v-else>
          <v-card class="pa-6">
            <v-card-title class="text-h4 font-weight-bold"
              >Welcome back, {{ auth.user?.username || 'User' }}!</v-card-title
            >
            <v-card-text class="text-subtitle-1">
              Access your wallet, place bets, and track your history below.
            </v-card-text>
            <v-divider class="my-4" />
            <v-row dense>
              <v-col cols="12" sm="4">
                <v-btn block color="primary" @click="goTo('/betting')">📊 Sportsbook</v-btn>
              </v-col>
              <v-col cols="12" sm="4">
                <v-btn block color="info" @click="goTo('/bets')">📝 Bet History</v-btn>
              </v-col>
              <v-col cols="12" sm="4">
                <v-btn block color="success" @click="goTo('/wallet')">💼 Wallet</v-btn>
              </v-col>
            </v-row>
          </v-card>
        </div>
      </v-col>
    </v-row>
  </v-container>

  <!-- Login Modal -->
  <v-dialog v-model="showLoginDialog" persistent max-width="500">
    <Login @close="closeDialog" />
  </v-dialog>

  <!-- Signup Modal -->
  <v-dialog v-model="showSignupDialog" persistent max-width="500">
    <Signup @close="closeDialog" />
  </v-dialog>
</template>
