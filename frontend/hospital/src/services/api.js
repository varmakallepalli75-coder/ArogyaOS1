import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

const getToken = () => {
  const role = sessionStorage.getItem('activeRole')
  return role === 'superadmin'
    ? localStorage.getItem('sa_accessToken')
    : localStorage.getItem('accessToken')
}

// ─── Add token to every request ───────────────────────
api.interceptors.request.use(config => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ─── Handle token expiry ──────────────────────────────
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      const role = sessionStorage.getItem('activeRole')
      if (role === 'superadmin') {
        localStorage.removeItem('sa_accessToken')
        localStorage.removeItem('sa_user')
      } else {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
      }
      sessionStorage.removeItem('activeRole')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
