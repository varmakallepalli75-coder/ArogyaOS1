import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { Activity, BedDouble, Bell, CalendarDays, ChevronDown, ChevronRight, CircleHelp, CreditCard, FileBarChart, FlaskConical, LayoutDashboard, LogOut, Menu, MoreHorizontal, Pill, Plus, Settings, Stethoscope, Users, WalletCards } from 'lucide-react'

const ALL_NAV = [
  { section: 'Main' },
  { path: '/dashboard',    icon: LayoutDashboard,   label: 'Today' },
  { path: '/patients',     icon: Users,  label: 'Patients',     perm: 'permPatients' },
  { path: '/appointments', icon: CalendarDays,  label: 'Today’s Queue', perm: 'permAppointments' },
  { path: '/referrals',    icon: ChevronRight,   label: 'Patient Referrals',    perm: 'permPatients' },
  { section: 'Clinical' },
  { path: '/opd',          icon: Stethoscope,  label: 'Consultation',          module: 'hasOPD',      perm: 'permOPD' },
  { path: '/ipd',          icon: BedDouble,  label: 'Admissions & Beds',   module: 'hasIPD',      perm: 'permIPD' },
  { path: '/doctors',      icon: Activity, label: 'Doctors & Departments' },
  { path: '/lab',          icon: FlaskConical,  label: 'Lab & Results',   module: 'hasLab',      perm: 'permLab' },
  { path: '/pharmacy',     icon: Pill,  label: 'Medicines',     module: 'hasPharmacy', perm: 'permPharmacy' },
  { section: 'Finance' },
  { path: '/billing',      icon: CreditCard,  label: 'Billing',      module: 'hasBilling',  perm: 'permBilling' },
  { path: '/deposits',     icon: WalletCards,  label: 'Advance Payments',     module: 'hasBilling',  perm: 'permBilling' },
  { path: '/reports',      icon: FileBarChart,  label: 'Accounts & Reports',      module: 'hasReports',  perm: 'permReports' },
  { section: 'Admin' },
  { path: '/staff',        icon: Users,  label: 'Team & Access',   perm: 'permStaff' },
  { path: '/support',      icon: CircleHelp,  label: 'Help & Support' },
  { path: '/settings',     icon: Settings,  label: 'Settings' },
]

const PRIMARY_PATHS = ['/dashboard', '/patients', '/appointments', '/opd', '/billing']

const SEVERITY_STYLES = {
  error:   { bg: 'bg-red-50',    border: 'border-red-200',    icon: '🔴', badge: 'bg-red-500'    },
  warning: { bg: 'bg-amber-50',  border: 'border-amber-200',  icon: '🟡', badge: 'bg-amber-500'  },
  info:    { bg: 'bg-blue-50',   border: 'border-blue-200',   icon: '🔵', badge: 'bg-blue-500'   },
}

const TYPE_LINKS = {
  low_stock:            '/pharmacy',
  pending_lab:          '/lab',
  pending_rx:           '/pharmacy',
  unpaid_bills:         '/billing',
  todays_appointments:  '/appointments',
}

function NotificationPanel({ onClose }) {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(() => typeof window === 'undefined' || window.innerWidth >= 640)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/alert')
      .then(r => { if (r.data.success) setAlerts(r.data.data || []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const go = (type) => {
    onClose()
    navigate(TYPE_LINKS[type] || '/dashboard')
  }

  return (
    <div className="absolute right-0 top-10 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div>
          <span className="font-semibold text-gray-900 text-sm">Alerts</span>
          {alerts.length > 0 && (
            <span className="ml-2 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full font-medium">
              {alerts.length}
            </span>
          )}
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="py-8 text-center text-gray-400 text-sm">Loading...</div>
        ) : alerts.length === 0 ? (
          <div className="py-10 text-center">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-sm font-medium text-gray-600">All clear!</div>
            <div className="text-xs text-gray-400 mt-1">No alerts right now</div>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {alerts.map((alert, idx) => {
              const s = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.info
              return (
                <button
                  key={idx}
                  onClick={() => go(alert.type)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3`}
                >
                  <span className="text-base mt-0.5 flex-shrink-0">{s.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-800">{alert.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{alert.message}</div>
                  </div>
                  <span className={`flex-shrink-0 text-xs text-white px-2 py-0.5 rounded-full font-bold ${s.badge}`}>
                    {alert.count}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400 text-center">
        Live data · refreshes on open
      </div>
    </div>
  )
}

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window === 'undefined' || window.innerWidth >= 640)
  const [moreOpen, setMoreOpen] = useState(false)
  const [showAlerts, setShowAlerts] = useState(false)
  const [alertCount, setAlertCount] = useState(0)
  const [announcements, setAnnouncements] = useState([])
  const [maintenanceMode, setMaintenanceMode] = useState(null)
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('dismissedAnn') || '[]') } catch { return [] }
  })
  const bellRef = useRef(null)
  const { user, logout } = useAuth()
  const location = useLocation()

  const isAdmin = user?.role === 0 || user?.role === 1 || user?.role === 'HospitalAdmin' || user?.role === 'SuperAdmin'

  const navItems = ALL_NAV.filter(item => {
    if (item.section) return true
    if (item.module && user?.[item.module] === false) return false
    if (item.perm && !isAdmin && !user?.[item.perm]) return false
    return true
  })

  const primaryItems = navItems.filter(item => item.path && PRIMARY_PATHS.includes(item.path))
  const moreItems = navItems.filter(item => item.path && !PRIMARY_PATHS.includes(item.path))

  const initials = user?.fullName
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'

  // Fetch alert count for badge (every 60s)
  useEffect(() => {
    const fetchCount = () => {
      api.get('/alert')
        .then(r => { if (r.data.success) setAlertCount(r.data.data?.length || 0) })
        .catch(() => {})
    }
    fetchCount()
    const id = setInterval(fetchCount, 60000)
    return () => clearInterval(id)
  }, [])

  // Fetch announcements + platform settings once on mount
  useEffect(() => {
    api.get('/announcements')
      .then(r => { if (r.data.success) setAnnouncements(r.data.data || []) })
      .catch(() => {})
    api.get('/platform/settings')
      .then(r => { if (r.data.success && r.data.data.maintenanceMode) setMaintenanceMode(r.data.data.maintenanceMessage) })
      .catch(() => {})
  }, [])

  const dismissAnn = (id) => {
    const updated = [...dismissedAnnouncements, id]
    setDismissedAnnouncements(updated)
    sessionStorage.setItem('dismissedAnn', JSON.stringify(updated))
  }

  const visibleAnn = announcements.filter(a => !dismissedAnnouncements.includes(a.id))

  // Close panel when clicking outside
  useEffect(() => {
    if (!showAlerts) return
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target))
        setShowAlerts(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showAlerts])

  return (
    <div className="mca-shell flex h-screen bg-gray-50 overflow-hidden">

      {/* Sidebar */}
      <aside className={`mca-sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'} bg-[#0B2D24] flex flex-col transition-all duration-300 flex-shrink-0`}>

        {/* Logo */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
              <Plus className="w-5 h-5" />
            </div>
            {sidebarOpen && (
              <div>
                <div className="text-white font-bold text-sm">MedCareAxis</div>
                <div className="text-emerald-400 text-xs truncate max-w-[120px]">
                  {user?.hospitalName || 'Hospital'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Daily work first; less-used modules stay available under More tools. */}
        <nav className="flex-1 overflow-y-auto py-2" aria-label="Daily workflow">
          {sidebarOpen && <div className="mca-nav-caption">Daily work</div>}
          {primaryItems.map(item => {
            const active = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path + '/'))
            return <Link key={item.path} to={item.path} onClick={() => { if (window.innerWidth < 640) setSidebarOpen(false) }}
              className={`flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-sm transition-all ${active ? 'bg-emerald-600 text-white' : 'text-emerald-200/70 hover:bg-white/5 hover:text-white'}`}>
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" />{sidebarOpen && <span>{item.label}</span>}
            </Link>
          })}
          <button type="button" onClick={() => setMoreOpen(v => !v)} className="mca-more-toggle">
            <MoreHorizontal className="w-[18px] h-[18px]" />
            {sidebarOpen && <><span>More tools</span><ChevronDown className={`w-4 h-4 ml-auto transition-transform ${moreOpen ? 'rotate-180' : ''}`}/></>}
          </button>
          {moreOpen && <div className="mca-more-nav">{moreItems.map(item => {
            const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
            return <Link key={item.path} to={item.path} onClick={() => { if (window.innerWidth < 640) setSidebarOpen(false) }}
              className={`flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-sm ${active ? 'bg-emerald-600 text-white' : 'text-emerald-200/70 hover:bg-white/5 hover:text-white'}`}>
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" />{sidebarOpen && <span>{item.label}</span>}
            </Link>
          })}</div>}
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
                  <LogOut className="inline w-3 h-3 mr-1" />Sign out
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
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-gray-800 font-semibold">
              {navItems.find(n => n.path === location.pathname)?.label || 'MedCareAxis'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="mca-top-actions">
              {navItems.some(n => n.path === '/patients') && <Link to="/patients?action=register" className="mca-top-link"><Users className="w-4 h-4"/> Register patient</Link>}
              {navItems.some(n => n.path === '/appointments') && <Link to="/appointments?action=book" className="mca-top-link primary"><CalendarDays className="w-4 h-4"/> Book appointment</Link>}
            </div>
            {/* Bell with badge */}
            <div ref={bellRef} className="relative">
              <button
                onClick={() => setShowAlerts(v => !v)}
                className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors relative"
              >
                <Bell className="w-4 h-4" />
                {alertCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                    {alertCount > 9 ? '9+' : alertCount}
                  </span>
                )}
              </button>
              {showAlerts && (
                <NotificationPanel onClose={() => setShowAlerts(false)} />
              )}
            </div>

            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold">
              {initials}
            </div>
          </div>
        </header>

        {/* Maintenance Mode Banner */}
        {maintenanceMode && (
          <div className="bg-red-600 text-white px-6 py-2.5 flex items-center justify-between text-sm font-medium">
            <span>🔧 {maintenanceMode}</span>
          </div>
        )}

        {/* Announcements Banner */}
        {visibleAnn.map(ann => {
          const colors = {
            Info:        'bg-blue-50 border-blue-200 text-blue-800',
            Warning:     'bg-amber-50 border-amber-200 text-amber-800',
            Maintenance: 'bg-red-50 border-red-200 text-red-800',
            Feature:     'bg-emerald-50 border-emerald-200 text-emerald-800',
          }
          const icons = { Info: 'ℹ️', Warning: '⚠️', Maintenance: '🔧', Feature: '✨' }
          return (
            <div key={ann.id} className={`border-b px-6 py-2.5 flex items-center justify-between text-sm ${colors[ann.type] || colors.Info}`}>
              <span>{icons[ann.type] || 'ℹ️'} <strong>{ann.title}</strong> — {ann.body}</span>
              <button onClick={() => dismissAnn(ann.id)} className="ml-4 opacity-60 hover:opacity-100 font-bold text-base leading-none">×</button>
            </div>
          )
        })}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>

      </div>
      <nav className="mca-mobile-nav" aria-label="Daily workflow">
        {primaryItems.slice(0, 4).map(item => {
          const active = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path + '/'))
          return <Link key={item.path} to={item.path} className={active ? 'active' : ''}><item.icon/><span>{item.label === 'Today’s Queue' ? 'Queue' : item.label}</span></Link>
        })}
        <button type="button" onClick={() => { setSidebarOpen(true); setMoreOpen(true) }}><MoreHorizontal/><span>More</span></button>
      </nav>
    </div>
  )
}
