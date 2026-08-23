import { useState, useEffect } from 'react'
import {
  CalendarCheck, Clock, CheckCircle2, Users, Stethoscope,
  Building2, UserPlus, TrendingUp, AlertCircle, RefreshCw,
  ChevronDown, ChevronUp,
} from 'lucide-react'
import api from '../../services/api'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showTrend, setShowTrend] = useState(false)

  useEffect(() => { loadStats() }, [])

  const loadStats = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/dashboard/stats')
      if (res.data.success) setStats(res.data.data)
      else setError(res.data.message || 'Failed to load dashboard.')
    } catch (e) {
      console.error(e)
      setError('Could not load dashboard data. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const statusColors = {
    Scheduled: 'bg-blue-100 text-blue-700',
    Confirmed: 'bg-purple-100 text-purple-700',
    InProgress: 'bg-amber-100 text-amber-700',
    Completed: 'bg-emerald-100 text-emerald-700',
    Cancelled: 'bg-red-100 text-red-700',
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-400">Loading dashboard...</div>
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <AlertCircle className="w-8 h-8 text-red-400" />
      <div className="text-gray-600 text-sm">{error}</div>
      <button onClick={loadStats}
        className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700">
        <RefreshCw className="w-3.5 h-3.5" /> Retry
      </button>
    </div>
  )

  if (!stats) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-400">No data available</div>
    </div>
  )

  // What matters minute-to-minute today, front and center.
  const todayStats = [
    { label: "Today's Appointments", value: stats.todayAppointments, Icon: CalendarCheck, color: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-600' },
    { label: 'Pending Today', value: stats.todayPending, Icon: Clock, color: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-600' },
    { label: 'Completed Today', value: stats.todayCompleted, Icon: CheckCircle2, color: 'bg-purple-500', light: 'bg-purple-50', text: 'text-purple-600' },
  ]

  // Slower-moving context — still useful, doesn't need equal visual weight.
  const contextStats = [
    { label: 'Total Patients', value: stats.totalPatients, Icon: Users },
    { label: 'Doctors', value: stats.totalDoctors, sub: `${stats.availableDoctors} available`, Icon: Stethoscope },
    { label: 'Departments', value: stats.totalDepartments, Icon: Building2 },
    { label: 'New Patients', value: stats.newPatientsThisMonth, sub: 'this month', Icon: UserPlus },
  ]

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500">
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long', year: 'numeric',
            month: 'long', day: 'numeric'
          })}
        </p>
      </div>

      {/* Today — the numbers that change through the day */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {todayStats.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-11 h-11 ${stat.light} rounded-xl flex items-center justify-center`}>
                <stat.Icon className={`w-5 h-5 ${stat.text}`} />
              </div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Context — slower-moving reference numbers, deliberately smaller */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {contextStats.map((stat, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-100 p-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
              <stat.Icon className="w-4 h-4 text-gray-400" />
            </div>
            <div className="min-w-0">
              <div className="text-lg font-semibold text-gray-900 leading-tight">{stat.value}</div>
              <div className="text-xs text-gray-500 truncate">{stat.label}{stat.sub ? ` · ${stat.sub}` : ''}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent Appointments */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Recent Appointments</h3>
          {stats.recentAppointments.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No appointments yet</div>
          ) : (
            <div className="space-y-3">
              {stats.recentAppointments.map((apt, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
                      {apt.patientName.split(' ').map(n => n[0]).join('').slice(0,2)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{apt.patientName}</div>
                      <div className="text-xs text-gray-500">{apt.doctorName} · {apt.departmentName}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[apt.status] || 'bg-gray-100 text-gray-600'}`}>
                      {apt.status}
                    </span>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {new Date(apt.appointmentDateTime).toLocaleTimeString('en-IN', {
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Department Stats */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Department Overview</h3>
          {stats.departmentStats.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No departments yet</div>
          ) : (
            <div className="space-y-3">
              {stats.departmentStats.map((dept, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold">
                    {dept.departmentName.slice(0,2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-800">{dept.departmentName}</span>
                      <span className="text-xs text-gray-500">{dept.appointmentCount} today</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-emerald-500 h-1.5 rounded-full"
                        style={{width: `${Math.min((dept.appointmentCount / (stats.todayAppointments || 1)) * 100, 100)}%`}}>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">{dept.doctorCount} drs</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Monthly Trend — least time-sensitive, collapsed by default */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <button onClick={() => setShowTrend(s => !s)}
          className="w-full flex items-center justify-between text-left">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            Monthly Trend (Last 6 Months)
          </h3>
          {showTrend ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
        {showTrend && (
          <div className="flex items-end gap-3 h-32 mt-4">
            {stats.monthlyStats.map((month, i) => {
              const maxApts = Math.max(...stats.monthlyStats.map(m => m.appointments), 1)
              const height = (month.appointments / maxApts) * 100
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-xs text-gray-500">{month.appointments}</div>
                  <div className="w-full bg-emerald-500 rounded-t-lg transition-all"
                    style={{height: `${Math.max(height, 4)}%`, minHeight: '4px'}}>
                  </div>
                  <div className="text-xs text-gray-400 text-center">{month.month.split(' ')[0]}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
