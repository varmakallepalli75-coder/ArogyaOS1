import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { auditService } from '../../services/auditService'
import { authService } from '../../services/authService'

const ACTION_COLORS = {
  Create: 'bg-green-100 text-green-800',
  Update: 'bg-blue-100 text-blue-800',
  Delete: 'bg-red-100 text-red-800',
  Login:  'bg-purple-100 text-purple-800',
  Logout: 'bg-gray-100 text-gray-700',
  Print:  'bg-yellow-100 text-yellow-800',
  Export: 'bg-orange-100 text-orange-800',
}

const ENTITY_ICONS = {
  Patient:       '🧑‍⚕️',
  Staff:         '👥',
  AppUser:       '🔑',
  Appointment:   '📅',
  Admission:     '🛏',
  Bill:          '💳',
  LabOrder:      '🧪',
  PharmacyOrder: '💊',
  Hospital:      '🏥',
}

function AuditLog() {
  const [logs, setLogs]         = useState([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const pageSize = 50

  const load = useCallback(async (p = page, s = search) => {
    setLoading(true)
    setError('')
    try {
      const res = await auditService.getLogs(p, pageSize, s)
      if (res.success) {
        setLogs(res.data.items)
        setTotal(res.data.totalCount)
      } else {
        setError(res.message || 'Failed to load audit logs')
      }
    } catch {
      setError('Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { load() }, [load])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    load(1, search)
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by entity, user, or notes..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          Search
        </button>
        {search && (
          <button type="button" onClick={() => { setSearch(''); setPage(1); load(1, '') }}
            className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
            Clear
          </button>
        )}
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left font-medium text-gray-600">Time</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Action</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Entity</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Details</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Performed By</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No audit logs found</td></tr>
              ) : logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit', hour12: true
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    <span className="mr-1">{ENTITY_ICONS[log.entityName] || '📄'}</span>
                    {log.entityName}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={log.notes}>
                    {log.notes || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{log.performedBy || '—'}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{log.ipAddress || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{total} total entries</span>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1}
              onClick={() => { setPage(p => p - 1); load(page - 1, search) }}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50">
              ← Prev
            </button>
            <span>Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages}
              onClick={() => { setPage(p => p + 1); load(page + 1, search) }}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50">
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ChangePassword() {
  const [form, setForm]     = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (form.newPassword !== form.confirm) {
      setError('New passwords do not match.')
      return
    }
    if (form.newPassword.length < 8) {
      setError('New password must be at least 8 characters.')
      return
    }
    setSaving(true)
    try {
      const res = await authService.changePassword(form.currentPassword, form.newPassword)
      if (res.success) {
        setSuccess('Password changed successfully.')
        setForm({ currentPassword: '', newPassword: '', confirm: '' })
      } else {
        setError(res.message || 'Failed to change password.')
      }
    } catch {
      setError('Failed to change password.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-md">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Change Password</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
          <input
            type="password"
            required
            value={form.currentPassword}
            onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
          <input
            type="password"
            required
            value={form.newPassword}
            onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Min 8 chars, uppercase, lowercase & number"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
          <input
            type="password"
            required
            value={form.confirm}
            onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button type="submit" disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {saving ? 'Changing...' : 'Change Password'}
        </button>
      </form>
    </div>
  )
}

export default function Settings() {
  const { user } = useAuth()
  const isAdmin = user?.role === 0 || user?.role === 1 || user?.role === 'SuperAdmin' || user?.role === 'HospitalAdmin'

  const [tab, setTab] = useState(isAdmin ? 'audit' : 'account')

  const tabs = [
    ...(isAdmin ? [{ id: 'audit', label: 'Audit Log' }] : []),
    { id: 'account', label: 'Account' },
    { id: 'general', label: 'General' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Hospital configuration and system administration</p>
      </div>

      {/* Tab bar */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1">
          {tabs.map(t => (
            <button key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'audit'   && isAdmin && <AuditLog />}
      {tab === 'account' && <ChangePassword />}
      {tab === 'general' && (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
          <div className="text-5xl mb-4">⚙️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">General Settings</h2>
          <p className="text-gray-500 max-w-sm">
            Hospital branding, notification preferences and integrations are coming soon.
          </p>
        </div>
      )}
    </div>
  )
}
