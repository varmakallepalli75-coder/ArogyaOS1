import api from './api'

export const superAdminService = {
  getDashboard: async () => {
    const res = await api.get('/super-admin/dashboard')
    return res.data
  },
  getHospitals: async (params = {}) => {
    const query = new URLSearchParams(params).toString()
    const res = await api.get(`/super-admin/hospitals?${query}`)
    return res.data
  },
  getHospital: async (id) => {
    const res = await api.get(`/super-admin/hospitals/${id}`)
    return res.data
  },
  onboardHospital: async (data) => {
    const res = await api.post('/super-admin/hospitals', data)
    return res.data
  },
  updateStatus: async (id, status, reason) => {
    const res = await api.put(`/super-admin/hospitals/${id}/status`, { status, reason })
    return res.data
  },
  resetPassword: async (id, newPassword) => {
    const res = await api.post(`/super-admin/hospitals/${id}/reset-password`, { newPassword })
    return res.data
  },
  updateSubscription: async (id, plan) => {
    const res = await api.put(`/super-admin/hospitals/${id}/subscription`, { plan })
    return res.data
  }
}
