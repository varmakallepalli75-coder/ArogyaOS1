import { useState, useEffect, useCallback } from 'react'
import { depositService } from '../../services/depositService'
import { patientService } from '../../services/patientService'

const PAYMENT_MODES = ['Cash', 'Card', 'UPI', 'NEFT', 'RTGS', 'Cheque']

const statusBadge = (d) => {
  if (d.isRefunded && d.refundedAmount >= d.amount) return { label: 'Refunded', cls: 'bg-red-100 text-red-700' }
  if (d.isAdjusted && d.adjustedAmount >= d.amount) return { label: 'Adjusted', cls: 'bg-blue-100 text-blue-700' }
  if (d.availableBalance > 0) return { label: 'Active', cls: 'bg-emerald-100 text-emerald-700' }
  return { label: 'Settled', cls: 'bg-gray-100 text-gray-600' }
}

function CollectModal({ onClose, onDone }) {
  const [patientSearch, setPatientSearch] = useState('')
  const [patientResults, setPatientResults] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    patientId: '', admissionId: null,
    amount: '', paymentMode: 0,
    transactionId: '', notes: '',
  })

  useEffect(() => {
    if (patientSearch.length < 3) { setPatientResults([]); return }
    const t = setTimeout(async () => {
      const res = await patientService.search(patientSearch)
      if (res.success) setPatientResults(res.data?.items || [])
    }, 300)
    return () => clearTimeout(t)
  }, [patientSearch])

  const selectPatient = (p) => {
    setSelectedPatient(p)
    setPatientResults([])
    setPatientSearch(p.fullName)
    setForm(f => ({ ...f, patientId: p.id }))
  }

  const submit = async () => {
    if (!form.patientId) return setError('Select a patient')
    if (!form.amount || parseFloat(form.amount) <= 0) return setError('Enter a valid amount')
    setSaving(true); setError('')
    try {
      const res = await depositService.collect({
        ...form,
        amount: parseFloat(form.amount),
        paymentMode: parseInt(form.paymentMode),
        admissionId: form.admissionId || null,
      })
      if (res.success) { onDone(res.data); onClose() }
      else setError(res.message || 'Failed to collect')
    } catch { setError('Server error') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Collect Advance Deposit</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          {/* Patient search */}
          <div className="relative">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Patient</label>
            <input
              value={patientSearch}
              onChange={e => setPatientSearch(e.target.value)}
              placeholder="Search by name, UHID or mobile..."
              className="mt-1 w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            {patientResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto mt-1">
                {patientResults.map(p => (
                  <button key={p.id} onClick={() => selectPatient(p)}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm border-b border-gray-50 last:border-0">
                    <div className="font-medium text-gray-800">{p.fullName}</div>
                    <div className="text-xs text-gray-400">{p.uhid} · {p.mobileNumber}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Admission ID (optional) */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">IPD Admission ID (optional)</label>
            <input
              value={form.admissionId || ''}
              onChange={e => setForm(f => ({ ...f, admissionId: e.target.value || null }))}
              placeholder="Leave blank for OPD advance"
              className="mt-1 w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount (₹)</label>
            <input
              type="number" min="1" value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              placeholder="0.00"
              className="mt-1 w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          {/* Payment mode */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment Mode</label>
            <select value={form.paymentMode} onChange={e => setForm(f => ({ ...f, paymentMode: e.target.value }))}
              className="mt-1 w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
              {PAYMENT_MODES.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          </div>

          {/* Transaction ID */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Transaction / Reference ID</label>
            <input
              value={form.transactionId}
              onChange={e => setForm(f => ({ ...f, transactionId: e.target.value }))}
              placeholder="UPI ID, card last 4, cheque no."
              className="mt-1 w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes</label>
            <input
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Optional"
              className="mt-1 w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          {error && <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
            <button onClick={submit} disabled={saving}
              className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50">
              {saving ? 'Collecting...' : 'Collect Deposit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function RefundModal({ deposit, onClose, onDone }) {
  const available = deposit.availableBalance
  const [form, setForm] = useState({ refundAmount: available, refundMode: 0, refundTransactionId: '', refundNotes: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (form.refundAmount <= 0 || form.refundAmount > available) return setError(`Refund must be between ₹1 and ₹${available}`)
    setSaving(true); setError('')
    try {
      const res = await depositService.refund({
        depositId: deposit.id,
        refundAmount: parseFloat(form.refundAmount),
        refundMode: parseInt(form.refundMode),
        refundTransactionId: form.refundTransactionId,
        refundNotes: form.refundNotes,
      })
      if (res.success) { onDone(); onClose() }
      else setError(res.message || 'Refund failed')
    } catch { setError('Server error') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Process Refund</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm">
            <div className="font-semibold text-amber-800">Receipt: {deposit.receiptNumber}</div>
            <div className="text-amber-700 mt-0.5">Available to refund: <span className="font-bold">₹{available.toLocaleString('en-IN')}</span></div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Refund Amount (₹)</label>
            <input type="number" min="1" max={available}
              value={form.refundAmount}
              onChange={e => setForm(f => ({ ...f, refundAmount: e.target.value }))}
              className="mt-1 w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Refund Mode</label>
            <select value={form.refundMode} onChange={e => setForm(f => ({ ...f, refundMode: e.target.value }))}
              className="mt-1 w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
              {PAYMENT_MODES.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Transaction / Reference</label>
            <input value={form.refundTransactionId}
              onChange={e => setForm(f => ({ ...f, refundTransactionId: e.target.value }))}
              placeholder="Optional"
              className="mt-1 w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes</label>
            <input value={form.refundNotes}
              onChange={e => setForm(f => ({ ...f, refundNotes: e.target.value }))}
              placeholder="Optional"
              className="mt-1 w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          {error && <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
            <button onClick={submit} disabled={saving}
              className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
              {saving ? 'Processing...' : 'Process Refund'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Deposits() {
  const [deposits, setDeposits] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [page, setPage] = useState(1)
  const [showCollect, setShowCollect] = useState(false)
  const [refundTarget, setRefundTarget] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await depositService.getAll(selectedDate || null, search, page)
      if (res.success) { setDeposits(res.data.items); setTotal(res.data.totalCount) }
    } catch { }
    finally { setLoading(false) }
  }, [search, selectedDate, page])

  useEffect(() => { load() }, [load])

  const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  const totalPages = Math.ceil(total / 20)

  // Summary stats from loaded page (approximate)
  const todayTotal = deposits.filter(d => new Date(d.depositDate).toDateString() === new Date().toDateString()).reduce((s, d) => s + d.amount, 0)
  const activeBalance = deposits.reduce((s, d) => s + d.availableBalance, 0)
  const refundable = deposits.filter(d => d.availableBalance > 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Advance Deposits</h2>
          <p className="text-sm text-gray-500 mt-0.5">Collect, track, adjust and refund patient advance payments</p>
        </div>
        <button onClick={() => setShowCollect(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors">
          + Collect Advance
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today's Collection", value: `₹${todayTotal.toLocaleString('en-IN')}`, icon: '💰', light: 'bg-emerald-50', text: 'text-emerald-600' },
          { label: 'Total Records', value: total, icon: '📋', light: 'bg-blue-50', text: 'text-blue-600' },
          { label: 'Active Balance', value: `₹${activeBalance.toLocaleString('en-IN')}`, icon: '🏦', light: 'bg-amber-50', text: 'text-amber-600' },
          { label: 'Refundable', value: refundable.length, icon: '↩', light: 'bg-red-50', text: 'text-red-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className={`w-10 h-10 ${s.light} rounded-xl flex items-center justify-center text-xl mb-3`}>{s.icon}</div>
            <div className={`text-2xl font-bold ${s.text}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search patient name, UHID, receipt..."
          className="flex-1 min-w-[200px] px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
        <input type="date" value={selectedDate}
          onChange={e => { setSelectedDate(e.target.value); setPage(1) }}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
        {(search || selectedDate) && (
          <button onClick={() => { setSearch(''); setSelectedDate(''); setPage(1) }}
            className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50">
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">Loading...</div>
        ) : deposits.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">💰</div>
            <div className="text-gray-600 font-medium">No deposits found</div>
            <div className="text-sm text-gray-400 mt-1">Collect the first advance payment to get started</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Receipt', 'Patient', 'Admission', 'Amount', 'Mode', 'Collected On', 'Balance', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {deposits.map(d => {
                  const badge = statusBadge(d)
                  return (
                    <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs font-bold text-gray-700">{d.receiptNumber}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{d.patientName}</div>
                        <div className="text-xs text-gray-400">{d.uhid}</div>
                      </td>
                      <td className="px-4 py-3">
                        {d.ipdNumber
                          ? <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{d.ipdNumber}</span>
                          : <span className="text-xs text-gray-400">OPD</span>
                        }
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">₹{d.amount.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-gray-600">{d.paymentMode}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(d.depositDate)}</td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${d.availableBalance > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                          ₹{d.availableBalance.toLocaleString('en-IN')}
                        </span>
                        {d.adjustedAmount > 0 && (
                          <div className="text-xs text-blue-500">adj. ₹{d.adjustedAmount.toLocaleString('en-IN')}</div>
                        )}
                        {d.refundedAmount > 0 && (
                          <div className="text-xs text-red-500">ref. ₹{d.refundedAmount.toLocaleString('en-IN')}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.cls}`}>{badge.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        {d.availableBalance > 0 && (
                          <button onClick={() => setRefundTarget(d)}
                            className="text-xs font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors">
                            Refund
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
            <span className="text-gray-500">Page {page} of {totalPages} · {total} records</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {showCollect && (
        <CollectModal
          onClose={() => setShowCollect(false)}
          onDone={() => load()}
        />
      )}

      {refundTarget && (
        <RefundModal
          deposit={refundTarget}
          onClose={() => setRefundTarget(null)}
          onDone={() => load()}
        />
      )}
    </div>
  )
}
