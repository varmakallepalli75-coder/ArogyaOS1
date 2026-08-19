export default function StepAdminAccount({ form, set, onNext, onBack }) {
  return (
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
        <button onClick={onBack}
          className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
          ← Back
        </button>
        <button onClick={onNext}
          disabled={!form.adminFirstName || !form.adminLastName || !form.adminEmail || !form.adminPhone || form.password.length < 8}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-40">
          Next: Plan →
        </button>
      </div>
    </div>
  )
}
