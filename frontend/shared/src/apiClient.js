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
      // A 401 on a login attempt just means the credentials were rejected — let the
      // caller read the error body and show it. Only a 401 on some *other* request
      // means the session expired, which is what should bounce the user to /login.
      const url = error.config?.url ?? ''
      const isLoginAttempt = /\/auth\/(login|patient-login|patient-unified-login)$/.test(url)
      if (error.response?.status === 401 && !isLoginAttempt) {
        onUnauthorized?.()
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }
  )

  return api
}
