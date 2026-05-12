import api from './api'

export const ipdService = {
  getAdmissions: async (status = '', search = '', page = 1, pageSize = 20) => {
    const params = { page, pageSize }
    if (status !== '') params.status = status
    if (search) params.search = search
    const res = await api.get('/ipd', { params })
    return res.data
  },

  getById: async (id) => {
    const res = await api.get(`/ipd/${id}`)
    return res.data
  },

  admit: async (data) => {
    const res = await api.post('/ipd/admit', data)
    return res.data
  },

  recordVitals: async (data) => {
    const res = await api.post('/ipd/vitals', data)
    return res.data
  },

  discharge: async (data) => {
    const res = await api.post('/ipd/discharge', data)
    return res.data
  },

  getWards: async () => {
    const res = await api.get('/ipd/wards')
    return res.data
  },

  getAvailableBeds: async (wardId) => {
    const res = await api.get('/ipd/beds/available', { params: { wardId } })
    return res.data
  },

  createWard: async (data) => {
    const res = await api.post('/ipd/wards', data)
    return res.data
  },

  createBed: async (data) => {
    const res = await api.post('/ipd/beds', data)
    return res.data
  },
}
