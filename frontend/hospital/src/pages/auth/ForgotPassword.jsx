import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../../services/authService'

export default function ForgotPassword() {
  const [step, setStep] = useState('email') // 'email' | 'reset'
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleRequestCode = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await authService.forgotPassword(email)
      setInfo(result.message || 'If that email exists, a verification code has been sent.')
      setStep('reset')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await authService.resetPassword(email, code, newPassword)
      if (result.success) {
        navigate('/login')
      } else {
        setError(result.message || 'Failed to reset password')
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-2xl mb-4">
            <span className="text-white text-2xl font-bold">✚</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">MedCareAxis</h1>
          <p className="text-gray-500 mt-1">Reset your password</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {step === 'email' ? (
            <>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                Forgot password?
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Enter your account email and we'll send you a verification code.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleRequestCode} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900"
                    placeholder="you@hospital.com"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending code...' : 'Send verification code'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Enter code &amp; new password
              </h2>
              {info && <p className="text-sm text-gray-500 mb-6">{info}</p>}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Verification code
                  </label>
                  <input
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                    maxLength={6}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 tracking-[0.3em] text-center"
                    placeholder="6-digit code"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    minLength={8}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900"
                    placeholder="At least 8 characters"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Resetting...' : 'Reset password'}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep('email'); setError(''); setCode('') }}
                  className="w-full text-center text-xs text-gray-500 hover:underline"
                >
                  ← Change email / resend code
                </button>
              </form>
            </>
          )}

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <Link to="/login" className="text-sm text-emerald-600 hover:underline">
              ← Back to sign in
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
