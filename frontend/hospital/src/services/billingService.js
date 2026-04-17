import api from './api'

export const billingService = {
  getAll: async (date = null, search = '', page = 1, pageSize = 20) => {
    const params = { page, pageSize }
    if (date) params.date = date
    if (search) params.search = search
    const res = await api.get('/billing', { params })
    return res.data
  },

  getById: async (id) => {
    const res = await api.get(`/billing/${id}`)
    return res.data
  },

  create: async (data) => {
    const res = await api.post('/billing', data)
    return res.data
  },

  recordPayment: async (data) => {
    const res = await api.post('/billing/payment', data)
    return res.data
  }
}
