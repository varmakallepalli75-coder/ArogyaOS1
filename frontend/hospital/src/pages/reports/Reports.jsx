import { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'

const fmt = (n) => new Intl.NumberFormat('en-IN').format(n)
const fmtRs = (n) => `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n)}`
const fmtDate = (d) => new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const fmtDay = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

const STATUS_COLORS = {
  Scheduled:  'bg-blue-100 text-blue-700',
  Confirmed:  'bg-purple-100 text-purple-700',
  InProgress: 'bg-amber-100 text-amber-700',
  Completed:  'bg-emerald-100 text-emerald-700',
  Cancelled:  'bg-red-100 text-red-700',
  NoShow:     'bg-gray-100 text-gray-500',
}

function today() { return new Date().toISOString().split('T')[0] }
function monthStart() {
  const d = new Date(); d.setDate(1)
  return d.toISOString().split('T')[0]
}

export default function Reports() {
  const [tab, setTab] = useState('summary')
  const [from, setFrom] = useState(monthStart())
  const [to, setTo] = useState(today())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [summary, setSummary] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [opd, setOpd] = useState([])
  const [billing, setBilling] = useState([])
  const [trend, setTrend] = useState([])

  const [aptStatus, setAptStatus] = useState('')

  const load = useCallback(async () => {
    if (!from || !to) return
    setLoading(true); setError('')
    try {
      if (tab === 'summary') {
        const [sumRes, trendRes] = await Promise.all([
          api.get('/report/summary', { params: { from, to } }),
          api.get('/report/trend', { params: { from, to } }),
        ])
        if (sumRes.data.success) setSummary(sumRes.data.data)
        if (trendRes.data.success) setTrend(trendRes.data.data)
      } else if (tab === 'appointments') {
        const res = await api.get('/report/appointments', { params: { from, to, status: aptStatus || undefined } })
        if (res.data.success) setAppointments(res.data.data)
      } else if (tab === 'opd') {
        const res = await api.get('/report/opd', { params: { from, to } })
        if (res.data.success) setOpd(res.data.data)
      } else if (tab === 'billing') {
        const res = await api.get('/report/billing', { params: { from, to } })
        if (res.data.success) setBilling(res.data.data)
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load report')
    } finally { setLoading(false) }
  }, [tab, from, to, aptStatus])

  useEffect(() => { load() }, [load])

  const setRange = (days) => {
    const t = new Date()
    const f = new Date(); f.setDate(f.getDate() - days + 1)
    setFrom(f.toISOString().split('T')[0])
    setTo(t.toISOString().split('T')[0])
  }

  const maxTrend = trend.length ? Math.max(...trend.map(d => d.appointments), 1) : 1

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-0.5">All hospital data is permanently saved. View any date range below.</p>
      </div>

      {/* Date range + quick picks */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500">From</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500">To</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="flex gap-1.5 ml-2">
            {[['Today', 1], ['7 Days', 7], ['30 Days', 30], ['This Month', 0]].map(([label, days]) => (
              <button key={label}
                onClick={() => days === 0
                  ? (setFrom(monthStart()), setTo(today()))
                  : setRange(days)}
                className="text-xs px-3 py-1.5 border border-gray-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 rounded-lg transition-colors">
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[['summary', 'Summary'], ['appointments', 'Appointments'], ['opd', 'OPD Visits'], ['billing', 'Billing']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${tab === key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center py-12 text-gray-400 text-sm">Loading report...</div>
      )}

      {/* ── Summary Tab ── */}
      {!loading && tab === 'summary' && summary && (
        <div className="space-y-6">
          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Appointments', value: fmt(summary.totalAppointments), sub: `${summary.completedAppointments} completed`, color: 'blue' },
              { label: 'OPD Visits', value: fmt(summary.opdVisits), sub: `${summary.prescriptionsIssued} prescriptions`, color: 'emerald' },
              { label: 'New Patients', value: fmt(summary.newPatients), sub: 'registered in period', color: 'purple' },
              { label: 'Revenue Collected', value: fmtRs(summary.paidRevenue), sub: `of ${fmtRs(summary.totalRevenue)} billed`, color: 'amber' },
            ].map(card => (
              <div key={card.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className={`text-2xl font-bold text-${card.color}-600`}>{card.value}</div>
                <div className="text-sm font-medium text-gray-700 mt-1">{card.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{card.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Cancelled', value: summary.cancelledAppointments, color: 'red' },
              { label: 'Lab Orders', value: summary.labOrders, color: 'violet' },
              { label: 'Bills Generated', value: summary.billsGenerated, color: 'gray' },
              { label: 'Outstanding', value: fmtRs(summary.totalRevenue - summary.paidRevenue), color: 'orange' },
            ].map(card => (
              <div key={card.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className={`text-xl font-bold text-${card.color}-600`}>{card.value}</div>
                <div className="text-sm text-gray-600 mt-1">{card.label}</div>
              </div>
            ))}
          </div>

          {/* Daily trend chart */}
          {trend.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Daily Appointments</h3>
              <div className="flex items-end gap-1.5 h-32 overflow-x-auto">
                {trend.map((d, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0" style={{ minWidth: '32px' }}>
                    <div className="text-xs text-gray-400">{d.appointments > 0 ? d.appointments : ''}</div>
                    <div
                      className="w-6 rounded-t bg-emerald-400 hover:bg-emerald-500 transition-colors cursor-default"
                      style={{ height: `${Math.max(4, (d.appointments / maxTrend) * 96)}px` }}
                      title={`${d.date}: ${d.appointments} apts, ${d.completed} completed, ₹${d.revenue}`}
                    />
                    <div className="text-xs text-gray-400 whitespace-nowrap"
                      style={{ fontSize: '9px', transform: 'rotate(-45deg)', transformOrigin: 'top left', marginTop: '4px' }}>
                      {d.date}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Appointments Tab ── */}
      {!loading && tab === 'appointments' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <select value={aptStatus} onChange={e => setAptStatus(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">All Statuses</option>
              {['Scheduled', 'Confirmed', 'InProgress', 'Completed', 'Cancelled', 'NoShow'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <span className="text-xs text-gray-500 self-center">{appointments.length} records</span>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['#', 'Patient', 'Doctor', 'Department', 'Date & Time', 'Type', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {appointments.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-400">No appointments in this range</td></tr>
                ) : appointments.map((a, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs font-mono text-gray-500">{a.appointmentNumber}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{a.patientName}</div>
                      <div className="text-xs text-gray-400">{a.patientUHID}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{a.doctorName}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{a.departmentName}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{fmtDate(a.appointmentDateTime)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{a.consultationType}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[a.status] || 'bg-gray-100 text-gray-600'}`}>{a.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── OPD Tab ── */}
      {!loading && tab === 'opd' && (
        <div className="space-y-4">
          <span className="text-xs text-gray-500">{opd.length} visits</span>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Visit #', 'Patient', 'Doctor', 'Diagnosis', 'Vitals', 'Rx #', 'Date'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {opd.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-400">No OPD visits in this range</td></tr>
                ) : opd.map((v, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs font-mono text-gray-500">{v.visitNumber}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{v.patientName}</div>
                      <div className="text-xs text-gray-400">{v.patientUHID}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-xs">{v.doctorName}</td>
                    <td className="px-4 py-3 text-gray-700 text-xs">{v.diagnosis || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {v.bloodPressure && <div>BP: {v.bloodPressure}</div>}
                      {v.pulseRate && <div>Pulse: {v.pulseRate}</div>}
                      {v.temperature && <div>Temp: {v.temperature}°F</div>}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-emerald-700">{v.prescriptionNumber || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{fmtDay(v.visitDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Billing Tab ── */}
      {!loading && tab === 'billing' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500">{billing.length} bills</span>
            {billing.length > 0 && (
              <span className="text-xs text-gray-500">
                Total: {fmtRs(billing.reduce((s, b) => s + b.totalAmount, 0))} ·
                Collected: {fmtRs(billing.reduce((s, b) => s + b.paidAmount, 0))} ·
                Outstanding: {fmtRs(billing.reduce((s, b) => s + b.balanceAmount, 0))}
              </span>
            )}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Bill #', 'Patient', 'Total', 'Paid', 'Balance', 'Status', 'Date'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {billing.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-400">No bills in this range</td></tr>
                ) : billing.map((b, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs font-mono text-gray-500">{b.billNumber}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{b.patientName}</div>
                      <div className="text-xs text-gray-400">{b.patientUHID}</div>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">{fmtRs(b.totalAmount)}</td>
                    <td className="px-4 py-3 text-sm text-emerald-700 font-medium">{fmtRs(b.paidAmount)}</td>
                    <td className={`px-4 py-3 text-sm font-medium ${b.balanceAmount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                      {fmtRs(b.balanceAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        b.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                        b.status === 'PartiallyPaid' ? 'bg-amber-100 text-amber-700' :
                        b.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{b.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{fmtDay(b.billDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
