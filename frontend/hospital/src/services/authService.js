import api from './api'
import { isSuperAdmin } from '@medcareaxis/shared/src/roles.js'

// activeRole lives in sessionStorage (per-tab) so two tabs can be logged in as different roles
// tokens live in localStorage (keyed by role) so they survive page refresh within the same tab
const getRole = () => sessionStorage.getItem('activeRole')

export const authService = {
  login: async (email, password) => {
    let res
    try {
      res = await api.post('/auth/login', { email, password })
    } catch (err) {
      // The API returns a non-2xx status (401 for bad credentials, 500 on an
      // internal error, 429 when rate-limited). Surface a real message instead
      // of letting this throw up to a generic "something went wrong".
      const data = err.response?.data
      if (data && typeof data === 'object' && 'success' in data) return data
      if (err.response) {
        const msg = err.response.status === 429
          ? 'Too many attempts. Please wait a minute and try again.'
          : data?.detail || data?.title
            || `Login failed (server error ${err.response.status}). Please try again.`
        return { success: false, message: msg }
      }
      return { success: false, message: 'Cannot reach the server. Check your connection and try again.' }
    }
    if (res.data.success) {
      const user  = res.data.data.user
      const isSA  = isSuperAdmin(user.role)
      const role  = isSA ? 'superadmin' : 'hospital'
      sessionStorage.setItem('activeRole', role)
      if (isSA) {
        localStorage.setItem('sa_accessToken', res.data.data.accessToken)
        localStorage.setItem('sa_user', JSON.stringify(user))
      } else {
        localStorage.setItem('accessToken', res.data.data.accessToken)
        localStorage.setItem('refreshToken', res.data.data.refreshToken)
        localStorage.setItem('user', JSON.stringify(user))
      }
    }
    return res.data
  },

  logout: async () => {
    try { await api.post('/auth/logout') } catch { /* ignore */ }
    const role = getRole()
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
  },

  changePassword: async (currentPassword, newPassword) => {
    const res = await api.post('/auth/change-password', { currentPassword, newPassword })
    return res.data
  },

  forgotPassword: async (email) => {
    const res = await api.post('/auth/forgot-password', { email })
    return res.data
  },

  resetPassword: async (email, code, newPassword) => {
    const res = await api.post('/auth/reset-password', { email, code, newPassword })
    return res.data
  },

  getUser: () => {
    const role = getRole()
    const raw  = role === 'superadmin'
      ? localStorage.getItem('sa_user')
      : localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  },

  saveUser: (user) => {
    const key = getRole() === 'superadmin' ? 'sa_user' : 'user'
    localStorage.setItem(key, JSON.stringify(user))
  },

  // Pull the caller's live role / permissions / modules from the server so an
  // admin's changes take effect without the user logging out and back in.
  refreshUser: async () => {
    try {
      const res = await api.get('/me')
      if (res.data?.success && res.data.data) {
        authService.saveUser(res.data.data)
        return res.data.data
      }
    } catch { /* offline or expired — keep the cached user */ }
    return null
  },

  isLoggedIn: () => {
    const role = getRole()
    return !!(role === 'superadmin'
      ? localStorage.getItem('sa_accessToken')
      : localStorage.getItem('accessToken'))
  },

  getToken: () => {
    const role = getRole()
    return role === 'superadmin'
      ? localStorage.getItem('sa_accessToken')
      : localStorage.getItem('accessToken')
  }
}
