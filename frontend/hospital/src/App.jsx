import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { isSuperAdmin, isAdminRole } from '@medcareaxis/shared/src/roles.js'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import Login from './pages/auth/Login'
import ForgotPassword from './pages/auth/ForgotPassword'
import Dashboard from './pages/dashboard/Dashboard'
import Patients from './pages/patients/Patients'
import PatientProfile from './pages/patients/PatientProfile'
import Doctors from './pages/doctors/Doctors'
import Appointments from './pages/appointments/Appointments'
import Referrals from './pages/referrals/Referrals'
import OPD from './pages/opd/OPD'
import Billing from './pages/billing/Billing'
import IPD from './pages/ipd/IPD'
import Lab from './pages/lab/Lab'
import Pharmacy from './pages/pharmacy/Pharmacy'
import Staff from './pages/staff/Staff'
import Reports from './pages/reports/Reports'
import Deposits from './pages/deposits/Deposits'
import Settings from './pages/settings/Settings'
import Support from './pages/support/Support'
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard'
import SuperAdminHospitals from './pages/superadmin/SuperAdminHospitals'
import SuperAdminHospitalDetail from './pages/superadmin/SuperAdminHospitalDetail'
import OnboardHospital from './pages/superadmin/OnboardHospital'
import SuperAdminSupport from './pages/superadmin/SuperAdminSupport'
import SuperAdminAnalytics from './pages/superadmin/SuperAdminAnalytics'
import SuperAdminAnnouncements from './pages/superadmin/SuperAdminAnnouncements'
import SuperAdminHealthScores from './pages/superadmin/SuperAdminHealthScores'
import SuperAdminPayments from './pages/superadmin/SuperAdminPayments'
import SuperAdminAuditLogs from './pages/superadmin/SuperAdminAuditLogs'
import SuperAdminRenewals from './pages/superadmin/SuperAdminRenewals'
import SuperAdminSettings from './pages/superadmin/SuperAdminSettings'

const SuperAdminRoute = ({ children }) => {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!isSuperAdmin(user.role)) return <Navigate to="/dashboard" replace />
  return children
}

// Wraps a page with layout + optional permission check
// If perm is set and user doesn't have it → redirect to /dashboard
const ProtectedRoute = ({ children, perm }) => {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (perm && !isAdminRole(user.role) && !user[perm]) return <Navigate to="/dashboard" replace />
  return <Layout>{children}</Layout>
}

const PublicRoute = ({ children }) => {
  const { user, logout } = useAuth()
  if (user) {
    const destination = isSuperAdmin(user.role) ? '/super-admin' : '/dashboard'
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-sm w-full text-center">
          <p className="text-sm text-gray-500 mb-1">You're already signed in as</p>
          <p className="font-semibold text-gray-900 mb-6">{user.email || user.fullName || 'this account'}</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => window.location.href = destination}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold text-sm">
              Continue to Dashboard
            </button>
            <button onClick={logout}
              className="w-full py-3 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
              Log out and sign in as someone else
            </button>
          </div>
        </div>
      </div>
    )
  }
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

      {/* Always accessible to any logged-in hospital user */}
      <Route path="/dashboard"   element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/doctors"     element={<ProtectedRoute><Doctors /></ProtectedRoute>} />
      <Route path="/settings"    element={<ProtectedRoute><Settings /></ProtectedRoute>} />

      {/* Permission-gated routes */}
      <Route path="/patients"      element={<ProtectedRoute perm="permPatients"><Patients /></ProtectedRoute>} />
      <Route path="/patients/:id"  element={<ProtectedRoute perm="permPatients"><PatientProfile /></ProtectedRoute>} />
      <Route path="/appointments"  element={<ProtectedRoute perm="permAppointments"><Appointments /></ProtectedRoute>} />
      <Route path="/referrals"     element={<ProtectedRoute perm="permPatients"><Referrals /></ProtectedRoute>} />
      <Route path="/opd"           element={<ProtectedRoute perm="permOPD"><OPD /></ProtectedRoute>} />
      <Route path="/ipd"           element={<ProtectedRoute perm="permIPD"><IPD /></ProtectedRoute>} />
      <Route path="/lab"           element={<ProtectedRoute perm="permLab"><Lab /></ProtectedRoute>} />
      <Route path="/pharmacy"      element={<ProtectedRoute perm="permPharmacy"><Pharmacy /></ProtectedRoute>} />
      <Route path="/billing"       element={<ProtectedRoute perm="permBilling"><Billing /></ProtectedRoute>} />
      <Route path="/deposits"      element={<ProtectedRoute perm="permBilling"><Deposits /></ProtectedRoute>} />
      <Route path="/reports"       element={<ProtectedRoute perm="permReports"><Reports /></ProtectedRoute>} />
      <Route path="/staff"         element={<ProtectedRoute perm="permStaff"><Staff /></ProtectedRoute>} />
      <Route path="/support"       element={<ProtectedRoute><Support /></ProtectedRoute>} />

      {/* Super admin */}
      <Route path="/super-admin"                    element={<SuperAdminRoute><SuperAdminDashboard /></SuperAdminRoute>} />
      <Route path="/super-admin/hospitals"          element={<SuperAdminRoute><SuperAdminHospitals /></SuperAdminRoute>} />
      <Route path="/super-admin/hospitals/new"      element={<SuperAdminRoute><OnboardHospital /></SuperAdminRoute>} />
      <Route path="/super-admin/hospitals/:id"      element={<SuperAdminRoute><SuperAdminHospitalDetail /></SuperAdminRoute>} />
      <Route path="/super-admin/support"            element={<SuperAdminRoute><SuperAdminSupport /></SuperAdminRoute>} />
      <Route path="/super-admin/analytics"          element={<SuperAdminRoute><SuperAdminAnalytics /></SuperAdminRoute>} />
      <Route path="/super-admin/announcements"      element={<SuperAdminRoute><SuperAdminAnnouncements /></SuperAdminRoute>} />
      <Route path="/super-admin/health"             element={<SuperAdminRoute><SuperAdminHealthScores /></SuperAdminRoute>} />
      <Route path="/super-admin/payments"           element={<SuperAdminRoute><SuperAdminPayments /></SuperAdminRoute>} />
      <Route path="/super-admin/audit-logs"         element={<SuperAdminRoute><SuperAdminAuditLogs /></SuperAdminRoute>} />
      <Route path="/super-admin/renewals"           element={<SuperAdminRoute><SuperAdminRenewals /></SuperAdminRoute>} />
      <Route path="/super-admin/settings"           element={<SuperAdminRoute><SuperAdminSettings /></SuperAdminRoute>} />

      <Route path="/"  element={<Navigate to="/dashboard" replace />} />
      <Route path="*"  element={<Navigate to="/dashboard" replace />} />
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
