import { useState, useEffect } from 'react'
import { appointmentService } from '../../services/appointmentService'
import { patientService } from '../../services/patientService'
import { departmentService } from '../../services/departmentService'

const statusColors = {
  Scheduled: 'bg-blue-100 text-blue-700',
  Confirmed: 'bg-purple-100 text-purple-700',
  InProgress: 'bg-amber-100 text-amber-700',
  Completed: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-red-100 text-red-700',
  NoShow: 'bg-gray-100 text-gray-600'
}

const statusOptions = [
  { value: 0, label: 'Scheduled' },
  { value: 1, label: 'Confirmed' },
  { value: 2, label: 'In Progress' },
  { value: 3, label: 'Completed' },
  { value: 4, label: 'Cancelled' },
  { value: 5, label: 'No Show' }
]

export default function Appointments() {
  const [appointments, setAppointments] = useState([])
  const [todayAppointments, setTodayAppointments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [departments, setDepartments] = useState([])
  const [patientSearch, setPatientSearch] = useState('')
  const [patientResults, setPatientResults] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('today')
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  const [form, setForm] = useState({
    patientId: '',
    doctorId: '',
    departmentId: '',
    appointmentDateTime: '',
    consultationType: 0,
    priority: 1,
    chiefComplaint: '',
    isWalkIn: false
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (activeTab === 'today') loadToday()
    else loadAll()
  }, [activeTab, selectedDate])

  useEffect(() => {
    if (patientSearch.length >= 3) searchPatients()
    else setPatientResults([])
  }, [patientSearch])

  const loadData = async () => {
    try {
      const [deptRes, docRes] = await Promise.all([
        departmentService.getAll(),
        departmentService.getDoctors(null)
      ])
      if (deptRes.success) setDepartments(deptRes.data)
      if (docRes.success) setDoctors(docRes.data)
    } catch(e) {}
    loadToday()
  }

  const loadToday = async () => {
    setLoading(true)
    try {
      const res = await appointmentService.getToday()
      if (res.success) setTodayAppointments(res.data)
    } catch(e) {}
    finally { setLoading(false) }
  }

  const loadAll = async () => {
    setLoading(true)
    try {
      const res = await appointmentService.getAll(selectedDate)
      if (res.success) setAppointments(res.data.items)
    } catch(e) {}
    finally { setLoading(false) }
  }

  const searchPatients = async () => {
    try {
      const res = await patientService.search(patientSearch)
      if (res.success) setPatientResults(res.data)
    } catch(e) {}
  }

  const selectPatient = (patient) => {
    setSelectedPatient(patient)
    setForm(p => ({ ...p, patientId: patient.id }))
    setPatientSearch(patient.fullName)
    setPatientResults([])
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await appointmentService.create(form)
      if (res.success) {
        setSuccess(`Appointment booked! Token: ${res.data.tokenNumber}`)
        setShowForm(false)
        setForm({
          patientId: '', doctorId: '', departmentId: '',
          appointmentDateTime: '', consultationType: 0,
          priority: 1, chiefComplaint: '', isWalkIn: false
        })
        setSelectedPatient(null)
        setPatientSearch('')
        loadToday()
      } else setError(res.message)
    } catch(e) { setError('Something went wrong.') }
    finally { setSaving(false) }
  }

  const updateStatus = async (id, status) => {
    try {
      await appointmentService.updateStatus(id, status)
      loadToday()
      loadAll()
    } catch(e) {}
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const overlay = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 50, padding: '1rem'
  }

  const getStatusColor = (status) => statusColors[status] || 'bg-gray-100 text-gray-600'

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Appointments</h2>
          <p className="text-sm text-gray-500">
            {todayAppointments.length} appointments today
          </p>
        </div>
        <button onClick={() => { setShowForm(true); setError('') }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold">
          + Book Appointment
        </button>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200">
        <button onClick={() => setActiveTab('today')}
          className={`px-6 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === 'today' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          Today's Queue
        </button>
        <button onClick={() => setActiveTab('all')}
          className={`px-6 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === 'all' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          All Appointments
        </button>
      </div>

      {/* Date filter for All tab */}
      {activeTab === 'all' && (
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600 font-medium">Date:</label>
          <input type="date" value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
      )}

      {/* Today's Queue */}
      {activeTab === 'today' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-20 text-gray-400">Loading...</div>
          ) : todayAppointments.length === 0 ? (
            <div className="flex flex-col items-center py-20">
              <div className="text-4xl mb-2">📅</div>
              <div className="text-gray-500 font-medium">No appointments today</div>
              <div className="text-gray-400 text-sm mt-1">Book the first appointment</div>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Token</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Patient</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Doctor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Time</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Complaint</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {todayAppointments.map(apt => (
                  <tr key={apt.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold text-emerald-600">{apt.tokenNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{apt.patientName}</div>
                      <div className="text-xs text-gray-500">{apt.patientUHID} · {apt.patientAge}y {apt.patientGender}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-700">{apt.doctorName}</div>
                      <div className="text-xs text-gray-500">{apt.departmentName}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(apt.appointmentDateTime).toLocaleTimeString('en-IN', {
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {apt.chiefComplaint || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(apt.status)}`}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value=""
                        onChange={e => updateStatus(apt.id, parseInt(e.target.value))}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500">
                        <option value="">Update</option>
                        {statusOptions.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* All Appointments */}
      {activeTab === 'all' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-20 text-gray-400">Loading...</div>
          ) : appointments.length === 0 ? (
            <div className="flex flex-col items-center py-20">
              <div className="text-4xl mb-2">📅</div>
              <div className="text-gray-500">No appointments found</div>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Apt No.</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Patient</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Doctor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date & Time</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {appointments.map(apt => (
                  <tr key={apt.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-emerald-600">
                      {apt.appointmentNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{apt.patientName}</div>
                      <div className="text-xs text-gray-500">{apt.patientUHID}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-700">{apt.doctorName}</div>
                      <div className="text-xs text-gray-500">{apt.departmentName}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(apt.appointmentDateTime).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(apt.status)}`}>
                        {apt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      {/* Book Appointment Modal */}
      {showForm && (
        <div style={overlay}>
          <div className="bg-white rounded-2xl w-full max-w-2xl" style={{maxHeight: '90vh', overflowY: 'auto'}}>
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Book Appointment</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Patient Search */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Search Patient *
                </label>
                <div className="relative">
                  <input
                    value={patientSearch}
                    onChange={e => {
                      setPatientSearch(e.target.value)
                      if (!e.target.value) {
                        setSelectedPatient(null)
                        setForm(p => ({ ...p, patientId: '' }))
                      }
                    }}
                    placeholder="Type name, mobile or UHID..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  {patientResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1">
                      {patientResults.map(p => (
                        <div key={p.id} onClick={() => selectPatient(p)}
                          className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0">
                          <div className="text-sm font-medium text-gray-900">{p.fullName}</div>
                          <div className="text-xs text-gray-500">{p.uhid} · {p.mobileNumber} · {p.age}y {p.gender}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {selectedPatient && (
                  <div className="mt-2 flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                      {selectedPatient.fullName.split(' ').map(n => n[0]).join('').slice(0,2)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-emerald-800">{selectedPatient.fullName}</div>
                      <div className="text-xs text-emerald-600">{selectedPatient.uhid} · {selectedPatient.age}y</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Department */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Department *</label>
                  <select required value={form.departmentId}
                    onChange={e => f('departmentId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">Select department</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                {/* Doctor */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Doctor *</label>
                  <select required value={form.doctorId}
                    onChange={e => f('doctorId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">Select doctor</option>
                    {doctors
  .filter(d => !form.departmentId || d.departmentId === form.departmentId)
  .map(d => (
                        <option key={d.id} value={d.id}>
                          {d.fullName} — Rs {d.consultationFee}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Date & Time */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Date & Time *</label>
                  <input required type="datetime-local" value={form.appointmentDateTime}
                    onChange={e => f('appointmentDateTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>

                {/* Consultation Type */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                  <select value={form.consultationType}
                    onChange={e => f('consultationType', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value={0}>General</option>
                    <option value={1}>Specialist</option>
                    <option value={2}>Emergency</option>
                    <option value={4}>Follow Up</option>
                  </select>
                </div>

                {/* Chief Complaint */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Chief Complaint</label>
                  <input value={form.chiefComplaint}
                    onChange={e => f('chiefComplaint', e.target.value)}
                    placeholder="e.g. Chest pain, Fever, Headache"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>

                {/* Walk In */}
                <div className="col-span-2 flex items-center gap-2">
                  <input type="checkbox" id="walkin" checked={form.isWalkIn}
                    onChange={e => f('isWalkIn', e.target.checked)}
                    className="w-4 h-4 accent-emerald-600" />
                  <label htmlFor="walkin" className="text-sm text-gray-600">
                    Walk-in patient (no prior appointment)
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600">
                  Cancel
                </button>
                <button type="submit" disabled={saving || !form.patientId}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50">
                  {saving ? 'Booking...' : 'Book Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}