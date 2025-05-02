<script setup>
import { useRouter, useRoute } from 'vue-router'
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'
import Login from './Login.vue'
import Signup from './Signup.vue'

const router = useRouter()
const route = useRoute()
const drawer = ref(false)

const auth = useAuthStore()

const isLoggedIn = computed(() => auth.isAuthenticated)

const showLoginDialog = ref(false)
const showSignupDialog = ref(false)

const logout = () => {
  auth.logout()
  router.push('/')
}

const closeDialog = () => {
  showLoginDialog.value = false
  showSignupDialog.value = false
}
</script>

<template>
  <v-app-bar app color="primary" dark>
    <!-- Mobile drawer toggle -->
    <v-app-bar-nav-icon @click="drawer = !drawer" />

    <!-- App Title -->
    <v-toolbar-title class="cursor-pointer" @click="router.push('/')"> Sportsbook </v-toolbar-title>

    <v-spacer />

    <!-- Always visible -->
    <v-btn text to="/betting">Sportsbook</v-btn>

    <!-- Only for logged-in users -->
    <template v-if="auth.isAuthenticated">
      <v-btn text to="/wallet">Wallet</v-btn>
      <v-btn text to="/bets">Bet History</v-btn>
      <v-btn text to="/account">Account Settings</v-btn>
      <v-btn text @click="logout" color="red">Logout</v-btn>
    </template>

    <!-- For guests -->
    <template v-else>
      <v-btn text @click="showLoginDialog = true">Login</v-btn>
      <v-btn text @click="showSignupDialog = true">Sign Up</v-btn>
    </template>
  </v-app-bar>

  <!-- Mobile Drawer -->
  <v-navigation-drawer v-model="drawer" app temporary>
    <v-list>
      <v-list-item to="/betting" title="Sportsbook" />

      <template v-if="auth.isAuthenticated">
        <v-list-item to="/wallet" title="Wallet" />
        <v-list-item to="/bets" title="Bet History" />
        <v-list-item to="/account" title="Account Settings" />
        <v-list-item @click="logout" title="Logout" />
      </template>

      <template v-else>
        <v-list-item @click="showLoginDialog = true" title="Login" />
        <v-list-item @click="showSignupDialog = true" title="Sign Up" />
      </template>
    </v-list>
  </v-navigation-drawer>

  <!-- Login Modal -->
  <v-dialog v-model="showLoginDialog" persistent max-width="500">
    <Login @close="closeDialog" />
  </v-dialog>

  <!-- Signup Modal -->
  <v-dialog v-model="showSignupDialog" persistent max-width="500">
    <Signup @close="closeDialog" />
  </v-dialog>
</template>
