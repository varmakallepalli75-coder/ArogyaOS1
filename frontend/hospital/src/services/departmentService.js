import api from './api'

export const departmentService = {
  getAll: async () => {
    const res = await api.get('/department')
    return res.data
  },

  create: async (data) => {
    const res = await api.post('/department', data)
    return res.data
  },

  getDoctors: async (departmentId = null) => {
    const params = departmentId ? { departmentId } : {}
    const res = await api.get('/department/doctors', { params })
    return res.data
  },

  getDoctorById: async (id) => {
    const res = await api.get(`/department/doctors/${id}`)
    return res.data
  },

  createDoctor: async (data) => {
    const res = await api.post('/department/doctors', data)
    return res.data
  },

  updateDoctor: async (id, data) => {
    const res = await api.put(`/department/doctors/${id}`, data)
    return res.data
  },

  updateAvailability: async (id, isAvailable) => {
    const res = await api.put(`/department/doctors/${id}/availability`, isAvailable)
    return res.data
  }
}
