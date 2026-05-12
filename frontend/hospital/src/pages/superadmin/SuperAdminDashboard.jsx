import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { superAdminService } from '../../services/superAdminService'
import SuperAdminLayout from './SuperAdminLayout'

const STATUS_COLOR = {
  Active:      'bg-emerald-100 text-emerald-700',
  Suspended:   'bg-amber-100 text-amber-700',
  Pending:     'bg-blue-100 text-blue-700',
  Deactivated: 'bg-red-100 text-red-700',
}

export default function SuperAdminDashboard() {
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      const res = await superAdminService.getDashboard()
      if (res.success) setStats(res.data)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const statCards = stats ? [
    { label: 'Total Hospitals', value: stats.totalHospitals,   icon: '🏥', color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-100' },
    { label: 'Active',          value: stats.activeHospitals,  icon: '✅', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { label: 'Suspended',       value: stats.suspendedHospitals, icon: '⚠️', color: 'text-amber-600', bg: 'bg-amber-50',  border: 'border-amber-100' },
    { label: 'Total Patients',  value: stats.totalPatients?.toLocaleString(), icon: '👥', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
    { label: 'MRR',             value: `₹${stats.mrr?.toLocaleString()}`,          icon: '💰', color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-100' },
    { label: 'Total Revenue',   value: `₹${stats.totalRevenue?.toLocaleString()}`, icon: '📈', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
  ] : []

  return (
    <SuperAdminLayout title="Dashboard" subtitle="Platform overview and recent activity">
      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>
      ) : (
        <div className="space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {statCards.map(card => (
              <div key={card.label} className={`${card.bg} border ${card.border} rounded-2xl p-4`}>
                <div className="text-2xl mb-2">{card.icon}</div>
                <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                <div className="text-xs text-gray-500 mt-1 font-medium">{card.label}</div>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Onboard Hospital', icon: '＋', action: () => navigate('/super-admin/hospitals/new'), color: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
              { label: 'View All Hospitals', icon: '🏥', action: () => navigate('/super-admin/hospitals'), color: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200' },
              { label: 'Support Tickets', icon: '🎫', action: () => navigate('/super-admin/support'), color: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200' },
              { label: 'Pending Review', icon: '⏳', action: () => navigate('/super-admin/hospitals?status=0'), color: 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200' },
            ].map(q => (
              <button key={q.label} onClick={q.action}
                className={`${q.color} rounded-2xl p-4 text-left font-medium text-sm transition-colors flex items-center gap-3`}>
                <span className="text-xl">{q.icon}</span>
                {q.label}
              </button>
            ))}
          </div>

          {/* Recent hospitals */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Recently Onboarded</h2>
              <button onClick={() => navigate('/super-admin/hospitals')}
                className="text-emerald-600 text-sm font-medium hover:underline">
                View all →
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {['Code', 'Hospital', 'City', 'Plan', 'Status', 'Admin', 'Joined', ''].map(h => (
                      <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {stats?.recentHospitals?.map(h => (
                    <tr key={h.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-xs font-mono text-emerald-600 font-bold">{h.hospitalCode}</td>
                      <td className="px-6 py-3 text-sm font-semibold text-gray-900">{h.name}</td>
                      <td className="px-6 py-3 text-sm text-gray-500">{h.city}</td>
                      <td className="px-6 py-3">
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{h.plan}</span>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[h.status] || 'bg-gray-100 text-gray-500'}`}>
                          {h.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500">{h.adminEmail}</td>
                      <td className="px-6 py-3 text-xs text-gray-400">{new Date(h.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="px-6 py-3">
                        <button onClick={() => navigate(`/super-admin/hospitals/${h.id}`)}
                          className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
                          Manage →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  )
}
