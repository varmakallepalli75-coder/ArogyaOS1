import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function Appointments() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('upcoming')
  const navigate = useNavigate()

  useEffect(() => { loadAppointments() }, [])

  const loadAppointments = async () => {
    setLoading(true)
    try {
      const res = await api.get('/appointment/my?page=1&pageSize=50')
      if (res.data.success) setAppointments(res.data.data.items)
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

  const today = new Date().toDateString()
  const upcoming = appointments.filter(a =>
    new Date(a.appointmentDateTime) >= new Date() &&
    a.status !== 'Cancelled')
  const past = appointments.filter(a =>
    new Date(a.appointmentDateTime) < new Date() ||
    a.status === 'Completed' || a.status === 'Cancelled')

  const list = activeTab === 'upcoming' ? upcoming : past

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-emerald-600 text-white px-4 pt-8 pb-6">
        <button onClick={() => navigate('/')} className="text-emerald-200 text-sm mb-2">← Back</button>
        <h1 className="text-xl font-bold">My Appointments</h1>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Tabs */}
        <div className="flex bg-white rounded-xl overflow-hidden border border-gray-100">
          {['upcoming', 'past'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}>
              {tab} ({tab === 'upcoming' ? upcoming.length : past.length})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center py-20">
            <div className="text-4xl mb-2">📅</div>
            <div className="text-gray-500 font-medium">No {activeTab} appointments</div>
          </div>
        ) : list.map(apt => (
          <div key={apt.id} className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-sm font-bold text-gray-900">{apt.doctorName}</div>
                <div className="text-xs text-gray-500">{apt.departmentName}</div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[apt.status] || 'bg-gray-100 text-gray-600'}`}>
                {apt.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>📅 {new Date(apt.appointmentDateTime).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric'
              })}</span>
              <span>🕐 {new Date(apt.appointmentDateTime).toLocaleTimeString('en-IN', {
                hour: '2-digit', minute: '2-digit'
              })}</span>
              <span className="font-bold text-emerald-600">Token {apt.tokenNumber}</span>
            </div>
            {apt.chiefComplaint && (
              <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                {apt.chiefComplaint}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom Nav */}
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
