import { useState, useEffect } from 'react'
import api from '../../services/api'
import SuperAdminLayout from './SuperAdminLayout'

const PLAN_COLOR = {
  Trial: 'bg-gray-200',
  Starter: 'bg-blue-400',
  Growth: 'bg-emerald-400',
  Enterprise: 'bg-indigo-500',
  Custom: 'bg-purple-500',
}

const fmt = (n) => n?.toLocaleString('en-IN') ?? '0'
const fmtMonth = (m) => {
  if (!m) return ''
  const [y, mo] = m.split('-')
  return new Date(+y, +mo - 1).toLocaleString('en-IN', { month: 'short', year: '2-digit' })
}

function BarChart({ data, valueKey = 'amount', color = 'bg-emerald-500', label = '' }) {
  if (!data?.length) return <div className="text-center py-10 text-gray-400 text-sm">No data</div>
  const max = Math.max(...data.map(d => d[valueKey] || 0)) || 1
  return (
    <div className="flex items-end gap-1 h-40 px-2">
      {data.map((d, i) => {
        const h = Math.max(4, ((d[valueKey] || 0) / max) * 140)
        return (
          <div key={i} className="flex flex-col items-center flex-1 gap-1">
            <div className="text-xs text-gray-400 text-center" style={{ fontSize: 9 }}>
              {valueKey === 'amount' ? `₹${Math.round((d[valueKey] || 0) / 1000)}k` : d[valueKey] || 0}
            </div>
            <div
              className={`w-full rounded-t ${color} transition-all`}
              style={{ height: h }}
              title={`${d.month}: ${d[valueKey]}`}
            />
            <div className="text-center text-gray-400" style={{ fontSize: 9 }}>
              {fmtMonth(d.month)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function SuperAdminAnalytics() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      const res = await api.get('/super-admin/analytics')
      if (res.data.success) setData(res.data.data)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  return (
    <SuperAdminLayout title="Revenue & Analytics" subtitle="Platform financial performance">
      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>
      ) : !data ? (
        <div className="text-center text-red-500">Failed to load analytics</div>
      ) : (
        <div className="space-y-6">
          {/* KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Collected',    value: `₹${fmt(data.totalCollected)}`,  icon: '💰', color: 'text-green-600',  bg: 'bg-green-50' },
              { label: 'Projected Annual',   value: `₹${fmt(data.projectedAnnual)}`, icon: '📈', color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { label: 'New This Month',     value: data.newThisMonth,               icon: '🏥', color: 'text-blue-600',   bg: 'bg-blue-50' },
              { label: 'Churned This Month', value: data.churnedThisMonth,           icon: '📉', color: 'text-red-600',    bg: 'bg-red-50' },
            ].map(card => (
              <div key={card.label} className={`${card.bg} rounded-2xl p-4 border border-white`}>
                <div className="text-2xl mb-2">{card.icon}</div>
                <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                <div className="text-xs text-gray-500 font-medium mt-1">{card.label}</div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Monthly Revenue Chart */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-1">Monthly Revenue</h2>
              <p className="text-xs text-gray-400 mb-4">Subscription payments received per month</p>
              <BarChart data={data.monthlyRevenue} valueKey="amount" color="bg-emerald-400" />
            </div>

            {/* Hospital Growth Chart */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-1">Hospital Growth</h2>
              <p className="text-xs text-gray-400 mb-4">New hospitals onboarded per month</p>
              <BarChart data={data.hospitalGrowth} valueKey="count" color="bg-blue-400" />
            </div>
          </div>

          {/* Plan Distribution */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-900 mb-4">Plan Distribution</h2>
            {data.planDistribution.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">No active subscriptions</div>
            ) : (
              <div className="space-y-3">
                {data.planDistribution.map(p => {
                  const total = data.planDistribution.reduce((s, x) => s + x.count, 0)
                  const pct = total > 0 ? Math.round((p.count / total) * 100) : 0
                  return (
                    <div key={p.plan} className="flex items-center gap-4">
                      <div className="w-24 text-sm font-medium text-gray-700">{p.plan}</div>
                      <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${PLAN_COLOR[p.plan] || 'bg-gray-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="w-8 text-sm text-right text-gray-600 font-semibold">{p.count}</div>
                      <div className="w-28 text-sm text-right text-gray-500">₹{fmt(p.revenue)}/mo</div>
                      <div className="w-10 text-xs text-gray-400 text-right">{pct}%</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </SuperAdminLayout>
  )
}
