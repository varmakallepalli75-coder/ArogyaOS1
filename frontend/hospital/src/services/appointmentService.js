import api from './api'

export const appointmentService = {
  getToday: async (doctorId = null) => {
    const params = doctorId ? { doctorId } : {}
    const res = await api.get('/appointment/today', { params })
    return res.data
  },

  getAll: async (date = null, doctorId = null, page = 1, pageSize = 20) => {
    const params = { page, pageSize }
    if (date) params.date = date
    if (doctorId) params.doctorId = doctorId
    const res = await api.get('/appointment', { params })
    return res.data
  },

  create: async (data) => {
    const res = await api.post('/appointment', data)
    return res.data
  },

  updateStatus: async (id, status, cancelledReason = null) => {
    const res = await api.put(`/appointment/${id}/status`, {
      status, cancelledReason
    })
    return res.data
  },

  getByPatient: async (patientId, page = 1, pageSize = 20) => {
    const res = await api.get(`/appointment/patient/${patientId}`, { params: { page, pageSize } })
    return res.data
  }
}