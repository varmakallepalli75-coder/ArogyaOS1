import { useState, useEffect } from 'react'
import api from '../../services/api'
import SuperAdminLayout from './SuperAdminLayout'

const Field = ({ label, hint, children }) => (
  <div>
    <label className="text-sm font-semibold text-gray-700 block mb-1">{label}</label>
    {hint && <p className="text-xs text-gray-400 mb-2">{hint}</p>}
    {children}
  </div>
)

export default function SuperAdminSettings() {
  const [settings, setSettings] = useState(null)
  const [form, setForm]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      const res = await api.get('/super-admin/settings')
      if (res.data.success) {
        setSettings(res.data.data)
        setForm(res.data.data)
      }
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const save = async () => {
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      const res = await api.put('/super-admin/settings', form)
      if (res.data.success) {
        setSettings(res.data.data)
        setForm(res.data.data)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else setError(res.data.message)
    } catch(e) { setError('Failed to save settings') }
    finally { setSaving(false) }
  }

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }))
  const isDirty = JSON.stringify(form) !== JSON.stringify(settings)

  const fmtDate = (iso) => iso ? new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : ''

  if (loading) return (
    <SuperAdminLayout title="Platform Settings">
      <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>
    </SuperAdminLayout>
  )

  return (
    <SuperAdminLayout title="Platform Settings" subtitle="Global configuration for all hospitals on ArogyaOS">
      <div className="max-w-2xl space-y-6">

        {/* Maintenance Mode */}
        <div className={`rounded-2xl border-2 p-6 transition-colors ${
          form?.maintenanceMode ? 'border-red-300 bg-red-50' : 'border-gray-100 bg-white'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-gray-900">🔧 Maintenance Mode</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                When enabled, all hospitals see a maintenance banner. They can still log in but are warned.
              </p>
            </div>
            <button
              onClick={() => set('maintenanceMode', !form?.maintenanceMode)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                form?.maintenanceMode ? 'bg-red-500' : 'bg-gray-200'
              }`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                form?.maintenanceMode ? 'translate-x-7' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {form?.maintenanceMode && (
            <Field label="Maintenance Message" hint="Shown to all hospital users as a banner">
              <textarea
                value={form.maintenanceMessage}
                onChange={e => set('maintenanceMessage', e.target.value)}
                rows={2}
                className="w-full px-4 py-3 border border-red-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none bg-white"
              />
            </Field>
          )}
        </div>

        {/* Contact & Support */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-bold text-gray-900">📧 Contact & Support</h2>
          <Field label="Support Email" hint="Shown to hospitals on the login and support pages">
            <input
              value={form?.supportEmail || ''}
              onChange={e => set('supportEmail', e.target.value)}
              placeholder="support@arogyaos.com"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </Field>
        </div>

        {/* Platform Info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-bold text-gray-900">ℹ️ Platform Info</h2>
          <Field label="Platform Version" hint="Used for display and debugging">
            <input
              value={form?.platformVersion || ''}
              onChange={e => set('platformVersion', e.target.value)}
              placeholder="1.0.0"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </Field>
          <Field label="Terms of Service URL">
            <input
              value={form?.termsUrl || ''}
              onChange={e => set('termsUrl', e.target.value)}
              placeholder="https://arogyaos.com/terms"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </Field>
          <Field label="Privacy Policy URL">
            <input
              value={form?.privacyUrl || ''}
              onChange={e => set('privacyUrl', e.target.value)}
              placeholder="https://arogyaos.com/privacy"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </Field>
        </div>

        {/* Last updated */}
        {settings?.updatedBy && (
          <p className="text-xs text-gray-400">
            Last saved by {settings.updatedBy} on {fmtDate(settings.updatedAt)}
          </p>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {saved && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">
            ✅ Settings saved successfully
          </div>
        )}

        <button
          onClick={save}
          disabled={saving || !isDirty}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold disabled:opacity-40 transition-colors">
          {saving ? 'Saving...' : isDirty ? 'Save Changes' : 'No Changes'}
        </button>
      </div>
    </SuperAdminLayout>
  )
}
