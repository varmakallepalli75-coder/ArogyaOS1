import api from './api'

export const auditService = {
  getLogs: async (page = 1, pageSize = 50, search = '') => {
    const params = { page, pageSize }
    if (search) params.search = search
    const res = await api.get('/audit', { params })
    return res.data
  }
}
