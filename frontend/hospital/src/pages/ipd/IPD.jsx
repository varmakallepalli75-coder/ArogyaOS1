import { useState, useEffect, useCallback } from 'react'
import { ipdService } from '../../services/ipdService'
import { patientService } from '../../services/patientService'
import { depositService } from '../../services/depositService'

const STATUS_COLORS = {
  Active: 'bg-emerald-100 text-emerald-700',
  Discharged: 'bg-gray-100 text-gray-600',
  Transferred: 'bg-blue-100 text-blue-700',
}

const PRIORITY_COLORS = {
  Low: 'bg-slate-100 text-slate-600',
  Normal: 'bg-blue-100 text-blue-600',
  High: 'bg-amber-100 text-amber-700',
  Critical: 'bg-red-100 text-red-700',
  Emergency: 'bg-red-600 text-white',
}

const DISCHARGE_TYPES = ['Regular', 'LAMA', 'Death', 'Transfer', 'Absconded']
const PRIORITY_LEVELS = ['Low', 'Normal', 'High', 'Critical', 'Emergency']
const INSURANCE_TYPES = ['None', 'Ayushman', 'CGHS', 'ESIC', 'Private Insurance', 'Corporate TPA']

export default function IPD() {
  const [tab, setTab] = useState('admissions') // admissions | wards
  const [admissions, setAdmissions] = useState([])
  const [wards, setWards] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Modals
  const [showAdmit, setShowAdmit] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [showVitals, setShowVitals] = useState(false)
  const [showDischarge, setShowDischarge] = useState(false)
  const [showWardForm, setShowWardForm] = useState(false)
  const [showBedForm, setShowBedForm] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [depositTarget, setDepositTarget] = useState(null)
  const [depositSummary, setDepositSummary] = useState(null)
  const [depositForm, setDepositForm] = useState({ amount: '', paymentMode: 0, transactionId: '', notes: '' })
  const [depositSaving, setDepositSaving] = useState(false)
  const [depositError, setDepositError] = useState('')

  const [selectedAdmission, setSelectedAdmission] = useState(null)
  const [saving, setSaving] = useState(false)

  // Admit form
  const [patientSearch, setPatientSearch] = useState('')
  const [patientResults, setPatientResults] = useState([])
  const [availableBeds, setAvailableBeds] = useState([])
  const [admitForm, setAdmitForm] = useState({
    patientId: '', patientName: '',
    doctorId: '', wardId: '', bedId: '',
    admissionDiagnosis: '', admissionNotes: '',
    priority: 1, isEmergency: false,
    insuranceType: 0, insuranceAuthCode: '',
    isReferred: false, referredFrom: '',
  })

  // Vitals form
  const [vitalsForm, setVitalsForm] = useState({
    admissionId: '', bloodPressure: '', pulseRate: '', temperature: '',
    spO2: '', respiratoryRate: '', bloodGlucose: '', gcsScore: '',
    painScore: '', notes: '', recordedBy: '',
  })

  // Discharge form
  const [dischargeForm, setDischargeForm] = useState({
    admissionId: '', dischargeType: 0, finalDiagnosis: '',
    dischargeSummary: '', dischargeInstructions: '',
    followUpAdvice: '', followUpDate: '',
  })

  const [wardForm, setWardForm] = useState({ code: '', name: '', wardType: 0, departmentId: '', floor: 1, wardInCharge: '' })
  const [bedForm, setBedForm] = useState({ bedNumber: '', wardId: '', bedType: 'General', chargePerDay: '', hasOxygen: false, hasMonitor: false, hasVentilator: false, hasCallBell: false })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await ipdService.getAdmissions(statusFilter, search, page)
      if (res.success) { setAdmissions(res.data.items); setTotal(res.data.totalCount) }
    } catch { setError('Failed to load admissions') }
    finally { setLoading(false) }
  }, [statusFilter, search, page])

  const loadWards = useCallback(async () => {
    const res = await ipdService.getWards()
    if (res.success) setWards(res.data)
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { if (tab === 'wards') loadWards() }, [tab, loadWards])

  const searchPatients = async (q) => {
    if (q.length < 2) { setPatientResults([]); return }
    const res = await patientService.search(q)
    if (res.success) setPatientResults(res.data)
  }

  const selectPatient = (p) => {
    setAdmitForm(f => ({ ...f, patientId: p.id, patientName: p.fullName }))
    setPatientSearch(p.fullName)
    setPatientResults([])
  }

  const selectWard = async (wardId) => {
    setAdmitForm(f => ({ ...f, wardId, bedId: '' }))
    const res = await ipdService.getAvailableBeds(wardId)
    if (res.success) setAvailableBeds(res.data)
  }

  const openDetail = async (admission) => {
    const res = await ipdService.getById(admission.id)
    if (res.success) { setSelectedAdmission(res.data); setShowDetail(true) }
  }

  const openDeposit = async (admission) => {
    setDepositTarget(admission)
    setDepositError('')
    setDepositForm({ amount: '', paymentMode: 0, transactionId: '', notes: '' })
    const res = await depositService.getSummary(admission.patientId, admission.id)
    if (res.success) setDepositSummary(res.data)
    else setDepositSummary(null)
    setShowDepositModal(true)
  }

  const handleCollectDeposit = async () => {
    if (!depositForm.amount || parseFloat(depositForm.amount) <= 0) return setDepositError('Enter a valid amount')
    setDepositSaving(true); setDepositError('')
    try {
      const res = await depositService.collect({
        patientId: depositTarget.patientId,
        admissionId: depositTarget.id,
        amount: parseFloat(depositForm.amount),
        paymentMode: parseInt(depositForm.paymentMode),
        transactionId: depositForm.transactionId,
        notes: depositForm.notes,
      })
      if (res.success) {
        const updated = await depositService.getSummary(depositTarget.patientId, depositTarget.id)
        if (updated.success) setDepositSummary(updated.data)
        setDepositForm({ amount: '', paymentMode: 0, transactionId: '', notes: '' })
      } else setDepositError(res.message || 'Failed')
    } catch { setDepositError('Server error') }
    finally { setDepositSaving(false) }
  }

  const handleAdmit = async (e) => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      const res = await ipdService.admit({
        patientId: admitForm.patientId,
        doctorId: admitForm.doctorId || '00000000-0000-0000-0000-000000000000',
        wardId: admitForm.wardId,
        bedId: admitForm.bedId,
        admissionDiagnosis: admitForm.admissionDiagnosis,
        admissionNotes: admitForm.admissionNotes,
        priority: parseInt(admitForm.priority),
        isEmergency: admitForm.isEmergency,
        insuranceType: parseInt(admitForm.insuranceType),
        insuranceAuthCode: admitForm.insuranceAuthCode,
        isReferred: admitForm.isReferred,
        referredFrom: admitForm.referredFrom,
      })
      if (res.success) { setShowAdmit(false); load(); loadWards() }
      else setError(res.message)
    } catch { setError('Failed to admit patient') }
    finally { setSaving(false) }
  }

  const handleVitals = async (e) => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      const res = await ipdService.recordVitals({
        ...vitalsForm,
        admissionId: selectedAdmission.id,
        pulseRate: vitalsForm.pulseRate ? parseInt(vitalsForm.pulseRate) : null,
        temperature: vitalsForm.temperature ? parseFloat(vitalsForm.temperature) : null,
        spO2: vitalsForm.spO2 ? parseInt(vitalsForm.spO2) : null,
        respiratoryRate: vitalsForm.respiratoryRate ? parseInt(vitalsForm.respiratoryRate) : null,
        bloodGlucose: vitalsForm.bloodGlucose ? parseFloat(vitalsForm.bloodGlucose) : null,
      })
      if (res.success) {
        setShowVitals(false)
        const detail = await ipdService.getById(selectedAdmission.id)
        if (detail.success) setSelectedAdmission(detail.data)
      } else setError(res.message)
    } catch { setError('Failed to record vitals') }
    finally { setSaving(false) }
  }

  const handleDischarge = async (e) => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      const res = await ipdService.discharge({
        admissionId: selectedAdmission.id,
        dischargeType: parseInt(dischargeForm.dischargeType),
        finalDiagnosis: dischargeForm.finalDiagnosis,
        dischargeSummary: dischargeForm.dischargeSummary,
        dischargeInstructions: dischargeForm.dischargeInstructions,
        followUpAdvice: dischargeForm.followUpAdvice,
        followUpDate: dischargeForm.followUpDate || null,
      })
      if (res.success) { setShowDischarge(false); setShowDetail(false); load(); loadWards() }
      else setError(res.message)
    } catch { setError('Failed to discharge patient') }
    finally { setSaving(false) }
  }

  const handleCreateWard = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await ipdService.createWard({ ...wardForm, wardType: parseInt(wardForm.wardType), floor: parseInt(wardForm.floor) })
      if (res.success) { setShowWardForm(false); loadWards() }
      else setError(res.message)
    } catch { setError('Failed to create ward') }
    finally { setSaving(false) }
  }

  const handleCreateBed = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await ipdService.createBed({ ...bedForm, chargePerDay: parseFloat(bedForm.chargePerDay) || 0 })
      if (res.success) { setShowBedForm(false); loadWards() }
      else setError(res.message)
    } catch { setError('Failed to create bed') }
    finally { setSaving(false) }
  }

  const totalBeds = wards.reduce((s, w) => s + w.totalBeds, 0)
  const availableBedCount = wards.reduce((s, w) => s + w.availableBeds, 0)
  const occupiedCount = wards.reduce((s, w) => s + w.occupiedBeds, 0)

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">IPD & Beds</h1>
          <p className="text-sm text-gray-500 mt-0.5">Inpatient Department — Admissions & Ward Management</p>
        </div>
        <button onClick={() => { setShowAdmit(true); setError('') }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
          + Admit Patient
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Beds', value: totalBeds, icon: '🛏️', color: 'bg-slate-50' },
          { label: 'Available', value: availableBedCount, icon: '✅', color: 'bg-emerald-50' },
          { label: 'Occupied', value: occupiedCount, icon: '🔴', color: 'bg-red-50' },
          { label: 'Active Admissions', value: admissions.filter(a => a.status === 'Active').length, icon: '🏥', color: 'bg-blue-50' },
        ].map(s => (
          <div key={s.label} className={`${s.color} rounded-2xl p-4 border border-gray-100`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-5">
        {['admissions', 'wards'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'admissions' ? '🏥 Admissions' : '🏨 Wards & Beds'}
          </button>
        ))}
      </div>

      {/* Admissions tab */}
      {tab === 'admissions' && (
        <>
          <div className="flex gap-3 mb-4">
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search patient name, UHID, IPD number..."
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none">
              <option value="">All Status</option>
              <option value="0">Active</option>
              <option value="1">Discharged</option>
              <option value="2">Transferred</option>
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-16 text-gray-400">Loading...</div>
          ) : admissions.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-2">🛏️</div>
              <p className="font-medium">No admissions found</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['IPD No.', 'Patient', 'Doctor', 'Ward / Bed', 'Admitted', 'Days', 'Priority', 'Status', ''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {admissions.map(a => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono font-bold text-emerald-600">{a.ipdNumber}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-semibold text-gray-900">{a.patientName}</div>
                        <div className="text-xs text-gray-400">{a.patientUHID}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{a.doctorName}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">{a.wardName}</div>
                        <div className="text-xs text-gray-400 font-mono">Bed {a.bedNumber}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(a.admissionDateTime).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-700">{a.daysAdmitted}d</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[a.priority] || ''}`}>
                          {a.isEmergency ? '🚨 ' : ''}{a.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[a.status] || 'bg-gray-100 text-gray-600'}`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openDetail(a)}
                            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                            View →
                          </button>
                          {a.status === 'Active' && (
                            <button onClick={() => openDeposit(a)}
                              className="text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold px-2 py-1 rounded-lg transition-colors">
                              💰 Advance
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <span className="text-sm text-gray-500">{total} total</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40">← Prev</button>
                  <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40">Next →</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Wards tab */}
      {tab === 'wards' && (
        <div>
          <div className="flex gap-2 justify-end mb-4">
            <button onClick={() => setShowBedForm(true)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">+ Add Bed</button>
            <button onClick={() => setShowWardForm(true)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold">+ Add Ward</button>
          </div>
          <div className="grid gap-4">
            {wards.map(ward => (
              <div key={ward.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-lg">🏨</div>
                    <div>
                      <div className="font-bold text-gray-900">{ward.name}</div>
                      <div className="text-xs text-gray-400">{ward.wardType} · Floor {ward.floor} {ward.wardInCharge && `· ${ward.wardInCharge}`}</div>
                    </div>
                  </div>
                  <div className="flex gap-4 text-center">
                    <div><div className="text-xl font-bold text-gray-900">{ward.totalBeds}</div><div className="text-xs text-gray-400">Total</div></div>
                    <div><div className="text-xl font-bold text-emerald-600">{ward.availableBeds}</div><div className="text-xs text-gray-400">Free</div></div>
                    <div><div className="text-xl font-bold text-red-500">{ward.occupiedBeds}</div><div className="text-xs text-gray-400">Occupied</div></div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {ward.beds?.map(bed => (
                    <div key={bed.id} className={`px-3 py-2 rounded-xl border text-xs font-medium ${
                      bed.status === 'Available' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                      bed.status === 'Occupied' ? 'bg-red-50 border-red-200 text-red-700' :
                      'bg-gray-50 border-gray-200 text-gray-500'
                    }`}>
                      <div className="font-mono font-bold">{bed.bedNumber}</div>
                      {bed.status === 'Occupied' && bed.currentPatientName && (
                        <div className="text-xs opacity-75 truncate max-w-[80px]">{bed.currentPatientName}</div>
                      )}
                      <div className="flex gap-1 mt-0.5">
                        {bed.hasOxygen && <span title="Oxygen">💨</span>}
                        {bed.hasMonitor && <span title="Monitor">📟</span>}
                        {bed.hasVentilator && <span title="Ventilator">🌬</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm shadow-lg">
          {error}
        </div>
      )}

      {/* Admit Modal */}
      {showAdmit && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-bold text-gray-900">Admit Patient</h3>
              <button onClick={() => setShowAdmit(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <form onSubmit={handleAdmit} className="p-6 space-y-4">
              {/* Patient search */}
              <div className="relative">
                <label className="block text-xs font-medium text-gray-600 mb-1">Patient *</label>
                <input value={patientSearch}
                  onChange={e => { setPatientSearch(e.target.value); searchPatients(e.target.value) }}
                  placeholder="Search by name or UHID..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                {patientResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-10 mt-1">
                    {patientResults.map(p => (
                      <div key={p.id} onClick={() => selectPatient(p)}
                        className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer">
                        <div className="text-sm font-medium">{p.fullName}</div>
                        <div className="text-xs text-gray-400">{p.uhid} · {p.mobileNumber}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Ward */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ward *</label>
                  <select value={admitForm.wardId} onChange={e => selectWard(e.target.value)} required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">Select ward</option>
                    {wards.filter(w => w.availableBeds > 0).map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.availableBeds} free)</option>
                    ))}
                  </select>
                </div>
                {/* Bed */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Bed *</label>
                  <select value={admitForm.bedId} onChange={e => setAdmitForm(f => ({ ...f, bedId: e.target.value }))} required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">Select bed</option>
                    {availableBeds.map(b => (
                      <option key={b.id} value={b.id}>{b.bedNumber} — {b.bedType} (₹{b.chargePerDay}/day)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Admission Diagnosis</label>
                <input value={admitForm.admissionDiagnosis}
                  onChange={e => setAdmitForm(f => ({ ...f, admissionDiagnosis: e.target.value }))}
                  placeholder="e.g. Acute Appendicitis"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
                  <select value={admitForm.priority} onChange={e => setAdmitForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none">
                    {PRIORITY_LEVELS.map((l, i) => <option key={i} value={i}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Insurance</label>
                  <select value={admitForm.insuranceType} onChange={e => setAdmitForm(f => ({ ...f, insuranceType: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none">
                    {INSURANCE_TYPES.map((t, i) => <option key={i} value={i}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={admitForm.isEmergency}
                    onChange={e => setAdmitForm(f => ({ ...f, isEmergency: e.target.checked }))}
                    className="w-4 h-4 accent-red-600" />
                  <span className="text-sm font-medium text-red-600">🚨 Emergency Admission</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={admitForm.isReferred}
                    onChange={e => setAdmitForm(f => ({ ...f, isReferred: e.target.checked }))}
                    className="w-4 h-4 accent-blue-600" />
                  <span className="text-sm text-gray-700">Referred case</span>
                </label>
              </div>

              {admitForm.isReferred && (
                <input value={admitForm.referredFrom}
                  onChange={e => setAdmitForm(f => ({ ...f, referredFrom: e.target.value }))}
                  placeholder="Referred from (hospital/clinic name)"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdmit(false)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium">Cancel</button>
                <button type="submit" disabled={saving || !admitForm.patientId || !admitForm.wardId || !admitForm.bedId}
                  className="flex-1 bg-emerald-600 text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-40">
                  {saving ? 'Admitting...' : 'Admit Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admission Detail Modal */}
      {showDetail && selectedAdmission && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <div className="font-bold text-gray-900 font-mono">{selectedAdmission.ipdNumber}</div>
                <div className="text-sm text-gray-500">{selectedAdmission.patientName} · {selectedAdmission.wardName}, Bed {selectedAdmission.bedNumber}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[selectedAdmission.status] || ''}`}>
                  {selectedAdmission.status}
                </span>
                <button onClick={() => setShowDetail(false)} className="text-gray-400 text-xl">✕</button>
              </div>
            </div>
            <div className="p-6 space-y-5">
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4 text-sm">
                {[
                  ['Doctor', selectedAdmission.doctorName],
                  ['Days Admitted', `${selectedAdmission.daysAdmitted} days`],
                  ['Diagnosis', selectedAdmission.admissionDiagnosis || '—'],
                  ['Priority', selectedAdmission.priority],
                  ['Insurance', selectedAdmission.insuranceType],
                  ['Admitted', new Date(selectedAdmission.admissionDateTime).toLocaleDateString('en-IN')],
                ].map(([k, v]) => (
                  <div key={k}><div className="text-xs text-gray-500">{k}</div><div className="font-medium text-gray-900">{v}</div></div>
                ))}
              </div>

              {/* Vitals */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-gray-900">📊 Vitals ({selectedAdmission.vitals?.length || 0})</h4>
                  {selectedAdmission.status === 'Active' && (
                    <button onClick={() => { setVitalsForm(f => ({ ...f, admissionId: selectedAdmission.id })); setShowVitals(true) }}
                      className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg">+ Record Vitals</button>
                  )}
                </div>
                {selectedAdmission.vitals?.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedAdmission.vitals.map(v => (
                      <div key={v.id} className="bg-blue-50 rounded-xl p-3 text-xs">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium text-blue-800">{new Date(v.recordedAt).toLocaleString('en-IN')}</span>
                          {v.recordedBy && <span className="text-blue-600">{v.recordedBy}</span>}
                        </div>
                        <div className="flex flex-wrap gap-3 text-blue-700">
                          {v.bloodPressure && <span>BP: {v.bloodPressure}</span>}
                          {v.pulseRate && <span>Pulse: {v.pulseRate}/min</span>}
                          {v.temperature && <span>Temp: {v.temperature}°C</span>}
                          {v.spO2 && <span>SpO₂: {v.spO2}%</span>}
                          {v.respiratoryRate && <span>RR: {v.respiratoryRate}/min</span>}
                          {v.bloodGlucose && <span>BG: {v.bloodGlucose} mg/dL</span>}
                          {v.painScore && <span>Pain: {v.painScore}/10</span>}
                        </div>
                        {v.notes && <div className="text-blue-600 mt-1 italic">{v.notes}</div>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3">No vitals recorded yet.</div>
                )}
              </div>

              {/* Discharge button */}
              {selectedAdmission.status === 'Active' && (
                <button onClick={() => { setDischargeForm(f => ({ ...f, admissionId: selectedAdmission.id, finalDiagnosis: selectedAdmission.admissionDiagnosis || '' })); setShowDischarge(true) }}
                  className="w-full py-2.5 bg-slate-700 text-white rounded-xl text-sm font-semibold">
                  Discharge Patient
                </button>
              )}

              {selectedAdmission.status === 'Discharged' && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                  <div className="font-bold text-gray-900">Discharge Summary</div>
                  {selectedAdmission.finalDiagnosis && <div><span className="text-gray-500">Final Diagnosis: </span>{selectedAdmission.finalDiagnosis}</div>}
                  {selectedAdmission.dischargeSummary && <div className="text-gray-700">{selectedAdmission.dischargeSummary}</div>}
                  {selectedAdmission.followUpAdvice && <div><span className="text-gray-500">Follow-up: </span>{selectedAdmission.followUpAdvice}</div>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Vitals Modal */}
      {showVitals && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-bold text-gray-900">Record Vitals</h3>
              <button onClick={() => setShowVitals(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <form onSubmit={handleVitals} className="p-6">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['bloodPressure', 'Blood Pressure', 'e.g. 120/80'],
                  ['pulseRate', 'Pulse Rate (/min)', '72'],
                  ['temperature', 'Temperature (°C)', '37.0'],
                  ['spO2', 'SpO₂ (%)', '98'],
                  ['respiratoryRate', 'Respiratory Rate', '16'],
                  ['bloodGlucose', 'Blood Glucose (mg/dL)', '90'],
                  ['gcsScore', 'GCS Score', 'e.g. E4V5M6'],
                  ['painScore', 'Pain Score (0-10)', '0'],
                ].map(([field, label, ph]) => (
                  <div key={field}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                    <input value={vitalsForm[field]} onChange={e => setVitalsForm(f => ({ ...f, [field]: e.target.value }))}
                      placeholder={ph}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Recorded By</label>
                  <input value={vitalsForm.recordedBy} onChange={e => setVitalsForm(f => ({ ...f, recordedBy: e.target.value }))}
                    placeholder="Nurse / Doctor name"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                  <textarea value={vitalsForm.notes} onChange={e => setVitalsForm(f => ({ ...f, notes: e.target.value }))}
                    rows={2} placeholder="Any observations..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setShowVitals(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Vitals'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discharge Modal */}
      {showDischarge && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-bold text-gray-900">Discharge Patient</h3>
              <button onClick={() => setShowDischarge(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <form onSubmit={handleDischarge} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Discharge Type</label>
                <select value={dischargeForm.dischargeType} onChange={e => setDischargeForm(f => ({ ...f, dischargeType: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none">
                  {DISCHARGE_TYPES.map((t, i) => <option key={i} value={i}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Final Diagnosis</label>
                <input value={dischargeForm.finalDiagnosis} onChange={e => setDischargeForm(f => ({ ...f, finalDiagnosis: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Discharge Summary</label>
                <textarea value={dischargeForm.dischargeSummary} onChange={e => setDischargeForm(f => ({ ...f, dischargeSummary: e.target.value }))}
                  rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Discharge Instructions</label>
                <textarea value={dischargeForm.dischargeInstructions} onChange={e => setDischargeForm(f => ({ ...f, dischargeInstructions: e.target.value }))}
                  rows={2} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Follow-up Advice</label>
                  <input value={dischargeForm.followUpAdvice} onChange={e => setDischargeForm(f => ({ ...f, followUpAdvice: e.target.value }))}
                    placeholder="e.g. Review after 1 week"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Follow-up Date</label>
                  <input type="date" value={dischargeForm.followUpDate} onChange={e => setDischargeForm(f => ({ ...f, followUpDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowDischarge(false)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-sm">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-slate-700 text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-50">
                  {saving ? 'Discharging...' : 'Confirm Discharge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Ward Modal */}
      {showWardForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-bold text-gray-900">Add Ward</h3>
              <button onClick={() => setShowWardForm(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <form onSubmit={handleCreateWard} className="p-6 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Code</label>
                  <input value={wardForm.code} onChange={e => setWardForm(f => ({ ...f, code: e.target.value }))} required placeholder="ICU-A"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                  <input value={wardForm.name} onChange={e => setWardForm(f => ({ ...f, name: e.target.value }))} required placeholder="ICU Ward A"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ward Type</label>
                  <select value={wardForm.wardType} onChange={e => setWardForm(f => ({ ...f, wardType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none">
                    {['General','ICU','NICU','PICU','CCU','Maternity','Surgery','Emergency','Isolation','Orthopedic','Cardiology','Neurology','Psychiatry','Oncology'].map((t, i) => (
                      <option key={i} value={i}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Floor</label>
                  <input type="number" value={wardForm.floor} onChange={e => setWardForm(f => ({ ...f, floor: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ward In-charge</label>
                <input value={wardForm.wardInCharge} onChange={e => setWardForm(f => ({ ...f, wardInCharge: e.target.value }))} placeholder="Dr. Name / Head Nurse"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowWardForm(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40">
                  {saving ? 'Creating...' : 'Create Ward'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Bed Modal */}
      {showBedForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-bold text-gray-900">Add Bed</h3>
              <button onClick={() => setShowBedForm(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <form onSubmit={handleCreateBed} className="p-6 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Bed Number</label>
                  <input value={bedForm.bedNumber} onChange={e => setBedForm(f => ({ ...f, bedNumber: e.target.value }))} required placeholder="A-101"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ward</label>
                  <select value={bedForm.wardId} onChange={e => setBedForm(f => ({ ...f, wardId: e.target.value }))} required
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none">
                    <option value="">Select ward</option>
                    {wards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Bed Type</label>
                  <select value={bedForm.bedType} onChange={e => setBedForm(f => ({ ...f, bedType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none">
                    {['General','Private','Semi-Private','ICU','HDU'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Charge/Day (₹)</label>
                  <input type="number" value={bedForm.chargePerDay} onChange={e => setBedForm(f => ({ ...f, chargePerDay: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
                </div>
              </div>
              <div className="flex gap-4">
                {[['hasOxygen','💨 Oxygen'],['hasMonitor','📟 Monitor'],['hasVentilator','🌬 Ventilator'],['hasCallBell','🔔 Call Bell']].map(([f, l]) => (
                  <label key={f} className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-700">
                    <input type="checkbox" checked={bedForm[f]} onChange={e => setBedForm(frm => ({ ...frm, [f]: e.target.checked }))} className="w-3.5 h-3.5 accent-emerald-600" />
                    {l}
                  </label>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowBedForm(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40">
                  {saving ? 'Adding...' : 'Add Bed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Deposit Modal */}
      {showDepositModal && depositTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-900">Advance Deposits</h2>
                <p className="text-xs text-gray-400 mt-0.5">{depositTarget.patientName} · {depositTarget.ipdNumber}</p>
              </div>
              <button onClick={() => setShowDepositModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            <div className="p-6 space-y-5">
              {/* Summary */}
              {depositSummary && (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Total Deposited', value: depositSummary.totalDeposited, cls: 'bg-emerald-50 text-emerald-700' },
                    { label: 'Adjusted', value: depositSummary.totalAdjusted, cls: 'bg-blue-50 text-blue-700' },
                    { label: 'Available', value: depositSummary.availableBalance, cls: 'bg-amber-50 text-amber-700' },
                  ].map(s => (
                    <div key={s.label} className={`${s.cls} rounded-xl p-3 text-center`}>
                      <div className="text-lg font-bold">₹{s.value.toLocaleString('en-IN')}</div>
                      <div className="text-xs mt-0.5 opacity-80">{s.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Collect new deposit */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="text-sm font-semibold text-gray-700">Collect New Advance</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">Amount (₹)</label>
                    <input type="number" min="1" value={depositForm.amount}
                      onChange={e => setDepositForm(f => ({ ...f, amount: e.target.value }))}
                      placeholder="0.00"
                      className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Payment Mode</label>
                    <select value={depositForm.paymentMode}
                      onChange={e => setDepositForm(f => ({ ...f, paymentMode: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white">
                      {['Cash','Card','UPI','NEFT','RTGS','Cheque'].map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                  </div>
                </div>
                <input value={depositForm.transactionId}
                  onChange={e => setDepositForm(f => ({ ...f, transactionId: e.target.value }))}
                  placeholder="Transaction / Reference ID (optional)"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                />
                <input value={depositForm.notes}
                  onChange={e => setDepositForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Notes (optional)"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                />
                {depositError && <div className="text-red-600 text-xs bg-red-50 px-3 py-2 rounded-lg">{depositError}</div>}
                <button onClick={handleCollectDeposit} disabled={depositSaving}
                  className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                  {depositSaving ? 'Collecting...' : '+ Collect Deposit'}
                </button>
              </div>

              {/* Deposit history */}
              {depositSummary?.deposits?.length > 0 && (
                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-2">Deposit History</div>
                  <div className="space-y-2">
                    {depositSummary.deposits.map(d => (
                      <div key={d.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3">
                        <div>
                          <div className="text-xs font-mono font-bold text-gray-600">{d.receiptNumber}</div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {d.paymentMode} · {new Date(d.depositDate).toLocaleDateString('en-IN')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-gray-800">₹{d.amount.toLocaleString('en-IN')}</div>
                          {d.adjustedAmount > 0 && <div className="text-xs text-blue-500">adj ₹{d.adjustedAmount.toLocaleString('en-IN')}</div>}
                          {d.refundedAmount > 0 && <div className="text-xs text-red-500">ref ₹{d.refundedAmount.toLocaleString('en-IN')}</div>}
                          <div className="text-xs text-emerald-600 font-medium">bal ₹{d.availableBalance.toLocaleString('en-IN')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
