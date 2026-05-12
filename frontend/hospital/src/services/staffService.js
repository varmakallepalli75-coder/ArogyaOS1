import api from './api'

export const staffService = {
  getAll: async (search = '') => {
    const res = await api.get('/staff', { params: search ? { search } : {} })
    return res.data
  },

  getById: async (id) => {
    const res = await api.get(`/staff/${id}`)
    return res.data
  },

  create: async (data) => {
    const res = await api.post('/staff', data)
    return res.data
  },

  update: async (id, data) => {
    const res = await api.put(`/staff/${id}`, data)
    return res.data
  },

  updatePermissions: async (id, permissions) => {
    const res = await api.put(`/staff/${id}/permissions`, permissions)
    return res.data
  },

  toggleStatus: async (id) => {
    const res = await api.put(`/staff/${id}/toggle-status`)
    return res.data
  },

  resetPassword: async (id, newPassword) => {
    const res = await api.post(`/staff/${id}/reset-password`, { newPassword })
    return res.data
  },
}
