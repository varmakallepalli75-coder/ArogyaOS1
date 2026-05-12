import api from './api'

export const depositService = {
  getAll: async (date = null, search = '', page = 1, pageSize = 20) => {
    const params = { page, pageSize }
    if (date) params.date = date
    if (search) params.search = search
    const res = await api.get('/deposits', { params })
    return res.data
  },

  getSummary: async (patientId, admissionId = null) => {
    const params = {}
    if (admissionId) params.admissionId = admissionId
    const res = await api.get(`/deposits/summary/${patientId}`, { params })
    return res.data
  },

  collect: async (data) => {
    const res = await api.post('/deposits/collect', data)
    return res.data
  },

  refund: async (data) => {
    const res = await api.post('/deposits/refund', data)
    return res.data
  },

  adjust: async (data) => {
    const res = await api.post('/deposits/adjust', data)
    return res.data
  },
}
