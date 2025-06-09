import { defineStore } from 'pinia'
import axios from 'axios'
import { jwtDecode } from 'jwt-decode'


export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: null,
    isLoading: false,
    isServiceStarting: false,
    startupMessage: '',
    retryAttempt: 0
  }),

  getters: {
    isAuthenticated: (state) => {
      if (!state.token) return false
      try {
        const { exp } = jwtDecode(state.token)
        return exp * 1000 > Date.now()
      } catch {
        return false
      }
    }
  },

  actions: {
    initializeAuth() {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const { exp } = jwtDecode(token)
          if (exp * 1000 < Date.now()) {
            this.logout()
          } else {
            this.token = token
            this.fetchUser()
          }
        } catch {
          this.logout()
        }
      }
    },

    async login({ email, password }) {
      console.log(email, password)
      this.isLoading = true
      this.isServiceStarting = false
      this.retryAttempt = 0

      try {
        const AUTH_API = import.meta.env.VITE_AUTH_API_URL;
        console.log("AUTH_API: ", AUTH_API)

        const res = await apiClient.makeRequest(
          () => axios.post(`${AUTH_API}/auth/login`, { email, password }),
          {
            onServiceStarting: (attempt, maxAttempts) => {
              this.isServiceStarting = true
              this.retryAttempt = attempt
              this.startupMessage = `Starting auth service... (${attempt}/${maxAttempts})`
            },
            onRetry: (attempt, error) => {
              console.log(`Retry attempt ${attempt}:`, error.message)
            }
          }
        );

        this.token = res.data.token
        localStorage.setItem('token', this.token)
        await this.fetchUser()
      } catch (error) {
        console.error('Login failed:', error)
        throw error
      } finally {
        this.isLoading = false
        this.isServiceStarting = false
        this.startupMessage = ''
        this.retryAttempt = 0
      }
    },

    async signup({ username, email, password }) {
      this.isLoading = true
      this.isServiceStarting = false

      try {
        const AUTH_API = import.meta.env.VITE_AUTH_API_URL;

        const res = await apiClient.makeRequest(
          () => axios.post(`${AUTH_API}/auth/register`, { username, email, password }),
          {
            onServiceStarting: (attempt, maxAttempts) => {
              this.isServiceStarting = true
              this.startupMessage = `Starting auth service... (${attempt}/${maxAttempts})`
            }
          }
        );
        this.token = res.data.token
        localStorage.setItem('token', this.token)
        await this.fetchUser()
      } catch (error) {
        console.error('Failed to register user:', error)
        throw error
      } finally {
        this.isLoading = false
        this.isServiceStarting = false
        this.startupMessage = ''
      }
    },

    async fetchUser() {
      if (!this.token) return
      try {
        const AUTH_API = import.meta.env.VITE_AUTH_API_URL;
        const res = await axios.get(`${AUTH_API}/auth/account`, {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        })
        this.user = res.data
      } catch (error) {
        console.error('Failed to fetch user:', error)
        this.logout()
      }
    },
    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem('token')
    },
  },
})
