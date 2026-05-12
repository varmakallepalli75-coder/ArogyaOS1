import { useState, useEffect } from 'react'
import api from '../../services/api'
import SuperAdminLayout from './SuperAdminLayout'

const TYPE_STYLES = {
  Info:        { badge: 'bg-blue-100 text-blue-700',    icon: 'ℹ️' },
  Warning:     { badge: 'bg-amber-100 text-amber-700',  icon: '⚠️' },
  Maintenance: { badge: 'bg-red-100 text-red-700',      icon: '🔧' },
  Feature:     { badge: 'bg-emerald-100 text-emerald-700', icon: '✨' },
}

const blank = { title: '', body: '', type: 'Info', expiresAt: '' }

export default function SuperAdminAnnouncements() {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]       = useState(blank)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/super-admin/announcements')
      if (res.data.success) setItems(res.data.data || [])
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const save = async () => {
    if (!form.title.trim() || !form.body.trim()) return setError('Title and body are required')
    setSaving(true)
    setError('')
    try {
      const payload = { ...form, expiresAt: form.expiresAt || null }
      const res = await api.post('/super-admin/announcements', payload)
      if (res.data.success) {
        setShowModal(false)
        setForm(blank)
        load()
      } else setError(res.data.message)
    } catch(e) { setError('Failed to create') }
    finally { setSaving(false) }
  }

  const toggle = async (id) => {
    await api.put(`/super-admin/announcements/${id}/toggle`)
    load()
  }

  const remove = async (id) => {
    if (!confirm('Delete this announcement?')) return
    await api.delete(`/super-admin/announcements/${id}`)
    load()
  }

  const fmt = (iso) => new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  const activeCount = items.filter(i => i.isActive).length

  return (
    <SuperAdminLayout
      title="Announcements"
      subtitle={`${activeCount} active announcement${activeCount !== 1 ? 's' : ''} visible to all hospitals`}
    >
      <div className="flex justify-end mb-5">
        <button onClick={() => { setShowModal(true); setForm(blank); setError('') }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold">
          + New Announcement
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-3">📢</div>
          <div className="text-gray-500 font-medium">No announcements yet</div>
          <div className="text-gray-400 text-sm mt-1">Create one to notify all hospitals</div>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const t = TYPE_STYLES[item.type] || TYPE_STYLES.Info
            const expired = item.expiresAt && new Date(item.expiresAt) < new Date()
            return (
              <div key={item.id} className={`bg-white rounded-2xl border p-5 ${
                item.isActive && !expired ? 'border-gray-100' : 'border-gray-100 opacity-60'
              } shadow-sm`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.badge}`}>
                        {t.icon} {item.type}
                      </span>
                      {!item.isActive && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>
                      )}
                      {expired && (
                        <span className="text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-full">Expired</span>
                      )}
                    </div>
                    <div className="font-semibold text-gray-900">{item.title}</div>
                    <div className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{item.body}</div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>By {item.createdBy}</span>
                      <span>{fmt(item.createdAt)}</span>
                      {item.expiresAt && <span>Expires: {fmt(item.expiresAt)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => toggle(item.id)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${
                        item.isActive
                          ? 'border-amber-200 text-amber-600 hover:bg-amber-50'
                          : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                      }`}>
                      {item.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => remove(item.id)}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium border border-red-200 text-red-500 hover:bg-red-50">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <h3 className="font-bold text-gray-900 mb-4">📢 New Announcement</h3>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-xl text-sm mb-4">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Title"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <textarea
                value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                placeholder="Message body..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 block">Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none">
                    <option value="Info">ℹ️ Info</option>
                    <option value="Warning">⚠️ Warning</option>
                    <option value="Maintenance">🔧 Maintenance</option>
                    <option value="Feature">✨ Feature</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 block">Expires At (optional)</label>
                  <input
                    type="datetime-local"
                    value={form.expiresAt}
                    onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={save} disabled={saving}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                {saving ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  )
}
