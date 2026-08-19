import api from './api'

export const patientService = {
  getAll: async (search = '', page = 1, pageSize = 20) => {
    const res = await api.get('/patient', {
      params: { search, page, pageSize }
    })
    return res.data
  },

  getById: async (id) => {
    const res = await api.get(`/patient/${id}`)
    return res.data
  },

  create: async (data) => {
    const res = await api.post('/patient', data)
    return res.data
  },

  update: async (id, data) => {
    const res = await api.put(`/patient/${id}`, data)
    return res.data
  },

  search: async (q) => {
    const res = await api.get('/patient/search', { params: { q } })
    return res.data
  }
}