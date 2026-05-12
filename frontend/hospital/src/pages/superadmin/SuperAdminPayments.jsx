import { useState, useEffect } from 'react'
import api from '../../services/api'
import SuperAdminLayout from './SuperAdminLayout'

const MODES = ['Cash', 'Card', 'UPI', 'NEFT', 'RTGS', 'Cheque', 'Online']

const blank = { hospitalId: '', amount: '', paymentMode: 'Cash', notes: '' }

const MODE_BADGE = {
  Cash: 'bg-gray-100 text-gray-600',
  UPI: 'bg-blue-100 text-blue-700',
  Card: 'bg-purple-100 text-purple-700',
  NEFT: 'bg-indigo-100 text-indigo-700',
  RTGS: 'bg-indigo-100 text-indigo-700',
  Cheque: 'bg-amber-100 text-amber-700',
  Online: 'bg-emerald-100 text-emerald-700',
}

export default function SuperAdminPayments() {
  const [payments, setPayments]   = useState([])
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]           = useState(blank)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  const [filterHospital, setFilterHospital] = useState('')

  useEffect(() => { load(); loadHospitals() }, [])

  const load = async (hid = '') => {
    setLoading(true)
    try {
      const params = hid ? { hospitalId: hid } : {}
      const res = await api.get('/super-admin/payments', { params })
      if (res.data.success) setPayments(res.data.data || [])
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const loadHospitals = async () => {
    try {
      const res = await api.get('/super-admin/hospitals?pageSize=200')
      if (res.data.success) setHospitals(res.data.data?.items || [])
    } catch(e) {}
  }

  const save = async () => {
    if (!form.hospitalId || !form.amount) return setError('Hospital and amount are required')
    if (isNaN(+form.amount) || +form.amount <= 0) return setError('Enter a valid amount')
    setSaving(true)
    setError('')
    try {
      const res = await api.post('/super-admin/payments', {
        hospitalId: form.hospitalId,
        amount: +form.amount,
        paymentMode: form.paymentMode,
        notes: form.notes || null
      })
      if (res.data.success) {
        setShowModal(false)
        setForm(blank)
        load(filterHospital)
      } else setError(res.data.message)
    } catch(e) { setError('Failed to record payment') }
    finally { setSaving(false) }
  }

  const fmt = (iso) => new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })

  const total = payments.reduce((s, p) => s + p.amount, 0)

  return (
    <SuperAdminLayout
      title="Subscription Payments"
      subtitle={`${payments.length} payments · Total ₹${total.toLocaleString('en-IN')}`}
    >
      <div className="flex gap-3 mb-5">
        <select
          value={filterHospital}
          onChange={e => { setFilterHospital(e.target.value); load(e.target.value) }}
          className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none">
          <option value="">All Hospitals</option>
          {hospitals.map(h => (
            <option key={h.id} value={h.id}>{h.name} ({h.hospitalCode})</option>
          ))}
        </select>
        <button onClick={() => { setShowModal(true); setForm(blank); setError('') }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap">
          + Record Payment
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : payments.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">💳</div>
            <div className="text-gray-500">No payments recorded</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Invoice', 'Hospital', 'Amount', 'Mode', 'Date', 'Notes'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-xs font-mono text-gray-500">{p.invoiceNumber || '—'}</td>
                    <td className="px-6 py-3">
                      <div className="text-sm font-semibold text-gray-900">{p.hospitalName}</div>
                      <div className="text-xs text-gray-400 font-mono">{p.hospitalCode}</div>
                    </td>
                    <td className="px-6 py-3 text-sm font-bold text-gray-900">
                      ₹{p.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${MODE_BADGE[p.paymentMode] || 'bg-gray-100 text-gray-500'}`}>
                        {p.paymentMode}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-500">{fmt(p.paidOn)}</td>
                    <td className="px-6 py-3 text-sm text-gray-400">{p.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td colSpan={2} className="px-6 py-3 text-sm font-semibold text-gray-700">Total</td>
                  <td className="px-6 py-3 text-sm font-bold text-gray-900">₹{total.toLocaleString('en-IN')}</td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-gray-900 mb-4">💳 Record Payment</h3>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-xl text-sm mb-4">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Hospital</label>
                <select value={form.hospitalId}
                  onChange={e => setForm(f => ({ ...f, hospitalId: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none">
                  <option value="">Select hospital...</option>
                  {hospitals.map(h => (
                    <option key={h.id} value={h.id}>{h.name} ({h.hospitalCode})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Amount (₹)</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="e.g. 7999"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Payment Mode</label>
                <select value={form.paymentMode}
                  onChange={e => setForm(f => ({ ...f, paymentMode: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none">
                  {MODES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Notes (optional)</label>
                <input
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="e.g. May 2026 subscription"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={save} disabled={saving}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                {saving ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  )
}
