import { createApiClient } from '@medcareaxis/shared/src/apiClient.js'

const api = createApiClient({
  getToken: () => localStorage.getItem('patient_token'),
  onUnauthorized: () => {
    localStorage.removeItem('patient_token')
    localStorage.removeItem('patient_user')
  }
})

export default api
