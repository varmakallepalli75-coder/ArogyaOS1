import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import SuperAdminLayout from './SuperAdminLayout'

const URGENCY = {
  Critical: { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    badge: 'bg-red-100 text-red-700',    icon: '🚨' },
  Warning:  { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  badge: 'bg-amber-100 text-amber-700',  icon: '⚠️' },
  Upcoming: { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   badge: 'bg-blue-100 text-blue-700',   icon: '📅' },
}

export default function SuperAdminRenewals() {
  const [renewals, setRenewals]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [days, setDays]           = useState(30)
  const navigate = useNavigate()

  useEffect(() => { load() }, [days])

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/super-admin/renewals?days=${days}`)
      if (res.data.success) setRenewals(res.data.data || [])
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })

  const critical = renewals.filter(r => r.urgency === 'Critical')
  const warning  = renewals.filter(r => r.urgency === 'Warning')
  const upcoming = renewals.filter(r => r.urgency === 'Upcoming')

  const groups = [
    { key: 'Critical', label: 'Expiring in 7 days',  items: critical },
    { key: 'Warning',  label: 'Expiring in 8–15 days', items: warning },
    { key: 'Upcoming', label: 'Expiring in 16–30 days', items: upcoming },
  ]

  return (
    <SuperAdminLayout
      title="Subscription Renewals"
      subtitle={`${renewals.length} subscriptions expiring within ${days} days`}
    >
      {/* Controls */}
      <div className="flex items-center gap-3 mb-6">
        {[7, 15, 30, 60].map(d => (
          <button key={d} onClick={() => setDays(d)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              days === d
                ? 'bg-slate-800 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            Next {d} days
          </button>
        ))}
        <div className="ml-auto flex gap-3">
          {[
            { label: 'Critical', count: critical.length, color: 'text-red-600 bg-red-50' },
            { label: 'Warning',  count: warning.length,  color: 'text-amber-600 bg-amber-50' },
            { label: 'Upcoming', count: upcoming.length, color: 'text-blue-600 bg-blue-50' },
          ].map(s => (
            <div key={s.label} className={`${s.color} px-3 py-1.5 rounded-xl text-xs font-semibold`}>
              {s.label}: {s.count}
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>
      ) : renewals.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-3">✅</div>
          <div className="text-gray-700 font-semibold">No renewals due</div>
          <div className="text-gray-400 text-sm mt-1">No subscriptions expiring in the next {days} days</div>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.filter(g => g.items.length > 0).map(group => {
            const u = URGENCY[group.key]
            return (
              <div key={group.key}>
                <div className="flex items-center gap-2 mb-3">
                  <span>{u.icon}</span>
                  <h2 className={`font-bold text-sm ${u.text}`}>{group.label}</h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.badge}`}>
                    {group.items.length}
                  </span>
                </div>
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {group.items.map(r => (
                    <div key={r.hospitalId}
                      className={`${u.bg} border ${u.border} rounded-2xl p-5`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="text-xs font-mono text-gray-500 font-bold">{r.hospitalCode}</div>
                          <div className="font-semibold text-gray-900 mt-0.5">{r.name}</div>
                        </div>
                        <div className={`text-2xl font-black ${u.text}`}>
                          {r.daysRemaining}d
                        </div>
                      </div>

                      <div className="space-y-1.5 mb-4 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Plan</span>
                          <span className="font-semibold text-gray-800">{r.plan}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Monthly</span>
                          <span className="font-semibold text-gray-800">₹{r.monthlyAmount?.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Expires</span>
                          <span className="font-semibold text-gray-800">{fmtDate(r.subscriptionEnd)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Admin</span>
                          <span className="font-medium text-gray-700 truncate max-w-[160px]">{r.adminEmail}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/super-admin/hospitals/${r.hospitalId}`)}
                          className="flex-1 py-2 text-xs font-semibold bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                          Manage
                        </button>
                        <a href={`mailto:${r.adminEmail}?subject=Subscription Renewal - ${r.name}&body=Dear Admin,%0D%0A%0D%0AYour MedCareAxis subscription (${r.plan} plan) expires on ${fmtDate(r.subscriptionEnd)}.%0D%0A%0D%0APlease renew to continue uninterrupted service.%0D%0A%0D%0ARegards,%0D%0AMedCareAxis Team`}
                          className="flex-1 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-center">
                          Email
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </SuperAdminLayout>
  )
}
