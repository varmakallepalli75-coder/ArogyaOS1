import { useState, useEffect } from 'react'
import { billingService } from '../../services/billingService'
import { patientService } from '../../services/patientService'
import { departmentService } from '../../services/departmentService'

const paymentModes = ['Cash', 'Card', 'UPI', 'NEFT', 'RTGS', 'Cheque', 'Insurance', 'Ayushman', 'CGHS', 'ESIC']

const statusColors = {
  Paid: 'bg-emerald-100 text-emerald-700',
  PartiallyPaid: 'bg-amber-100 text-amber-700',
  Pending: 'bg-red-100 text-red-700',
  Draft: 'bg-gray-100 text-gray-600',
}

export default function Billing() {
  const [bills, setBills] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showBill, setShowBill] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [selectedBill, setSelectedBill] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [page, setPage] = useState(1)
  const [doctors, setDoctors] = useState([])
  const [patientSearch, setPatientSearch] = useState('')
  const [patientResults, setPatientResults] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)

  const [form, setForm] = useState({
    patientId: '',
    doctorId: '',
    billType: 0,
    items: [{ description: '', itemType: 0, unitPrice: 0, quantity: 1, gstPercent: 0 }],
    discountAmount: 0,
    discountPercent: 0,
    discountReason: '',
    paymentMode: 0,
    isPaid: false,
    insuranceType: 0,
    insuranceCoveredAmount: 0,
    notes: ''
  })

  const [paymentForm, setPaymentForm] = useState({
    billId: '',
    amount: 0,
    paymentMode: 0,
    transactionReference: '',
    notes: ''
  })

  useEffect(() => { loadBills() }, [search, selectedDate, page])
  useEffect(() => {
    if (patientSearch.length >= 3) searchPatients()
    else setPatientResults([])
  }, [patientSearch])

  useEffect(() => {
    departmentService.getDoctors(null).then(res => {
      if (res.success) setDoctors(res.data)
    })
  }, [])

  const loadBills = async () => {
    setLoading(true)
    try {
      const res = await billingService.getAll(selectedDate || null, search, page)
      if (res.success) {
        setBills(res.data.items)
        setTotal(res.data.totalCount)
      }
    } catch(e) {}
    finally { setLoading(false) }
  }

  const searchPatients = async () => {
    try {
      const res = await patientService.search(patientSearch)
      if (res.success) setPatientResults(res.data)
    } catch(e) {}
  }

  const selectPatient = (p) => {
    setSelectedPatient(p)
    setForm(prev => ({ ...prev, patientId: p.id }))
    setPatientSearch(p.fullName)
    setPatientResults([])
  }

  const addItem = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { description: '', itemType: 0, unitPrice: 0, quantity: 1, gstPercent: 0 }]
    }))
  }

  const removeItem = (i) => {
    setForm(prev => ({ ...prev, items: prev.items.filter((_, j) => j !== i) }))
  }

  const updateItem = (i, field, value) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.map((item, j) => j === i ? { ...item, [field]: value } : item)
    }))
  }

  const subTotal = form.items.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0)
  const discountAmt = form.discountAmount > 0 ? form.discountAmount : (subTotal * form.discountPercent / 100)
  const gstAmt = form.items.reduce((sum, i) => sum + (i.unitPrice * i.quantity * i.gstPercent / 100), 0)
  const total2 = subTotal - discountAmt + gstAmt - form.insuranceCoveredAmount

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await billingService.create(form)
      if (res.success) {
        setSuccess(`Bill created! ${res.data.billNumber}`)
        setShowForm(false)
        setSelectedPatient(null)
        setPatientSearch('')
        setForm({
          patientId: '', doctorId: '', billType: 0,
          items: [{ description: '', itemType: 0, unitPrice: 0, quantity: 1, gstPercent: 0 }],
          discountAmount: 0, discountPercent: 0, discountReason: '',
          paymentMode: 0, isPaid: false, insuranceType: 0,
          insuranceCoveredAmount: 0, notes: ''
        })
        loadBills()
      } else setError(res.message)
    } catch(e) { setError('Something went wrong.') }
    finally { setSaving(false) }
  }

  const handlePayment = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await billingService.recordPayment(paymentForm)
      if (res.success) {
        setSuccess('Payment recorded successfully!')
        setShowPayment(false)
        setSelectedBill(res.data)
        loadBills()
      } else setError(res.message)
    } catch(e) { setError('Something went wrong.') }
    finally { setSaving(false) }
  }

  const openBill = async (id) => {
    try {
      const res = await billingService.getById(id)
      if (res.success) {
        setSelectedBill(res.data)
        setShowBill(true)
      }
    } catch(e) {}
  }

  const overlay = { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:'1rem' }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Billing</h2>
          <p className="text-sm text-gray-500">{total} total bills</p>
        </div>
        <button onClick={() => { setShowForm(true); setError('') }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold">
          + Create Bill
        </button>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">
          {success}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex gap-3">
        <input
          type="text" placeholder="Search by bill no, patient name, UHID..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        <input
          type="date" value={selectedDate}
          onChange={e => { setSelectedDate(e.target.value); setPage(1) }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        {selectedDate && (
          <button onClick={() => setSelectedDate('')}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">
            Clear
          </button>
        )}
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : bills.length === 0 ? (
          <div className="flex flex-col items-center py-20">
            <div className="text-4xl mb-2">🧾</div>
            <div className="text-gray-500 font-medium">No bills found</div>
            <div className="text-gray-400 text-sm mt-1">Create your first bill</div>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Bill No.</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Patient</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Paid</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Due</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bills.map(bill => (
                  <tr key={bill.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-emerald-600">{bill.billNumber}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{bill.patientName}</div>
                      <div className="text-xs text-gray-500">{bill.patientUHID}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(bill.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      ₹{bill.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-emerald-600 font-medium">
                      ₹{bill.paidAmount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-red-600 font-medium">
                      ₹{bill.dueAmount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[bill.paymentStatus] || 'bg-gray-100 text-gray-600'}`}>
                        {bill.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openBill(bill.id)}
                          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
                          View
                        </button>
                        {bill.dueAmount > 0 && (
                          <button onClick={() => {
                            setPaymentForm({ billId: bill.id, amount: bill.dueAmount, paymentMode: 0, transactionReference: '', notes: '' })
                            setShowPayment(true)
                            setError('')
                          }}
                            className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200">
                            Pay
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {total > 20 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  Showing {((page-1)*20)+1}–{Math.min(page*20, total)} of {total}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                    className="px-3 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-40">
                    Previous
                  </button>
                  <button onClick={() => setPage(p => p+1)} disabled={page * 20 >= total}
                    className="px-3 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-40">
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {/* Create Bill Modal */}
      {showForm && (
        <div style={overlay}>
          <div className="bg-white rounded-2xl w-full max-w-3xl" style={{maxHeight:'90vh',overflowY:'auto'}}>
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold">Create Bill</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-5">
              {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

              {/* Patient Search */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Search Patient *</label>
                <div className="relative">
                  <input value={patientSearch}
                    onChange={e => { setPatientSearch(e.target.value); if (!e.target.value) { setSelectedPatient(null); setForm(p=>({...p,patientId:''})) } }}
                    placeholder="Type name, mobile or UHID..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  {patientResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1">
                      {patientResults.map(p => (
                        <div key={p.id} onClick={() => selectPatient(p)}
                          className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0">
                          <div className="text-sm font-medium text-gray-900">{p.fullName}</div>
                          <div className="text-xs text-gray-500">{p.uhid} · {p.mobileNumber}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {selectedPatient && (
                  <div className="mt-2 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg text-sm text-emerald-800">
                    ✅ {selectedPatient.fullName} — {selectedPatient.uhid}
                  </div>
                )}
              </div>

              {/* Doctor */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Doctor</label>
                <select value={form.doctorId} onChange={e => setForm(p=>({...p,doctorId:e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="">Select doctor (optional)</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.fullName} — ₹{d.consultationFee}</option>)}
                </select>
              </div>

              {/* Bill Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-700">Bill Items *</label>
                  <button type="button" onClick={addItem}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg font-medium">
                    + Add Item
                  </button>
                </div>
                <div className="space-y-2">
                  {form.items.map((item, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <input value={item.description} onChange={e => updateItem(i,'description',e.target.value)}
                        placeholder="Description" required
                        className="col-span-4 px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                      <input type="number" value={item.unitPrice} onChange={e => updateItem(i,'unitPrice',parseFloat(e.target.value)||0)}
                        placeholder="Price"
                        className="col-span-2 px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                      <input type="number" value={item.quantity} onChange={e => updateItem(i,'quantity',parseInt(e.target.value)||1)}
                        placeholder="Qty"
                        className="col-span-2 px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                      <input type="number" value={item.gstPercent} onChange={e => updateItem(i,'gstPercent',parseFloat(e.target.value)||0)}
                        placeholder="GST%"
                        className="col-span-2 px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                      <div className="col-span-1 text-sm font-medium text-gray-700">
                        ₹{(item.unitPrice * item.quantity).toFixed(0)}
                      </div>
                      {form.items.length > 1 && (
                        <button type="button" onClick={() => removeItem(i)}
                          className="col-span-1 text-red-400 hover:text-red-600 text-lg text-center">✕</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Discount & Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Discount (₹)</label>
                      <input type="number" value={form.discountAmount}
                        onChange={e => setForm(p=>({...p,discountAmount:parseFloat(e.target.value)||0}))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Discount (%)</label>
                      <input type="number" value={form.discountPercent}
                        onChange={e => setForm(p=>({...p,discountPercent:parseFloat(e.target.value)||0}))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Payment Mode</label>
                    <select value={form.paymentMode} onChange={e => setForm(p=>({...p,paymentMode:parseInt(e.target.value)}))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                      {paymentModes.map((m,i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="isPaid" checked={form.isPaid}
                      onChange={e => setForm(p=>({...p,isPaid:e.target.checked}))}
                      className="w-4 h-4 accent-emerald-600" />
                    <label htmlFor="isPaid" className="text-sm text-gray-600">Mark as Paid</label>
                  </div>
                </div>

                {/* Bill Summary */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Bill Summary</h4>
                  {[
                    ['Sub Total', `₹${subTotal.toFixed(2)}`],
                    ['Discount', `-₹${discountAmt.toFixed(2)}`],
                    ['GST', `₹${gstAmt.toFixed(2)}`],
                    ['Insurance', `-₹${form.insuranceCoveredAmount.toFixed(2)}`],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-gray-500">{label}</span>
                      <span className="font-medium text-gray-800">{value}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-2 flex justify-between">
                    <span className="text-sm font-bold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-emerald-600">₹{total2.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm">Cancel</button>
                <button type="submit" disabled={saving || !form.patientId}
                  className="flex-1 bg-emerald-600 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50">
                  {saving ? 'Creating...' : 'Create Bill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Bill Modal */}
      {showBill && selectedBill && (
        <div style={overlay}>
          <div className="bg-white rounded-2xl w-full max-w-2xl" style={{maxHeight:'90vh',overflowY:'auto'}}>
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold">{selectedBill.billNumber}</h3>
                <p className="text-sm text-gray-500">{new Date(selectedBill.createdAt).toLocaleDateString('en-IN')}</p>
              </div>
              <div className="flex gap-2 items-center">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[selectedBill.paymentStatus] || 'bg-gray-100 text-gray-600'}`}>
                  {selectedBill.paymentStatus}
                </span>
                <button onClick={() => setShowBill(false)} className="text-gray-400 text-xl">✕</button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
                <div>
                  <div className="text-xs text-gray-500">Patient</div>
                  <div className="text-sm font-semibold text-gray-900">{selectedBill.patientName}</div>
                  <div className="text-xs text-gray-500">{selectedBill.patientUHID} · {selectedBill.patientMobile}</div>
                </div>
                {selectedBill.doctorName && (
                  <div>
                    <div className="text-xs text-gray-500">Doctor</div>
                    <div className="text-sm font-semibold text-gray-900">{selectedBill.doctorName}</div>
                  </div>
                )}
              </div>

              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Description</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">Price</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">Qty</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBill.items.map((item, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="px-3 py-2 text-sm text-gray-800">{item.description}</td>
                      <td className="px-3 py-2 text-sm text-right text-gray-600">₹{item.unitPrice}</td>
                      <td className="px-3 py-2 text-sm text-right text-gray-600">{item.quantity}</td>
                      <td className="px-3 py-2 text-sm text-right font-medium text-gray-800">₹{item.totalPrice}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
                {[
                  ['Sub Total', `₹${selectedBill.subTotal}`],
                  ['Discount', `-₹${selectedBill.discountAmount}`],
                  ['GST', `₹${selectedBill.gstAmount}`],
                ].map(([l,v]) => (
                  <div key={l} className="flex justify-between text-sm">
                    <span className="text-gray-500">{l}</span>
                    <span className="text-gray-800">{v}</span>
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-emerald-600">₹{selectedBill.totalAmount}</span>
                </div>
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Paid</span>
                  <span>₹{selectedBill.paidAmount}</span>
                </div>
                <div className="flex justify-between text-sm text-red-600 font-medium">
                  <span>Due</span>
                  <span>₹{selectedBill.dueAmount}</span>
                </div>
              </div>

              {selectedBill.payments?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Payment History</h4>
                  {selectedBill.payments.map((p, i) => (
                    <div key={i} className="flex justify-between text-sm bg-emerald-50 px-3 py-2 rounded-lg mb-1">
                      <span className="text-gray-700">{p.paymentMode} {p.transactionReference && `· ${p.transactionReference}`}</span>
                      <span className="font-medium text-emerald-700">₹{p.amount}</span>
                    </div>
                  ))}
                </div>
              )}

              {selectedBill.dueAmount > 0 && (
                <button onClick={() => {
                  setPaymentForm({ billId: selectedBill.id, amount: selectedBill.dueAmount, paymentMode: 0, transactionReference: '', notes: '' })
                  setShowBill(false)
                  setShowPayment(true)
                  setError('')
                }}
                  className="w-full bg-emerald-600 text-white rounded-xl py-2.5 text-sm font-semibold">
                  Record Payment — ₹{selectedBill.dueAmount}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <div style={overlay}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Record Payment</h3>
              <button onClick={() => setShowPayment(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <form onSubmit={handlePayment} className="space-y-4">
              {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Amount (₹)</label>
                <input type="number" value={paymentForm.amount}
                  onChange={e => setPaymentForm(p=>({...p,amount:parseFloat(e.target.value)||0}))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Payment Mode</label>
                <select value={paymentForm.paymentMode}
                  onChange={e => setPaymentForm(p=>({...p,paymentMode:parseInt(e.target.value)}))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  {paymentModes.map((m,i) => <option key={i} value={i}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Transaction Reference</label>
                <input value={paymentForm.transactionReference}
                  onChange={e => setPaymentForm(p=>({...p,transactionReference:e.target.value}))}
                  placeholder="UPI ID, Card last 4 digits..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowPayment(false)}
                  className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-emerald-600 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50">
                  {saving ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}