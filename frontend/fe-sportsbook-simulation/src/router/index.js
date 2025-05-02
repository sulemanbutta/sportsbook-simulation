import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import Home from '@/views/Home.vue'
import Betting from '@/views/Betting.vue'
import Wallet from '@/views/Wallet.vue'
import BetHistory from '@/views/BetHistory.vue'
import AccountSettings from '@/views/AccountSettings.vue'
import Login from '@/components/Login.vue'
import Signup from '@/components/Signup.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/login', name: 'Login', component: Login },
  { path: '/signup', name: 'Signup', component: Signup },
  { path: '/betting', name: 'Betting', component: Betting },

  //Protected Routes
  {
    path: '/wallet',
    name: 'Wallet',
    component: Wallet,
    meta: { requiresAuth: true },
  },
  {
    path: '/bets',
    name: 'BetHistory',
    component: BetHistory,
    meta: { requiresAuth: true },
  },
  {
    path: '/account',
    name: 'AccountSettings',
    component: AccountSettings,
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    next({ name: 'Home' })
  } else {
    next()
  }
})

export default router
