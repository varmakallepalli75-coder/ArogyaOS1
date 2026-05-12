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
  },

  getByPatient: async (patientId, page = 1, pageSize = 20) => {
    const res = await api.get(`/billing/patient/${patientId}`, { params: { page, pageSize } })
    return res.data
  },

  downloadPdf: async (id, billNumber) => {
    const res = await api.get(`/billing/${id}/pdf`, { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `Bill-${billNumber}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }
}
