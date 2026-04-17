import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [step, setStep] = useState(1)
  const [hospitalCode, setHospitalCode] = useState('')
  const [mobile, setMobile] = useState('')
  const [dob, setDob] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
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
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">🏥</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ArogyaOS</h1>
          <p className="text-gray-500 text-sm mt-1">Patient Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Welcome!</h2>
          <p className="text-gray-500 text-sm mb-6">
            Login to view your appointments, prescriptions and bills
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Hospital Code *
              </label>
              <input
                required
                value={hospitalCode}
                onChange={e => setHospitalCode(e.target.value.toUpperCase())}
                placeholder="e.g. ARG-HOS-0001"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Get this from your hospital reception
              </p>
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
              <p className="text-xs text-gray-400 mt-1">
                Used to verify your identity
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50">
              {loading ? 'Logging in...' : 'Login →'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            Not registered? Visit your hospital reception to register.
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Powered by ArogyaOS
        </p>
      </div>
    </div>
  )
}
