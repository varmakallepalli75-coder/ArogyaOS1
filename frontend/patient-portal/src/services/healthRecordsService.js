import api from './api'

const healthRecordsService = {
  getLinkedHospitals: () => api.get('/health-records/linked-hospitals'),
  getPrescriptions: () => api.get('/health-records/prescriptions'),
  getVisits: () => api.get('/health-records/visits'),
  getAdmissions: () => api.get('/health-records/admissions'),
  getLabs: () => api.get('/health-records/labs'),
  getTimeline: () => api.get('/health-records/timeline'),

  getDocuments: () => api.get('/health-records/documents'),
  getDocument: (id) => api.get(`/health-records/documents/${id}`),
  uploadDocument: (data) => api.post('/health-records/documents', data),
  deleteDocument: (id) => api.delete(`/health-records/documents/${id}`),
}

export default healthRecordsService
