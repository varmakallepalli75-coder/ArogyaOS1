import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import healthRecordsService from '../services/healthRecordsService'

const TAB_TIMELINE = 'timeline'
const TAB_PRESCRIPTIONS = 'prescriptions'
const TAB_VISITS = 'visits'
const TAB_LABS = 'labs'
const TAB_ADMISSIONS = 'admissions'

const EVENT_ICONS = {
  'OPD Visit': '🩺',
  'IPD Admission': '🏥',
  'Lab Test': '🧪',
  'Prescription': '💊',
}

const EVENT_COLORS = {
  'OPD Visit': 'bg-green-100 text-green-800 border-green-200',
  'IPD Admission': 'bg-red-100 text-red-800 border-red-200',
  'Lab Test': 'bg-purple-100 text-purple-800 border-purple-200',
  'Prescription': 'bg-blue-100 text-blue-800 border-blue-200',
}

function HospitalBadge({ name }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-200">
      🏥 {name}
    </span>
  )
}

export default function HealthRecords() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState(TAB_TIMELINE)
  const [linkedHospitals, setLinkedHospitals] = useState([])
  const [timeline, setTimeline] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [visits, setVisits] = useState([])
  const [labs, setLabs] = useState([])
  const [admissions, setAdmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState({})

  const isUnified = user?.loginMode === 'unified'

  useEffect(() => {
    if (isUnified) {
      loadData()
    }
  }, [isUnified])

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [hosRes, timelineRes] = await Promise.all([
        healthRecordsService.getLinkedHospitals(),
        healthRecordsService.getTimeline(),
      ])
      if (hosRes.data.success) setLinkedHospitals(hosRes.data.data)
      if (timelineRes.data.success) setTimeline(timelineRes.data.data)
    } catch (err) {
      setError('Failed to load health records.')
    } finally {
      setLoading(false)
    }
  }

  const loadTab = async (tab) => {
    setActiveTab(tab)
    if (tab === TAB_PRESCRIPTIONS && prescriptions.length === 0) {
      const res = await healthRecordsService.getPrescriptions()
      if (res.data.success) setPrescriptions(res.data.data)
    }
    if (tab === TAB_VISITS && visits.length === 0) {
      const res = await healthRecordsService.getVisits()
      if (res.data.success) setVisits(res.data.data)
    }
    if (tab === TAB_LABS && labs.length === 0) {
      const res = await healthRecordsService.getLabs()
      if (res.data.success) setLabs(res.data.data)
    }
    if (tab === TAB_ADMISSIONS && admissions.length === 0) {
      const res = await healthRecordsService.getAdmissions()
      if (res.data.success) setAdmissions(res.data.data)
    }
  }

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  if (!isUnified) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm shadow">
          <span className="text-4xl">🔒</span>
          <h2 className="text-lg font-bold text-gray-800 mt-3 mb-2">Unified Login Required</h2>
          <p className="text-gray-500 text-sm">
            To view cross-hospital health records, please log in using "My Health Records"
            on the login screen (without a hospital code).
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-3">⟳</div>
          <p className="text-gray-500">Loading your health records...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 pt-8 pb-6">
        <h1 className="text-xl font-bold">My Health Records</h1>
        <p className="text-blue-100 text-sm mt-1">
          {user?.fullName} · {linkedHospitals.length} hospital{linkedHospitals.length !== 1 ? 's' : ''}
        </p>
        {/* Linked hospitals chips */}
        <div className="flex flex-wrap gap-2 mt-3">
          {linkedHospitals.map(h => (
            <div key={h.hospitalId} className="bg-white/20 rounded-full px-3 py-1 text-xs text-white">
              {h.hospitalName} · UHID: {h.uhid}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Tab bar */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex overflow-x-auto scrollbar-hide px-2">
          {[
            { key: TAB_TIMELINE, label: '⏱ Timeline' },
            { key: TAB_PRESCRIPTIONS, label: '💊 Prescriptions' },
            { key: TAB_VISITS, label: '🩺 Visits' },
            { key: TAB_LABS, label: '🧪 Labs' },
            { key: TAB_ADMISSIONS, label: '🏥 Admissions' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => loadTab(t.key)}
              className={`whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors flex-shrink-0 ${
                activeTab === t.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {/* Timeline */}
        {activeTab === TAB_TIMELINE && (
          timeline.length === 0 ? (
            <Empty text="No health events found." />
          ) : (
            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />
              {timeline.map((event, i) => (
                <div key={i} className="flex gap-4 mb-4">
                  <div className="w-10 h-10 flex-shrink-0 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-lg z-10">
                    {EVENT_ICONS[event.eventType] || '📌'}
                  </div>
                  <div className="flex-1 bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border mb-1 ${EVENT_COLORS[event.eventType] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                          {event.eventType}
                        </span>
                        <p className="font-semibold text-gray-800 text-sm">{event.title}</p>
                        {event.doctorName && (
                          <p className="text-xs text-gray-500 mt-0.5">Dr. {event.doctorName}</p>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 flex-shrink-0">
                        {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    {event.details && (
                      <p className="text-xs text-gray-600 mt-2 border-t border-gray-100 pt-2">{event.details}</p>
                    )}
                    <HospitalBadge name={event.hospitalName} />
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Prescriptions */}
        {activeTab === TAB_PRESCRIPTIONS && (
          prescriptions.length === 0 ? (
            <Empty text="No prescriptions found." />
          ) : (
            prescriptions.map(rx => (
              <div key={rx.prescriptionId} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div
                  className="p-4 cursor-pointer flex justify-between items-start"
                  onClick={() => toggle(rx.prescriptionId)}>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-bold text-gray-800">{rx.prescriptionNumber}</span>
                      <HospitalBadge name={rx.hospitalName} />
                    </div>
                    <p className="text-xs text-gray-500">Dr. {rx.doctorName}</p>
                    {rx.diagnosis && <p className="text-xs text-blue-700 font-medium mt-1">Dx: {rx.diagnosis}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(rx.prescribedOn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-gray-400 text-lg">{expanded[rx.prescriptionId] ? '▲' : '▼'}</div>
                </div>
                {expanded[rx.prescriptionId] && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <div className="space-y-2 mt-3">
                      {rx.medicines.map((m, i) => (
                        <div key={i} className="bg-blue-50 rounded-lg p-3">
                          <p className="text-sm font-semibold text-gray-800">💊 {m.medicineName}</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {m.dosage && <span className="text-xs bg-white px-2 py-0.5 rounded-full border border-blue-200 text-blue-700">{m.dosage}</span>}
                            {m.frequency && <span className="text-xs bg-white px-2 py-0.5 rounded-full border border-blue-200 text-blue-700">{m.frequency}</span>}
                            {m.duration && <span className="text-xs bg-white px-2 py-0.5 rounded-full border border-blue-200 text-blue-700">{m.duration}</span>}
                          </div>
                          {m.instructions && <p className="text-xs text-gray-500 mt-1">{m.instructions}</p>}
                        </div>
                      ))}
                    </div>
                    {rx.notes && <p className="text-xs text-gray-600 mt-2">Note: {rx.notes}</p>}
                    {rx.followUpInstructions && (
                      <p className="text-xs text-orange-600 mt-1">Follow-up: {rx.followUpInstructions}</p>
                    )}
                  </div>
                )}
              </div>
            ))
          )
        )}

        {/* Visits */}
        {activeTab === TAB_VISITS && (
          visits.length === 0 ? (
            <Empty text="No OPD visits found." />
          ) : (
            visits.map(v => (
              <div key={v.visitId} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div
                  className="p-4 cursor-pointer flex justify-between items-start"
                  onClick={() => toggle(v.visitId)}>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-bold text-gray-800">{v.visitNumber}</span>
                      <HospitalBadge name={v.hospitalName} />
                    </div>
                    <p className="text-xs text-gray-500">Dr. {v.doctorName}</p>
                    {v.diagnosis && <p className="text-xs text-blue-700 font-medium mt-1">Dx: {v.diagnosis}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(v.visitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-gray-400 text-lg">{expanded[v.visitId] ? '▲' : '▼'}</div>
                </div>
                {expanded[v.visitId] && (
                  <div className="px-4 pb-4 border-t border-gray-100 mt-0">
                    {v.chiefComplaint && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-500">Chief Complaint</p>
                        <p className="text-sm text-gray-800">{v.chiefComplaint}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {v.bloodPressure && <Vital label="BP" value={v.bloodPressure} />}
                      {v.pulseRate && <Vital label="Pulse" value={`${v.pulseRate} bpm`} />}
                      {v.temperature && <Vital label="Temp" value={`${v.temperature}°F`} />}
                    </div>
                    {v.advice && (
                      <div className="mt-3 bg-green-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-green-700">Advice</p>
                        <p className="text-sm text-green-800">{v.advice}</p>
                      </div>
                    )}
                    {v.followUpDate && (
                      <p className="text-xs text-orange-600 mt-2">Follow-up: {v.followUpDate}</p>
                    )}
                  </div>
                )}
              </div>
            ))
          )
        )}

        {/* Labs */}
        {activeTab === TAB_LABS && (
          labs.length === 0 ? (
            <Empty text="No lab orders found." />
          ) : (
            labs.map(lab => (
              <div key={lab.orderId} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-bold text-gray-800">{lab.orderNumber}</span>
                      {lab.isAbnormal && (
                        <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium">Abnormal</span>
                      )}
                      <HospitalBadge name={lab.hospitalName} />
                    </div>
                    <p className="text-xs text-gray-500">Dr. {lab.doctorName}</p>
                    {lab.testNames.length > 0 && (
                      <p className="text-xs text-purple-700 font-medium mt-1">
                        {lab.testNames.join(', ')}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        lab.status === 'ResultAvailable' || lab.status === 'Reported'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>{lab.status}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(lab.orderedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )
        )}

        {/* Admissions */}
        {activeTab === TAB_ADMISSIONS && (
          admissions.length === 0 ? (
            <Empty text="No IPD admissions found." />
          ) : (
            admissions.map(adm => (
              <div key={adm.admissionId} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div
                  className="p-4 cursor-pointer flex justify-between items-start"
                  onClick={() => toggle(adm.admissionId)}>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-bold text-gray-800">{adm.ipdNumber}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        adm.status === 'Discharged' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>{adm.status}</span>
                      <HospitalBadge name={adm.hospitalName} />
                    </div>
                    <p className="text-xs text-gray-500">Dr. {adm.doctorName}</p>
                    {adm.admissionDiagnosis && (
                      <p className="text-xs text-blue-700 font-medium mt-1">Dx: {adm.admissionDiagnosis}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Admitted: {new Date(adm.admissionDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {adm.dischargeDate && ` · Discharged: ${new Date(adm.dischargeDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                    </p>
                  </div>
                  <div className="text-gray-400 text-lg">{expanded[adm.admissionId] ? '▲' : '▼'}</div>
                </div>
                {expanded[adm.admissionId] && adm.dischargeSummary && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mt-3">Discharge Summary</p>
                    <p className="text-sm text-gray-700 mt-1">{adm.dischargeSummary}</p>
                    {adm.finalDiagnosis && (
                      <p className="text-xs text-blue-700 mt-2">Final Diagnosis: {adm.finalDiagnosis}</p>
                    )}
                  </div>
                )}
              </div>
            ))
          )
        )}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2">
        <div className="flex justify-around">
          {[
            { icon: '📋', label: 'Records',   path: '/health-records' },
            { icon: '📂', label: 'Documents', path: '/documents' },
            { icon: '👤', label: 'Profile',   path: '/profile' },
          ].map(item => (
            <Link key={item.path} to={item.path}
              className={`flex flex-col items-center text-xs gap-0.5 ${
                window.location.pathname === item.path ? 'text-blue-600' : 'text-gray-400'
              }`}>
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function Empty({ text }) {
  return (
    <div className="text-center py-12 text-gray-400">
      <div className="text-4xl mb-2">📭</div>
      <p className="text-sm">{text}</p>
    </div>
  )
}

function Vital({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-lg p-2 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-800">{value}</p>
    </div>
  )
}
