import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedUser = authService.getUser()
    if (savedUser) setUser(savedUser)
    setLoading(false)

    // Re-hydrate role / permissions / modules from the server, so changes an
    // admin makes to this user reflect on the next load without a re-login.
    if (savedUser) {
      authService.refreshUser().then(fresh => { if (fresh) setUser(fresh) })
    }

    const onFocus = () => {
      if (authService.isLoggedIn()) {
        authService.refreshUser().then(fresh => { if (fresh) setUser(fresh) })
      }
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  const login = async (email, password) => {
    const result = await authService.login(email, password)
    if (result.success) {
      setUser(result.data.user)
    }
    return result
  }

  const logout = async () => {
    setUser(null)
    await authService.logout()
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}