import { useState, useEffect } from 'react'
import { appointmentService } from '../../services/appointmentService'
import { patientService } from '../../services/patientService'
import { aiService } from '../../services/aiService'

export default function OPD() {
  const [queue, setQueue] = useState([])
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')

  const [vitals, setVitals] = useState({
    bloodPressure: '', pulseRate: '', temperature: '',
    spO2: '', weightKg: '', heightCm: '', bloodGlucose: ''
  })

  const [consultation, setConsultation] = useState({
    chiefComplaint: '', historyOfPresentIllness: '',
    clinicalFindings: '', diagnosis: '',
    advice: '', followUpDate: ''
  })

  const [prescription, setPrescription] = useState([])
  const [newMed, setNewMed] = useState({
    medicineName: '', dosage: '', frequency: '',
    duration: '', instructions: '', quantity: 1
  })

  useEffect(() => { loadQueue() }, [])

  const loadQueue = async () => {
    setLoading(true)
    try {
      const res = await appointmentService.getToday()
      if (res.success) setQueue(res.data)
    } catch(e) {}
    finally { setLoading(false) }
  }

 const selectAppointment = async (apt) => {
    setSelectedAppointment(apt)
    setPatient(null)
    setAiSuggestions(null)
    setPrescription([])
    setVitals({ bloodPressure: '', pulseRate: '', temperature: '',
      spO2: '', weightKg: '', heightCm: '', bloodGlucose: '' })
    setConsultation({ chiefComplaint: apt.chiefComplaint || '',
      historyOfPresentIllness: '', clinicalFindings: '',
      diagnosis: '', advice: '', followUpDate: '' })
   try {
      const res = await patientService.getById(apt.patientId)
      console.log('Patient response:', res)
      if (res.success) setPatient(res.data)
    } catch(e) { console.error('Patient load error:', e) }
    await appointmentService.updateStatus(apt.id, 2)
    loadQueue()
  }

  const getAISuggestions = async () => {
    if (!consultation.diagnosis && !consultation.chiefComplaint) {
      alert('Please enter diagnosis or chief complaint first')
      return
    }
    if (!patient) {
      alert('Patient data not loaded yet. Please wait.')
      return
    }
    setAiLoading(true)
    setAiSuggestions(null)
    try {
      const result = await aiService.getMedicineSuggestions(
        patient,
        consultation.diagnosis || consultation.chiefComplaint,
        patient?.currentMedications
      )
      setAiSuggestions(result)
    } catch(e) {
      console.error(e)
      alert('AI suggestion failed. Please try again.')
    }
    finally { setAiLoading(false) }
  }

  const addMedicineFromAI = (med) => {
    setPrescription(prev => [...prev, {
      medicineName: `${med.medicineName} ${med.dosage}`,
      genericName: med.genericName,
      dosage: med.dosage,
      frequency: med.frequency,
      duration: med.duration,
      instructions: med.instructions,
      quantity: 1,
      isSubstitutionAllowed: true
    }])
  }

  const addManualMedicine = () => {
    if (!newMed.medicineName) return
    setPrescription(prev => [...prev, { ...newMed }])
    setNewMed({ medicineName: '', dosage: '', frequency: '',
      duration: '', instructions: '', quantity: 1 })
  }

  const removeMedicine = (index) => {
    setPrescription(prev => prev.filter((_, i) => i !== index))
  }

  const v = (k, val) => setVitals(p => ({ ...p, [k]: val }))
  const c = (k, val) => setConsultation(p => ({ ...p, [k]: val }))
  const statusColors = {
    Scheduled: 'bg-blue-100 text-blue-700',
    Confirmed: 'bg-purple-100 text-purple-700',
    InProgress: 'bg-amber-100 text-amber-700',
    Completed: 'bg-emerald-100 text-emerald-700',
    Cancelled: 'bg-red-100 text-red-700',
  }

  return (
    <div className="flex h-full gap-4" style={{height: 'calc(100vh - 100px)'}}>

      {/* Left — Queue */}
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
              onClick={() => selectAppointment(apt)}
              className={`p-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${selectedAppointment?.id === apt.id ? 'bg-emerald-50 border-l-4 border-l-emerald-500' : ''}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-emerald-600">{apt.tokenNumber}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusColors[apt.status] || 'bg-gray-100 text-gray-600'}`}>
                  {apt.status}
                </span>
              </div>
              <div className="text-sm font-medium text-gray-900">{apt.patientName}</div>
              <div className="text-xs text-gray-500">{apt.patientAge}y · {apt.patientGender}</div>
              {apt.chiefComplaint && (
                <div className="text-xs text-gray-400 mt-0.5 truncate">{apt.chiefComplaint}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right — Consultation */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {!selectedAppointment ? (
          <div className="flex flex-col items-center justify-center h-full bg-white rounded-xl border border-gray-100">
            <div className="text-5xl mb-3">🏥</div>
            <div className="text-gray-500 font-medium">Select a patient from the queue</div>
            <div className="text-gray-400 text-sm mt-1">Click on any patient to start consultation</div>
          </div>
        ) : (
          <>
            {/* Patient Header */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                    {selectedAppointment.patientName.split(' ').map(n=>n[0]).join('').slice(0,2)}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{selectedAppointment.patientName}</div>
                    <div className="text-sm text-gray-500">
                      {selectedAppointment.patientUHID} · {selectedAppointment.patientAge}y · {selectedAppointment.patientGender}
                      {patient?.bloodGroup && ` · ${patient.bloodGroup.replace('Positive','+').replace('Negative','-')}`}
                    </div>
                    {patient?.knownAllergies && patient.knownAllergies !== 'None' && (
                      <div className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full inline-block mt-1">
                        ⚠️ Allergies: {patient.knownAllergies}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-700">{selectedAppointment.doctorName}</div>
                  <div className="text-xs text-gray-500">{selectedAppointment.departmentName}</div>
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    Token: {selectedAppointment.tokenNumber}
                  </span>
                </div>
              </div>
            </div>

            {/* Vitals */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Vitals</h4>
              <div className="grid grid-cols-4 gap-3">
                {[
                  ['bloodPressure', 'Blood Pressure', 'mmHg', 'e.g. 120/80'],
                  ['pulseRate', 'Pulse Rate', 'bpm', 'e.g. 72'],
                  ['temperature', 'Temperature', '°F', 'e.g. 98.6'],
                  ['spO2', 'SpO2', '%', 'e.g. 98'],
                  ['weightKg', 'Weight', 'kg', 'e.g. 70'],
                  ['heightCm', 'Height', 'cm', 'e.g. 170'],
                  ['bloodGlucose', 'Blood Glucose', 'mg/dL', 'e.g. 110'],
                ].map(([key, label, unit, placeholder]) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-500 mb-1">{label} <span className="text-gray-400">({unit})</span></label>
                    <input value={vitals[key]} onChange={e => v(key, e.target.value)}
                      placeholder={placeholder}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                ))}
              </div>
            </div>
            {/* Consultation Notes */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Consultation Notes</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Chief Complaint</label>
                  <input value={consultation.chiefComplaint}
                    onChange={e => c('chiefComplaint', e.target.value)}
                    placeholder="e.g. Chest pain, Fever, Headache"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">History of Present Illness</label>
                  <textarea value={consultation.historyOfPresentIllness}
                    onChange={e => c('historyOfPresentIllness', e.target.value)}
                    rows={2} placeholder="Describe the history..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Clinical Findings</label>
                  <textarea value={consultation.clinicalFindings}
                    onChange={e => c('clinicalFindings', e.target.value)}
                    rows={2} placeholder="On examination..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Diagnosis *</label>
                  <input value={consultation.diagnosis}
                    onChange={e => c('diagnosis', e.target.value)}
                    placeholder="e.g. Hypertension, Type 2 Diabetes"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
            </div>

            {/* AI Suggestions */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700">🤖 ArogyaOS AI Suggestions</h4>
                  <p className="text-xs text-gray-400 mt-0.5">AI-powered medicine suggestions based on patient profile</p>
                </div>
                <button onClick={getAISuggestions} disabled={aiLoading}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center gap-2">
                  {aiLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Analyzing...
                    </>
                  ) : '✨ Get AI Suggestions'}
                </button>
              </div>

              {aiSuggestions && (
                <div className="space-y-3">
                  {/* Alerts */}
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

                  {/* Clinical Note */}
                  {aiSuggestions.clinicalNote && (
                    <div className="bg-purple-50 border border-purple-200 px-3 py-2 rounded-lg text-sm text-purple-700">
                      <span className="font-medium">AI Note: </span>{aiSuggestions.clinicalNote}
                    </div>
                  )}

                  {/* Medicine Suggestions */}
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
            {/* Prescription */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Prescription</h4>

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
                      <button onClick={() => removeMedicine(i)}
                        className="text-red-400 hover:text-red-600 text-lg">✕</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add medicine manually */}
              <div className="border border-dashed border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-2 font-medium">Add Medicine Manually</p>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <input value={newMed.medicineName}
                    onChange={e => setNewMed(p => ({...p, medicineName: e.target.value}))}
                    placeholder="Medicine name"
                    className="col-span-2 px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  <input value={newMed.dosage}
                    onChange={e => setNewMed(p => ({...p, dosage: e.target.value}))}
                    placeholder="Dosage e.g. 500mg"
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <input value={newMed.frequency}
                    onChange={e => setNewMed(p => ({...p, frequency: e.target.value}))}
                    placeholder="Frequency 1-0-1"
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  <input value={newMed.duration}
                    onChange={e => setNewMed(p => ({...p, duration: e.target.value}))}
                    placeholder="Duration 5 days"
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  <input value={newMed.instructions}
                    onChange={e => setNewMed(p => ({...p, instructions: e.target.value}))}
                    placeholder="After food"
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  <button onClick={addManualMedicine}
                    className="bg-gray-700 hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                    + Add
                  </button>
                </div>
              </div>
            </div>

            {/* Advice & Follow up */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Advice & Follow Up</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Advice / Instructions</label>
                  <textarea value={consultation.advice}
                    onChange={e => c('advice', e.target.value)}
                    rows={3} placeholder="Diet advice, rest, lifestyle changes..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Follow Up Date</label>
                  <input type="date" value={consultation.followUpDate}
                    onChange={e => c('followUpDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
            </div>

            {/* Save Button */}
            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">
                {success}
              </div>
            )}
            <div className="flex gap-3 pb-4">
              <button
                onClick={async () => {
                  setSaving(true)
                  try {
                    await appointmentService.updateStatus(selectedAppointment.id, 3)
                    setSuccess('Consultation saved successfully!')
                    setSelectedAppointment(null)
                    setPatient(null)
                    loadQueue()
                  } catch(e) {}
                  finally { setSaving(false) }
                }}
                disabled={saving}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl font-semibold disabled:opacity-50">
                {saving ? 'Saving...' : '✅ Save & Complete Consultation'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}