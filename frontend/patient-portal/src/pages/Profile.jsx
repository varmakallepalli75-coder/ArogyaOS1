import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { pushService } from '../services/pushService'

function NotificationToggle() {
  const [status, setStatus]   = useState('loading') // loading | unsupported | denied | off | on
  const [working, setWorking] = useState(false)

  useEffect(() => {
    if (!pushService.isSupported()) { setStatus('unsupported'); return }
    const perm = pushService.getPermission()
    if (perm === 'denied') { setStatus('denied'); return }
    pushService.getSubscription().then(sub => setStatus(sub ? 'on' : 'off'))
  }, [])

  const toggle = async () => {
    setWorking(true)
    try {
      if (status === 'on') {
        await pushService.unsubscribe()
        setStatus('off')
      } else {
        const perm = await Notification.requestPermission()
        if (perm !== 'granted') { setStatus('denied'); return }
        await pushService.subscribe()
        setStatus('on')
      }
    } catch (e) {
      console.error('Push toggle error:', e)
    } finally {
      setWorking(false)
    }
  }

  if (status === 'loading') return null

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-800">Medicine Reminders</div>
          <div className="text-xs text-gray-500 mt-0.5">
            {status === 'unsupported' && 'Not supported in this browser'}
            {status === 'denied'      && 'Blocked — enable in browser settings'}
            {status === 'off'         && 'Get notified when it\'s time for your medicines'}
            {status === 'on'          && 'You\'ll be notified at medicine times'}
          </div>
        </div>
        {status !== 'unsupported' && status !== 'denied' && (
          <button onClick={toggle} disabled={working}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              status === 'on' ? 'bg-emerald-500' : 'bg-gray-300'
            } disabled:opacity-50`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              status === 'on' ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        )}
        {status === 'denied' && (
          <span className="text-xs text-red-500 font-medium">Blocked</span>
        )}
      </div>
      {status === 'on' && (
        <div className="mt-3 bg-emerald-50 rounded-xl p-3 text-xs text-emerald-700">
          Reminders are sent at <strong>8:00 AM</strong> (morning), <strong>2:00 PM</strong> (afternoon), and <strong>9:00 PM</strong> (night) based on your prescription schedule.
        </div>
      )}
    </div>
  )
}

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-emerald-600 text-white px-4 pt-8 pb-16">
        <button onClick={() => navigate('/')} className="text-emerald-200 text-sm mb-2">← Back</button>
        <h1 className="text-xl font-bold">My Profile</h1>
      </div>

      <div className="px-4 -mt-8 space-y-4">
        {/* Avatar card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-2xl font-bold mb-3">
            {user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <h2 className="text-xl font-bold text-gray-900">{user?.fullName}</h2>
          <p className="text-gray-500 text-sm">{user?.hospitalName}</p>
        </div>

        {/* Info */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          {[
            ['Mobile', user?.email],
            ['Hospital', user?.hospitalName],
            ['Role', 'Patient'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-500">{label}</span>
              <span className="text-sm font-medium text-gray-800">{value}</span>
            </div>
          ))}
        </div>

        {/* Notification toggle */}
        <NotificationToggle />

        <button onClick={logout}
          className="w-full bg-red-50 text-red-600 border border-red-200 py-3 rounded-2xl font-semibold text-sm">
          Logout
        </button>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2">
        <div className="flex justify-around">
          {[
            { icon: '🏠', label: 'Home', path: '/' },
            { icon: '📅', label: 'Appointments', path: '/appointments' },
            { icon: '💊', label: 'Prescriptions', path: '/prescriptions' },
            { icon: '🧾', label: 'Bills', path: '/bills' },
            { icon: '👤', label: 'Profile', path: '/profile' },
          ].map(item => (
            <button key={item.path} onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-1 px-2 py-1">
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs text-gray-500">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
