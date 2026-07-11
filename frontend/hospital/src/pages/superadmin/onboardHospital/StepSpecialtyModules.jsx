import { CATEGORIES, ALL_MODULES } from './constants'

export default function StepSpecialtyModules({ form, set, selectedCat, selectCategory, onNext, onBack }) {
  return (
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
        <button onClick={onBack}
          className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
          ← Back
        </button>
        <button onClick={onNext}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold text-sm">
          Next: Medical Services →
        </button>
      </div>
    </div>
  )
}
