import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { superAdminService } from '../../services/superAdminService'
import SuperAdminLayout from './SuperAdminLayout'
import { CATEGORIES, CATEGORY_SERVICES, STEPS, defaultForm } from './onboardHospital/constants'
import StepHospitalInfo from './onboardHospital/StepHospitalInfo'
import StepSpecialtyModules from './onboardHospital/StepSpecialtyModules'
import StepMedicalServices from './onboardHospital/StepMedicalServices'
import StepAdminAccount from './onboardHospital/StepAdminAccount'
import StepPlanSummary from './onboardHospital/StepPlanSummary'

export default function OnboardHospital() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(defaultForm)
  const [customService, setCustomService] = useState({ code: '', name: '' })

  const set = (field, value) => setForm(p => ({ ...p, [field]: value }))

  const selectCategory = (catId) => {
    const cat = CATEGORIES.find(c => c.id === catId)
    if (!cat) return
    const defaultServices = (CATEGORY_SERVICES[catId] || []).map(s => ({ code: s.c, name: s.n }))
    setForm(p => ({ ...p, category: catId, ...cat.modules, services: defaultServices }))
  }

  const toggleService = (code) => {
    setForm(p => {
      const exists = p.services.some(s => s.code === code)
      if (exists) {
        return { ...p, services: p.services.filter(s => s.code !== code) }
      } else {
        const allForCat = CATEGORY_SERVICES[p.category] || []
        const found = allForCat.find(s => s.c === code)
        if (found) return { ...p, services: [...p.services, { code: found.c, name: found.n }] }
        return p
      }
    })
  }

  const addCustomService = () => {
    const code = customService.code.trim().toUpperCase()
    const name = customService.name.trim()
    if (!code || !name) return
    if (form.services.some(s => s.code === code)) return
    setForm(p => ({ ...p, services: [...p.services, { code, name }] }))
    setCustomService({ code: '', name: '' })
  }

  const removeService = (code) => {
    setForm(p => ({ ...p, services: p.services.filter(s => s.code !== code) }))
  }

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await superAdminService.onboardHospital({
        ...form,
        totalBeds: parseInt(form.totalBeds) || 0,
        services: form.services
      })
      if (res.success) {
        setSuccess(res.data)
      } else {
        setError(res.message || 'Failed to onboard hospital')
      }
    } catch(e) {
      // Extract real error from API response. ASP.NET's automatic model
      // validation returns { title: "One or more validation errors occurred.",
      // errors: { FieldName: ["message"], ... } } — surface the actual
      // per-field messages instead of just the generic title.
      const validationErrors = e.response?.data?.errors
      const fieldErrors = validationErrors && Object.values(validationErrors).flat().join(' ')
      const apiMsg = e.response?.data?.message
        || fieldErrors
        || e.response?.data?.title
        || e.message
        || 'Something went wrong. Please try again.'
      setError(apiMsg)
    } finally {
      setLoading(false)
    }
  }

  if (success) return (
    <SuperAdminLayout title="Hospital Onboarded">
    <div className="flex items-center justify-center py-12">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Hospital Onboarded!</h2>
        <p className="text-gray-500 mb-6">The hospital has been successfully registered on MedCareAxis.</p>
        <div className="bg-emerald-50 rounded-xl p-4 mb-6 text-left space-y-2">
          {[
            ['Hospital Code', success.hospitalCode],
            ['Hospital Name', success.hospitalName],
            ['Admin Email', success.adminEmail],
            ['Plan', success.plan],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <span className="text-sm text-gray-500">{k}</span>
              <span className={`text-sm font-bold ${k === 'Hospital Code' ? 'text-emerald-600 font-mono' : ''}`}>{v}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/super-admin/hospitals')}
            className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
            View All Hospitals
          </button>
          <button onClick={() => { setSuccess(null); setForm(defaultForm); setStep(1) }}
            className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold">
            Onboard Another
          </button>
        </div>
      </div>
    </div>
    </SuperAdminLayout>
  )

  const selectedCat = CATEGORIES.find(c => c.id === form.category)
  const allCatServices = CATEGORY_SERVICES[form.category] || []

  return (
    <SuperAdminLayout title="Onboard New Hospital" subtitle="Register a new hospital on MedCareAxis">
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="flex items-center mb-8">
          {STEPS.map((label, i) => {
            const s = i + 1
            return (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    step >= s ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>{s}</div>
                  <div className={`text-xs font-medium hidden sm:block ${step >= s ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {label}
                  </div>
                </div>
                {s < STEPS.length && <div className={`flex-1 h-0.5 mx-2 ${step > s ? 'bg-emerald-600' : 'bg-gray-200'}`} />}
              </div>
            )
          })}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-4">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {step === 1 && (
            <StepHospitalInfo form={form} set={set} onNext={() => setStep(2)} />
          )}
          {step === 2 && (
            <StepSpecialtyModules
              form={form} set={set} selectedCat={selectedCat} selectCategory={selectCategory}
              onNext={() => setStep(3)} onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <StepMedicalServices
              form={form} selectedCat={selectedCat} allCatServices={allCatServices}
              toggleService={toggleService} removeService={removeService}
              customService={customService} setCustomService={setCustomService} addCustomService={addCustomService}
              onNext={() => setStep(4)} onBack={() => setStep(2)}
            />
          )}
          {step === 4 && (
            <StepAdminAccount form={form} set={set} onNext={() => setStep(5)} onBack={() => setStep(3)} />
          )}
          {step === 5 && (
            <StepPlanSummary
              form={form} set={set} selectedCat={selectedCat} loading={loading}
              onSubmit={handleSubmit} onBack={() => setStep(4)}
            />
          )}
        </div>
      </div>
    </SuperAdminLayout>
  )
}
