//import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './plugins/axios'
import apiClient from './utils/api.js'
import { createPinia } from 'pinia'
import { useAuthStore } from './stores/useAuthStore'
import { createVuetify } from 'vuetify'
import '@mdi/font/css/materialdesignicons.css' // Ensure you are using css-loader
import 'vuetify/styles'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const app = createApp(App)
const pinia = createPinia()
const vuetify = createVuetify({
  components,
  directives,
  iconfront: 'mdi',
})

app.use(router)
app.use(pinia)
app.use(vuetify)

const auth = useAuthStore()
auth.initializeAuth()

apiClient.warmUpServices()

app.mount('#app')
