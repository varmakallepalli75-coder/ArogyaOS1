import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { section: 'Main' },
  { path: '/dashboard', icon: '◻', label: 'Dashboard' },
  { path: '/patients', icon: '👤', label: 'Patients' },
  { path: '/appointments', icon: '📅', label: 'Appointments' },
  { section: 'Clinical' },
  { path: '/opd', icon: '🏥', label: 'OPD' },
  { path: '/ipd', icon: '🛏', label: 'IPD & Beds' },
  { path: '/doctors', icon: '👨‍⚕️', label: 'Doctors' },
  { path: '/lab', icon: '🔬', label: 'Laboratory' },
  { path: '/pharmacy', icon: '💊', label: 'Pharmacy' },
  { section: 'Finance' },
  { path: '/billing', icon: '🧾', label: 'Billing' },
  { path: '/reports', icon: '📊', label: 'Reports' },
  { section: 'Admin' },
  { path: '/staff', icon: '👥', label: 'Staff & HR' },
  { path: '/settings', icon: '⚙', label: 'Settings' },
]

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const initials = user?.fullName
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-56' : 'w-16'} bg-[#0B2D24] flex flex-col transition-all duration-300 flex-shrink-0`}>

        {/* Logo */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
              ✚
            </div>
            {sidebarOpen && (
              <div>
                <div className="text-white font-bold text-sm">ArogyaOS</div>
                <div className="text-emerald-400 text-xs truncate max-w-[120px]">
                  {user?.hospitalName || 'Hospital'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2">
          {navItems.map((item, i) => {
            if (item.section) {
              return sidebarOpen ? (
                <div key={i} className="px-4 pt-4 pb-1 text-xs text-emerald-600/60 uppercase tracking-wider font-semibold">
                  {item.section}
                </div>
              ) : <div key={i} className="my-1 mx-2 border-t border-white/10" />
            }

            const isActive = location.pathname === item.path

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : 'text-emerald-200/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="text-base flex-shrink-0">{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <div className="text-white text-xs font-medium truncate">
                  {user?.fullName}
                </div>
                <button
                  onClick={logout}
                  className="text-emerald-400 text-xs hover:text-white transition-colors"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 h-14 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ☰
            </button>
            <h1 className="text-gray-800 font-semibold">
              {navItems.find(n => n.path === location.pathname)?.label || 'ArogyaOS'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
              🔔
            </button>
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold">
              {initials}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>

      </div>
    </div>
  )
}