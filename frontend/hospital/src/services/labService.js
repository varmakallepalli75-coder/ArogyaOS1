import api from './api'

export const labService = {
  getTests: async (search = '') => {
    const res = await api.get('/lab/tests', { params: search ? { search } : {} })
    return res.data
  },

  createTest: async (data) => {
    const res = await api.post('/lab/tests', data)
    return res.data
  },

  getOrders: async (status = '', search = '', date = '', page = 1, pageSize = 20) => {
    const params = { page, pageSize }
    if (status !== '') params.status = status
    if (search) params.search = search
    if (date) params.date = date
    const res = await api.get('/lab/orders', { params })
    return res.data
  },

  getOrderById: async (id) => {
    const res = await api.get(`/lab/orders/${id}`)
    return res.data
  },

  createOrder: async (data) => {
    const res = await api.post('/lab/orders', data)
    return res.data
  },

  collectSample: async (data) => {
    const res = await api.post('/lab/orders/collect-sample', data)
    return res.data
  },

  enterResults: async (data) => {
    const res = await api.post('/lab/orders/results', data)
    return res.data
  },

  reportOrder: async (data) => {
    const res = await api.post('/lab/orders/report', data)
    return res.data
  },

  getByPatient: async (patientId, page = 1, pageSize = 20) => {
    const res = await api.get(`/lab/orders/patient/${patientId}`, { params: { page, pageSize } })
    return res.data
  }
}
