import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const STEPS = [
  { step: 1, label: 'Registered',         icon: '✓',  color: 'emerald' },
  { step: 2, label: 'Checked In',         icon: '🏥', color: 'blue'    },
  { step: 3, label: 'With Doctor',        icon: '👨‍⚕️', color: 'purple'  },
  { step: 4, label: 'Prescription Ready', icon: '💊', color: 'amber'   },
  { step: 5, label: 'Done',               icon: '✅', color: 'emerald' },
]

const COLOR = {
  emerald: { dot: 'bg-emerald-500', ring: 'ring-emerald-300', text: 'text-emerald-700', line: 'bg-emerald-400', badge: 'bg-emerald-100 text-emerald-700' },
  blue:    { dot: 'bg-blue-500',    ring: 'ring-blue-300',    text: 'text-blue-700',    line: 'bg-blue-400',    badge: 'bg-blue-100 text-blue-700'    },
  purple:  { dot: 'bg-purple-500',  ring: 'ring-purple-300',  text: 'text-purple-700',  line: 'bg-purple-400',  badge: 'bg-purple-100 text-purple-700'  },
  amber:   { dot: 'bg-amber-500',   ring: 'ring-amber-300',   text: 'text-amber-700',   line: 'bg-amber-400',   badge: 'bg-amber-100 text-amber-700'   },
}

function fmt(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

function JourneyCard({ apt }) {
  const currentStep = apt.currentStep
  const activeStep  = STEPS.find(s => s.step === currentStep)
  const activeColor = COLOR[activeStep?.color] || COLOR.emerald

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className={`px-4 py-3 flex items-center justify-between ${
        currentStep === 5 ? 'bg-emerald-600' : 'bg-blue-600'
      } text-white`}>
        <div>
          <div className="text-xs opacity-80">Token</div>
          <div className="text-2xl font-bold">{apt.tokenNumber || '—'}</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold">{apt.doctorName}</div>
          <div className="text-xs opacity-80">{apt.departmentName}</div>
          <div className="text-xs opacity-70 mt-0.5">
            {new Date(apt.appointmentDateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {/* Current status pill */}
      <div className="px-4 pt-3 pb-1 flex items-center gap-2">
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${activeColor.badge}`}>
          {activeStep?.icon} {activeStep?.label}
        </span>
        {currentStep < 5 && (
          <span className="text-xs text-gray-400">· updating every 30s</span>
        )}
      </div>

      {/* Timeline */}
      <div className="px-4 py-3 space-y-0">
        {STEPS.map((s, idx) => {
          const done   = currentStep > s.step
          const active = currentStep === s.step
          const future = currentStep < s.step
          const isLast = idx === STEPS.length - 1
          const stepInfo = apt.steps?.find(st => st.step === s.step)
          const c = COLOR[s.color]

          return (
            <div key={s.step} className="flex gap-3">
              {/* Dot + connector */}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 transition-all duration-500 ${
                  done   ? `${c.dot} text-white` :
                  active ? `${c.dot} text-white ring-4 ${c.ring} animate-pulse` :
                           'bg-gray-100 text-gray-400'
                }`}>
                  {done ? '✓' : active ? s.step : s.step}
                </div>
                {!isLast && (
                  <div className={`w-0.5 flex-1 my-1 min-h-[20px] transition-all duration-500 ${
                    done ? c.line : 'bg-gray-200'
                  }`} />
                )}
              </div>

              {/* Label + time */}
              <div className={`pb-4 flex-1 ${isLast ? '' : ''}`}>
                <div className={`text-sm font-medium leading-8 ${
                  done ? 'text-gray-700' : active ? c.text + ' font-semibold' : 'text-gray-400'
                }`}>
                  {s.label}
                  {active && (
                    <span className="ml-2 inline-flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  )}
                </div>
                {stepInfo?.time && (
                  <div className="text-xs text-gray-400 -mt-2">{fmt(stepInfo.time)}</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Apt number */}
      <div className="px-4 pb-3 text-xs text-gray-400">{apt.appointmentNumber}</div>
    </div>
  )
}

export default function Home() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [journeys, setJourneys]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [lastRefresh, setLastRefresh] = useState(null)
  const timerRef = useRef(null)

  const loadJourney = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await api.get('/appointment/my/journey')
      if (res.data.success) {
        setJourneys(res.data.data || [])
        setLastRefresh(new Date())
      }
    } catch(e) { console.error(e) }
    finally { if (!silent) setLoading(false) }
  }

  useEffect(() => {
    loadJourney()
    // Auto-refresh every 30 seconds
    timerRef.current = setInterval(() => loadJourney(true), 30000)
    return () => clearInterval(timerRef.current)
  }, [])

  const hasActiveVisit = journeys.some(j => j.currentStep < 5)

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-emerald-600 text-white px-4 pt-8 pb-16">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-emerald-200 text-sm">Welcome back</p>
            <h1 className="text-xl font-bold">{user?.fullName}</h1>
            <p className="text-emerald-200 text-xs mt-0.5">{user?.hospitalName}</p>
          </div>
          <button onClick={logout} className="text-emerald-200 hover:text-white text-sm">
            Logout
          </button>
        </div>
      </div>

      <div className="px-4 -mt-8 space-y-4 pb-24">

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: '📅', label: 'Appointments', path: '/appointments' },
            { icon: '💊', label: 'Prescriptions', path: '/prescriptions' },
            { icon: '🧾', label: 'Bills',         path: '/bills'         },
          ].map(item => (
            <button key={item.path} onClick={() => navigate(item.path)}
              className="bg-white rounded-2xl p-4 shadow-sm flex flex-col items-center gap-2 hover:shadow-md transition-shadow">
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs font-medium text-gray-700">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Journey tracker */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-800">
              {hasActiveVisit ? "Today's Visit Status" : "Today's Appointments"}
            </h3>
            {lastRefresh && hasActiveVisit && (
              <button onClick={() => loadJourney(true)}
                className="text-xs text-emerald-600 font-medium">
                Refresh
              </button>
            )}
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
              <div className="text-gray-400 text-sm">Loading...</div>
            </div>
          ) : journeys.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
              <div className="text-3xl mb-2">📅</div>
              <div className="text-gray-500 text-sm">No appointments today</div>
              <button onClick={() => navigate('/appointments')}
                className="mt-3 text-emerald-600 text-sm font-medium">
                Book an appointment →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {journeys.map(apt => <JourneyCard key={apt.id} apt={apt} />)}
            </div>
          )}
        </div>

        {/* Health Tip */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
          <h3 className="font-semibold text-emerald-800 mb-2">Health Tip</h3>
          <p className="text-emerald-700 text-sm">
            Stay hydrated! Drink at least 8 glasses of water every day for better health.
          </p>
        </div>
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
