import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function Home() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAppointments()
  }, [])

  const loadAppointments = async () => {
    setLoading(true)
    try {
      const res = await api.get('/appointment/my?page=1&pageSize=10')
      if (res.data.success) {
        const today = new Date().toDateString()
        const todayApts = res.data.data.items.filter(
          a => new Date(a.appointmentDateTime).toDateString() === today
        )
        setAppointments(todayApts)
      }
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const statusColors = {
    Scheduled: 'bg-blue-100 text-blue-700',
    Confirmed: 'bg-purple-100 text-purple-700',
    InProgress: 'bg-amber-100 text-amber-700',
    Completed: 'bg-emerald-100 text-emerald-700',
    Cancelled: 'bg-red-100 text-red-700',
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-emerald-600 text-white px-4 pt-8 pb-16">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-emerald-200 text-sm">Welcome back</p>
            <h1 className="text-xl font-bold">{user?.fullName} 👋</h1>
            <p className="text-emerald-200 text-xs mt-0.5">{user?.hospitalName}</p>
          </div>
          <button onClick={logout}
            className="text-emerald-200 hover:text-white text-sm">
            Logout
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 -mt-8 space-y-4 pb-24">

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: '📅', label: 'Appointments', path: '/appointments' },
            { icon: '💊', label: 'Prescriptions', path: '/prescriptions' },
            { icon: '🧾', label: 'Bills', path: '/bills' },
          ].map(item => (
            <button key={item.path}
              onClick={() => navigate(item.path)}
              className="bg-white rounded-2xl p-4 shadow-sm flex flex-col items-center gap-2 hover:shadow-md transition-shadow">
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs font-medium text-gray-700">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Today's Appointments */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Today's Appointments</h3>
          {loading ? (
            <div className="text-center py-6 text-gray-400 text-sm">Loading...</div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-3xl mb-2">📅</div>
              <div className="text-gray-500 text-sm">No appointments today</div>
              <button onClick={() => navigate('/appointments')}
                className="mt-3 text-emerald-600 text-sm font-medium">
                Book an appointment →
              </button>
            </div>
          ) : appointments.map(apt => (
            <div key={apt.id} className="border border-gray-100 rounded-xl p-3 mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg font-bold text-emerald-600">
                  Token {apt.tokenNumber}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[apt.status] || 'bg-gray-100 text-gray-600'}`}>
                  {apt.status}
                </span>
              </div>
              <div className="text-sm font-medium text-gray-800">{apt.doctorName}</div>
              <div className="text-xs text-gray-500">{apt.departmentName}</div>
              <div className="text-xs text-gray-400 mt-1">
                {new Date(apt.appointmentDateTime).toLocaleTimeString('en-IN', {
                  hour: '2-digit', minute: '2-digit'
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Health Tips */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
          <h3 className="font-semibold text-emerald-800 mb-2">💡 Health Tip</h3>
          <p className="text-emerald-700 text-sm">
            Stay hydrated! Drink at least 8 glasses of water every day for better health.
          </p>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2">
        <div className="flex justify-around">
          {[
            { icon: '🏠', label: 'Home', path: '/' },
            { icon: '📅', label: 'Appointments', path: '/appointments' },
            { icon: '💊', label: 'Prescriptions', path: '/prescriptions' },
            { icon: '🧾', label: 'Bills', path: '/bills' },
            { icon: '👤', label: 'Profile', path: '/profile' },
          ].map(item => (
            <button key={item.path}
              onClick={() => navigate(item.path)}
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
