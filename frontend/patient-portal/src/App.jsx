import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Home from './pages/Home'
import Appointments from './pages/Appointments'
import Bills from './pages/Bills'
import Prescriptions from './pages/Prescriptions'
import Profile from './pages/Profile'
import HealthRecords from './pages/HealthRecords'
import MyDocuments from './pages/MyDocuments'

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

const PublicRoute = ({ children }) => {
  const { user } = useAuth()
  if (user) {
    const saved = localStorage.getItem('patient_user')
    const u = saved ? JSON.parse(saved) : null
    if (u?.loginMode === 'unified') return <Navigate to="/health-records" replace />
    return <Navigate to="/" replace />
  }
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/appointments" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
      <Route path="/bills" element={<ProtectedRoute><Bills /></ProtectedRoute>} />
      <Route path="/prescriptions" element={<ProtectedRoute><Prescriptions /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/health-records" element={<ProtectedRoute><HealthRecords /></ProtectedRoute>} />
      <Route path="/documents" element={<ProtectedRoute><MyDocuments /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
