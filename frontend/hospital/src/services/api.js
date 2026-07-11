import { createApiClient } from '@medcareaxis/shared/src/apiClient.js'

const getToken = () => {
  const role = sessionStorage.getItem('activeRole')
  return role === 'superadmin'
    ? localStorage.getItem('sa_accessToken')
    : localStorage.getItem('accessToken')
}

const api = createApiClient({
  headers: { 'Content-Type': 'application/json' },
  getToken,
  onUnauthorized: () => {
    const role = sessionStorage.getItem('activeRole')
    if (role === 'superadmin') {
      localStorage.removeItem('sa_accessToken')
      localStorage.removeItem('sa_user')
    } else {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
    }
    sessionStorage.removeItem('activeRole')
  }
})

export default api
