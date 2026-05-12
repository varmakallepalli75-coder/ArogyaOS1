import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { superAdminService } from '../../services/superAdminService'
import SuperAdminLayout from './SuperAdminLayout'

const CATEGORIES = [
  { id: 'General',       label: 'General Hospital',     icon: '🏥', desc: 'Full-service multi-purpose',          modules: { hasOPD: true, hasIPD: true,  hasLab: true,  hasPharmacy: true,  hasRadiology: true  } },
  { id: 'MultiSpeciality', label: 'Multi-Speciality',   icon: '🏨', desc: 'Multiple specialities under one roof', modules: { hasOPD: true, hasIPD: true,  hasLab: true,  hasPharmacy: true,  hasRadiology: true  } },
  { id: 'Dental',        label: 'Dental Clinic',         icon: '🦷', desc: 'Dental care and oral health',         modules: { hasOPD: true, hasIPD: false, hasLab: false, hasPharmacy: true,  hasRadiology: false } },
  { id: 'Eye',           label: 'Eye Hospital',          icon: '👁', desc: 'Ophthalmology and eye care',          modules: { hasOPD: true, hasIPD: false, hasLab: true,  hasPharmacy: false, hasRadiology: false } },
  { id: 'Maternity',     label: 'Maternity Hospital',    icon: '🤱', desc: 'Maternity and gynecology',            modules: { hasOPD: true, hasIPD: true,  hasLab: true,  hasPharmacy: true,  hasRadiology: false } },
  { id: 'Orthopedic',   label: 'Orthopedic',             icon: '🦴', desc: 'Bone, joint and muscle care',         modules: { hasOPD: true, hasIPD: true,  hasLab: true,  hasPharmacy: false, hasRadiology: true  } },
  { id: 'Pediatric',    label: 'Pediatric',              icon: '👶', desc: 'Child health and care',               modules: { hasOPD: true, hasIPD: true,  hasLab: true,  hasPharmacy: true,  hasRadiology: false } },
  { id: 'Cardiac',      label: 'Cardiac / Heart',        icon: '❤️', desc: 'Cardiology and heart care',           modules: { hasOPD: true, hasIPD: true,  hasLab: true,  hasPharmacy: false, hasRadiology: true  } },
  { id: 'Oncology',     label: 'Cancer / Oncology',      icon: '🎗', desc: 'Cancer diagnosis and treatment',      modules: { hasOPD: true, hasIPD: true,  hasLab: true,  hasPharmacy: true,  hasRadiology: true  } },
  { id: 'ENT',          label: 'ENT',                    icon: '👂', desc: 'Ear, nose and throat care',           modules: { hasOPD: true, hasIPD: false, hasLab: true,  hasPharmacy: false, hasRadiology: false } },
  { id: 'Dermatology',  label: 'Skin / Dermatology',     icon: '🩺', desc: 'Skin care and cosmetic',              modules: { hasOPD: true, hasIPD: false, hasLab: false, hasPharmacy: true,  hasRadiology: false } },
  { id: 'Psychiatric',  label: 'Psychiatric',            icon: '🧠', desc: 'Mental health and psychiatry',        modules: { hasOPD: true, hasIPD: true,  hasLab: false, hasPharmacy: true,  hasRadiology: false } },
  { id: 'Dialysis',     label: 'Dialysis Center',        icon: '💉', desc: 'Kidney care and dialysis',            modules: { hasOPD: true, hasIPD: true,  hasLab: true,  hasPharmacy: false, hasRadiology: false } },
  { id: 'Trauma',       label: 'Trauma Center',          icon: '🚑', desc: 'Emergency and trauma care',           modules: { hasOPD: true, hasIPD: true,  hasLab: true,  hasPharmacy: false, hasRadiology: true  } },
  { id: 'Rehabilitation', label: 'Rehabilitation',       icon: '♿', desc: 'Physical therapy and rehab',          modules: { hasOPD: true, hasIPD: true,  hasLab: false, hasPharmacy: false, hasRadiology: false } },
]

const ALL_MODULES = [
  { id: 'hasOPD',          label: 'OPD / Outpatient',   icon: '🏥', always: true },
  { id: 'hasIPD',          label: 'IPD & Beds',          icon: '🛏️' },
  { id: 'hasLab',          label: 'Laboratory',          icon: '🔬' },
  { id: 'hasPharmacy',     label: 'Pharmacy',            icon: '💊' },
  { id: 'hasRadiology',    label: 'Radiology',           icon: '🔭' },
  { id: 'hasBilling',      label: 'Billing',             icon: '🧾', always: true },
  { id: 'hasPatientPortal',label: 'Patient Portal',      icon: '📱' },
  { id: 'hasHR',           label: 'Staff & HR',          icon: '👥' },
  { id: 'hasReports',      label: 'Reports & Analytics', icon: '📊' },
]

const CATEGORY_SERVICES = {
  General:        [{ c:'GM',   n:'General Medicine' },{ c:'GS',    n:'General Surgery' },{ c:'EMER', n:'Emergency Medicine' },{ c:'PED',  n:'Pediatrics' },{ c:'GYN',  n:'Obstetrics & Gynecology' },{ c:'ORTH', n:'Orthopedics' },{ c:'CARD', n:'Cardiology' },{ c:'NEUR', n:'Neurology' },{ c:'ENT',  n:'ENT' },{ c:'DERM', n:'Dermatology' },{ c:'PSYC', n:'Psychiatry' },{ c:'PULM', n:'Pulmonology' },{ c:'NEPH', n:'Nephrology' },{ c:'UROL', n:'Urology' },{ c:'OPHT', n:'Ophthalmology' },{ c:'PHYS', n:'Physiotherapy' },{ c:'ANES', n:'Anesthesiology' },{ c:'RAD',  n:'Radiology' }],
  MultiSpeciality:[{ c:'GM',   n:'General Medicine' },{ c:'GS',    n:'General Surgery' },{ c:'EMER', n:'Emergency Medicine' },{ c:'PED',  n:'Pediatrics' },{ c:'GYN',  n:'Obstetrics & Gynecology' },{ c:'ORTH', n:'Orthopedics' },{ c:'CARD', n:'Cardiology' },{ c:'NEUR', n:'Neurology' },{ c:'ENT',  n:'ENT' },{ c:'DERM', n:'Dermatology' },{ c:'ONCO', n:'Oncology' },{ c:'NEPH', n:'Nephrology' },{ c:'UROL', n:'Urology' },{ c:'PULM', n:'Pulmonology' },{ c:'OPHT', n:'Ophthalmology' },{ c:'PSYC', n:'Psychiatry' },{ c:'PHYS', n:'Physiotherapy' },{ c:'ANES', n:'Anesthesiology' },{ c:'RAD',  n:'Radiology' }],
  Dental:         [{ c:'DENT', n:'General Dentistry' },{ c:'ORSU', n:'Oral Surgery' },{ c:'ORTO', n:'Orthodontics' },{ c:'ENDO', n:'Endodontics (Root Canal)' },{ c:'PERI', n:'Periodontics (Gum)' },{ c:'PROS', n:'Prosthodontics' },{ c:'PDED', n:'Pediatric Dentistry' },{ c:'OMFS', n:'Oral & Maxillofacial Surgery' },{ c:'IMPL', n:'Dental Implants' },{ c:'AEST', n:'Cosmetic Dentistry' }],
  Eye:            [{ c:'OPHT', n:'General Ophthalmology' },{ c:'CATA', n:'Cataract Surgery' },{ c:'RETN', n:'Retina' },{ c:'GLAU', n:'Glaucoma' },{ c:'LASI', n:'LASIK / Refractive Surgery' },{ c:'CORN', n:'Cornea & Anterior Segment' },{ c:'POPT', n:'Pediatric Ophthalmology' },{ c:'OCPL', n:'Oculoplasty' }],
  Maternity:      [{ c:'OBG',  n:'Obstetrics & Gynecology' },{ c:'FERT', n:'Fertility & IVF' },{ c:'NEON', n:'Neonatology' },{ c:'PEDI', n:'Pediatrics' },{ c:'PHYS', n:'Physiotherapy' },{ c:'DIET', n:'Nutrition & Dietetics' }],
  Orthopedic:     [{ c:'GORT', n:'General Orthopedics' },{ c:'SPIN', n:'Spine Surgery' },{ c:'JOIN', n:'Joint Replacement' },{ c:'SPOT', n:'Sports Medicine' },{ c:'HAND', n:'Hand Surgery' },{ c:'FOOT', n:'Foot & Ankle' },{ c:'PHYS', n:'Physiotherapy' },{ c:'PEDO', n:'Pediatric Orthopedics' }],
  Pediatric:      [{ c:'GPED', n:'General Pediatrics' },{ c:'NEON', n:'Neonatology' },{ c:'PCAR', n:'Pediatric Cardiology' },{ c:'PNEU', n:'Pediatric Neurology' },{ c:'PSUR', n:'Pediatric Surgery' },{ c:'PGAS', n:'Pediatric Gastroenterology' },{ c:'VACC', n:'Vaccination' },{ c:'PEND', n:'Pediatric Endocrinology' }],
  Cardiac:        [{ c:'CARD', n:'Cardiology' },{ c:'CSUR', n:'Cardiac Surgery' },{ c:'INTH', n:'Interventional Cardiology' },{ c:'ELEC', n:'Electrophysiology' },{ c:'VASC', n:'Vascular Surgery' },{ c:'REHC', n:'Cardiac Rehabilitation' }],
  Oncology:       [{ c:'MEDO', n:'Medical Oncology' },{ c:'SURO', n:'Surgical Oncology' },{ c:'RADO', n:'Radiation Oncology' },{ c:'HEMO', n:'Hematology & BMT' },{ c:'GYNO', n:'Gynecologic Oncology' },{ c:'PEDO', n:'Pediatric Oncology' },{ c:'PALL', n:'Palliative Care' }],
  ENT:            [{ c:'GENT', n:'General ENT' },{ c:'HEAR', n:'Hearing & Audiometry' },{ c:'HEAD', n:'Head & Neck Surgery' },{ c:'RHIN', n:'Rhinology & Sinuses' },{ c:'LARY', n:'Laryngology & Voice' },{ c:'PENT', n:'Pediatric ENT' }],
  Dermatology:    [{ c:'DERM', n:'General Dermatology' },{ c:'COSM', n:'Cosmetic Dermatology' },{ c:'TRIC', n:'Trichology (Hair)' },{ c:'LASE', n:'Laser & Aesthetics' },{ c:'PDERM',n:'Pediatric Dermatology' }],
  Psychiatric:    [{ c:'PSYC', n:'General Psychiatry' },{ c:'CHIL', n:'Child & Adolescent Psychiatry' },{ c:'ADDI', n:'Addiction Medicine' },{ c:'PSYT', n:'Psychotherapy' },{ c:'GERO', n:'Geriatric Psychiatry' }],
  Dialysis:       [{ c:'NEPH', n:'Nephrology' },{ c:'DIAL', n:'Hemodialysis' },{ c:'PERD', n:'Peritoneal Dialysis' },{ c:'TRAN', n:'Transplant Medicine' }],
  Trauma:         [{ c:'EMER', n:'Emergency Medicine' },{ c:'TSUR', n:'Trauma Surgery' },{ c:'NEUS', n:'Neurosurgery' },{ c:'ORTH', n:'Orthopedics' },{ c:'BURN', n:'Burns & Plastic Surgery' },{ c:'ICU',  n:'Intensive Care (ICU)' }],
  Rehabilitation: [{ c:'PHYS', n:'Physiotherapy' },{ c:'OCCU', n:'Occupational Therapy' },{ c:'SPEE', n:'Speech Therapy' },{ c:'REHA', n:'Rehabilitation Medicine' },{ c:'NREU', n:'Neuro Rehabilitation' }],
}

const STEPS = ['Hospital Info', 'Specialty & Modules', 'Medical Services', 'Admin Account', 'Plan']

const defaultForm = {
  hospitalName: '', hospitalEmail: '', phone: '',
  address: '', city: '', state: '', pinCode: '',
  gstNumber: '', totalBeds: '', hospitalType: 'Private',
  category: '',
  hasOPD: true, hasIPD: false, hasLab: false, hasPharmacy: false,
  hasRadiology: false, hasBilling: true, hasPatientPortal: false,
  hasHR: false, hasReports: false,
  services: [],
  adminFirstName: '', adminLastName: '',
  adminEmail: '', adminPhone: '', password: '',
  plan: 'Trial'
}

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
      // Extract real error from API response
      const apiMsg = e.response?.data?.message
        || e.response?.data?.errors?.request?.[0]
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
        <p className="text-gray-500 mb-6">The hospital has been successfully registered on ArogyaOS.</p>
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
    <SuperAdminLayout title="Onboard New Hospital" subtitle="Register a new hospital on ArogyaOS">
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

          {/* ── Step 1 — Hospital Info ── */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-bold text-gray-900 mb-4">🏥 Hospital Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Hospital Name *</label>
                  <input value={form.hospitalName} onChange={e => set('hospitalName', e.target.value)}
                    placeholder="Apollo Hospital Hyderabad"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Hospital Email *</label>
                  <input value={form.hospitalEmail} onChange={e => set('hospitalEmail', e.target.value)}
                    placeholder="info@hospital.com"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phone *</label>
                  <input value={form.phone} onChange={e => set('phone', e.target.value)}
                    placeholder="9876543210"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Address *</label>
                  <input value={form.address} onChange={e => set('address', e.target.value)}
                    placeholder="123 Hospital Road"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">City *</label>
                  <input value={form.city} onChange={e => set('city', e.target.value)}
                    placeholder="Hyderabad"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">State *</label>
                  <input value={form.state} onChange={e => set('state', e.target.value)}
                    placeholder="Telangana"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">PIN Code *</label>
                  <input value={form.pinCode} onChange={e => set('pinCode', e.target.value)}
                    placeholder="500001"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Total Beds</label>
                  <input value={form.totalBeds} onChange={e => set('totalBeds', e.target.value)}
                    placeholder="100" type="number"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ownership Type</label>
                  <select value={form.hospitalType} onChange={e => set('hospitalType', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option>Private</option>
                    <option>Government</option>
                    <option>Trust</option>
                    <option>Corporate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">GST Number</label>
                  <input value={form.gstNumber} onChange={e => set('gstNumber', e.target.value)}
                    placeholder="22AAAAA0000A1Z5"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <button onClick={() => setStep(2)}
                disabled={!form.hospitalName || !form.hospitalEmail || !form.phone || !form.city || !form.state}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-40 mt-2">
                Next: Specialty & Modules →
              </button>
            </div>
          )}

          {/* ── Step 2 — Specialty & Modules ── */}
          {step === 2 && (
            <div>
              <h2 className="font-bold text-gray-900 mb-1">🏷️ Hospital Specialty</h2>
              <p className="text-xs text-gray-500 mb-4">Select the specialty — modules and medical services will be pre-selected. You can customize in the next step.</p>

              {/* Category grid */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                {CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => selectCategory(cat.id)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      form.category === cat.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}>
                    <div className="text-xl mb-1">{cat.icon}</div>
                    <div className="text-xs font-semibold text-gray-900 leading-tight">{cat.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5 leading-tight hidden sm:block">{cat.desc}</div>
                  </button>
                ))}
              </div>

              {/* Module toggles */}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-900">Active Modules</h3>
                  {selectedCat && (
                    <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-medium">
                      {selectedCat.icon} {selectedCat.label} defaults
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_MODULES.map(mod => (
                    <label key={mod.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        form[mod.id]
                          ? 'border-emerald-400 bg-emerald-50'
                          : 'border-gray-200 bg-white'
                      } ${mod.always ? 'opacity-70' : ''}`}>
                      <input
                        type="checkbox"
                        checked={!!form[mod.id]}
                        disabled={mod.always}
                        onChange={e => !mod.always && set(mod.id, e.target.checked)}
                        className="w-4 h-4 accent-emerald-600"
                      />
                      <span className="text-base">{mod.icon}</span>
                      <span className="text-xs font-medium text-gray-800">{mod.label}</span>
                      {mod.always && <span className="ml-auto text-xs text-gray-400">Always on</span>}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
                  ← Back
                </button>
                <button onClick={() => setStep(3)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold text-sm">
                  Next: Medical Services →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3 — Medical Services ── */}
          {step === 3 && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-bold text-gray-900">🔬 Medical Services</h2>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
                  {form.services.length} selected
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                These become department options in the doctor registration form. Pre-selected for <strong>{selectedCat?.label}</strong>.
              </p>

              {/* Preset services checklist */}
              <div className="grid grid-cols-2 gap-2 mb-5">
                {allCatServices.map(svc => {
                  const checked = form.services.some(s => s.code === svc.c)
                  return (
                    <label key={svc.c}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        checked ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleService(svc.c)}
                        className="w-4 h-4 accent-emerald-600 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-gray-900 truncate">{svc.n}</div>
                        <div className="text-xs text-gray-400 font-mono">{svc.c}</div>
                      </div>
                    </label>
                  )
                })}
              </div>

              {/* Custom services already added (that aren't in the category preset) */}
              {form.services.filter(s => !allCatServices.some(a => a.c === s.code)).length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Custom Services Added</p>
                  <div className="flex flex-wrap gap-2">
                    {form.services
                      .filter(s => !allCatServices.some(a => a.c === s.code))
                      .map(s => (
                        <div key={s.code}
                          className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs px-3 py-1.5 rounded-full">
                          <span className="font-mono font-bold">{s.code}</span>
                          <span>{s.name}</span>
                          <button onClick={() => removeService(s.code)}
                            className="ml-1 text-blue-400 hover:text-blue-700 font-bold">×</button>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}

              {/* Add custom service */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-600 mb-2">Add Custom Service</p>
                <div className="flex gap-2">
                  <input
                    value={customService.code}
                    onChange={e => setCustomService(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                    placeholder="Code (e.g. CARD)"
                    maxLength={8}
                    className="w-28 px-3 py-2.5 border border-gray-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
                  />
                  <input
                    value={customService.name}
                    onChange={e => setCustomService(p => ({ ...p, name: e.target.value }))}
                    placeholder="Service name (e.g. Cardiology)"
                    className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    onKeyDown={e => e.key === 'Enter' && addCustomService()}
                  />
                  <button
                    onClick={addCustomService}
                    disabled={!customService.code || !customService.name}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold disabled:opacity-40">
                    + Add
                  </button>
                </div>
              </div>

              {form.category === '' && (
                <div className="mt-3 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2.5 rounded-xl text-xs">
                  ⚠️ No specialty selected. Go back to Step 2 and pick a category to load preset services.
                </div>
              )}
              {form.category !== '' && form.services.length === 0 && (
                <div className="mt-3 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2.5 rounded-xl text-xs">
                  ⚠️ No services selected. Doctors won't have department options. Select at least one.
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(2)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
                  ← Back
                </button>
                <button onClick={() => setStep(4)}
                  disabled={form.services.length === 0}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-40">
                  Next: Admin Account →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4 — Admin Account ── */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-bold text-gray-900 mb-4">👤 Admin Account</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">First Name *</label>
                  <input value={form.adminFirstName} onChange={e => set('adminFirstName', e.target.value)}
                    placeholder="Rajesh"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Last Name *</label>
                  <input value={form.adminLastName} onChange={e => set('adminLastName', e.target.value)}
                    placeholder="Kumar"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Admin Email *</label>
                  <input value={form.adminEmail} onChange={e => set('adminEmail', e.target.value)}
                    placeholder="admin@hospital.com"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Admin Phone *</label>
                  <input value={form.adminPhone} onChange={e => set('adminPhone', e.target.value)}
                    placeholder="9876543210"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Password *</label>
                  <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                    placeholder="Min 8 chars"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <p className="text-xs text-blue-700">
                  💡 The admin will use this email and password to log in to the hospital dashboard.
                  Share these credentials securely with the hospital.
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(3)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
                  ← Back
                </button>
                <button onClick={() => setStep(5)}
                  disabled={!form.adminFirstName || !form.adminLastName || !form.adminEmail || !form.password}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-40">
                  Next: Plan →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 5 — Plan & Summary ── */}
          {step === 5 && (
            <div>
              <h2 className="font-bold text-gray-900 mb-4">📋 Subscription Plan</h2>
              <div className="space-y-3 mb-6">
                {[
                  { plan: 'Trial',      price: '₹0',         duration: '30 days free', features: 'OPD + Billing, 3 users, 100 patients',      color: 'border-gray-300'    },
                  { plan: 'Starter',    price: '₹2,999/mo',  duration: '',             features: 'OPD + Billing, 5 users, 500 patients',        color: 'border-blue-300'    },
                  { plan: 'Growth',     price: '₹7,999/mo',  duration: '',             features: 'All modules, 25 users, 5,000 patients',        color: 'border-emerald-300' },
                  { plan: 'Enterprise', price: '₹19,999/mo', duration: '',             features: 'Unlimited everything + Reports + API',         color: 'border-purple-300'  },
                ].map(p => (
                  <div key={p.plan}
                    onClick={() => set('plan', p.plan)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      form.plan === p.plan ? 'border-emerald-500 bg-emerald-50' : `${p.color} hover:border-gray-400`
                    }`}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{p.plan}</span>
                        {p.duration && <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full">{p.duration}</span>}
                      </div>
                      <span className="font-bold text-emerald-600">{p.price}</span>
                    </div>
                    <p className="text-xs text-gray-500">{p.features}</p>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="bg-slate-50 rounded-xl p-4 mb-6 space-y-3">
                <h4 className="text-sm font-bold text-gray-900">📋 Summary</h4>
                <div className="space-y-1.5 text-sm">
                  {[
                    ['Hospital', form.hospitalName],
                    ['Specialty', `${selectedCat?.icon} ${selectedCat?.label}`],
                    ['Admin', form.adminEmail],
                    ['Location', `${form.city}, ${form.state}`],
                    ['Plan', form.plan],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-gray-500">{k}</span>
                      <span className="font-medium">{v}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2 font-medium">Active Modules:</p>
                  <div className="flex flex-wrap gap-1">
                    {ALL_MODULES.filter(m => form[m.id]).map(m => (
                      <span key={m.id} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                        {m.icon} {m.label}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2 font-medium">Medical Services ({form.services.length}):</p>
                  <div className="flex flex-wrap gap-1">
                    {form.services.map(s => (
                      <span key={s.code} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-mono">
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(4)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
                  ← Back
                </button>
                <button onClick={handleSubmit} disabled={loading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-50">
                  {loading ? 'Onboarding...' : '🚀 Onboard Hospital'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </SuperAdminLayout>
  )
}
