import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function Prescriptions() {
  const [visits, setVisits]   = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const navigate = useNavigate()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/opd/my/history?limit=50')
      if (res.data.success) {
        setVisits(res.data.data || [])
      }
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const toggle = (id) => setExpanded(prev => prev === id ? null : id)

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-emerald-600 text-white px-4 pt-8 pb-6">
        <button onClick={() => navigate('/')} className="text-emerald-200 text-sm mb-2">← Back</button>
        <h1 className="text-xl font-bold">My Prescriptions</h1>
        <p className="text-emerald-200 text-xs mt-0.5">{visits.length} visit{visits.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : visits.length === 0 ? (
          <div className="flex flex-col items-center py-20">
            <div className="text-4xl mb-2">💊</div>
            <div className="text-gray-500 font-medium">No prescriptions yet</div>
            <div className="text-gray-400 text-sm mt-1">
              Prescriptions appear after your consultation
            </div>
          </div>
        ) : visits.map(visit => (
          <div key={visit.visitId} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Header row */}
            <button
              onClick={() => toggle(visit.visitId)}
              className="w-full text-left px-4 py-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm font-bold text-gray-900">
                    {visit.doctorName || 'Doctor'}
                  </div>
                  {visit.diagnosis && (
                    <div className="text-xs text-gray-500 mt-0.5">{visit.diagnosis}</div>
                  )}
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(visit.visitDate).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 ml-2">
                  {visit.prescriptionNumber && (
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                      {visit.prescriptionNumber}
                    </span>
                  )}
                  <span className="text-xs text-emerald-600 font-medium">
                    {visit.medicines?.length || 0} medicine{(visit.medicines?.length || 0) !== 1 ? 's' : ''}
                    {' '}{expanded === visit.visitId ? '▲' : '▼'}
                  </span>
                </div>
              </div>
            </button>

            {/* Expanded medicine list */}
            {expanded === visit.visitId && (
              <div className="border-t border-gray-100 px-4 py-3 space-y-3">
                {visit.medicines?.length > 0 ? (
                  visit.medicines.map((med, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-start justify-between">
                        <div className="font-semibold text-gray-800 text-sm">{med.medicineName}</div>
                        <div className="text-xs text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full ml-2">
                          {med.dosage}
                        </div>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                        {med.frequency && (
                          <span>⏰ {med.frequency}</span>
                        )}
                        {med.duration && (
                          <span>📅 {med.duration}</span>
                        )}
                        {med.instructions && (
                          <span className="text-amber-600">⚠ {med.instructions}</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-400 text-sm">
                    No medicines prescribed
                  </div>
                )}

                {visit.advice && (
                  <div className="bg-blue-50 rounded-xl px-3 py-2 text-xs text-blue-700">
                    <span className="font-semibold">Doctor's advice: </span>{visit.advice}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2">
        <div className="flex justify-around">
          {[
            { icon: '🏠', label: 'Home',          path: '/'              },
            { icon: '📅', label: 'Appointments',  path: '/appointments'  },
            { icon: '💊', label: 'Prescriptions', path: '/prescriptions' },
            { icon: '🧾', label: 'Bills',          path: '/bills'         },
            { icon: '👤', label: 'Profile',        path: '/profile'       },
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
