import { useState, useEffect, useCallback } from 'react'
import { staffService } from '../../services/staffService'
import api from '../../services/api'

const ROLES = [
  { value: 1, label: 'Hospital Admin' },
  { value: 2, label: 'Doctor' },
  { value: 3, label: 'Nurse' },
  { value: 4, label: 'Receptionist' },
  { value: 5, label: 'Billing Staff' },
  { value: 6, label: 'Pharmacist' },
  { value: 7, label: 'Lab Technician' },
  { value: 8, label: 'Radiology Staff' },
  { value: 9, label: 'Other' },
]

const ROLE_COLORS = {
  Doctor: 'bg-blue-100 text-blue-700',
  Nurse: 'bg-pink-100 text-pink-700',
  Receptionist: 'bg-amber-100 text-amber-700',
  Billing: 'bg-purple-100 text-purple-700',
  Pharmacy: 'bg-emerald-100 text-emerald-700',
  Lab: 'bg-cyan-100 text-cyan-700',
  HospitalAdmin: 'bg-indigo-100 text-indigo-700',
}

const ROLE_DEFAULTS = {
  1: { permPatients:true,  permAppointments:true,  permOPD:true,  permIPD:true,  permLab:true,  permPharmacy:true,  permBilling:true,  permReports:true,  permStaff:true  },
  2: { permPatients:true,  permAppointments:true,  permOPD:true,  permIPD:true,  permLab:true,  permPharmacy:true,  permBilling:false, permReports:false, permStaff:false },
  3: { permPatients:true,  permAppointments:false, permOPD:false, permIPD:true,  permLab:false, permPharmacy:false, permBilling:false, permReports:false, permStaff:false },
  4: { permPatients:true,  permAppointments:true,  permOPD:true,  permIPD:false, permLab:false, permPharmacy:false, permBilling:true,  permReports:false, permStaff:false },
  5: { permPatients:true,  permAppointments:false, permOPD:false, permIPD:false, permLab:false, permPharmacy:false, permBilling:true,  permReports:false, permStaff:false },
  6: { permPatients:true,  permAppointments:false, permOPD:false, permIPD:false, permLab:false, permPharmacy:true,  permBilling:false, permReports:false, permStaff:false },
  7: { permPatients:true,  permAppointments:false, permOPD:false, permIPD:false, permLab:true,  permPharmacy:false, permBilling:false, permReports:false, permStaff:false },
  8: { permPatients:true,  permAppointments:false, permOPD:false, permIPD:false, permLab:false, permPharmacy:false, permBilling:false, permReports:false, permStaff:false },
  9: { permPatients:false, permAppointments:false, permOPD:false, permIPD:false, permLab:false, permPharmacy:false, permBilling:false, permReports:false, permStaff:false },
}

const PERM_LABELS = [
  { key: 'permPatients',     label: 'Patients',      icon: '👤' },
  { key: 'permAppointments', label: 'Appointments',  icon: '📅' },
  { key: 'permOPD',          label: 'OPD',           icon: '🏥' },
  { key: 'permIPD',          label: 'IPD & Beds',    icon: '🛏' },
  { key: 'permLab',          label: 'Laboratory',    icon: '🔬' },
  { key: 'permPharmacy',     label: 'Pharmacy',      icon: '💊' },
  { key: 'permBilling',      label: 'Billing',       icon: '🧾' },
  { key: 'permReports',      label: 'Reports',       icon: '📊' },
  { key: 'permStaff',        label: 'Staff Mgmt',    icon: '👥' },
]

const blankForm = () => ({
  firstName: '', lastName: '', email: '', phone: '',
  password: '', role: 4, designation: '',
  isExternal: false,
  permissions: { ...ROLE_DEFAULTS[4] },
  // Doctor-specific
  departmentId: '', qualification: '', specialization: '',
  registrationNumber: '', consultationFee: '', experienceYears: '',
})

export default function Staff() {
  const [staff, setStaff] = useState([])
  const [departments, setDepartments] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const [showAdd, setShowAdd] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [showPerms, setShowPerms] = useState(false)
  const [showReset, setShowReset] = useState(false)

  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(blankForm())
  const [permsForm, setPermsForm] = useState({})
  const [newPassword, setNewPassword] = useState('')
  const [resetError, setResetError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await staffService.getAll(search)
      if (res.success) setStaff(res.data)
    } catch { setError('Failed to load staff') }
    finally { setLoading(false) }
  }, [search])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    api.get('/department').then(r => {
      if (r.data.success) setDepartments(r.data.data || [])
    }).catch(() => {})
  }, [])

  const openDetail = async (id) => {
    try {
      const res = await staffService.getById(id)
      if (res.success) { setSelected(res.data); setShowDetail(true) }
    } catch { setError('Failed to load staff details') }
  }

  const handleRoleChange = (roleVal) => {
    const perms = ROLE_DEFAULTS[roleVal] || ROLE_DEFAULTS[9]
    setForm(f => ({ ...f, role: roleVal, permissions: { ...perms } }))
  }

  const togglePerm = (key) => setForm(f => ({
    ...f, permissions: { ...f.permissions, [key]: !f.permissions[key] }
  }))

  const submitCreate = async () => {
    setFormError('')
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setFormError('First name, last name, email and password are required'); return
    }
    if (form.role === 2) {
      if (!form.departmentId) { setFormError('Department is required for doctors'); return }
      if (!form.qualification) { setFormError('Qualification is required for doctors'); return }
      if (!form.specialization) { setFormError('Specialization is required for doctors'); return }
      if (!form.registrationNumber) { setFormError('Registration number is required for doctors'); return }
    }
    setSaving(true)
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || null,
        password: form.password,
        role: form.role,
        designation: form.designation || null,
        isExternal: form.isExternal,
        permissions: form.permissions,
      }
      if (form.role === 2) {
        payload.departmentId = form.departmentId
        payload.qualification = form.qualification
        payload.specialization = form.specialization
        payload.registrationNumber = form.registrationNumber
        payload.consultationFee = parseFloat(form.consultationFee) || 0
        payload.experienceYears = parseInt(form.experienceYears) || 0
      }
      const res = await staffService.create(payload)
      if (res.success) { setShowAdd(false); setFormError(''); setForm(blankForm()); load() }
      else setFormError(res.errors?.length ? res.errors.join(' ') : (res.message || 'Failed to create staff'))
    } catch (e) {
      const msg = e.response?.data?.errors
        ? Object.values(e.response.data.errors).flat().join(' ')
        : (e.response?.data?.message || 'Failed to create staff')
      setFormError(msg)
    }
    finally { setSaving(false) }
  }

  const openEditPerms = (member) => {
    setSelected(member)
    setPermsForm({
      permPatients:     member.permPatients,
      permAppointments: member.permAppointments,
      permOPD:          member.permOPD,
      permIPD:          member.permIPD,
      permLab:          member.permLab,
      permPharmacy:     member.permPharmacy,
      permBilling:      member.permBilling,
      permReports:      member.permReports,
      permStaff:        member.permStaff,
    })
    setShowPerms(true)
  }

  const submitPerms = async () => {
    setSaving(true)
    try {
      const res = await staffService.updatePermissions(selected.id, permsForm)
      if (res.success) { setShowPerms(false); setShowDetail(false); load() }
      else setError(res.message || 'Failed to update permissions')
    } catch { setError('Failed to update permissions') }
    finally { setSaving(false) }
  }

  const handleToggle = async (id) => {
    try {
      const res = await staffService.toggleStatus(id)
      if (res.success) load()
      else setError(res.message)
    } catch { setError('Failed to update status') }
  }

  const submitReset = async () => {
    setResetError('')
    if (!newPassword || newPassword.length < 8) { setResetError('Password must be at least 8 characters'); return }
    setSaving(true)
    try {
      const res = await staffService.resetPassword(selected.id, newPassword)
      if (res.success) { setShowReset(false); setNewPassword(''); setResetError('') }
      else setResetError(res.errors?.length ? res.errors.join(' ') : (res.message || 'Failed to reset password'))
    } catch { setResetError('Failed to reset password') }
    finally { setSaving(false) }
  }

  const roleColor = (roleLabel) => {
    for (const [key, cls] of Object.entries(ROLE_COLORS)) {
      if (roleLabel?.includes(key)) return cls
    }
    return 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">{staff.length} staff member{staff.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setForm(blankForm()); setShowAdd(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition"
        >
          <span className="text-lg leading-none">+</span> Add Staff
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex justify-between">
          {error}
          <button onClick={() => setError('')} className="ml-4 font-bold">×</button>
        </div>
      )}

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by name or email..."
        className="border border-gray-200 rounded-xl px-4 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />

      {/* Staff Grid */}
      {loading ? (
        <div className="py-12 text-center text-gray-400">Loading...</div>
      ) : staff.length === 0 ? (
        <div className="py-12 text-center text-gray-400">No staff accounts yet. Add your first staff member.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {staff.map(s => (
            <div key={s.id} className={`bg-white rounded-2xl border shadow-sm p-5 space-y-3 ${!s.isActive ? 'opacity-60' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-gray-900">{s.fullName}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{s.email}</div>
                </div>
                <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${roleColor(s.roleLabel)}`}>
                  {s.roleLabel}
                </span>
              </div>
              {s.phone && <div className="text-xs text-gray-500">{s.phone}</div>}
              <div className="flex items-center gap-1.5 flex-wrap">
                {!s.isActive && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Inactive</span>}
                {s.isActive && <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full">Active</span>}
                {s.isExternal && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">External</span>}
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => openDetail(s.id)} className="flex-1 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition">
                  Manage
                </button>
                <button onClick={() => handleToggle(s.id)} className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition ${s.isActive ? 'text-gray-600 bg-gray-100 hover:bg-gray-200' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'}`}>
                  {s.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Staff Modal */}
      {showAdd && (
        <Modal title="Add Staff Member" onClose={() => { setShowAdd(false); setFormError('') }} wide>
          <div className="space-y-5">
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{formError}</div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">First Name *</label>
                <input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Last Name *</label>
                <input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Password *</label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="e.g. Apollo@123" />
                <p className="text-xs text-gray-400 mt-1">Min 8 chars, include uppercase, lowercase &amp; number</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Designation</label>
                <input value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}
                  placeholder="e.g. Sr. Nurse, Front Desk"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
            </div>

            {/* External partner toggle */}
            <label className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 cursor-pointer">
              <div>
                <div className="text-sm font-semibold text-amber-800">External Partner</div>
                <div className="text-xs text-amber-600 mt-0.5">Tied-up medical shop or clinic — can view prescriptions but cannot dispense medicines or create bills</div>
              </div>
              <input
                type="checkbox"
                checked={form.isExternal}
                onChange={e => setForm(f => ({ ...f, isExternal: e.target.checked }))}
                className="w-4 h-4 rounded text-amber-600 ml-3 flex-shrink-0"
              />
            </label>

            {/* Role selector */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Role (sets default permissions)</label>
              <div className="flex flex-wrap gap-2">
                {ROLES.filter(r => r.value !== 1).map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => handleRoleChange(r.value)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition ${form.role === r.value ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Doctor-specific fields */}
            {form.role === 2 && (
              <div className="border border-blue-100 bg-blue-50 rounded-xl p-4 space-y-4">
                <div className="text-xs font-semibold text-blue-700 mb-1">Doctor Details (required)</div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Department *</label>
                    <select
                      value={form.departmentId}
                      onChange={e => setForm(f => ({ ...f, departmentId: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                    >
                      <option value="">Select department</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Qualification *</label>
                    <input
                      value={form.qualification}
                      onChange={e => setForm(f => ({ ...f, qualification: e.target.value }))}
                      placeholder="e.g. MBBS, MD"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Specialization *</label>
                    <input
                      value={form.specialization}
                      onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))}
                      placeholder="e.g. General Medicine"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Registration No. *</label>
                    <input
                      value={form.registrationNumber}
                      onChange={e => setForm(f => ({ ...f, registrationNumber: e.target.value }))}
                      placeholder="e.g. MCI-12345"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Consultation Fee (₹)</label>
                    <input
                      type="number"
                      value={form.consultationFee}
                      onChange={e => setForm(f => ({ ...f, consultationFee: e.target.value }))}
                      placeholder="500"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Experience (years)</label>
                    <input
                      type="number"
                      value={form.experienceYears}
                      onChange={e => setForm(f => ({ ...f, experienceYears: e.target.value }))}
                      placeholder="5"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Permissions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-600">Module Permissions</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setForm(f => ({ ...f, permissions: Object.fromEntries(PERM_LABELS.map(p => [p.key, true])) }))} className="text-xs text-indigo-600 hover:underline">All On</button>
                  <span className="text-gray-300">|</span>
                  <button type="button" onClick={() => setForm(f => ({ ...f, permissions: Object.fromEntries(PERM_LABELS.map(p => [p.key, false])) }))} className="text-xs text-gray-400 hover:underline">All Off</button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {PERM_LABELS.map(p => (
                  <label key={p.key} className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition ${form.permissions[p.key] ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-100'}`}>
                    <input
                      type="checkbox"
                      checked={!!form.permissions[p.key]}
                      onChange={() => togglePerm(p.key)}
                      className="w-4 h-4 rounded text-indigo-600"
                    />
                    <span className="text-xs font-medium text-gray-700">{p.icon} {p.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={submitCreate} disabled={saving} className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                {saving ? 'Creating...' : 'Create Staff Account'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Staff Detail Modal */}
      {showDetail && selected && (
        <Modal title={selected.fullName} onClose={() => setShowDetail(false)} wide>
          <div className="space-y-5">
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`text-sm px-3 py-1 rounded-full font-medium ${roleColor(selected.roleLabel)}`}>{selected.roleLabel}</span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${selected.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                {selected.isActive ? 'Active' : 'Inactive'}
              </span>
              {selected.isExternal && (
                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-amber-100 text-amber-700">
                  External Partner — view only
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4 text-sm">
              <InfoRow label="Email" value={selected.email} />
              <InfoRow label="Phone" value={selected.phone} />
              {selected.designation && <InfoRow label="Designation" value={selected.designation} />}
              <InfoRow label="Member Since" value={new Date(selected.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })} />
            </div>

            {/* Current Permissions */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Current Permissions</h3>
              <div className="grid grid-cols-3 gap-2">
                {PERM_LABELS.map(p => (
                  <div key={p.key} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${selected[p.key] ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-50 text-gray-400 line-through'}`}>
                    {p.icon} {p.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
              <button onClick={() => openEditPerms(selected)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">
                Edit Permissions
              </button>
              <button onClick={() => { setShowReset(true) }} className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600">
                Reset Password
              </button>
              <button onClick={() => { handleToggle(selected.id); setShowDetail(false) }} className={`px-4 py-2 rounded-xl text-sm font-medium ${selected.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                {selected.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button onClick={() => setShowDetail(false)} className="ml-auto px-4 py-2 text-sm text-gray-500">Close</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Permissions Modal */}
      {showPerms && selected && (
        <Modal title={`Permissions — ${selected.fullName}`} onClose={() => setShowPerms(false)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Toggle which modules this staff member can access.</p>
            <div className="grid grid-cols-1 gap-2">
              {PERM_LABELS.map(p => (
                <label key={p.key} className={`flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer transition ${permsForm[p.key] ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-100'}`}>
                  <span className="text-sm font-medium text-gray-800">{p.icon} {p.label}</span>
                  <input
                    type="checkbox"
                    checked={!!permsForm[p.key]}
                    onChange={() => setPermsForm(f => ({ ...f, [p.key]: !f[p.key] }))}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowPerms(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={submitPerms} disabled={saving} className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Permissions'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reset Password Modal */}
      {showReset && selected && (
        <Modal title={`Reset Password — ${selected.fullName}`} onClose={() => { setShowReset(false); setResetError('') }}>
          <div className="space-y-4">
            {resetError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{resetError}</div>}
            <p className="text-sm text-gray-500">Set a new password for {selected.fullName}. They will need to use this to log in.</p>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="e.g. Apollo@123"
              />
              <p className="text-xs text-gray-400 mt-1">Min 8 chars, include uppercase, lowercase &amp; number</p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowReset(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={submitReset} disabled={saving} className="px-5 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 disabled:opacity-50">
                {saving ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Modal({ title, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition text-xl leading-none">×</button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div>
      <div className="text-xs text-gray-400 mb-0.5">{label}</div>
      <div className="text-sm font-medium text-gray-900">{value || '—'}</div>
    </div>
  )
}
