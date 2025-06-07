import { defineStore } from 'pinia'
import axios from 'axios'
import { jwtDecode } from 'jwt-decode'


export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: null,
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
      const AUTH_API = import.meta.env.VITE_AUTH_API_URL;
      console.log("AUTH_API: ", AUTH_API)
      const res =  await axios.post(`${AUTH_API}/auth/login`, { email, password });
      console.log('res:', res)
      this.token = res.data.token
      localStorage.setItem('token', this.token)
      await this.fetchUser()
    },
    async signup({ username, email, password }) {
      try {
        const AUTH_API = import.meta.env.VITE_AUTH_API_URL;
        const res = await axios.post(`${AUTH_API}/auth/register`, {
          username,
          email,
          password,
        })
        this.token = res.data.token
        localStorage.setItem('token', this.token)
        await this.fetchUser()
      } catch (error) {
        console.error('Failed to register user:', error)
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
      localStorage.removeItem('token')
    },
  },
})
