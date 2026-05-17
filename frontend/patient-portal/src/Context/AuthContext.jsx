import { createContext, useContext, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('patient_user')
    return saved ? JSON.parse(saved) : null
  })

  const login = async (mobileNumber, hospitalCode, dateOfBirth) => {
    const res = await api.post('/auth/patient-login', {
      mobileNumber, hospitalCode, dateOfBirth
    })
    if (res.data.success) {
      const { accessToken, user: userData } = res.data.data
      const enriched = { ...userData, loginMode: 'hospital' }
      localStorage.setItem('patient_token', accessToken)
      localStorage.setItem('patient_user', JSON.stringify(enriched))
      setUser(enriched)
      return { success: true }
    }
    return { success: false, message: res.data.message }
  }

  const unifiedLogin = async (mobileNumber, dateOfBirth) => {
    const res = await api.post('/auth/patient-unified-login', {
      mobileNumber, dateOfBirth
    })
    if (res.data.success) {
      const { accessToken, fullName, linkedHospitals, expiresAt } = res.data.data
      const userData = {
        id: mobileNumber,
        fullName,
        email: mobileNumber,
        role: 'Patient',
        loginMode: 'unified',
        mobileNumber,
        linkedHospitals: linkedHospitals || []
      }
      localStorage.setItem('patient_token', accessToken)
      localStorage.setItem('patient_user', JSON.stringify(userData))
      setUser(userData)
      return { success: true }
    }
    return { success: false, message: res.data.message }
  }

  const logout = () => {
    localStorage.removeItem('patient_token')
    localStorage.removeItem('patient_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, unifiedLogin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
