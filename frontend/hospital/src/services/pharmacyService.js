import api from './api'

export const pharmacyService = {
  getMedicines: async (search = '', lowStockOnly = false, page = 1, pageSize = 20) => {
    const params = { page, pageSize }
    if (search) params.search = search
    if (lowStockOnly) params.lowStockOnly = true
    const res = await api.get('/pharmacy/medicines', { params })
    return res.data
  },

  getMedicineById: async (id) => {
    const res = await api.get(`/pharmacy/medicines/${id}`)
    return res.data
  },

  addMedicine: async (data) => {
    const res = await api.post('/pharmacy/medicines', data)
    return res.data
  },

  addStock: async (data) => {
    const res = await api.post('/pharmacy/stock', data)
    return res.data
  },

  getBatches: async (medicineId) => {
    const res = await api.get(`/pharmacy/medicines/${medicineId}/batches`)
    return res.data
  },

  getOrders: async (status = '', search = '', page = 1, pageSize = 20) => {
    const params = { page, pageSize }
    if (status !== '') params.status = status
    if (search) params.search = search
    const res = await api.get('/pharmacy/orders', { params })
    return res.data
  },

  getOrderById: async (id) => {
    const res = await api.get(`/pharmacy/orders/${id}`)
    return res.data
  },

  createOrder: async (data) => {
    const res = await api.post('/pharmacy/orders', data)
    return res.data
  },

  dispenseOrder: async (data) => {
    const res = await api.post('/pharmacy/orders/dispense', data)
    return res.data
  },

  getTransactions: async (medicineId = null, page = 1, pageSize = 50) => {
    const params = { page, pageSize }
    if (medicineId) params.medicineId = medicineId
    const res = await api.get('/pharmacy/transactions', { params })
    return res.data
  },

  getPendingPrescriptions: async (search = '') => {
    const params = search ? { search } : {}
    const res = await api.get('/pharmacy/prescriptions', { params })
    return res.data
  },

  markPrescriptionDispensed: async (id) => {
    const res = await api.post(`/pharmacy/prescriptions/${id}/dispense`)
    return res.data
  },
}
