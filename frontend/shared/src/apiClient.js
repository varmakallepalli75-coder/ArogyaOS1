import axios from 'axios'

// Shared axios client factory for both frontend apps. Each app supplies its own
// token lookup and its own cleanup logic for the 401 case (different storage keys).
export function createApiClient({ baseURL = '/api', headers, getToken, onUnauthorized }) {
  const api = axios.create({ baseURL, ...(headers ? { headers } : {}) })

  api.interceptors.request.use(config => {
    const token = getToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  api.interceptors.response.use(
    response => response,
    error => {
      if (error.response?.status === 401) {
        onUnauthorized?.()
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }
  )

  return api
}
