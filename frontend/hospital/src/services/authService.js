import api from './api'

export const authService = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    if (res.data.success) {
      localStorage.setItem('accessToken', res.data.data.accessToken)
      localStorage.setItem('refreshToken', res.data.data.refreshToken)
      localStorage.setItem('user', JSON.stringify(res.data.data.user))
    }
    return res.data
  },

  logout: () => {
    localStorage.clear()
    window.location.href = '/login'
  },

  getUser: () => {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  },

  isLoggedIn: () => !!localStorage.getItem('accessToken')
}