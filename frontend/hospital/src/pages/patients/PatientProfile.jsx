import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { patientService } from '../../services/patientService'

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown']
const genders = ['Male', 'Female', 'Other', 'PreferNotToSay']
const insuranceTypes = ['None', 'Ayushman', 'CGHS', 'ESIC', 'PrivateInsurance', 'CorporateTPA']
const states = ['Andhra Pradesh', 'Telangana', 'Karnataka', 'Tamil Nadu', 'Maharashtra', 'Gujarat', 'Delhi', 'Uttar Pradesh', 'West Bengal', 'Rajasthan', 'Other']

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

  useEffect(() => {
    loadPatient()
  }, [id])

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
            b === res.data.bloodGroup
              .replace('Positive', '+')
              .replace('Negative', '-')),
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
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const res = await patientService.update(id, form)
      if (res.success) {
        setSuccess('Patient updated successfully!')
        setEditing(false)
        loadPatient()
      } else {
        setError(res.message)
      }
    } catch (err) {
      setError('Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  const f = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

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
            <button onClick={() => setEditing(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold">
              ✏️ Edit Patient
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Personal Info */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">
            Personal Information
          </h3>
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
              </div>
              <div className="grid grid-cols-2 gap-2">
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
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Aadhaar Number</label>
                  <input value={form.aadhaarNumber} onChange={e => f('aadhaarNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="vip" checked={form.isVIP}
                  onChange={e => f('isVIP', e.target.checked)}
                  className="w-4 h-4 accent-emerald-600" />
                <label htmlFor="vip" className="text-sm text-gray-600">Mark as VIP Patient</label>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {[
                ['Full Name', patient.fullName],
                ['Date of Birth', new Date(patient.dateOfBirth).toLocaleDateString('en-IN')],
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
          <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">
            Contact Information
          </h3>
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
                  <input value={form.email} onChange={e => f('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Address</label>
                <input value={form.address} onChange={e => f('address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">City</label>
                  <input value={form.city} onChange={e => f('city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">State</label>
                  <select value={form.state} onChange={e => f('state', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    {states.map(s => <option key={s}>{s}</option>)}
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
                ['Alternate Mobile', patient.alternateMobile || '—'],
                ['Email', patient.email || '—'],
                ['Address', patient.address],
                ['City', patient.city],
                ['State', patient.state],
                ['PIN Code', patient.pinCode],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-xs text-gray-500">{label}</span>
                  <span className="text-sm font-medium text-gray-800">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Emergency Contact */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">
            Emergency Contact
          </h3>
          {editing ? (
            <div className="grid grid-cols-3 gap-2">
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
          <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">
            Insurance & Medical
          </h3>
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
                  <span className="text-sm font-medium text-gray-800">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}