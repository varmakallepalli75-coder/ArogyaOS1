import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { superAdminService } from '../../services/superAdminService'
import SuperAdminLayout from './SuperAdminLayout'

const STATUS_COLOR = {
  Active:      'bg-emerald-100 text-emerald-700',
  Suspended:   'bg-amber-100 text-amber-700',
  Pending:     'bg-blue-100 text-blue-700',
  Deactivated: 'bg-red-100 text-red-700',
}

export default function SuperAdminHospitals() {
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [status, setStatus]     = useState('')
  const [page, setPage]         = useState(1)
  const [total, setTotal]       = useState(0)
  const navigate  = useNavigate()
  const pageSize  = 20

  useEffect(() => { load() }, [search, status, page])

  const load = async () => {
    setLoading(true)
    try {
      const params = { page, pageSize }
      if (search) params.search = search
      if (status) params.status = status
      const res = await superAdminService.getHospitals(params)
      if (res.success) {
        setHospitals(res.data.items)
        setTotal(res.data.totalCount)
      }
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  return (
    <SuperAdminLayout title="Hospitals" subtitle={`${total} hospitals on the platform`}>
      {/* Toolbar */}
      <div className="flex gap-3 mb-5">
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search by name, code, city, email..."
          className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1) }}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none">
          <option value="">All Status</option>
          <option value="0">Pending</option>
          <option value="1">Active</option>
          <option value="2">Suspended</option>
          <option value="3">Deactivated</option>
        </select>
        <button
          onClick={() => navigate('/super-admin/hospitals/new')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap">
          + Onboard Hospital
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : hospitals.length === 0 ? (
          <div className="text-center py-20 text-gray-400">No hospitals found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Code', 'Hospital', 'Location', 'Specialty', 'Plan', 'Status', 'MRR', 'Actions'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {hospitals.map(h => (
                  <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-xs font-mono text-emerald-600 font-bold">{h.hospitalCode}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">{h.name}</div>
                      <div className="text-xs text-gray-400">{h.adminEmail}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{h.city}, {h.state}</td>
                    <td className="px-6 py-4">
                      {h.category
                        ? <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">{h.category}</span>
                        : <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{h.plan}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[h.status] || 'bg-gray-100 text-gray-500'}`}>
                        {h.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      ₹{h.monthlyAmount?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigate(`/super-admin/hospitals/${h.id}`)}
                        className="bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                        Manage →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > pageSize && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
            </span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                ← Prev
              </button>
              <button disabled={page >= Math.ceil(total / pageSize)} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  )
}
