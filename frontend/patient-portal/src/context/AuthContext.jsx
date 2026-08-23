import { createContext, useContext, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('patient_user')
    return saved ? JSON.parse(saved) : null
  })

  const requestOtp = async (mobileNumber, hospitalCode) => {
    const res = await api.post('/auth/patient-login/request-otp', {
      mobileNumber, hospitalCode
    })
    return { success: res.data.success, message: res.data.message }
  }

  const requestUnifiedOtp = async (mobileNumber) => {
    const res = await api.post('/auth/patient-unified-login/request-otp', {
      mobileNumber
    })
    return { success: res.data.success, message: res.data.message }
  }

  const login = async (mobileNumber, hospitalCode, dateOfBirth, code) => {
    const res = await api.post('/auth/patient-login', {
      mobileNumber, hospitalCode, dateOfBirth, code
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

  const unifiedLogin = async (mobileNumber, dateOfBirth, code) => {
    const res = await api.post('/auth/patient-unified-login', {
      mobileNumber, dateOfBirth, code
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
    <AuthContext.Provider value={{ user, login, unifiedLogin, requestOtp, requestUnifiedOtp, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
