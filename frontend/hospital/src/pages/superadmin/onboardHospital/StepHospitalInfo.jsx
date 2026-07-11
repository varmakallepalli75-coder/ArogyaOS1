export default function StepHospitalInfo({ form, set, onNext }) {
  return (
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
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Website</label>
          <input value={form.website} onChange={e => set('website', e.target.value)}
            placeholder="https://www.hospital.com"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Facebook</label>
          <input value={form.facebookUrl} onChange={e => set('facebookUrl', e.target.value)}
            placeholder="https://facebook.com/hospital"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Instagram</label>
          <input value={form.instagramUrl} onChange={e => set('instagramUrl', e.target.value)}
            placeholder="https://instagram.com/hospital"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">LinkedIn</label>
          <input value={form.linkedInUrl} onChange={e => set('linkedInUrl', e.target.value)}
            placeholder="https://linkedin.com/company/hospital"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
      </div>
      <button onClick={onNext}
        disabled={!form.hospitalName || !form.hospitalEmail || !form.phone || !form.city || !form.state}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-40 mt-2">
        Next: Specialty & Modules →
      </button>
    </div>
  )
}
