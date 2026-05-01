import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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
        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-2xl font-bold mb-3">
            {user?.fullName?.split(' ').map(n => n[0]).join('').slice(0,2)}
          </div>
          <h2 className="text-xl font-bold text-gray-900">{user?.fullName}</h2>
          <p className="text-gray-500 text-sm">{user?.hospitalName}</p>
        </div>

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
