import api from './api'
import { isSuperAdmin } from '@medcareaxis/shared/src/roles.js'

// activeRole lives in sessionStorage (per-tab) so two tabs can be logged in as different roles
// tokens live in localStorage (keyed by role) so they survive page refresh within the same tab
const getRole = () => sessionStorage.getItem('activeRole')

export const authService = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
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

  getUser: () => {
    const role = getRole()
    const raw  = role === 'superadmin'
      ? localStorage.getItem('sa_user')
      : localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
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
