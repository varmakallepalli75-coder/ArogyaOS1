import { useState, useEffect } from 'react'
import { departmentService } from '../../services/departmentService'

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Doctors() {
  const [doctors, setDoctors] = useState([])
  const [departments, setDepartments] = useState([])
  const [selectedDept, setSelectedDept] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showDeptForm, setShowDeptForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [deptForm, setDeptForm] = useState({ code: '', name: '', location: '' })

  const emptyForm = {
    firstName: '', lastName: '', qualification: '', specialization: '',
    registrationNumber: '', experienceYears: 0, mobileNumber: '',
    email: '', departmentId: '', consultationFee: 0, followUpFee: 0, employmentType: 0
  }
  const [form, setForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)

  const defaultSched = [1,2,3,4,5].map(d => ({
    dayOfWeek: d, enabled: true, startTime: '09:00',
    endTime: '13:00', slotDurationMinutes: 15, maxPatients: 20
  }))
  const [editSchedules, setEditSchedules] = useState(defaultSched)

  useEffect(() => { loadData() }, [])
  useEffect(() => { loadDoctors() }, [selectedDept])

  const loadData = async () => {
    try {
      const res = await departmentService.getAll()
      if (res.success) setDepartments(res.data)
    } catch(e) {}
    loadDoctors()
  }

  const loadDoctors = async () => {
    setLoading(true)
    try {
      const res = await departmentService.getDoctors(selectedDept || null)
      if (res.success) setDoctors(res.data)
    } catch(e) {}
    finally { setLoading(false) }
  }

  const handleCreateDept = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await departmentService.create(deptForm)
      if (res.success) {
        setSuccess('Department created!')
        setShowDeptForm(false)
        setDeptForm({ code: '', name: '', location: '' })
        loadData()
      } else setError(res.message)
    } catch(e) { setError('Something went wrong.') }
    finally { setSaving(false) }
  }
  const buildPayload = (f, s) => ({
    ...f,
    schedules: s.filter(x => x.enabled).map(x => ({
      dayOfWeek: x.dayOfWeek, startTime: x.startTime, endTime: x.endTime,
      slotDurationMinutes: x.slotDurationMinutes, maxPatients: x.maxPatients
    }))
  })

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      // Quick-add: no schedule at creation — the admin sets working hours later via Edit.
      const res = await departmentService.createDoctor(buildPayload(form, []))
      if (res.success) {
        setSuccess('Doctor added successfully!')
        setShowForm(false)
        setForm(emptyForm)
        loadDoctors()
      } else setError(res.message)
    } catch(e) { setError('Something went wrong.') }
    finally { setSaving(false) }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await departmentService.updateDoctor(
        selectedDoctor.id, buildPayload(editForm, editSchedules))
      if (res.success) {
        setSuccess('Doctor updated successfully!')
        setShowEditForm(false)
        loadDoctors()
      } else setError(res.message)
    } catch(e) { setError('Something went wrong.') }
    finally { setSaving(false) }
  }

  const openEdit = (doc) => {
    const parts = doc.fullName.replace('Dr. ', '').split(' ')
    setEditForm({
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || '',
      qualification: doc.qualification,
      specialization: doc.specialization,
      registrationNumber: '',
      experienceYears: 0,
      mobileNumber: doc.mobileNumber,
      email: '',
      departmentId: doc.departmentId || '',
      consultationFee: doc.consultationFee,
      followUpFee: 0,
      employmentType: 0
    })
    setEditSchedules([...defaultSched])
    setSelectedDoctor(doc)
    setShowEditForm(true)
    setError('')
  }

  const toggleAvail = async (doc) => {
    try {
      await departmentService.updateAvailability(doc.id, !doc.isAvailable)
      loadDoctors()
    } catch(e) {}
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const ef = (k, v) => setEditForm(p => ({ ...p, [k]: v }))
  const SchedEditor = ({ list, set }) => (
    <div className="space-y-2">
      {list.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <input type="checkbox" checked={s.enabled}
            className="w-4 h-4 accent-emerald-600"
            onChange={e => set(p => p.map((x, j) => j === i ? {...x, enabled: e.target.checked} : x))} />
          <span className="text-sm w-10 font-medium text-gray-700">{days[s.dayOfWeek]}</span>
          <input type="time" value={s.startTime} disabled={!s.enabled}
            className="px-2 py-1 border border-gray-200 rounded text-sm disabled:opacity-40"
            onChange={e => set(p => p.map((x, j) => j === i ? {...x, startTime: e.target.value} : x))} />
          <span className="text-gray-400 text-xs">to</span>
          <input type="time" value={s.endTime} disabled={!s.enabled}
            className="px-2 py-1 border border-gray-200 rounded text-sm disabled:opacity-40"
            onChange={e => set(p => p.map((x, j) => j === i ? {...x, endTime: e.target.value} : x))} />
          <span className="text-xs text-gray-500">Max:</span>
          <input type="number" value={s.maxPatients} disabled={!s.enabled}
            className="w-14 px-2 py-1 border border-gray-200 rounded text-sm disabled:opacity-40"
            onChange={e => set(p => p.map((x, j) => j === i ? {...x, maxPatients: parseInt(e.target.value) || 20} : x))} />
        </div>
      ))}
    </div>
  )

  const DoctorFields = ({ d, on, minimal = false }) => (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">First Name *</label>
        <input required value={d.firstName} onChange={e => on('firstName', e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Last Name *</label>
        <input required value={d.lastName} onChange={e => on('lastName', e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Mobile *</label>
        <input required value={d.mobileNumber} onChange={e => on('mobileNumber', e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Department *</label>
        <select required value={d.departmentId} onChange={e => on('departmentId', e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="">Select department</option>
          {departments.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Consultation Fee (Rs)</label>
        <input type="number" value={d.consultationFee}
          onChange={e => on('consultationFee', parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      </div>

      {!minimal && <>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Qualification</label>
          <input value={d.qualification} onChange={e => on('qualification', e.target.value)}
            placeholder="e.g. MBBS, MD"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Specialization</label>
          <input value={d.specialization} onChange={e => on('specialization', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Registration No.</label>
          <input value={d.registrationNumber} onChange={e => on('registrationNumber', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Experience (years)</label>
          <input type="number" value={d.experienceYears}
            onChange={e => on('experienceYears', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
          <input type="email" value={d.email} onChange={e => on('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
      </>}
    </div>
  )
  const overlay = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 50, padding: '1rem'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Doctors</h2>
          <p className="text-sm text-gray-500">{doctors.length} doctors registered</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowDeptForm(true); setError('') }}
            className="border border-emerald-600 text-emerald-600 hover:bg-emerald-50 px-4 py-2 rounded-xl text-sm font-semibold">
            + Add Department
          </button>
          <button onClick={() => { setShowForm(true); setError('') }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold">
            + Add Doctor
          </button>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">
          {success}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setSelectedDept('')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium ${selectedDept === '' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
          All Departments
        </button>
        {departments.map(d => (
          <button key={d.id} onClick={() => setSelectedDept(d.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium ${selectedDept === d.id ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {d.name} ({d.doctorCount})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading...</div>
      ) : doctors.length === 0 ? (
        <div className="flex flex-col items-center py-20 bg-white rounded-xl border border-gray-100">
          <div className="text-4xl mb-2">👨‍⚕️</div>
          <div className="text-gray-500">No doctors found</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map(doc => (
            <div key={doc.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                    {doc.fullName.replace('Dr. ', '').split(' ').map(n => n[0]).join('').slice(0,2)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{doc.fullName}</div>
                    {doc.qualification
                      ? <div className="text-xs text-gray-500">{doc.qualification}</div>
                      : <div className="text-xs text-amber-600">Details incomplete</div>}
                  </div>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <button onClick={() => openEdit(doc)}
                    className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200">
                    Edit
                  </button>
                  <button onClick={() => toggleAvail(doc)}
                    className={`text-xs px-2 py-0.5 rounded-full ${doc.isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {doc.isAvailable ? 'Available' : 'Unavailable'}
                  </button>
                </div>
              </div>
              <div className="flex gap-2 mb-2 flex-wrap">
                {doc.specialization && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{doc.specialization}</span>}
                {doc.departmentName && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{doc.departmentName}</span>}
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>📞 {doc.mobileNumber}</span>
                <span className="font-semibold text-emerald-600">Rs {doc.consultationFee}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDeptForm && (
        <div style={overlay}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Add Department</h3>
              <button onClick={() => setShowDeptForm(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <form onSubmit={handleCreateDept} className="space-y-3">
              {error && <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</div>}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Code *</label>
                <input required placeholder="e.g. CARD" value={deptForm.code}
                  onChange={e => setDeptForm(p => ({...p, code: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                <input required placeholder="e.g. Cardiology" value={deptForm.name}
                  onChange={e => setDeptForm(p => ({...p, name: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
                <input placeholder="e.g. Block A, Floor 2" value={deptForm.location}
                  onChange={e => setDeptForm(p => ({...p, location: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowDeptForm(false)}
                  className="flex-1 border border-gray-200 rounded-xl py-2 text-sm">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-emerald-600 text-white rounded-xl py-2 text-sm font-semibold disabled:opacity-50">
                  {saving ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showForm && (
        <div style={overlay}>
          <div className="bg-white rounded-2xl w-full max-w-3xl" style={{maxHeight: '90vh', overflowY: 'auto'}}>
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold">Add Doctor</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-5">
              {error && <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</div>}
              <DoctorFields d={form} on={f} minimal />
              <p className="text-xs text-gray-500">
                Just the basics to get started. Qualification, registration number, working
                hours and fees can be added later from the doctor’s <span className="font-medium">Edit</span> screen.
              </p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-emerald-600 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50">
                  {saving ? 'Adding...' : 'Add Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditForm && editForm && (
        <div style={overlay}>
          <div className="bg-white rounded-2xl w-full max-w-3xl" style={{maxHeight: '90vh', overflowY: 'auto'}}>
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold">Edit — {selectedDoctor?.fullName}</h3>
              <button onClick={() => setShowEditForm(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-5">
              {error && <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</div>}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-100">Doctor Information</h4>
                <DoctorFields d={editForm} on={ef} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-100">Working Schedule</h4>
                <SchedEditor list={editSchedules} set={setEditSchedules} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowEditForm(false)}
                  className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-emerald-600 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}