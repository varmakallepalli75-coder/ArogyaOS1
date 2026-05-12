import { useState, useEffect, useRef } from 'react'
import { appointmentService } from '../../services/appointmentService'
import { patientService } from '../../services/patientService'
import { labService } from '../../services/labService'
import { aiService } from '../../services/aiService'
import api from '../../services/api'

// ─── Vital range validation ───────────────────────────────
const VITAL_RANGES = {
  pulseRate:      { low: 40, high: 120, unit: 'bpm' },
  temperature:    { low: 95, high: 104, unit: '°F' },
  spO2:           { low: 90, high: 100, unit: '%' },
  respiratoryRate:{ low: 8,  high: 30,  unit: '/min' },
  bloodGlucose:   { low: 50, high: 400, unit: 'mg/dL' },
}

function vitalStatus(key, val) {
  if (!val || !VITAL_RANGES[key]) return null
  const num = parseFloat(val)
  if (isNaN(num)) return null
  const { low, high } = VITAL_RANGES[key]
  if (num < low || num > high) return 'critical'
  if (num < low * 1.05 || num > high * 0.95) return 'warn'
  return 'ok'
}

// ─── Diagnosis quick templates ────────────────────────────
const DIAGNOSIS_TEMPLATES = [
  { label: 'Viral Fever',        diagnosis: 'Viral Fever', advice: 'Rest, plenty of fluids, avoid cold food. Take paracetamol if temp > 101°F.' },
  { label: 'Hypertension',       diagnosis: 'Essential Hypertension', advice: 'Low salt diet, daily exercise, reduce stress. Avoid smoking.' },
  { label: 'Type 2 Diabetes',    diagnosis: 'Type 2 Diabetes Mellitus', advice: 'Diabetic diet, regular blood sugar monitoring, daily walk 30 min.' },
  { label: 'URTI',               diagnosis: 'Upper Respiratory Tract Infection', advice: 'Steam inhalation, warm fluids, rest, avoid cold air.' },
  { label: 'Gastroenteritis',    diagnosis: 'Acute Gastroenteritis', advice: 'ORS, light diet, avoid oily food. Come back if no improvement in 48h.' },
  { label: 'Migraine',           diagnosis: 'Migraine without aura', advice: 'Avoid triggers (bright light, stress). Rest in dark room during episode.' },
  { label: 'Anemia',             diagnosis: 'Iron Deficiency Anemia', advice: 'Iron-rich foods (spinach, dates, jaggery). Avoid tea/coffee with meals.' },
  { label: 'UTI',                diagnosis: 'Urinary Tract Infection', advice: 'Increase water intake (3L/day). Complete full antibiotic course.' },
  { label: 'Asthma',             diagnosis: 'Bronchial Asthma', advice: 'Avoid triggers, use inhaler as prescribed. Avoid cold, dust, smoke.' },
  { label: 'Back Pain',          diagnosis: 'Lumbar Muscle Strain', advice: 'Rest, hot fomentation. Avoid lifting heavy weights. Physiotherapy advised.' },
]

// ─── Past Visit Card ──────────────────────────────────────
function PastVisitCard({ visit }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50">
        <div>
          <div className="text-xs font-semibold text-gray-800">
            {new Date(visit.visitDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
          <div className="text-xs text-gray-500 mt-0.5 truncate max-w-[220px]">
            {visit.diagnosis || visit.chiefComplaint || 'No diagnosis recorded'}
          </div>
        </div>
        <span className="text-gray-400 text-xs ml-2">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2 bg-gray-50 border-t border-gray-100">
          {visit.doctorName && <div className="text-xs text-gray-500">Dr. {visit.doctorName}</div>}
          {visit.blodPressure && <div className="text-xs text-gray-600">BP: {visit.bloodPressure} | Pulse: {visit.pulseRate} | Temp: {visit.temperature}°F</div>}
          {visit.advice && <div className="text-xs text-gray-600 italic">"{visit.advice}"</div>}
          {visit.medicines?.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-600">Rx: {visit.prescriptionNumber}</div>
              {visit.medicines.map((m, i) => (
                <div key={i} className="text-xs text-gray-700 pl-2">
                  • {m.medicineName} {m.dosage} — {m.frequency} × {m.duration}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Medicine Autocomplete ────────────────────────────────
function MedicineSearch({ value, onChange }) {
  const [query, setQuery] = useState(value || '')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const timer = useRef(null)

  const search = (q) => {
    setQuery(q)
    onChange(q)
    clearTimeout(timer.current)
    if (q.length < 2) { setResults([]); setOpen(false); return }
    timer.current = setTimeout(async () => {
      try {
        const res = await api.get('/pharmacy/medicines', { params: { search: q, pageSize: 8 } })
        const items = res.data?.data?.items || []
        setResults(items)
        setOpen(items.length > 0)
      } catch { setResults([]); setOpen(false) }
    }, 300)
  }

  const pick = (med) => {
    const name = `${med.name} ${med.strength || ''}`.trim()
    setQuery(name)
    onChange(name)
    setOpen(false)
    setResults([])
  }

  return (
    <div className="relative col-span-2">
      <input value={query} onChange={e => search(e.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Medicine name (type to search pharmacy)"
        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      {open && (
        <div className="absolute z-20 top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-0.5 max-h-40 overflow-y-auto">
          {results.map(med => (
            <button key={med.id} onMouseDown={() => pick(med)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 flex items-center justify-between">
              <span className="font-medium">{med.name} {med.strength}</span>
              <span className="text-xs text-gray-400">{med.category}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Inline Lab Order Modal ───────────────────────────────
function LabOrderModal({ onClose, onAdd }) {
  const [tests, setTests] = useState([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    labService.getTests().then(res => {
      if (res.success) setTests(res.data)
    }).finally(() => setLoading(false))
  }, [])

  const filtered = tests.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.code.toLowerCase().includes(search.toLowerCase())
  )

  const toggle = (t) => setSelected(prev =>
    prev.find(s => s.id === t.id)
      ? prev.filter(s => s.id !== t.id)
      : [...prev, { labTestId: t.id, testName: t.name }]
  )

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Order Lab Tests</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div className="p-4">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search tests..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          <div className="max-h-56 overflow-y-auto space-y-1">
            {loading ? <div className="text-center py-4 text-gray-400 text-sm">Loading...</div>
            : tests.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">
                <div className="text-2xl mb-2">🧪</div>
                <div className="font-medium text-gray-500">No lab tests configured</div>
                <div className="mt-1 text-xs">Go to <strong>Lab → Tests</strong> tab to add tests for your hospital</div>
              </div>
            )
            : filtered.length === 0 ? <div className="text-center py-4 text-gray-400 text-sm">No tests matching your search</div>
            : filtered.map(t => (
              <label key={t.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" checked={!!selected.find(s => s.labTestId === t.id)}
                  onChange={() => toggle(t)}
                  className="w-4 h-4 rounded text-emerald-600" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-800">{t.name}</div>
                  <div className="text-xs text-gray-400">{t.code} · ₹{t.price}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
        <div className="p-4 border-t border-gray-100 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={() => { onAdd(selected); onClose() }}
            disabled={selected.length === 0}
            className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
            Order {selected.length > 0 ? `(${selected.length})` : ''} Tests
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main OPD Component ───────────────────────────────────
export default function OPD() {
  const [queue, setQueue]                     = useState([])
  const [selectedApt, setSelectedApt]         = useState(null)
  const [patient, setPatient]                 = useState(null)
  const [pastVisits, setPastVisits]           = useState([])
  const [loading, setLoading]                 = useState(false)
  const [aiLoading, setAiLoading]             = useState(false)
  const [aiSuggestions, setAiSuggestions]     = useState(null)
  const [saving, setSaving]                   = useState(false)
  const [success, setSuccess]                 = useState('')
  const [saveError, setSaveError]             = useState('')
  const [showLabModal, setShowLabModal]       = useState(false)
  const [labTests, setLabTests]               = useState([])
  const [showHistory, setShowHistory]         = useState(true)
  const [feeTarget, setFeeTarget]             = useState(null)   // apt object for fee modal
  const [feePayMode, setFeePayMode]           = useState('Cash')
  const [feeCollecting, setFeeCollecting]     = useState(false)
  const [feeReceipt, setFeeReceipt]           = useState(null)  // receipt after collect

  const [vitals, setVitals] = useState({
    bloodPressure: '', pulseRate: '', temperature: '',
    spO2: '', weightKg: '', heightCm: '', bloodGlucose: '', respiratoryRate: ''
  })

  const [consultation, setConsultation] = useState({
    chiefComplaint: '', historyOfPresentIllness: '',
    clinicalFindings: '', diagnosis: '', advice: '', followUpDate: ''
  })
  const [createFollowUp, setCreateFollowUp] = useState(false)

  const [prescription, setPrescription] = useState([])
  const [newMed, setNewMed]             = useState({
    medicineName: '', dosage: '', frequency: '', duration: '', instructions: '', quantity: 1
  })

  useEffect(() => { loadQueue() }, [])

  const loadQueue = async () => {
    setLoading(true)
    try {
      const res = await appointmentService.getToday()
      if (res.success) setQueue(res.data)
    } finally { setLoading(false) }
  }

  const selectAppointment = async (apt) => {
    setSelectedApt(apt)
    setPatient(null)
    setPastVisits([])
    setAiSuggestions(null)
    setPrescription([])
    setLabTests([])
    setSuccess('')
    setVitals({ bloodPressure: '', pulseRate: '', temperature: '',
      spO2: '', weightKg: '', heightCm: '', bloodGlucose: '', respiratoryRate: '' })
    setConsultation({ chiefComplaint: apt.chiefComplaint || '',
      historyOfPresentIllness: '', clinicalFindings: '',
      diagnosis: '', advice: '', followUpDate: '' })
    setCreateFollowUp(false)

    try {
      const [patRes, histRes] = await Promise.all([
        patientService.getById(apt.patientId),
        api.get(`/opd/patient/${apt.patientId}/history?limit=5`)
      ])
      if (patRes.success) setPatient(patRes.data)
      if (histRes.data?.success) setPastVisits(histRes.data.data || [])
    } catch(e) { console.error(e) }

    await appointmentService.updateStatus(apt.id, 2)
    loadQueue()
  }

  // Auto BMI
  const bmi = (() => {
    const w = parseFloat(vitals.weightKg)
    const h = parseFloat(vitals.heightCm)
    if (!w || !h || h === 0) return null
    return (w / ((h / 100) ** 2)).toFixed(1)
  })()

  const getAISuggestions = async () => {
    if (!consultation.diagnosis && !consultation.chiefComplaint) return
    setAiLoading(true); setAiSuggestions(null)
    try {
      const result = await aiService.getMedicineSuggestions(
        patient, consultation.diagnosis || consultation.chiefComplaint, patient?.currentMedications)
      setAiSuggestions(result)
    } catch(e) { console.error(e) }
    finally { setAiLoading(false) }
  }

  const addMedicineFromAI = (med) => {
    setPrescription(prev => [...prev, {
      medicineName: `${med.medicineName} ${med.dosage}`,
      genericName: med.genericName, dosage: med.dosage,
      frequency: med.frequency, duration: med.duration,
      instructions: med.instructions, quantity: 1, isSubstitutionAllowed: true
    }])
  }

  const addManualMedicine = () => {
    if (!newMed.medicineName) return
    setPrescription(prev => [...prev, { ...newMed }])
    setNewMed({ medicineName: '', dosage: '', frequency: '', duration: '', instructions: '', quantity: 1 })
  }

  const applyTemplate = (tpl) => {
    setConsultation(p => ({ ...p, diagnosis: tpl.diagnosis, advice: tpl.advice }))
  }

  const handleSave = async (andPrint = false) => {
    if (!consultation.diagnosis) { alert('Please enter a diagnosis'); return }
    setSaving(true)
    setSaveError('')
    try {
      const res = await api.post('/opd/consultation', {
        appointmentId: selectedApt.id,
        patientId: selectedApt.patientId,
        doctorId: selectedApt.doctorId,
        ...vitals,
        ...consultation,
        followUpDate: consultation.followUpDate || null,
        createFollowUpAppointment: createFollowUp,
        medicines: prescription.map(m => ({
          medicineName: m.medicineName, genericName: m.genericName || '',
          dosage: m.dosage || '', frequency: m.frequency || '',
          duration: m.duration || '', instructions: m.instructions || '',
          quantity: m.quantity || 1
        })),
        labTests: labTests
      })

      if (res.data?.success) {
        const rxNumber = res.data.data?.prescriptionNumber
        setSuccess(`Consultation saved! Rx: ${rxNumber}${createFollowUp ? ' · Follow-up appointment created.' : ''}`)

        if (andPrint && rxNumber) {
          const printWindow = window.open('', '_blank')
          const rx = res.data.data
          printWindow.document.write(buildPrescriptionHtml(rx, patient, selectedApt))
          printWindow.document.close()
          printWindow.focus()
          setTimeout(() => printWindow.print(), 500)
        }

        setSelectedApt(null); setPatient(null); setPrescription([]); setLabTests([])
        setVitals({ bloodPressure: '', pulseRate: '', temperature: '',
          spO2: '', weightKg: '', heightCm: '', bloodGlucose: '', respiratoryRate: '' })
        setConsultation({ chiefComplaint: '', historyOfPresentIllness: '',
          clinicalFindings: '', diagnosis: '', advice: '', followUpDate: '' })
        loadQueue()
      } else {
        setSaveError(res.data?.message || 'Failed to save consultation')
      }
    } catch(e) {
      setSaveError(e.response?.data?.message || e.message || 'Failed to save consultation')
    }
    finally { setSaving(false) }
  }

  const buildPrescriptionHtml = (rx, pt, apt) => `
    <!DOCTYPE html><html><head><title>Prescription - ${rx?.prescriptionNumber}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; max-width: 700px; margin: 0 auto; }
      .header { display:flex; justify-content:space-between; border-bottom: 2px solid #059669; padding-bottom:12px; margin-bottom:12px; }
      .hospital-name { font-size:20px; font-weight:bold; color:#059669; }
      .rx-symbol { font-size:36px; color:#059669; }
      table { width:100%; border-collapse:collapse; margin-top:12px; }
      th,td { border:1px solid #e5e7eb; padding:8px 10px; text-align:left; font-size:13px; }
      th { background:#f9fafb; font-weight:600; }
      .patient-info { background:#f0fdf4; padding:10px; border-radius:8px; margin-bottom:12px; display:grid; grid-template-columns:1fr 1fr; gap:4px; font-size:13px; }
      .diagnosis { margin:12px 0; font-size:14px; }
      .footer { margin-top:20px; border-top:1px solid #e5e7eb; padding-top:12px; display:flex; justify-content:space-between; font-size:12px; color:#6b7280; }
      @media print { body { padding:5px; } }
    </style></head><body>
    <div class="header">
      <div><div class="hospital-name">ArogyaOS Hospital</div><div style="font-size:12px;color:#6b7280;">Medical Centre</div></div>
      <div style="text-align:right">
        <div style="font-size:12px;color:#6b7280;">Dr. ${apt?.doctorName || ''}</div>
        <div style="font-size:12px;color:#6b7280;">${apt?.departmentName || ''}</div>
        <div style="font-size:12px;font-weight:600;color:#059669;">Rx: ${rx?.prescriptionNumber || ''}</div>
      </div>
    </div>
    <div class="patient-info">
      <div><strong>Patient:</strong> ${pt?.fullName || ''}</div>
      <div><strong>UHID:</strong> ${pt?.uhid || ''}</div>
      <div><strong>Age/Sex:</strong> ${pt?.age || ''}y / ${pt?.gender || ''}</div>
      <div><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</div>
      ${pt?.knownAllergies ? `<div style="color:red;grid-column:span 2"><strong>⚠ Allergies:</strong> ${pt.knownAllergies}</div>` : ''}
    </div>
    <div class="diagnosis"><strong>Diagnosis:</strong> ${rx?.diagnosis || consultation.diagnosis || ''}</div>
    <div class="rx-symbol">℞</div>
    <table>
      <thead><tr><th>#</th><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Instructions</th></tr></thead>
      <tbody>${(rx?.medicines || prescription).map((m, i) => `
        <tr>
          <td>${i+1}</td>
          <td>${m.medicineName}</td>
          <td>${m.dosage || ''}</td>
          <td>${m.frequency || ''}</td>
          <td>${m.duration || ''}</td>
          <td>${m.instructions || ''}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    ${consultation.advice ? `<div style="margin-top:12px;font-size:13px;"><strong>Advice:</strong> ${consultation.advice}</div>` : ''}
    ${consultation.followUpDate ? `<div style="margin-top:6px;font-size:13px;"><strong>Follow-up:</strong> ${new Date(consultation.followUpDate).toLocaleDateString('en-IN')}</div>` : ''}
    <div class="footer">
      <span>This prescription is computer generated</span>
      <span>Doctor's Signature: _______________</span>
    </div>
    </body></html>`

  const v = (k, val) => setVitals(p => ({ ...p, [k]: val }))
  const c = (k, val) => setConsultation(p => ({ ...p, [k]: val }))

  const statusColors = {
    Scheduled:  'bg-blue-100 text-blue-700',
    Confirmed:  'bg-purple-100 text-purple-700',
    InProgress: 'bg-amber-100 text-amber-700',
    Completed:  'bg-emerald-100 text-emerald-700',
    Cancelled:  'bg-red-100 text-red-700',
  }

  // Map appointment status → journey step (1-5)
  const statusToStep = { Scheduled: 1, Confirmed: 2, InProgress: 3, Completed: 5 }

  const checkIn = async (e, apt) => {
    e.stopPropagation()
    await api.post(`/appointment/${apt.id}/checkin`)
    loadQueue()
  }

  const openFeeModal = (e, apt) => {
    e.stopPropagation()
    setFeeTarget(apt)
    setFeePayMode('Cash')
    setFeeReceipt(null)
  }

  const handleCollectFee = async () => {
    if (!feeTarget) return
    setFeeCollecting(true)
    try {
      const res = await api.post(`/appointment/${feeTarget.id}/collect-fee`, { paymentMode: feePayMode })
      if (res.data.success) {
        setFeeReceipt(res.data.data)
        loadQueue()
      }
    } catch(e) { console.error(e) }
    finally { setFeeCollecting(false) }
  }

  // Mini 5-dot stepper for queue row
  const MiniStepper = ({ apt }) => {
    const step = statusToStep[apt.status] ?? 1
    const dots = [
      { s: 1, title: 'Registered' },
      { s: 2, title: 'Checked In' },
      { s: 3, title: 'With Doctor' },
      { s: 4, title: 'Prescription' },
      { s: 5, title: 'Done' },
    ]
    return (
      <div className="flex items-center gap-0.5 mt-1.5">
        {dots.map((d, i) => (
          <div key={d.s} className="flex items-center gap-0.5">
            <div title={d.title} className={`w-2 h-2 rounded-full transition-colors ${
              step > d.s  ? 'bg-emerald-500' :
              step === d.s ? 'bg-blue-500 ring-2 ring-blue-200' :
                             'bg-gray-200'
            }`} />
            {i < dots.length - 1 && (
              <div className={`w-3 h-0.5 ${step > d.s ? 'bg-emerald-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
    )
  }

  const VitalInput = ({ k, label, unit, placeholder }) => {
    const status = vitalStatus(k, vitals[k])
    return (
      <div>
        <label className="block text-xs text-gray-500 mb-1">
          {label} <span className="text-gray-400">({unit})</span>
        </label>
        <div className="relative">
          <input value={vitals[k]} onChange={e => v(k, e.target.value)}
            placeholder={placeholder}
            className={`w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
              status === 'critical' ? 'border-red-400 bg-red-50 focus:ring-red-400' :
              status === 'warn'     ? 'border-amber-400 bg-amber-50 focus:ring-amber-400' :
              'border-gray-200 focus:ring-emerald-500'
            }`} />
          {status === 'critical' && <span className="absolute right-2 top-1.5 text-red-500 text-xs">!</span>}
          {status === 'warn' && <span className="absolute right-2 top-1.5 text-amber-500 text-xs">⚠</span>}
        </div>
        {status === 'critical' && (
          <div className="text-xs text-red-600 mt-0.5">Critical value — verify immediately</div>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-full gap-4" style={{ height: 'calc(100vh - 100px)' }}>

      {/* ─── Left: Queue ───────────────────────────────────── */}
      <div className="w-72 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Today's OPD Queue</h3>
          <p className="text-xs text-gray-500 mt-0.5">{queue.length} patients</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-10 text-gray-400 text-sm">Loading...</div>
          ) : queue.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">No patients today</div>
          ) : queue.map(apt => (
            <div key={apt.id}
              className={`p-3 border-b border-gray-50 transition-colors ${
                selectedApt?.id === apt.id
                  ? 'bg-emerald-50 border-l-4 border-l-emerald-500'
                  : 'hover:bg-gray-50'
              } ${apt.status === 'Completed' ? 'opacity-60' : ''}`}>

              {/* Row header */}
              <div className="flex items-center justify-between mb-1 cursor-pointer"
                onClick={() => apt.status !== 'Completed' && selectAppointment(apt)}>
                <span className="text-xs font-bold text-emerald-600">{apt.tokenNumber}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusColors[apt.status] || 'bg-gray-100 text-gray-600'}`}>
                  {apt.status}
                </span>
              </div>

              <div className="cursor-pointer" onClick={() => apt.status !== 'Completed' && selectAppointment(apt)}>
                <div className="text-sm font-medium text-gray-900">{apt.patientName}</div>
                <div className="text-xs text-gray-500">{apt.patientAge}y · {apt.patientGender}</div>
                {apt.chiefComplaint && (
                  <div className="text-xs text-gray-400 mt-0.5 truncate">{apt.chiefComplaint}</div>
                )}
              </div>

              {/* Mini journey stepper */}
              <MiniStepper apt={apt} />

              {/* Fee badge */}
              {apt.consultationFee > 0 && (
                <div className="mt-1.5">
                  {apt.isFeeCollected ? (
                    <div className="flex items-center gap-1 text-xs text-emerald-700 font-medium">
                      <span>✓ Fee Paid</span>
                      <span className="text-gray-400">· ₹{apt.consultationFee} · {apt.feePaymentMode}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                      <span>⚠ Fee Pending · ₹{apt.consultationFee}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="mt-2 flex gap-1.5">
                {apt.status === 'Scheduled' && (
                  <button onClick={e => checkIn(e, apt)}
                    className="flex-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg py-1 font-medium transition-colors">
                    Check In
                  </button>
                )}
                {apt.consultationFee > 0 && !apt.isFeeCollected && apt.status !== 'Completed' && (
                  <button onClick={e => openFeeModal(e, apt)}
                    className="flex-1 text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg py-1 font-medium transition-colors">
                    💰 Collect Fee
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Right: Consultation ──────────────────────────── */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {!selectedApt ? (
          <div className="flex flex-col items-center justify-center h-full bg-white rounded-xl border border-gray-100">
            <div className="text-5xl mb-3">🏥</div>
            <div className="text-gray-500 font-medium">Select a patient from the queue</div>
            <div className="text-gray-400 text-sm mt-1">Click on any patient to start consultation</div>
          </div>
        ) : (
          <>
            {/* ── Patient Header ── */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg flex-shrink-0">
                    {selectedApt.patientName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{selectedApt.patientName}</div>
                    <div className="text-sm text-gray-500">
                      {selectedApt.patientUHID} · {selectedApt.patientAge}y · {selectedApt.patientGender}
                      {patient?.bloodGroup && ` · ${patient.bloodGroup.replace('Positive', '+').replace('Negative', '-')}`}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {patient?.knownAllergies && patient.knownAllergies !== 'None' && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                          ⚠ Allergy: {patient.knownAllergies}
                        </span>
                      )}
                      {patient?.chronicConditions && patient.chronicConditions !== 'None' && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                          {patient.chronicConditions}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-700">{selectedApt.doctorName}</div>
                  <div className="text-xs text-gray-500">{selectedApt.departmentName}</div>
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    Token: {selectedApt.tokenNumber}
                  </span>
                </div>
              </div>

              {/* Past visit history */}
              {pastVisits.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <button onClick={() => setShowHistory(h => !h)}
                    className="flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-gray-900">
                    <span>📋 Past Visits ({pastVisits.length})</span>
                    <span className="text-gray-400">{showHistory ? '▲' : '▼'}</span>
                  </button>
                  {showHistory && (
                    <div className="mt-2 space-y-1.5 max-h-52 overflow-y-auto">
                      {pastVisits.map(v => <PastVisitCard key={v.visitId} visit={v} />)}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Vitals ── */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Vitals</h4>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Blood Pressure <span className="text-gray-400">(mmHg)</span></label>
                  <input value={vitals.bloodPressure} onChange={e => v('bloodPressure', e.target.value)}
                    placeholder="120/80"
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <VitalInput k="pulseRate"       label="Pulse Rate"   unit="bpm"  placeholder="72" />
                <VitalInput k="temperature"     label="Temperature"  unit="°F"   placeholder="98.6" />
                <VitalInput k="spO2"            label="SpO2"         unit="%"    placeholder="98" />
                <VitalInput k="respiratoryRate" label="Resp. Rate"   unit="/min" placeholder="16" />
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Weight <span className="text-gray-400">(kg)</span></label>
                  <input value={vitals.weightKg} onChange={e => v('weightKg', e.target.value)}
                    placeholder="70"
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Height <span className="text-gray-400">(cm)</span></label>
                  <input value={vitals.heightCm} onChange={e => v('heightCm', e.target.value)}
                    placeholder="170"
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    BMI {bmi && <span className={`font-semibold ml-1 ${
                      parseFloat(bmi) < 18.5 ? 'text-blue-600' :
                      parseFloat(bmi) < 25   ? 'text-green-600' :
                      parseFloat(bmi) < 30   ? 'text-amber-600' : 'text-red-600'
                    }`}>{bmi} ({parseFloat(bmi) < 18.5 ? 'Underweight' : parseFloat(bmi) < 25 ? 'Normal' : parseFloat(bmi) < 30 ? 'Overweight' : 'Obese'})</span>}
                  </label>
                  <VitalInput k="bloodGlucose" label="" unit="mg/dL" placeholder="110" />
                </div>
              </div>
            </div>

            {/* ── Consultation Notes ── */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Consultation Notes</h4>

              {/* Quick diagnosis templates */}
              <div className="mb-3">
                <div className="text-xs text-gray-500 mb-1.5">Quick Diagnosis</div>
                <div className="flex flex-wrap gap-1.5">
                  {DIAGNOSIS_TEMPLATES.map(tpl => (
                    <button key={tpl.label} onClick={() => applyTemplate(tpl)}
                      className="text-xs px-2.5 py-1 bg-gray-100 hover:bg-emerald-100 hover:text-emerald-700 text-gray-600 rounded-full transition-colors">
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Chief Complaint</label>
                  <input value={consultation.chiefComplaint} onChange={e => c('chiefComplaint', e.target.value)}
                    placeholder="e.g. Chest pain, Fever, Headache"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">History of Present Illness</label>
                  <textarea value={consultation.historyOfPresentIllness}
                    onChange={e => c('historyOfPresentIllness', e.target.value)}
                    rows={2} placeholder="Describe the history..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Clinical Findings</label>
                  <textarea value={consultation.clinicalFindings}
                    onChange={e => c('clinicalFindings', e.target.value)}
                    rows={2} placeholder="On examination..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Diagnosis <span className="text-red-400">*</span></label>
                  <input value={consultation.diagnosis} onChange={e => c('diagnosis', e.target.value)}
                    placeholder="e.g. Hypertension, Type 2 Diabetes"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
            </div>

            {/* ── AI Suggestions ── */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700">🤖 ArogyaOS AI Suggestions</h4>
                  <p className="text-xs text-gray-400 mt-0.5">AI-powered medicine suggestions based on patient profile</p>
                </div>
                <button onClick={getAISuggestions} disabled={aiLoading}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center gap-2">
                  {aiLoading ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>Analyzing...</>
                  ) : '✨ Get AI Suggestions'}
                </button>
              </div>

              {aiSuggestions && (
                <div className="space-y-3">
                  {aiSuggestions.alerts?.length > 0 && (
                    <div className="space-y-2">
                      {aiSuggestions.alerts.map((alert, i) => (
                        <div key={i} className={`px-3 py-2 rounded-lg text-sm flex items-start gap-2 ${
                          alert.type === 'allergy' ? 'bg-red-50 text-red-700 border border-red-200' :
                          alert.type === 'interaction' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          <span>{alert.type === 'allergy' ? '⚠️' : alert.type === 'interaction' ? '🔴' : 'ℹ️'}</span>
                          <span>{alert.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {aiSuggestions.clinicalNote && (
                    <div className="bg-purple-50 border border-purple-200 px-3 py-2 rounded-lg text-sm text-purple-700">
                      <span className="font-medium">AI Note: </span>{aiSuggestions.clinicalNote}
                    </div>
                  )}
                  <div className="space-y-2">
                    {aiSuggestions.suggestions?.map((med, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">{med.medicineName} {med.dosage}</span>
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{med.frequency}</span>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{med.duration}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {med.instructions && <span>{med.instructions}</span>}
                            {med.warning && <span className="text-amber-600 ml-2">⚠️ {med.warning}</span>}
                          </div>
                        </div>
                        <button onClick={() => addMedicineFromAI(med)}
                          className="ml-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-medium flex-shrink-0">
                          + Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Prescription ── */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-700">Prescription</h4>
                <button onClick={() => setShowLabModal(true)}
                  className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1">
                  🧪 Order Lab Tests {labTests.length > 0 && `(${labTests.length})`}
                </button>
              </div>

              {/* Ordered lab tests badge */}
              {labTests.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {labTests.map((t, i) => (
                    <span key={i} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full flex items-center gap-1">
                      🧪 {t.testName}
                      <button onClick={() => setLabTests(prev => prev.filter((_, j) => j !== i))} className="ml-0.5 text-purple-500 hover:text-purple-800">×</button>
                    </span>
                  ))}
                </div>
              )}

              {/* Added medicines */}
              {prescription.length > 0 && (
                <div className="mb-3 space-y-2">
                  {prescription.map((med, i) => (
                    <div key={i} className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-emerald-800">{med.medicineName}</span>
                        <span className="text-xs text-emerald-600 ml-2">{med.frequency} · {med.duration}</span>
                        {med.instructions && <span className="text-xs text-gray-500 ml-2">{med.instructions}</span>}
                      </div>
                      <button onClick={() => setPrescription(prev => prev.filter((_, j) => j !== i))}
                        className="text-red-400 hover:text-red-600 text-lg">✕</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add medicine with autocomplete */}
              <div className="border border-dashed border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-2 font-medium">Add Medicine</p>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <MedicineSearch
                    value={newMed.medicineName}
                    onChange={val => setNewMed(p => ({ ...p, medicineName: val }))} />
                  <input value={newMed.dosage}
                    onChange={e => setNewMed(p => ({ ...p, dosage: e.target.value }))}
                    placeholder="500mg"
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <input value={newMed.frequency}
                    onChange={e => setNewMed(p => ({ ...p, frequency: e.target.value }))}
                    placeholder="1-0-1"
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  <input value={newMed.duration}
                    onChange={e => setNewMed(p => ({ ...p, duration: e.target.value }))}
                    placeholder="5 days"
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  <input value={newMed.instructions}
                    onChange={e => setNewMed(p => ({ ...p, instructions: e.target.value }))}
                    placeholder="After food"
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  <button onClick={addManualMedicine}
                    className="bg-gray-700 hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                    + Add
                  </button>
                </div>
              </div>
            </div>

            {/* ── Advice & Follow-up ── */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Advice & Follow Up</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Advice / Instructions</label>
                  <textarea value={consultation.advice} onChange={e => c('advice', e.target.value)}
                    rows={3} placeholder="Diet advice, rest, lifestyle changes..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Follow Up Date</label>
                    <input type="date" value={consultation.followUpDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => c('followUpDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  {consultation.followUpDate && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={createFollowUp}
                        onChange={e => setCreateFollowUp(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600" />
                      <span className="text-xs text-gray-600">Auto-create follow-up appointment</span>
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* ── Save Buttons ── */}
            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">
                {success}
              </div>
            )}
            {saveError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {saveError}
              </div>
            )}
            <div className="flex gap-3 pb-4">
              <button onClick={() => handleSave(false)} disabled={saving}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl font-semibold disabled:opacity-50">
                {saving ? 'Saving...' : '✅ Save & Complete'}
              </button>
              <button onClick={() => handleSave(true)} disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-semibold disabled:opacity-50">
                🖨 Save & Print Rx
              </button>
            </div>
          </>
        )}
      </div>

      {/* ─── Lab Order Modal ──────────────────────────────── */}
      {showLabModal && (
        <LabOrderModal
          onClose={() => setShowLabModal(false)}
          onAdd={(tests) => setLabTests(prev => {
            const existing = prev.map(t => t.labTestId)
            return [...prev, ...tests.filter(t => !existing.includes(t.labTestId))]
          })}
        />
      )}

      {/* ─── Collect Fee Modal ────────────────────────────── */}
      {feeTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-900">Collect Consultation Fee</div>
                <div className="text-xs text-gray-500 mt-0.5">{feeTarget.patientName} · Token {feeTarget.tokenNumber}</div>
              </div>
              <button onClick={() => setFeeTarget(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            {feeReceipt ? (
              <div className="p-6 text-center">
                <div className="text-4xl mb-3">✅</div>
                <div className="text-lg font-bold text-gray-900 mb-1">Fee Collected!</div>
                <div className="text-sm text-gray-500 mb-4">Receipt generated successfully</div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
                  <div className="text-xs text-gray-500 mb-1">Receipt Number</div>
                  <div className="text-xl font-bold text-emerald-700 font-mono">{feeReceipt}</div>
                  <div className="text-sm text-gray-600 mt-2">
                    ₹{feeTarget.consultationFee} · {feePayMode}
                  </div>
                </div>
                <div className="text-xs text-gray-400 mb-4">Give this receipt to the patient. They can see the doctor now.</div>
                <button onClick={() => setFeeTarget(null)}
                  className="w-full bg-emerald-600 text-white py-2.5 rounded-xl font-semibold text-sm">
                  Done
                </button>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                {/* Amount */}
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <div className="text-xs text-gray-500 mb-1">Consultation Fee</div>
                  <div className="text-3xl font-bold text-blue-700">₹{feeTarget.consultationFee}</div>
                  <div className="text-xs text-gray-400 mt-1">Dr. {feeTarget.doctorName} · {feeTarget.departmentName}</div>
                </div>

                {/* Payment Mode */}
                <div>
                  <div className="text-xs font-medium text-gray-600 mb-2">Payment Mode</div>
                  <div className="grid grid-cols-3 gap-2">
                    {['Cash', 'Card', 'UPI'].map(mode => (
                      <button key={mode} onClick={() => setFeePayMode(mode)}
                        className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                          feePayMode === mode
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}>
                        {mode === 'Cash' ? '💵' : mode === 'Card' ? '💳' : '📱'} {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={handleCollectFee} disabled={feeCollecting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-sm disabled:opacity-50">
                  {feeCollecting ? 'Processing...' : `Collect ₹${feeTarget.consultationFee}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
