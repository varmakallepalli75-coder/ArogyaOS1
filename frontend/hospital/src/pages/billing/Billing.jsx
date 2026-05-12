import { useState, useEffect, useCallback } from 'react'
import { billingService } from '../../services/billingService'
import { patientService } from '../../services/patientService'
import { depositService } from '../../services/depositService'

const PAYMENT_MODES = ['Cash', 'Card', 'UPI', 'NEFT', 'RTGS', 'Cheque', 'Insurance', 'Ayushman', 'CGHS', 'ESIC']

const STATUS_TABS = ['All', 'Pending', 'PartiallyPaid', 'Paid']
const STATUS_COLORS = {
  Paid:          'bg-emerald-100 text-emerald-700',
  PartiallyPaid: 'bg-amber-100 text-amber-700',
  Pending:       'bg-red-100 text-red-700',
}

// Common service shortcuts for Indian hospitals
const QUICK_SERVICES = [
  { label: 'Consultation', price: 500,  cat: 'Consultation' },
  { label: 'Doctor Visit',  price: 300,  cat: 'Consultation' },
  { label: 'Room / Day',    price: 1500, cat: 'Bed' },
  { label: 'Nursing',       price: 500,  cat: 'Procedure' },
  { label: 'Lab Test',      price: 800,  cat: 'Lab' },
  { label: 'X-Ray',         price: 600,  cat: 'Radiology' },
  { label: 'Medicine',      price: 0,    cat: 'Pharmacy' },
  { label: 'OT Charges',    price: 5000, cat: 'Surgery' },
  { label: 'Dressing',      price: 200,  cat: 'Procedure' },
  { label: 'Ambulance',     price: 800,  cat: 'Ambulance' },
]

const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

// ─── Create Bill Modal ──────────────────────────────────────────────────────

function CreateBillModal({ onClose, onDone }) {
  const [step, setStep] = useState(1)       // 1=Patient, 2=Items, 3=Payment
  const [patientSearch, setPatientSearch] = useState('')
  const [patientResults, setPatientResults] = useState([])
  const [patient, setPatient] = useState(null)
  const [depositSummary, setDepositSummary] = useState(null)
  const [items, setItems] = useState([{ description: '', category: 'Consultation', unitPrice: '', quantity: 1, gstPercent: 0 }])
  const [discount, setDiscount] = useState({ type: 'amount', value: 0 })
  const [payment, setPayment] = useState({ isPaid: false, paymentMode: 0, transactionId: '', notes: '', insuranceCoveredAmount: 0, insuranceType: 0 })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (patientSearch.length < 3) { setPatientResults([]); return }
    const t = setTimeout(async () => {
      const res = await patientService.search(patientSearch)
      if (res.success) setPatientResults(res.data?.items || res.data || [])
    }, 300)
    return () => clearTimeout(t)
  }, [patientSearch])

  const selectPatient = async (p) => {
    setPatient(p)
    setPatientSearch(p.fullName)
    setPatientResults([])
    setStep(2)
    try {
      const res = await depositService.getSummary(p.id, null)
      if (res.success && res.data?.totalDeposited > 0) setDepositSummary(res.data)
    } catch { }
  }

  const addQuick = (s) => setItems(prev => [...prev, { description: s.label, category: s.cat, unitPrice: s.price, quantity: 1, gstPercent: 0 }])
  const addBlank = () => setItems(prev => [...prev, { description: '', category: 'Consultation', unitPrice: '', quantity: 1, gstPercent: 0 }])
  const removeItem = (i) => setItems(prev => prev.filter((_, j) => j !== i))
  const updateItem = (i, k, v) => setItems(prev => prev.map((it, j) => j === i ? { ...it, [k]: v } : it))

  const subTotal = items.reduce((s, i) => s + (parseFloat(i.unitPrice) || 0) * (parseInt(i.quantity) || 1), 0)
  const discountAmt = discount.type === 'percent' ? subTotal * discount.value / 100 : parseFloat(discount.value) || 0
  const gstAmt = items.reduce((s, i) => s + (parseFloat(i.unitPrice) || 0) * (parseInt(i.quantity) || 1) * (parseFloat(i.gstPercent) || 0) / 100, 0)
  const insAmt = parseFloat(payment.insuranceCoveredAmount) || 0
  const grandTotal = Math.max(0, subTotal - discountAmt + gstAmt - insAmt)

  const submit = async () => {
    if (!patient) return setError('Select a patient')
    if (items.every(i => !i.description)) return setError('Add at least one item')
    setSaving(true); setError('')
    try {
      const res = await billingService.create({
        patientId: patient.id,
        items: items.filter(i => i.description).map(i => ({
          description: i.description,
          itemType: 0,
          unitPrice: parseFloat(i.unitPrice) || 0,
          quantity: parseInt(i.quantity) || 1,
          gstPercent: parseFloat(i.gstPercent) || 0,
        })),
        discountAmount: discount.type === 'amount' ? parseFloat(discount.value) || 0 : 0,
        discountPercent: discount.type === 'percent' ? parseFloat(discount.value) || 0 : 0,
        paymentMode: parseInt(payment.paymentMode),
        isPaid: payment.isPaid,
        insuranceType: parseInt(payment.insuranceType),
        insuranceCoveredAmount: insAmt,
        notes: payment.notes,
      })
      if (res.success) { onDone(res.data); onClose() }
      else setError(res.message || 'Failed to create bill')
    } catch { setError('Server error') }
    finally { setSaving(false) }
  }

  const steps = ['Patient', 'Services', 'Payment']

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="font-bold text-gray-900 text-lg">New Bill</h2>
            <div className="flex items-center gap-1.5">
              {steps.map((s, i) => (
                <div key={s} className="flex items-center gap-1.5">
                  <button onClick={() => { if (i < step - 1 || (i === 1 && patient)) setStep(i + 1) }}
                    className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${
                      step === i + 1 ? 'bg-emerald-600 text-white' :
                      step > i + 1 ? 'bg-emerald-100 text-emerald-700 cursor-pointer' :
                      'bg-gray-100 text-gray-400'
                    }`}>{i + 1}</button>
                  <span className={`text-xs ${step === i + 1 ? 'text-emerald-700 font-medium' : 'text-gray-400'}`}>{s}</span>
                  {i < 2 && <span className="text-gray-200 text-xs">›</span>}
                </div>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && <div className="mb-4 text-red-600 text-sm bg-red-50 px-4 py-2.5 rounded-xl">{error}</div>}

          {/* Step 1 — Patient */}
          {step === 1 && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Search Patient</label>
                <input value={patientSearch} onChange={e => setPatientSearch(e.target.value)}
                  placeholder="Type name, UHID or mobile number..."
                  autoFocus
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              {patientSearch.length < 3 && (
                <div className="text-center py-10 text-gray-400 text-sm">Type at least 3 characters to search</div>
              )}

              {patientSearch.length >= 3 && patientResults.length === 0 && (
                <div className="text-center py-10 text-gray-400 text-sm">No patients found</div>
              )}

              {patientResults.length > 0 && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  {patientResults.map((p, i) => (
                    <button key={p.id} onClick={() => selectPatient(p)}
                      className={`w-full text-left px-4 py-3.5 hover:bg-emerald-50 transition-colors flex items-center gap-3 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                      <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm flex-shrink-0">
                        {p.fullName?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-800 text-sm">{p.fullName}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{p.uhid} · {p.mobileNumber}{p.age ? ` · ${p.age}y` : ''}</div>
                      </div>
                      <span className="text-emerald-500 text-xs font-medium flex-shrink-0">Select →</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2 — Services */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Patient chip */}
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {patient?.fullName?.[0]}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-emerald-800 text-sm">{patient?.fullName}</div>
                  <div className="text-xs text-emerald-600">{patient?.uhid} · {patient?.mobileNumber}</div>
                </div>
                <button onClick={() => { setPatient(null); setStep(1) }} className="text-emerald-400 hover:text-emerald-600 text-sm">Change</button>
              </div>

              {depositSummary && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                  <span className="font-semibold">Advance available: ₹{fmt(depositSummary.availableBalance)}</span>
                  <span className="text-amber-600 ml-2">· Can be adjusted at discharge</span>
                </div>
              )}

              {/* Quick add */}
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Quick Add</div>
                <div className="flex flex-wrap gap-2">
                  {QUICK_SERVICES.map(s => (
                    <button key={s.label} onClick={() => addQuick(s)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-transparent text-gray-600 rounded-lg text-xs font-medium transition-colors">
                      + {s.label} {s.price > 0 && `₹${s.price}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bill Items</div>
                  <button onClick={addBlank} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">+ Add Custom</button>
                </div>

                <div className="space-y-2">
                  {items.map((item, i) => (
                    <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
                      {/* Description row */}
                      <div className="flex items-center gap-2">
                        <input value={item.description}
                          onChange={e => updateItem(i, 'description', e.target.value)}
                          placeholder="Service / Item description"
                          className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                        />
                        {items.length > 1 && (
                          <button onClick={() => removeItem(i)} className="text-gray-300 hover:text-red-400 text-xl leading-none flex-shrink-0">×</button>
                        )}
                      </div>
                      {/* Price / Qty / Total row */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="text-xs text-gray-400 mb-1">Rate (₹)</div>
                          <input type="number" min="0" value={item.unitPrice}
                            onChange={e => updateItem(i, 'unitPrice', e.target.value)}
                            placeholder="0"
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                          />
                        </div>
                        <div className="flex-shrink-0">
                          <div className="text-xs text-gray-400 mb-1">Qty</div>
                          <input type="number" min="1" value={item.quantity}
                            onChange={e => updateItem(i, 'quantity', e.target.value)}
                            className="w-16 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-center font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400"
                          />
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <div className="text-xs text-gray-400 mb-1">Total</div>
                          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-sm font-bold text-emerald-700 min-w-[80px] text-center">
                            ₹{fmt((parseFloat(item.unitPrice) || 0) * (parseInt(item.quantity) || 1))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discount */}
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-600 font-medium flex-shrink-0">Discount</div>
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                  {['amount', 'percent'].map(t => (
                    <button key={t} onClick={() => setDiscount(d => ({ ...d, type: t }))}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${discount.type === t ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}>
                      {t === 'amount' ? '₹' : '%'}
                    </button>
                  ))}
                </div>
                <input type="number" min="0" value={discount.value}
                  onChange={e => setDiscount(d => ({ ...d, value: e.target.value }))}
                  placeholder="0"
                  className="w-28 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                {discount.value > 0 && (
                  <span className="text-sm text-red-500 font-medium">-₹{fmt(discountAmt)}</span>
                )}
              </div>

              {/* Live summary */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                {[
                  ['Subtotal', `₹${fmt(subTotal)}`],
                  ...(discountAmt > 0 ? [['Discount', `-₹${fmt(discountAmt)}`]] : []),
                  ...(gstAmt > 0 ? [['GST', `₹${fmt(gstAmt)}`]] : []),
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between text-sm text-gray-600"><span>{l}</span><span>{v}</span></div>
                ))}
                <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2">
                  <span>Total</span>
                  <span className="text-emerald-600">₹{fmt(grandTotal)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">← Back</button>
                <button onClick={() => setStep(3)} disabled={items.every(i => !i.description)}
                  className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40">
                  Continue to Payment →
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Payment */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Bill summary chip */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-emerald-700">{patient?.fullName}</div>
                    <div className="text-xs text-emerald-600 mt-0.5">{items.filter(i => i.description).length} item(s)</div>
                  </div>
                  <div className="text-2xl font-black text-emerald-700">₹{fmt(grandTotal)}</div>
                </div>
              </div>

              {/* Paid toggle */}
              <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                <div>
                  <div className="text-sm font-semibold text-gray-800">Collect payment now</div>
                  <div className="text-xs text-gray-400 mt-0.5">Toggle off to save as pending</div>
                </div>
                <button onClick={() => setPayment(p => ({ ...p, isPaid: !p.isPaid }))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${payment.isPaid ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${payment.isPaid ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>

              {payment.isPaid && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment Mode</label>
                    <div className="grid grid-cols-5 gap-2 mt-2">
                      {['Cash', 'UPI', 'Card', 'NEFT', 'Cheque'].map((m, i) => (
                        <button key={m} onClick={() => setPayment(p => ({ ...p, paymentMode: i }))}
                          className={`py-2 rounded-xl text-xs font-semibold transition-colors ${parseInt(payment.paymentMode) === i ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                          {m}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-5 gap-2 mt-2">
                      {['Insurance', 'Ayushman', 'CGHS', 'ESIC', 'RTGS'].map((m, i) => (
                        <button key={m} onClick={() => setPayment(p => ({ ...p, paymentMode: i + 5 }))}
                          className={`py-2 rounded-xl text-xs font-semibold transition-colors ${parseInt(payment.paymentMode) === i + 5 ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Transaction / Reference ID</label>
                    <input value={payment.transactionId}
                      onChange={e => setPayment(p => ({ ...p, transactionId: e.target.value }))}
                      placeholder="UPI ref, card last 4, cheque no..."
                      className="mt-1.5 w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                </div>
              )}

              {/* Insurance covered amount */}
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-600 flex-shrink-0">Insurance covers</div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-400 text-sm">₹</span>
                  <input type="number" min="0" value={payment.insuranceCoveredAmount}
                    onChange={e => setPayment(p => ({ ...p, insuranceCoveredAmount: e.target.value }))}
                    placeholder="0"
                    className="w-32 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                {insAmt > 0 && <span className="text-xs text-blue-600">Patient pays ₹{fmt(grandTotal)}</span>}
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes</label>
                <input value={payment.notes}
                  onChange={e => setPayment(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Optional remarks"
                  className="mt-1.5 w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(2)} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">← Back</button>
                <button onClick={submit} disabled={saving}
                  className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40">
                  {saving ? 'Creating...' : payment.isPaid ? `Generate & Collect ₹${fmt(grandTotal)}` : 'Generate Bill (Pending)'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Bill Detail Modal ──────────────────────────────────────────────────────

function BillDetailModal({ bill, onClose, onPayment, onRefresh }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <div className="font-mono font-bold text-gray-800">{bill.billNumber}</div>
            <div className="text-xs text-gray-400 mt-0.5">{fmtDate(bill.createdAt)}</div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[bill.paymentStatus] || 'bg-gray-100 text-gray-600'}`}>
              {bill.paymentStatus}
            </span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Patient info */}
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
            <div className="w-9 h-9 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {bill.patientName?.[0]}
            </div>
            <div>
              <div className="font-semibold text-gray-800 text-sm">{bill.patientName}</div>
              <div className="text-xs text-gray-400">{bill.patientUHID} · {bill.patientMobile}</div>
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Services</div>
            <div className="space-y-1">
              {bill.items?.map((item, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <div className="text-sm text-gray-700">{item.description}</div>
                  <div className="text-sm text-gray-500 text-right">
                    {item.quantity > 1 && <span className="text-xs text-gray-400 mr-2">₹{fmt(item.unitPrice)} × {item.quantity}</span>}
                    <span className="font-semibold text-gray-800">₹{fmt(item.totalPrice)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            {bill.subTotal !== bill.totalAmount && (
              <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span>₹{fmt(bill.subTotal)}</span></div>
            )}
            {bill.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-red-500"><span>Discount</span><span>-₹{fmt(bill.discountAmount)}</span></div>
            )}
            {bill.gstAmount > 0 && (
              <div className="flex justify-between text-sm text-gray-500"><span>GST</span><span>₹{fmt(bill.gstAmount)}</span></div>
            )}
            {bill.insuranceCoveredAmount > 0 && (
              <div className="flex justify-between text-sm text-blue-600"><span>Insurance</span><span>-₹{fmt(bill.insuranceCoveredAmount)}</span></div>
            )}
            <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2">
              <span>Total</span>
              <span className="text-gray-900">₹{fmt(bill.totalAmount)}</span>
            </div>

            {/* Advance info for IPD */}
            {bill.advanceDeposited > 0 && (
              <div className="mt-2 pt-2 border-t border-dashed border-gray-200 space-y-1">
                <div className="flex justify-between text-xs text-amber-600"><span>Advance Deposited</span><span>₹{fmt(bill.advanceDeposited)}</span></div>
                {bill.advanceAdjusted > 0 && <div className="flex justify-between text-xs text-blue-600"><span>Adjusted</span><span>-₹{fmt(bill.advanceAdjusted)}</span></div>}
                <div className="flex justify-between text-xs text-emerald-600 font-medium"><span>Balance Available</span><span>₹{fmt(bill.advanceAvailable)}</span></div>
              </div>
            )}

            <div className="flex justify-between text-sm text-emerald-600 font-semibold"><span>Paid</span><span>₹{fmt(bill.paidAmount)}</span></div>
            {bill.dueAmount > 0 && (
              <div className="flex justify-between text-sm text-red-600 font-bold"><span>Due</span><span>₹{fmt(bill.dueAmount)}</span></div>
            )}
          </div>

          {/* Payment history */}
          {bill.payments?.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Payments</div>
              <div className="space-y-1.5">
                {bill.payments.map((p, i) => (
                  <div key={i} className="flex justify-between items-center bg-emerald-50 rounded-lg px-3 py-2">
                    <div className="text-xs text-gray-600">{p.paymentMode} {p.transactionReference && `· ${p.transactionReference}`}</div>
                    <div className="text-sm font-semibold text-emerald-700">₹{fmt(p.amount)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={() => billingService.downloadPdf(bill.id, bill.billNumber)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
              📄 PDF
            </button>
            {bill.dueAmount > 0 && (
              <button onClick={() => onPayment(bill)}
                className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700">
                Collect ₹{fmt(bill.dueAmount)}
              </button>
            )}
            {bill.dueAmount <= 0 && (
              <div className="flex-1 flex items-center justify-center text-emerald-600 font-semibold text-sm">
                ✅ Fully Paid
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Payment Modal ──────────────────────────────────────────────────────────

function PaymentModal({ bill, onClose, onDone }) {
  const [form, setForm] = useState({ amount: bill.dueAmount, paymentMode: 0, transactionReference: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!form.amount || form.amount <= 0) return setError('Enter a valid amount')
    setSaving(true); setError('')
    try {
      const res = await billingService.recordPayment({ billId: bill.id, ...form, paymentMode: parseInt(form.paymentMode) })
      if (res.success) { onDone(res.data); onClose() }
      else setError(res.message || 'Failed')
    } catch { setError('Server error') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900">Collect Payment</h2>
            <p className="text-xs text-gray-400 mt-0.5">{bill.billNumber} · {bill.patientName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-center">
            <div className="text-2xl font-black text-red-600">₹{fmt(bill.dueAmount)}</div>
            <div className="text-xs text-red-400 mt-0.5">Due amount</div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount to collect</label>
            <input type="number" value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
              className="mt-1.5 w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Payment Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {['Cash', 'UPI', 'Card', 'NEFT', 'Cheque', 'Insurance'].map((m, i) => (
                <button key={m} onClick={() => setForm(f => ({ ...f, paymentMode: i }))}
                  className={`py-2 rounded-xl text-xs font-semibold transition-colors ${parseInt(form.paymentMode) === i ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          <input value={form.transactionReference}
            onChange={e => setForm(f => ({ ...f, transactionReference: e.target.value }))}
            placeholder="Reference / Transaction ID (optional)"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />

          {error && <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</div>}

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            <button onClick={submit} disabled={saving}
              className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40">
              {saving ? 'Processing...' : 'Confirm Payment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Billing Page ──────────────────────────────────────────────────────

export default function Billing() {
  const [bills, setBills] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [date, setDate] = useState('')
  const [statusTab, setStatusTab] = useState('All')
  const [page, setPage] = useState(1)

  const [showCreate, setShowCreate] = useState(false)
  const [selectedBill, setSelectedBill] = useState(null)
  const [paymentBill, setPaymentBill] = useState(null)
  const [toast, setToast] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await billingService.getAll(date || null, search, page)
      if (res.success) { setBills(res.data.items); setTotal(res.data.totalCount) }
    } catch { }
    finally { setLoading(false) }
  }, [search, date, page])

  useEffect(() => { load() }, [load])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const openBill = async (id) => {
    const res = await billingService.getById(id)
    if (res.success) setSelectedBill(res.data)
  }

  const filtered = statusTab === 'All' ? bills : bills.filter(b => b.paymentStatus === statusTab)

  // Summary stats from current page
  const todayStr = new Date().toDateString()
  const todayBills = bills.filter(b => new Date(b.createdAt).toDateString() === todayStr)
  const todayRevenue = todayBills.reduce((s, b) => s + b.paidAmount, 0)
  const pendingCount = bills.filter(b => b.paymentStatus !== 'Paid').length
  const pendingAmount = bills.reduce((s, b) => s + b.dueAmount, 0)

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="space-y-5">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium">
          ✅ {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Billing</h2>
          <p className="text-sm text-gray-500 mt-0.5">{total} total bills</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm">
          + New Bill
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Today's Revenue",  value: `₹${fmt(todayRevenue)}`, icon: '💰', cls: 'bg-emerald-50 text-emerald-600' },
          { label: 'Pending Bills',    value: pendingCount,            icon: '⏳', cls: 'bg-amber-50 text-amber-600' },
          { label: 'Amount Due',       value: `₹${fmt(pendingAmount)}`,icon: '📋', cls: 'bg-red-50 text-red-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
            <div className={`w-12 h-12 ${s.cls} rounded-xl flex items-center justify-center text-2xl`}>{s.icon}</div>
            <div>
              <div className="text-xl font-black text-gray-800">{s.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + Status tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 p-4 border-b border-gray-50">
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search bill no, patient name, UHID..."
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <input type="date" value={date} onChange={e => { setDate(e.target.value); setPage(1) }}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          {(search || date) && (
            <button onClick={() => { setSearch(''); setDate(''); setPage(1) }}
              className="px-4 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">
              Clear
            </button>
          )}
        </div>

        {/* Status tabs */}
        <div className="flex border-b border-gray-100">
          {STATUS_TABS.map(tab => (
            <button key={tab} onClick={() => setStatusTab(tab)}
              className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                statusTab === tab
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {tab}
              {tab !== 'All' && bills.filter(b => b.paymentStatus === tab).length > 0 && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  tab === 'Pending' ? 'bg-red-100 text-red-600' :
                  tab === 'PartiallyPaid' ? 'bg-amber-100 text-amber-600' :
                  'bg-emerald-100 text-emerald-600'
                }`}>
                  {bills.filter(b => b.paymentStatus === tab).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Bills list */}
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🧾</div>
            <div className="text-gray-600 font-medium">No bills found</div>
            <div className="text-sm text-gray-400 mt-1">
              {search || date ? 'Try clearing filters' : 'Create your first bill'}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(bill => (
              <div key={bill.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => openBill(bill.id)}>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-gray-500">{bill.billNumber}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[bill.paymentStatus] || 'bg-gray-100 text-gray-600'}`}>
                      {bill.paymentStatus}
                    </span>
                  </div>
                  <div className="font-semibold text-gray-800 text-sm mt-0.5">{bill.patientName}</div>
                  <div className="text-xs text-gray-400">{bill.patientUHID} · {fmtDate(bill.createdAt)}</div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-base font-bold text-gray-800">₹{fmt(bill.totalAmount)}</div>
                  {bill.dueAmount > 0 ? (
                    <div className="text-xs text-red-500 font-medium mt-0.5">Due ₹{fmt(bill.dueAmount)}</div>
                  ) : (
                    <div className="text-xs text-emerald-500 mt-0.5">Paid in full</div>
                  )}
                </div>

                {bill.dueAmount > 0 && (
                  <button
                    onClick={e => { e.stopPropagation(); setPaymentBill(bill) }}
                    className="flex-shrink-0 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-colors">
                    Collect
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">Page {page} of {totalPages} · {total} bills</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateBillModal
          onClose={() => setShowCreate(false)}
          onDone={(bill) => { showToast(`Bill ${bill.billNumber} created!`); load() }}
        />
      )}

      {selectedBill && (
        <BillDetailModal
          bill={selectedBill}
          onClose={() => setSelectedBill(null)}
          onPayment={(b) => { setPaymentBill(b); setSelectedBill(null) }}
          onRefresh={load}
        />
      )}

      {paymentBill && (
        <PaymentModal
          bill={paymentBill}
          onClose={() => setPaymentBill(null)}
          onDone={(updated) => {
            showToast('Payment recorded!')
            setPaymentBill(null)
            load()
            if (selectedBill) openBill(updated.id)
          }}
        />
      )}
    </div>
  )
}
