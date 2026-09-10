import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { Activity, Bell, Building2, CreditCard, FileClock, HeartPulse, LayoutDashboard, Megaphone, Plus, Settings, TicketCheck } from 'lucide-react'

const NAV = [
  { icon: LayoutDashboard,  label: 'Dashboard',     path: '/super-admin' },
  { icon: Building2, label: 'Hospitals',     path: '/super-admin/hospitals' },
  { icon: Activity, label: 'Analytics',     path: '/super-admin/analytics' },
  { icon: HeartPulse, label: 'Health',        path: '/super-admin/health' },
  { icon: Bell, label: 'Renewals',      path: '/super-admin/renewals', badge: 'renewals' },
  { icon: CreditCard, label: 'Payments',      path: '/super-admin/payments' },
  { icon: Megaphone, label: 'Announcements', path: '/super-admin/announcements' },
  { icon: TicketCheck, label: 'Support',       path: '/super-admin/support' },
  { icon: FileClock, label: 'Audit Logs',    path: '/super-admin/audit-logs' },
  { icon: Settings, label: 'Settings',      path: '/super-admin/settings' },
]

export default function SuperAdminLayout({ children, title, subtitle }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { logout, user } = useAuth()
  const [renewalCount, setRenewalCount] = useState(0)

  useEffect(() => {
    api.get('/super-admin/renewals?days=7')
      .then(r => { if (r.data.success) setRenewalCount(r.data.data?.length || 0) })
      .catch(() => {})
  }, [])

  return (
    <div className="mca-admin flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-slate-900 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center font-bold text-white text-lg"><Plus className="w-5 h-5" /></div>
            <div>
              <div className="text-white font-bold text-sm">MedCareAxis</div>
              <div className="text-emerald-400 text-xs font-medium">Super Admin</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(item => {
            const active = location.pathname === item.path ||
              (item.path !== '/super-admin' && location.pathname.startsWith(item.path))
            const badgeCount = item.badge === 'renewals' ? renewalCount : 0
            return (
              <button key={item.path} onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}>
                <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {badgeCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {badgeCount}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* User + logout */}
        <div className="px-3 py-4 border-t border-slate-700">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.fullName?.[0] || 'S'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-semibold truncate">{user?.fullName || 'Super Admin'}</div>
              <div className="text-slate-400 text-xs truncate">{user?.email}</div>
            </div>
          </div>
          <button onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl text-sm transition-colors">
            <span>⎋</span> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        {(title || subtitle) && (
          <div className="bg-white border-b border-gray-100 px-8 py-4 flex-shrink-0">
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
        )}

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  )
}
