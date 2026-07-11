export const CATEGORIES = [
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

export const ALL_MODULES = [
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

export const CATEGORY_SERVICES = {
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

export const STEPS = ['Hospital Info', 'Specialty & Modules', 'Medical Services', 'Admin Account', 'Plan']

export const PLANS = [
  { plan: 'Trial',      price: '₹0',        duration: '30 days free', features: 'OPD + Billing, 3 users, 100 patients',   color: 'border-gray-300'    },
  { plan: 'Starter',    price: '₹1,999/mo', duration: '',             features: 'OPD + Billing, 5 users, 500 patients',   color: 'border-blue-300'    },
  { plan: 'Growth',     price: '₹4,999/mo', duration: '',             features: 'All modules, 25 users, 5,000 patients',  color: 'border-emerald-300' },
  { plan: 'Enterprise', price: '₹9,999/mo', duration: '',             features: 'Unlimited everything + Reports + API',   color: 'border-purple-300'  },
]

export const defaultForm = {
  hospitalName: '', hospitalEmail: '', phone: '',
  address: '', city: '', state: '', pinCode: '',
  gstNumber: '', totalBeds: '', hospitalType: 'Private',
  category: '',
  website: '', facebookUrl: '', instagramUrl: '', linkedInUrl: '',
  hasOPD: true, hasIPD: false, hasLab: false, hasPharmacy: false,
  hasRadiology: false, hasBilling: true, hasPatientPortal: false,
  hasHR: false, hasReports: false,
  services: [],
  adminFirstName: '', adminLastName: '',
  adminEmail: '', adminPhone: '', password: '',
  plan: 'Trial'
}
