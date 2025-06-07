import axios from 'axios'

axios.interceptors.response.use(
  response => response,
  error => {
    if ([401, 403].includes(error?.response?.status)) {
      localStorage.removeItem('token')
      localStorage.setItem('sessionExpired', 'true')
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

export default axios