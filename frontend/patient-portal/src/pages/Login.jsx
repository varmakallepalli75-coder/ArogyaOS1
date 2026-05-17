import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [tab, setTab] = useState('hospital')
  const [hospitalCode, setHospitalCode] = useState('')
  const [mobile, setMobile] = useState('')
  const [dob, setDob] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login, unifiedLogin } = useAuth()
  const navigate = useNavigate()

  const handleHospitalLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await login(mobile, hospitalCode, dob)
      if (result.success) {
        navigate('/')
      } else {
        setError(result.message || 'Login failed. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleUnifiedLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await unifiedLogin(mobile, dob)
      if (result.success) {
        navigate('/health-records')
      } else {
        setError(result.message || 'Login failed. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">🏥</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">MedCareAxis</h1>
          <p className="text-gray-500 text-sm mt-1">Patient Portal</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => { setTab('hospital'); setError('') }}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                tab === 'hospital'
                  ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
              Hospital Login
            </button>
            <button
              onClick={() => { setTab('unified'); setError('') }}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                tab === 'unified'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
              My Health Records
            </button>
          </div>

          <div className="p-8">
            {tab === 'hospital' ? (
              <>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Welcome!</h2>
                <p className="text-gray-500 text-sm mb-6">
                  Login to view appointments, prescriptions and bills for a specific hospital.
                </p>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
                    {error}
                  </div>
                )}

                <form onSubmit={handleHospitalLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Hospital Code *
                    </label>
                    <input
                      required
                      value={hospitalCode}
                      onChange={e => setHospitalCode(e.target.value.toUpperCase())}
                      placeholder="e.g. MCA-HOS-0001"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">Get this from your hospital reception</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Mobile Number *
                    </label>
                    <input
                      required
                      value={mobile}
                      onChange={e => setMobile(e.target.value)}
                      placeholder="10 digit mobile number"
                      maxLength={10}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Date of Birth *
                    </label>
                    <input
                      required
                      type="date"
                      value={dob}
                      onChange={e => setDob(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50">
                    {loading ? 'Logging in...' : 'Login →'}
                  </button>
                </form>

                <button
                  onClick={() => { setTab('unified'); setError('') }}
                  className="w-full text-center text-xs text-blue-500 mt-4 hover:underline">
                  Visited multiple hospitals? View your complete health records →
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">📋</span>
                  <h2 className="text-xl font-bold text-gray-900">My Health Records</h2>
                </div>
                <p className="text-gray-500 text-sm mb-6">
                  View your complete medical history from all hospitals you've visited.
                  Your mobile number links all your records together.
                </p>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
                    {error}
                  </div>
                )}

                <form onSubmit={handleUnifiedLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Mobile Number *
                    </label>
                    <input
                      required
                      value={mobile}
                      onChange={e => setMobile(e.target.value)}
                      placeholder="10 digit mobile number"
                      maxLength={10}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Must be the same mobile used at all hospitals
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Date of Birth *
                    </label>
                    <input
                      required
                      type="date"
                      value={dob}
                      onChange={e => setDob(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">Used to verify your identity</p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50">
                    {loading ? 'Searching records...' : 'View My Health Records →'}
                  </button>
                </form>

                <div className="mt-4 p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
                  <strong>What you'll see:</strong> Prescriptions, visits, lab reports, and admissions from every MedCareAxis hospital you've been to — all in one place. You can also upload and store your own medical documents.
                </div>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">Powered by MedCareAxis</p>
      </div>
    </div>
  )
}
