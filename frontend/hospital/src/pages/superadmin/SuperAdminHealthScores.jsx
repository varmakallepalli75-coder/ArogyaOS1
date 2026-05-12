import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import SuperAdminLayout from './SuperAdminLayout'

const scoreColor = (s) => {
  if (s >= 80) return { bar: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Healthy' }
  if (s >= 50) return { bar: 'bg-amber-400',   text: 'text-amber-600',   bg: 'bg-amber-50',   label: 'At Risk' }
  return               { bar: 'bg-red-500',     text: 'text-red-600',     bg: 'bg-red-50',     label: 'Inactive' }
}

const fmtDate = (iso) => iso
  ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  : 'Never'

export default function SuperAdminHealthScores() {
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('all')
  const navigate = useNavigate()

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/super-admin/health')
      if (res.data.success) setHospitals(res.data.data || [])
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const filtered = hospitals.filter(h => {
    if (filter === 'healthy')  return h.healthScore >= 80
    if (filter === 'atrisk')   return h.healthScore >= 50 && h.healthScore < 80
    if (filter === 'inactive') return h.healthScore < 50
    return true
  })

  const counts = {
    all:      hospitals.length,
    healthy:  hospitals.filter(h => h.healthScore >= 80).length,
    atrisk:   hospitals.filter(h => h.healthScore >= 50 && h.healthScore < 80).length,
    inactive: hospitals.filter(h => h.healthScore < 50).length,
  }

  return (
    <SuperAdminLayout title="Hospital Health Scores" subtitle="Identify at-risk and inactive hospitals">
      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {[
          { key: 'all',      label: 'All',      count: counts.all,      color: 'gray' },
          { key: 'healthy',  label: 'Healthy',  count: counts.healthy,  color: 'emerald' },
          { key: 'atrisk',   label: 'At Risk',  count: counts.atrisk,   color: 'amber' },
          { key: 'inactive', label: 'Inactive', count: counts.inactive, color: 'red' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === tab.key
                ? `bg-${tab.color}-600 text-white`
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
            style={filter === tab.key ? { backgroundColor: tab.color === 'gray' ? '#4b5563' : tab.color === 'emerald' ? '#059669' : tab.color === 'amber' ? '#d97706' : '#dc2626' } : {}}>
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading...</div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(h => {
            const c = scoreColor(h.healthScore)
            return (
              <div key={h.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-xs font-mono text-emerald-600 font-bold">{h.hospitalCode}</div>
                    <div className="font-semibold text-gray-900 mt-0.5">{h.name}</div>
                  </div>
                  <div className={`${c.bg} ${c.text} text-xs font-bold px-2.5 py-1 rounded-full`}>
                    {h.healthScore}/100
                  </div>
                </div>

                {/* Score bar */}
                <div className="bg-gray-100 rounded-full h-2 mb-4 overflow-hidden">
                  <div className={`${c.bar} h-full rounded-full transition-all`}
                    style={{ width: `${h.healthScore}%` }} />
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="text-gray-400">Last Login</div>
                    <div className="font-medium text-gray-700">{fmtDate(h.lastAdminLogin)}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="text-gray-400">Patients (month)</div>
                    <div className="font-medium text-gray-700">{h.patientsThisMonth}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="text-gray-400">Appts (month)</div>
                    <div className="font-medium text-gray-700">{h.appointmentsThisMonth}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="text-gray-400">Plan</div>
                    <div className="font-medium text-gray-700">{h.plan}</div>
                  </div>
                </div>

                {/* Warnings */}
                {h.warnings?.length > 0 && (
                  <div className="space-y-1 mb-3">
                    {h.warnings.map((w, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg">
                        <span>⚠</span> {w}
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={() => navigate(`/super-admin/hospitals/${h.id}`)}
                  className="w-full text-center text-xs text-emerald-600 hover:text-emerald-700 font-medium py-1.5 border border-emerald-100 rounded-lg hover:bg-emerald-50 transition-colors">
                  Manage Hospital →
                </button>
              </div>
            )
          })}
        </div>
      )}
    </SuperAdminLayout>
  )
}
