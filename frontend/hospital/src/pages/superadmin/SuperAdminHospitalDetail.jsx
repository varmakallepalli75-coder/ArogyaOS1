import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { superAdminService } from '../../services/superAdminService'
import SuperAdminLayout from './SuperAdminLayout'

export default function SuperAdminHospitalDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [hospital, setHospital] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  // Status modal
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [statusReason, setStatusReason] = useState('')
  const [statusLoading, setStatusLoading] = useState(false)

  // Password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  // Subscription modal
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [newPlan, setNewPlan] = useState('')
  const [planLoading, setPlanLoading] = useState(false)

  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => { loadHospital() }, [id])

  const loadHospital = async () => {
    setLoading(true)
    try {
      const res = await superAdminService.getHospital(id)
      if (res.success) setHospital(res.data)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleStatusUpdate = async () => {
    if (!statusReason.trim()) return setErrorMsg('Please provide a reason')
    setStatusLoading(true)
    try {
      const statusMap = { Active: 1, Suspended: 2, Deactivated: 3, Pending: 0 }
      const res = await superAdminService.updateStatus(id, statusMap[newStatus], statusReason)
      if (res.success) {
        setSuccessMsg(res.message)
        setShowStatusModal(false)
        setStatusReason('')
        loadHospital()
      } else setErrorMsg(res.message)
    } catch(e) { setErrorMsg('Failed to update status') }
    finally { setStatusLoading(false) }
  }

  const handlePasswordReset = async () => {
    setPasswordError('')
    if (newPassword.length < 8) return setPasswordError('Password must be at least 8 characters')
    if (newPassword !== confirmPassword) return setPasswordError('Passwords do not match')
    if (!/[A-Z]/.test(newPassword)) return setPasswordError('Password must contain at least one uppercase letter')
    if (!/[0-9]/.test(newPassword)) return setPasswordError('Password must contain at least one number')
    if (!/[^A-Za-z0-9]/.test(newPassword)) return setPasswordError('Password must contain at least one special character')
    setPasswordLoading(true)
    try {
      const res = await superAdminService.resetPassword(id, newPassword)
      if (res.success) {
        setSuccessMsg('Password reset successfully')
        setShowPasswordModal(false)
        setNewPassword('')
        setConfirmPassword('')
      } else setPasswordError(res.message)
    } catch(e) { setPasswordError('Failed to reset password') }
    finally { setPasswordLoading(false) }
  }

  const handlePlanUpdate = async () => {
    setPlanLoading(true)
    const planMap = { Trial: 0, Starter: 1, Growth: 2, Enterprise: 3, Custom: 4 }
    try {
      const res = await superAdminService.updateSubscription(id, planMap[newPlan])
      if (res.success) {
        setSuccessMsg('Plan updated successfully')
        setShowPlanModal(false)
        loadHospital()
      } else setErrorMsg(res.message)
    } catch(e) { setErrorMsg('Failed to update plan') }
    finally { setPlanLoading(false) }
  }

  const statusColor = (s) => ({
    Active: 'bg-emerald-100 text-emerald-700',
    Suspended: 'bg-amber-100 text-amber-700',
    Pending: 'bg-blue-100 text-blue-700',
    Deactivated: 'bg-red-100 text-red-700',
  }[s] || 'bg-gray-100 text-gray-600')

  if (loading) return (
    <SuperAdminLayout>
      <div className="flex items-center justify-center h-64 text-gray-400">Loading hospital...</div>
    </SuperAdminLayout>
  )

  if (!hospital) return (
    <SuperAdminLayout>
      <div className="flex items-center justify-center h-64 text-red-500">Hospital not found</div>
    </SuperAdminLayout>
  )

  return (
    <SuperAdminLayout
      title={hospital.name}
      subtitle={`${hospital.hospitalCode} - ${hospital.city}, ${hospital.state}`}
    >
      <div>
        {/* Back + status */}
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => navigate('/super-admin/hospitals')}
            className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1">
            ← Back to Hospitals
          </button>
          <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${statusColor(hospital.status)}`}>
            {hospital.status}
          </span>
        </div>

        {/* Success/Error messages */}
        {successMsg && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm flex justify-between">
            {successMsg}
            <button onClick={() => setSuccessMsg('')}>✕</button>
          </div>
        )}
        {errorMsg && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex justify-between">
            {errorMsg}
            <button onClick={() => setErrorMsg('')}>✕</button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button onClick={() => { setNewStatus('Active'); setShowStatusModal(true) }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold">
            ✅ Activate
          </button>
          <button onClick={() => { setNewStatus('Suspended'); setShowStatusModal(true) }}
            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-semibold">
            ⚠️ Suspend
          </button>
          <button onClick={() => { setNewStatus('Deactivated'); setShowStatusModal(true) }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold">
            🚫 Deactivate
          </button>
          <button onClick={() => setShowPasswordModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold">
            🔑 Reset Password
          </button>
          <button onClick={() => { setNewPlan(hospital.plan); setShowPlanModal(true) }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold">
            📋 Change Plan
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Patients', value: hospital.patientCount, icon: '👥' },
            { label: 'Doctors', value: hospital.doctorCount, icon: '👨‍⚕️' },
            { label: 'Appointments', value: hospital.appointmentCount, icon: '📅' },
            { label: 'Total Beds', value: hospital.totalBeds, icon: '🛏️' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
          {['overview', 'modules', 'subscription', 'admin'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-colors ${
                activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Hospital Info</h3>
              <div className="space-y-3">
                {[
                  ['Name', hospital.name],
                  ['Code', hospital.hospitalCode],
                  ['Specialty', hospital.category || 'N/A'],
                  ['Ownership', hospital.hospitalType || 'N/A'],
                  ['Phone', hospital.phone],
                  ['Email', hospital.email],
                  ['GST', hospital.gstNumber || 'N/A'],
                ].map(([k,v]) => (
                  <div key={k} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-500">{k}</span>
                    <span className="text-sm font-medium text-gray-900">{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Address</h3>
              <div className="space-y-3">
                {[
                  ['Address', hospital.address],
                  ['City', hospital.city],
                  ['District', hospital.district || 'N/A'],
                  ['State', hospital.state],
                  ['PIN Code', hospital.pinCode],
                ].map(([k,v]) => (
                  <div key={k} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-500">{k}</span>
                    <span className="text-sm font-medium text-gray-900">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'modules' && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-1">Active Modules</h3>
            <p className="text-sm text-gray-500 mb-5">Services enabled for this hospital based on their specialty and plan.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { key: 'hasOPD',           label: 'OPD / Outpatient',   icon: '🏥' },
                { key: 'hasIPD',           label: 'IPD & Beds',         icon: '🛏️' },
                { key: 'hasLab',           label: 'Laboratory',         icon: '🔬' },
                { key: 'hasPharmacy',      label: 'Pharmacy',           icon: '💊' },
                { key: 'hasRadiology',     label: 'Radiology',          icon: '🔭' },
                { key: 'hasBilling',       label: 'Billing',            icon: '🧾' },
                { key: 'hasPatientPortal', label: 'Patient Portal',     icon: '📱' },
                { key: 'hasHR',            label: 'Staff & HR',         icon: '👥' },
                { key: 'hasReports',       label: 'Reports',            icon: '📊' },
              ].map(mod => {
                const active = hospital[mod.key]
                return (
                  <div key={mod.key}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 ${
                      active ? 'border-emerald-300 bg-emerald-50' : 'border-gray-100 bg-gray-50 opacity-50'
                    }`}>
                    <span className="text-xl">{mod.icon}</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{mod.label}</div>
                      <div className={`text-xs font-semibold ${active ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {active ? '✓ Enabled' : '✗ Disabled'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'subscription' && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Subscription Details</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                ['Plan', hospital.plan],
                ['Status', hospital.subscriptionStatus],
                ['Monthly Amount', `₹${hospital.monthlyAmount?.toLocaleString()}`],
                ['Start Date', hospital.subscriptionStart ? new Date(hospital.subscriptionStart).toLocaleDateString('en-IN') : 'N/A'],
                ['End Date', hospital.subscriptionEnd ? new Date(hospital.subscriptionEnd).toLocaleDateString('en-IN') : 'N/A'],
              ].map(([k,v]) => (
                <div key={k} className="flex justify-between py-3 border-b border-gray-50">
                  <span className="text-sm text-gray-500">{k}</span>
                  <span className="text-sm font-bold text-gray-900">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Admin Account</h3>
            <div className="space-y-3">
              {[
                ['Name', hospital.adminName],
                ['Email', hospital.adminEmail],
                ['Phone', hospital.adminPhone],
                ['User ID', hospital.adminUserId || 'N/A'],
                ['Joined', new Date(hospital.createdAt).toLocaleDateString('en-IN')],
              ].map(([k,v]) => (
                <div key={k} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-500">{k}</span>
                  <span className="text-sm font-medium text-gray-900">{v}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowPasswordModal(true)}
              className="mt-4 w-full bg-blue-50 text-blue-600 border border-blue-200 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-100">
              🔑 Reset Admin Password
            </button>
          </div>
        )}
      </div>

      {/* Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-gray-900 mb-4">
              {newStatus === 'Active' ? '✅' : newStatus === 'Suspended' ? '⚠️' : '🚫'} {newStatus} Hospital
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              You are about to <strong>{newStatus.toLowerCase()}</strong> <strong>{hospital.name}</strong>.
              This action will be logged.
            </p>
            <textarea
              value={statusReason}
              onChange={e => setStatusReason(e.target.value)}
              placeholder="Reason for this action (required)..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => { setShowStatusModal(false); setStatusReason('') }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleStatusUpdate} disabled={statusLoading}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 ${
                  newStatus === 'Active' ? 'bg-emerald-600' :
                  newStatus === 'Suspended' ? 'bg-amber-500' : 'bg-red-600'
                }`}>
                {statusLoading ? 'Processing...' : `Confirm ${newStatus}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-gray-900 mb-2">🔑 Reset Admin Password</h3>
            <p className="text-sm text-gray-500 mb-4">
              Setting new password for <strong>{hospital.adminEmail}</strong>
            </p>
            {passwordError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-xl text-sm mb-4">
                {passwordError}
              </div>
            )}
            <div className="space-y-3 mb-4">
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="New password (min 8 chars)"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
              <p className="text-xs text-amber-700 font-medium">⚠️ Password Requirements:</p>
              <ul className="text-xs text-amber-600 mt-1 space-y-0.5">
                <li>• Minimum 8 characters</li>
                <li>• At least one uppercase letter</li>
                <li>• At least one number</li>
                <li>• At least one special character (!@#$...)</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowPasswordModal(false); setNewPassword(''); setConfirmPassword(''); setPasswordError('') }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handlePasswordReset} disabled={passwordLoading}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                {passwordLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-gray-900 mb-4">📋 Change Subscription Plan</h3>
            <div className="space-y-3 mb-6">
              {[
                { plan: 'Trial', price: '₹0', features: 'OPD + Billing, 3 users, 100 patients' },
                { plan: 'Starter', price: '₹2,999/mo', features: 'OPD + Billing, 5 users, 500 patients' },
                { plan: 'Growth', price: '₹7,999/mo', features: 'All modules, 25 users, 5000 patients' },
                { plan: 'Enterprise', price: '₹19,999/mo', features: 'Unlimited everything + Reports + API' },
              ].map(p => (
                <div key={p.plan}
                  onClick={() => setNewPlan(p.plan)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                    newPlan === p.plan ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-gray-900">{p.plan}</span>
                    <span className="font-bold text-indigo-600">{p.price}</span>
                  </div>
                  <p className="text-xs text-gray-500">{p.features}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowPlanModal(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handlePlanUpdate} disabled={planLoading}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                {planLoading ? 'Updating...' : 'Update Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  )
}
