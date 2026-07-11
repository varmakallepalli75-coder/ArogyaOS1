import { ALL_MODULES, PLANS } from './constants'

export default function StepPlanSummary({ form, set, selectedCat, loading, onSubmit, onBack }) {
  return (
    <div>
      <h2 className="font-bold text-gray-900 mb-4">📋 Subscription Plan</h2>
      <div className="space-y-3 mb-6">
        {PLANS.map(p => (
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
        <button onClick={onBack}
          className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
          ← Back
        </button>
        <button onClick={onSubmit} disabled={loading}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-50">
          {loading ? 'Onboarding...' : '🚀 Onboard Hospital'}
        </button>
      </div>
    </div>
  )
}
