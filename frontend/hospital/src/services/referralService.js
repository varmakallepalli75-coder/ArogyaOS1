import api from './api'

export const referralService = {
  send: async (data) => {
    const res = await api.post('/referral', data)
    return res.data
  },

  getInbox: async (page = 1, pageSize = 20, status = '') => {
    const params = { page, pageSize }
    if (status) params.status = status
    const res = await api.get('/referral/inbox', { params })
    return res.data
  },

  getSent: async (page = 1, pageSize = 20, status = '') => {
    const params = { page, pageSize }
    if (status) params.status = status
    const res = await api.get('/referral/sent', { params })
    return res.data
  },

  getInboxCount: async () => {
    const res = await api.get('/referral/inbox/count')
    return res.data
  },

  getHospitals: async () => {
    const res = await api.get('/referral/hospitals')
    return res.data
  },

  getById: async (id) => {
    const res = await api.get(`/referral/${id}`)
    return res.data
  },

  accept: async (id, existingPatientId = null) => {
    const res = await api.put(`/referral/${id}/accept`, { existingPatientId })
    return res.data
  },

  decline: async (id, reason) => {
    const res = await api.put(`/referral/${id}/decline`, { reason })
    return res.data
  },

  complete: async (id, outcomeNotes = '') => {
    const res = await api.put(`/referral/${id}/complete`, { outcomeNotes })
    return res.data
  },

  cancel: async (id) => {
    const res = await api.put(`/referral/${id}/cancel`)
    return res.data
  }
}
