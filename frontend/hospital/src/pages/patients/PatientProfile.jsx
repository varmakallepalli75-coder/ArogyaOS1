import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { patientService } from '../../services/patientService'
import { referralService } from '../../services/referralService'
import { appointmentService } from '../../services/appointmentService'
import { billingService } from '../../services/billingService'
import { labService } from '../../services/labService'
import { departmentService } from '../../services/departmentService'

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown']
const genders = ['Male', 'Female', 'Other', 'PreferNotToSay']
const insuranceTypes = ['None', 'Ayushman', 'CGHS', 'ESIC', 'PrivateInsurance', 'CorporateTPA']
const states = ['Andhra Pradesh', 'Telangana', 'Karnataka', 'Tamil Nadu', 'Maharashtra', 'Gujarat', 'Delhi', 'Uttar Pradesh', 'West Bengal', 'Rajasthan', 'Other']

const STATUS_COLORS = {
  Scheduled:  'bg-blue-100 text-blue-700',
  Confirmed:  'bg-emerald-100 text-emerald-700',
  InProgress: 'bg-yellow-100 text-yellow-700',
  Completed:  'bg-green-100 text-green-700',
  Cancelled:  'bg-red-100 text-red-700',
  NoShow:     'bg-gray-100 text-gray-500',
}

const BILL_STATUS_COLORS = {
  Generated: 'bg-blue-100 text-blue-700',
  PartiallyPaid: 'bg-yellow-100 text-yellow-700',
  Paid: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
}

const LAB_STATUS_COLORS = {
  Ordered:        'bg-gray-100 text-gray-600',
  SampleCollected:'bg-blue-100 text-blue-700',
  Processing:     'bg-yellow-100 text-yellow-700',
  Completed:      'bg-green-100 text-green-700',
  Reported:       'bg-emerald-100 text-emerald-700',
  Cancelled:      'bg-red-100 text-red-700',
}

// ─── History Tab: Appointments ────────────────────────────────────────────────
function AppointmentsTab({ patientId }) {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const res = await appointmentService.getByPatient(patientId, p, 10)
      if (res.success) { setItems(res.data.items); setTotal(res.data.totalCount) }
    } finally { setLoading(false) }
  }, [patientId])

  useEffect(() => { load(1) }, [load])

  if (loading) return <div className="py-10 text-center text-gray-400 text-sm">Loading...</div>
  if (items.length === 0) return (
    <div className="py-10 text-center text-gray-400 text-sm">No appointments found</div>
  )

  return (
    <div className="space-y-3">
      {items.map(a => (
        <div key={a.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm flex-shrink-0">📅</div>
            <div>
              <div className="text-sm font-medium text-gray-900">{a.doctorName}</div>
              <div className="text-xs text-gray-500 mt-0.5">{a.departmentName}</div>
              <div className="text-xs text-gray-400 mt-1">
                {new Date(a.appointmentDateTime).toLocaleString('en-IN', {
                  day: '2-digit', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit', hour12: true
                })}
                {a.tokenNumber && <span className="ml-2 font-medium text-emerald-600">· {a.tokenNumber}</span>}
              </div>
              {a.chiefComplaint && <div className="text-xs text-gray-500 mt-1 italic">"{a.chiefComplaint}"</div>}
            </div>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${STATUS_COLORS[a.status] || 'bg-gray-100 text-gray-600'}`}>
            {a.status}
          </span>
        </div>
      ))}
      {total > 10 && (
        <div className="flex items-center justify-between text-sm text-gray-500 pt-2">
          <span>{total} total</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => { setPage(p => p - 1); load(page - 1) }}
              className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50 text-xs">← Prev</button>
            <button disabled={page * 10 >= total} onClick={() => { setPage(p => p + 1); load(page + 1) }}
              className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50 text-xs">Next →</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── History Tab: Bills ───────────────────────────────────────────────────────
function BillsTab({ patientId }) {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const res = await billingService.getByPatient(patientId, p, 10)
      if (res.success) { setItems(res.data.items); setTotal(res.data.totalCount) }
    } finally { setLoading(false) }
  }, [patientId])

  useEffect(() => { load(1) }, [load])

  const totalBilled = items.reduce((s, b) => s + b.totalAmount, 0)
  const totalPaid   = items.reduce((s, b) => s + b.paidAmount, 0)
  const outstanding = totalBilled - totalPaid

  if (loading) return <div className="py-10 text-center text-gray-400 text-sm">Loading...</div>
  if (items.length === 0) return (
    <div className="py-10 text-center text-gray-400 text-sm">No bills found</div>
  )

  return (
    <div className="space-y-3">
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          ['Total Billed', `₹${totalBilled.toLocaleString('en-IN')}`, 'text-gray-800'],
          ['Total Paid',   `₹${totalPaid.toLocaleString('en-IN')}`,   'text-green-700'],
          ['Outstanding',  `₹${outstanding.toLocaleString('en-IN')}`, outstanding > 0 ? 'text-red-600' : 'text-green-600'],
        ].map(([label, val, cls]) => (
          <div key={label} className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
            <div className={`text-lg font-bold ${cls}`}>{val}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {items.map(b => (
        <div key={b.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-sm flex-shrink-0">🧾</div>
            <div>
              <div className="text-sm font-medium text-gray-900">{b.billNumber}</div>
              <div className="text-xs text-gray-400 mt-0.5">
                {new Date(b.billDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900">₹{b.totalAmount.toLocaleString('en-IN')}</div>
              {b.paidAmount < b.totalAmount && (
                <div className="text-xs text-red-500">Due: ₹{(b.totalAmount - b.paidAmount).toLocaleString('en-IN')}</div>
              )}
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${BILL_STATUS_COLORS[b.status] || 'bg-gray-100 text-gray-600'}`}>
              {b.status}
            </span>
          </div>
        </div>
      ))}
      {total > 10 && (
        <div className="flex items-center justify-between text-sm text-gray-500 pt-2">
          <span>{total} total</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => { setPage(p => p - 1); load(page - 1) }}
              className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50 text-xs">← Prev</button>
            <button disabled={page * 10 >= total} onClick={() => { setPage(p => p + 1); load(page + 1) }}
              className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50 text-xs">Next →</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── History Tab: Lab Results ─────────────────────────────────────────────────
function LabTab({ patientId }) {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const res = await labService.getByPatient(patientId, p, 10)
      if (res.success) { setItems(res.data.items); setTotal(res.data.totalCount) }
    } finally { setLoading(false) }
  }, [patientId])

  useEffect(() => { load(1) }, [load])

  if (loading) return <div className="py-10 text-center text-gray-400 text-sm">Loading...</div>
  if (items.length === 0) return (
    <div className="py-10 text-center text-gray-400 text-sm">No lab orders found</div>
  )

  return (
    <div className="space-y-3">
      {items.map(o => (
        <div key={o.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-sm flex-shrink-0">🧪</div>
            <div>
              <div className="text-sm font-medium text-gray-900">{o.orderNumber}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {o.tests?.map(t => t.testName).join(', ') || 'Lab tests'}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {new Date(o.orderedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                {o.doctorName && <span className="ml-2">· Dr. {o.doctorName}</span>}
              </div>
            </div>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${LAB_STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-600'}`}>
            {o.status}
          </span>
        </div>
      ))}
      {total > 10 && (
        <div className="flex items-center justify-between text-sm text-gray-500 pt-2">
          <span>{total} total</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => { setPage(p => p - 1); load(page - 1) }}
              className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50 text-xs">← Prev</button>
            <button disabled={page * 10 >= total} onClick={() => { setPage(p => p + 1); load(page + 1) }}
              className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50 text-xs">Next →</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Book Appointment Modal ───────────────────────────────────────────────────
function BookAppointmentModal({ patient, onClose, onSuccess }) {
  const [departments, setDepartments]   = useState([])
  const [doctors, setDoctors]           = useState([])
  const [loadingDocs, setLoadingDocs]   = useState(false)
  const [selectedDept, setSelectedDept] = useState(null)
  const [selectedDoc, setSelectedDoc]   = useState(null)
  const [step, setStep]                 = useState(1) // 1=dept 2=doctor 3=details
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState('')
  const [form, setForm] = useState(() => {
    const now = new Date()
    now.setMinutes(now.getMinutes() + 10)
    const pad = n => String(n).padStart(2, '0')
    const dt = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
    return { appointmentDateTime: dt, consultationType: 0, priority: 0, chiefComplaint: '', isWalkIn: false }
  })

  useEffect(() => {
    departmentService.getAll().then(res => {
      if (res.success) setDepartments(res.data || [])
    })
  }, [])

  const pickDepartment = async (dept) => {
    setSelectedDept(dept)
    setSelectedDoc(null)
    setDoctors([])
    setLoadingDocs(true)
    setStep(2)
    try {
      const res = await departmentService.getDoctors(dept.id)
      if (res.success) {
        setDoctors(Array.isArray(res.data) ? res.data : [])
      } else {
        setError(res.message || 'Failed to load doctors')
      }
    } catch(e) {
      setError(e.response?.data?.message || 'Failed to load doctors')
    } finally {
      setLoadingDocs(false)
    }
  }

  const pickDoctor = (doc) => {
    setSelectedDoc(doc)
    setStep(3)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.appointmentDateTime) { setError('Please select date & time'); return }
    setSaving(true); setError('')
    try {
      const res = await appointmentService.create({
        patientId: patient.id,
        doctorId: selectedDoc.id,
        departmentId: selectedDoc.departmentId || selectedDept?.id,
        appointmentDateTime: form.appointmentDateTime,
        consultationType: parseInt(form.consultationType),
        priority: parseInt(form.priority),
        chiefComplaint: form.chiefComplaint,
        isWalkIn: form.isWalkIn,
      })
      if (res.success) {
        onSuccess(`Appointment booked! Token: ${res.data?.tokenNumber || ''}`)
      } else {
        setError(res.message || 'Failed to book appointment')
      }
    } catch(e) {
      setError(e.response?.data?.message || 'Failed to book appointment')
    } finally { setSaving(false) }
  }

  const f = (field, val) => setForm(prev => ({ ...prev, [field]: val }))
  const minDateTime = new Date(Date.now() + 5 * 60000).toISOString().slice(0, 16)
  const defaultDateTime = (() => {
    const now = new Date()
    now.setMinutes(now.getMinutes() + 10)
    // Format as local datetime string yyyy-MM-ddTHH:mm
    const pad = n => String(n).padStart(2, '0')
    return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
  })()

  // Step label breadcrumb
  const Breadcrumb = () => (
    <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
      <span className={step >= 1 ? 'text-emerald-600 font-medium' : ''}>Department</span>
      <span>›</span>
      <span className={step >= 2 ? 'text-emerald-600 font-medium' : ''}>Doctor</span>
      <span>›</span>
      <span className={step >= 3 ? 'text-emerald-600 font-medium' : ''}>Details</span>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Book Appointment</h3>
              <p className="text-sm text-gray-500">{patient.fullName} · {patient.uhid}</p>
              <Breadcrumb />
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>
          )}

          {/* ── Step 1: Department ── */}
          {step === 1 && (
            <div>
              <p className="text-sm text-gray-500 mb-3">Which department does the patient need?</p>
              {departments.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">Loading departments...</div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {departments.map(dept => (
                    <button key={dept.id} onClick={() => pickDepartment(dept)}
                      className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-100 hover:border-emerald-400 hover:bg-emerald-50 text-left transition-all group">
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-lg flex-shrink-0">
                        🏥
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">{dept.name}</div>
                        <div className="text-xs text-gray-400 font-mono">{dept.code}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Doctor ── */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <button onClick={() => setStep(1)}
                  className="text-xs text-emerald-600 hover:underline">← Back</button>
                <span className="text-sm text-gray-500">
                  Doctors in <strong>{selectedDept?.name}</strong>
                </span>
              </div>

              {loadingDocs ? (
                <div className="text-center py-8 text-gray-400 text-sm">Loading doctors...</div>
              ) : doctors.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2">👨‍⚕️</div>
                  <div className="text-gray-500 text-sm">No available doctors in this department</div>
                  <button onClick={() => setStep(1)} className="mt-3 text-emerald-600 text-sm">← Choose another department</button>
                </div>
              ) : (
                <div className="space-y-2">
                  {doctors.map(doc => (
                    <button key={doc.id} onClick={() => pickDoctor(doc)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-emerald-400 hover:bg-emerald-50 text-left transition-all">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg flex-shrink-0">
                        {(doc.fullName || '').replace('Dr. ','').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || 'DR'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm">{doc.fullName}</div>
                        <div className="text-xs text-gray-500">{doc.specialization || doc.departmentName}</div>
                        {doc.experienceYears > 0 && (
                          <div className="text-xs text-gray-400">{doc.experienceYears} yrs experience</div>
                        )}
                        {doc.isAvailable === false && (
                          <div className="text-xs text-amber-600 font-medium">Currently unavailable</div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-emerald-600 font-bold text-sm">₹{doc.consultationFee}</div>
                        <div className="text-xs text-gray-400">per visit</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Details ── */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Selected doctor summary */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700 font-bold flex-shrink-0">
                  {selectedDoc?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-emerald-800">Dr. {selectedDoc?.fullName}</div>
                  <div className="text-xs text-emerald-600">{selectedDept?.name} · ₹{selectedDoc?.consultationFee}</div>
                </div>
                <button type="button" onClick={() => setStep(2)}
                  className="text-xs text-emerald-600 hover:underline">Change</button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time *</label>
                <input type="datetime-local" required min={minDateTime}
                  value={form.appointmentDateTime}
                  onChange={e => f('appointmentDateTime', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chief Complaint</label>
                <input value={form.chiefComplaint} onChange={e => f('chiefComplaint', e.target.value)}
                  placeholder="e.g. Fever, headache, chest pain..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={form.consultationType} onChange={e => f('consultationType', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value={0}>OPD Visit</option>
                    <option value={1}>Follow-up</option>
                    <option value={2}>Emergency</option>
                    <option value={3}>Teleconsultation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select value={form.priority} onChange={e => f('priority', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value={0}>Normal</option>
                    <option value={1}>High</option>
                    <option value={2}>Emergency</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isWalkIn} onChange={e => f('isWalkIn', e.target.checked)}
                  className="w-4 h-4 rounded accent-emerald-600" />
                <span className="text-sm text-gray-700">Walk-in (patient is already here)</span>
              </label>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                  {saving ? 'Booking...' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main PatientProfile ──────────────────────────────────────────────────────
export default function PatientProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({})
  const [activeTab, setActiveTab] = useState('info')

  // Modals
  const [showReferModal, setShowReferModal]   = useState(false)
  const [showBookModal, setShowBookModal]     = useState(false)
  const [hospitals, setHospitals]             = useState([])
  const [referForm, setReferForm]             = useState({
    toHospitalId: '', referringDoctorName: '', receivingDoctorName: '',
    urgency: 0, reason: '', clinicalNotes: '', patientConsent: false
  })
  const [referSaving, setReferSaving]         = useState(false)
  const [referError, setReferError]           = useState('')

  useEffect(() => { loadPatient() }, [id])

  const loadPatient = async () => {
    setLoading(true)
    try {
      const res = await patientService.getById(id)
      if (res.success) {
        setPatient(res.data)
        setForm({
          firstName: res.data.firstName,
          middleName: res.data.middleName || '',
          lastName: res.data.lastName,
          dateOfBirth: res.data.dateOfBirth?.split('T')[0],
          gender: genders.indexOf(res.data.gender),
          bloodGroup: bloodGroups.findIndex(b =>
            b === res.data.bloodGroup.replace('Positive', '+').replace('Negative', '-')),
          maritalStatus: 0,
          mobileNumber: res.data.mobileNumber,
          alternateMobile: res.data.alternateMobile || '',
          email: res.data.email || '',
          address: res.data.address,
          city: res.data.city,
          district: res.data.district || '',
          state: res.data.state,
          pinCode: res.data.pinCode,
          aadhaarNumber: res.data.aadhaarNumber || '',
          abhaId: res.data.abhaId || '',
          emergencyContactName: res.data.emergencyContactName,
          emergencyContactPhone: res.data.emergencyContactPhone,
          emergencyContactRelation: res.data.emergencyContactRelation,
          insuranceType: insuranceTypes.indexOf(res.data.insuranceType),
          insurancePolicyNumber: res.data.insurancePolicyNumber || '',
          ayushmanCardNumber: res.data.ayushmanCardNumber || '',
          knownAllergies: res.data.knownAllergies || '',
          chronicConditions: res.data.chronicConditions || '',
          isVIP: res.data.isVIP
        })
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    setSaving(true); setError(''); setSuccess('')
    try {
      const res = await patientService.update(id, form)
      if (res.success) { setSuccess('Patient updated successfully!'); setEditing(false); loadPatient() }
      else setError(res.message)
    } catch { setError('Something went wrong.') }
    finally { setSaving(false) }
  }

  const f  = (field, value) => setForm(prev => ({ ...prev, [field]: value }))
  const rf = (field, value) => setReferForm(prev => ({ ...prev, [field]: value }))

  const openReferModal = async () => {
    setReferError('')
    setReferForm({ toHospitalId: '', referringDoctorName: '', receivingDoctorName: '', urgency: 0, reason: '', clinicalNotes: '', patientConsent: false })
    setShowReferModal(true)
    try {
      const res = await referralService.getHospitals()
      if (res.success) setHospitals(res.data)
    } catch { setReferError('Could not load hospital list') }
  }

  const handleSendReferral = async (e) => {
    e.preventDefault()
    if (!referForm.patientConsent) { setReferError('Patient consent is required.'); return }
    setReferSaving(true); setReferError('')
    try {
      const res = await referralService.send({ ...referForm, patientId: id, urgency: parseInt(referForm.urgency) })
      if (res.success) { setShowReferModal(false); setSuccess('Referral sent successfully!') }
      else setReferError(res.message || 'Failed to send referral')
    } catch { setReferError('Failed to send referral') }
    finally { setReferSaving(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-gray-400">Loading patient...</div>
    </div>
  )

  if (!patient) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-gray-400">Patient not found</div>
    </div>
  )

  const TABS = [
    { id: 'info',         label: 'Profile' },
    { id: 'appointments', label: 'Appointments' },
    { id: 'bills',        label: 'Bills' },
    { id: 'lab',          label: 'Lab Results' },
  ]

  return (
    <div className="space-y-4 max-w-5xl">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/patients')}
          className="text-gray-400 hover:text-gray-600 transition-colors">
          ← Back
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
              {patient.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">{patient.fullName}</h2>
                {patient.isVIP && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">VIP</span>}
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span className="text-emerald-600 font-medium">{patient.uhid}</span>
                <span>·</span>
                <span>{patient.age} yrs</span>
                <span>·</span>
                <span>{patient.gender}</span>
                <span>·</span>
                <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium">
                  {patient.bloodGroup.replace('Positive', '+').replace('Negative', '-')}
                </span>
                {patient.knownAllergies && (
                  <>
                    <span>·</span>
                    <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-medium" title={patient.knownAllergies}>
                      ⚠ Allergies
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={() => { setEditing(false); setError('') }}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setShowBookModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold">
                + Book Appointment
              </button>
              <button onClick={openReferModal}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold">
                ↗ Refer
              </button>
              <button onClick={() => { setEditing(true); setActiveTab('info') }}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">
                ✏ Edit
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">{success}</div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === t.id
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ─── Profile Tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Personal Info */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">Personal Information</h3>
            {editing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">First Name</label>
                    <input value={form.firstName} onChange={e => f('firstName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Middle Name</label>
                    <input value={form.middleName} onChange={e => f('middleName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Last Name</label>
                    <input value={form.lastName} onChange={e => f('lastName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Date of Birth</label>
                    <input type="date" value={form.dateOfBirth} onChange={e => f('dateOfBirth', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Gender</label>
                    <select value={form.gender} onChange={e => f('gender', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                      {genders.map((g, i) => <option key={i} value={i}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Blood Group</label>
                    <select value={form.bloodGroup} onChange={e => f('bloodGroup', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                      {bloodGroups.map((b, i) => <option key={i} value={i}>{b}</option>)}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs text-gray-500 mb-1">Aadhaar Number</label>
                    <input value={form.aadhaarNumber} onChange={e => f('aadhaarNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isVIP || false} onChange={e => f('isVIP', e.target.checked)}
                    className="w-4 h-4 rounded" />
                  <span className="text-sm text-gray-600">Mark as VIP Patient</span>
                </label>
              </div>
            ) : (
              <div className="space-y-2">
                {[
                  ['Full Name', patient.fullName],
                  ['Date of Birth', patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString('en-IN') : '—'],
                  ['Age', `${patient.age} years`],
                  ['Gender', patient.gender],
                  ['Blood Group', patient.bloodGroup.replace('Positive', '+').replace('Negative', '-')],
                  ['Aadhaar', patient.aadhaarNumber || '—'],
                  ['ABHA ID', patient.abhaId || '—'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-xs text-gray-500">{label}</span>
                    <span className="text-sm font-medium text-gray-800">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">Contact Information</h3>
            {editing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Mobile</label>
                    <input value={form.mobileNumber} onChange={e => f('mobileNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Email</label>
                    <input type="email" value={form.email} onChange={e => f('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Address</label>
                    <input value={form.address} onChange={e => f('address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">City</label>
                    <input value={form.city} onChange={e => f('city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">State</label>
                    <select value={form.state} onChange={e => f('state', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                      {states.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">PIN Code</label>
                    <input value={form.pinCode} onChange={e => f('pinCode', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {[
                  ['Mobile', patient.mobileNumber],
                  ['Alternate', patient.alternateMobile || '—'],
                  ['Email', patient.email || '—'],
                  ['Address', patient.address],
                  ['City', patient.city],
                  ['State', patient.state],
                  ['PIN', patient.pinCode],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-xs text-gray-500">{label}</span>
                    <span className="text-sm font-medium text-gray-800 text-right max-w-[200px] truncate">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Emergency Contact */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">Emergency Contact</h3>
            {editing ? (
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Name</label>
                  <input value={form.emergencyContactName} onChange={e => f('emergencyContactName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Phone</label>
                  <input value={form.emergencyContactPhone} onChange={e => f('emergencyContactPhone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Relation</label>
                  <input value={form.emergencyContactRelation} onChange={e => f('emergencyContactRelation', e.target.value)}
                    placeholder="e.g. Wife, Son, Father"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {[
                  ['Name', patient.emergencyContactName],
                  ['Phone', patient.emergencyContactPhone],
                  ['Relation', patient.emergencyContactRelation],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-xs text-gray-500">{label}</span>
                    <span className="text-sm font-medium text-gray-800">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Insurance & Medical */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">Insurance & Medical</h3>
            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Insurance Type</label>
                  <select value={form.insuranceType} onChange={e => f('insuranceType', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    {insuranceTypes.map((t, i) => <option key={i} value={i}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Known Allergies</label>
                  <input value={form.knownAllergies} onChange={e => f('knownAllergies', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Chronic Conditions</label>
                  <input value={form.chronicConditions} onChange={e => f('chronicConditions', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {[
                  ['Insurance', patient.insuranceType],
                  ['Policy Number', patient.insurancePolicyNumber || '—'],
                  ['Ayushman Card', patient.ayushmanCardNumber || '—'],
                  ['Known Allergies', patient.knownAllergies || '—'],
                  ['Chronic Conditions', patient.chronicConditions || '—'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-xs text-gray-500">{label}</span>
                    <span className={`text-sm font-medium text-right max-w-[200px] ${
                      label === 'Known Allergies' && value !== '—' ? 'text-orange-700' :
                      label === 'Chronic Conditions' && value !== '—' ? 'text-red-700' : 'text-gray-800'
                    }`}>{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── History Tabs ─────────────────────────────────────────────────────── */}
      {activeTab === 'appointments' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Appointment History</h3>
            <button onClick={() => setShowBookModal(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold">
              + Book New
            </button>
          </div>
          <AppointmentsTab patientId={id} />
        </div>
      )}

      {activeTab === 'bills' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">Billing History</h3>
          <BillsTab patientId={id} />
        </div>
      )}

      {activeTab === 'lab' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">Lab Results</h3>
          <LabTab patientId={id} />
        </div>
      )}

      {/* ─── Book Appointment Modal ────────────────────────────────────────────── */}
      {showBookModal && (
        <BookAppointmentModal
          patient={patient}
          onClose={() => setShowBookModal(false)}
          onSuccess={(msg) => { setShowBookModal(false); setSuccess(msg); setActiveTab('appointments') }}
        />
      )}

      {/* ─── Refer Patient Modal ───────────────────────────────────────────────── */}
      {showReferModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Refer Patient to Another Hospital</h3>
                <button onClick={() => setShowReferModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
              </div>
              <p className="text-sm text-gray-500 mt-1">{patient.fullName} · {patient.uhid}</p>
            </div>
            <form onSubmit={handleSendReferral} className="p-6 space-y-4">
              {referError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{referError}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Hospital *</label>
                <select required value={referForm.toHospitalId} onChange={e => rf('toHospitalId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select hospital...</option>
                  {hospitals.map(h => (
                    <option key={h.id} value={h.id}>{h.name} — {h.city}, {h.state}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Referring Doctor *</label>
                  <input required value={referForm.referringDoctorName} onChange={e => rf('referringDoctorName', e.target.value)}
                    placeholder="Dr. name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Receiving Doctor</label>
                  <input value={referForm.receivingDoctorName} onChange={e => rf('receivingDoctorName', e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Urgency *</label>
                <select value={referForm.urgency} onChange={e => rf('urgency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value={0}>Routine</option>
                  <option value={1}>Urgent</option>
                  <option value={2}>Emergency</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Referral *</label>
                <input required value={referForm.reason} onChange={e => rf('reason', e.target.value)}
                  placeholder="e.g. Specialist consultation for cardiac evaluation"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Notes</label>
                <textarea value={referForm.clinicalNotes} onChange={e => rf('clinicalNotes', e.target.value)}
                  rows={3} placeholder="Diagnosis, treatment given, relevant history..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={referForm.patientConsent} onChange={e => rf('patientConsent', e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded" />
                  <span className="text-sm text-amber-800">
                    I confirm that the patient has given consent for their medical information to be shared with the receiving hospital.
                  </span>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowReferModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={referSaving}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                  {referSaving ? 'Sending...' : 'Send Referral'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
