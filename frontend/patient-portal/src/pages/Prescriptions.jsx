import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function Prescriptions() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/appointment/my?page=1&pageSize=50')
      if (res.data.success) {
        const completed = res.data.data.items.filter(
          a => a.status === 'Completed'
        )
        setAppointments(completed)
      }
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-emerald-600 text-white px-4 pt-8 pb-6">
        <button onClick={() => navigate('/')} className="text-emerald-200 text-sm mb-2">← Back</button>
        <h1 className="text-xl font-bold">My Prescriptions</h1>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center py-20">
            <div className="text-4xl mb-2">💊</div>
            <div className="text-gray-500 font-medium">No prescriptions yet</div>
            <div className="text-gray-400 text-sm mt-1">
              Prescriptions appear after your consultation
            </div>
          </div>
        ) : appointments.map(apt => (
          <div key={apt.id} className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-sm font-bold text-gray-900">{apt.doctorName}</div>
                <div className="text-xs text-gray-500">{apt.departmentName}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(apt.appointmentDateTime).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })}
                </div>
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
                Completed
              </span>
            </div>
            {apt.chiefComplaint && (
              <div className="bg-gray-50 rounded-xl px-3 py-2 text-xs text-gray-600">
                <span className="font-medium">Complaint: </span>{apt.chiefComplaint}
              </div>
            )}
            <div className="mt-3 flex items-center gap-2 text-xs text-emerald-600">
              <span>💊</span>
              <span>Prescription available at hospital</span>
            </div>
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
