import { useState, useEffect } from 'react'
import api from '../../services/api'
import SuperAdminLayout from './SuperAdminLayout'

const ACTION_STYLES = {
  Create: 'bg-emerald-100 text-emerald-700',
  Update: 'bg-blue-100 text-blue-700',
  Delete: 'bg-red-100 text-red-700',
  Login:  'bg-purple-100 text-purple-700',
  Logout: 'bg-gray-100 text-gray-600',
  Print:  'bg-amber-100 text-amber-700',
  Export: 'bg-indigo-100 text-indigo-700',
}

export default function SuperAdminAuditLogs() {
  const [logs, setLogs]       = useState([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [search, setSearch]   = useState('')
  const [loading, setLoading] = useState(true)
  const pageSize = 50

  useEffect(() => { load() }, [page, search])

  const load = async () => {
    setLoading(true)
    try {
      const params = { page, pageSize }
      if (search) params.search = search
      const res = await api.get('/super-admin/audit-logs', { params })
      if (res.data.success) {
        setLogs(res.data.data?.items || [])
        setTotal(res.data.data?.totalCount || 0)
      }
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const fmt = (iso) => new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  })

  return (
    <SuperAdminLayout title="Audit Logs" subtitle={`${total.toLocaleString()} total events across the platform`}>
      <div className="mb-5">
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search by entity, user, or notes..."
          className="w-full max-w-md px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20 text-gray-400">No audit logs found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['When', 'Action', 'Entity', 'Notes', 'Performed By', 'IP'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">{fmt(log.createdAt)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_STYLES[log.action] || 'bg-gray-100 text-gray-500'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-sm font-medium text-gray-800">{log.entityName}</div>
                      <div className="text-xs text-gray-400 font-mono">{log.entityId?.slice(0, 8)}…</div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600 max-w-xs truncate">{log.notes || '—'}</td>
                    <td className="px-5 py-3 text-sm text-gray-500">{log.performedBy || '—'}</td>
                    <td className="px-5 py-3 text-xs font-mono text-gray-400">{log.ipAddress || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

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
