import axios from 'axios'

axios.interceptors.response.use(
  response => response,
  error => {
    const token = localStorage.getItem('token')
    const isAuthError = [401, 403].includes(error?.response?.status)

    if (isAuthError) {
      localStorage.removeItem('token')

      if (token) {
        // Token was present but failed => session expired
        localStorage.setItem('sessionExpired', 'true')
        window.location.href = '/'
      } else {
        // No token => just redirect to home or wherever
        window.location.href = '/'
      }
    }

    return Promise.reject(error)
  }
)

export default axios