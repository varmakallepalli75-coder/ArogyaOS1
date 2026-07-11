export default function StepMedicalServices({
  form, selectedCat, allCatServices, toggleService, removeService,
  customService, setCustomService, addCustomService, onNext, onBack
}) {
  return (
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
        <button onClick={onBack}
          className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
          ← Back
        </button>
        <button onClick={onNext}
          disabled={form.services.length === 0}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-40">
          Next: Admin Account →
        </button>
      </div>
    </div>
  )
}
