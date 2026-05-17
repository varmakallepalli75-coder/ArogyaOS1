import { useState, useEffect } from 'react'
import api from '../../services/api'

const CATEGORIES = ['Technical', 'Billing', 'Feature', 'Training', 'Other']
const PRIORITIES  = ['Low', 'Medium', 'High', 'Critical']

const STATUS_STYLES = {
  Open:       'bg-blue-100 text-blue-700',
  InProgress: 'bg-amber-100 text-amber-700',
  Resolved:   'bg-emerald-100 text-emerald-700',
  Closed:     'bg-gray-100 text-gray-500',
}

const PRIORITY_STYLES = {
  Low:      'bg-gray-100 text-gray-500',
  Medium:   'bg-blue-100 text-blue-700',
  High:     'bg-amber-100 text-amber-700',
  Critical: 'bg-red-100 text-red-700',
}

export default function Support() {
  const [tickets, setTickets]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null)
  const [detail, setDetail]     = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending]   = useState(false)
  const [showNew, setShowNew]   = useState(false)
  const [form, setForm] = useState({ subject: '', category: 'Technical', priority: 'Medium', message: '' })
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/support')
      if (res.data.success) setTickets(res.data.data || [])
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const openTicket = async (ticket) => {
    setSelected(ticket)
    setLoadingDetail(true)
    try {
      const res = await api.get(`/support/${ticket.id}`)
      if (res.data.success) setDetail(res.data.data)
    } catch(e) { console.error(e) }
    finally { setLoadingDetail(false) }
  }

  const sendReply = async () => {
    if (!replyText.trim()) return
    setSending(true)
    try {
      const res = await api.post(`/support/${detail.id}/reply`, { message: replyText })
      if (res.data.success) {
        setDetail(res.data.data)
        setReplyText('')
        load()
      }
    } catch(e) { console.error(e) }
    finally { setSending(false) }
  }

  const createTicket = async () => {
    setFormError('')
    if (!form.subject.trim()) { setFormError('Subject is required'); return }
    if (!form.message.trim()) { setFormError('Please describe your issue'); return }
    setCreating(true)
    try {
      const res = await api.post('/support', form)
      if (res.data.success) {
        setShowNew(false)
        setForm({ subject: '', category: 'Technical', priority: 'Medium', message: '' })
        load()
        openTicket(res.data.data)
      } else setFormError(res.data.message || 'Failed to raise ticket')
    } catch(e) { setFormError('Failed to raise ticket') }
    finally { setCreating(false) }
  }

  const fmt = (iso) => new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  })

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support</h1>
          <p className="text-sm text-gray-500 mt-0.5">Raise a ticket and we'll get back to you</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition"
        >
          + New Ticket
        </button>
      </div>

      <div className="flex gap-6 h-[calc(100vh-220px)]">
        {/* Ticket list */}
        <div className="w-80 flex-shrink-0 overflow-y-auto space-y-2">
          {loading ? (
            <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">🎫</div>
              <div className="text-gray-500 font-medium text-sm">No tickets yet</div>
              <div className="text-gray-400 text-xs mt-1">Click "New Ticket" to contact support</div>
            </div>
          ) : tickets.map(t => (
            <button
              key={t.id}
              onClick={() => openTicket(t)}
              className={`w-full text-left bg-white rounded-xl border p-4 hover:shadow-md transition ${selected?.id === t.id ? 'border-emerald-400 shadow-md' : 'border-gray-100'}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="text-xs font-mono text-gray-400">{t.ticketNumber}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[t.status] || 'bg-gray-100 text-gray-500'}`}>
                  {t.status}
                </span>
              </div>
              <div className="text-sm font-semibold text-gray-800 leading-tight">{t.subject}</div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_STYLES[t.priority] || ''}`}>{t.priority}</span>
                <span className="text-xs text-gray-400">{t.category}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">{fmt(t.createdAt)}</div>
            </button>
          ))}
        </div>

        {/* Ticket detail / chat */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          {!detail ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <div className="text-5xl mb-3">💬</div>
              <div className="text-sm font-medium">Select a ticket to view the conversation</div>
            </div>
          ) : loadingDetail ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Loading...</div>
          ) : (
            <>
              {/* Ticket header */}
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-mono text-gray-400 mb-1">{detail.ticketNumber}</div>
                    <div className="text-base font-bold text-gray-900">{detail.subject}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${PRIORITY_STYLES[detail.priority] || ''}`}>{detail.priority}</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[detail.status] || ''}`}>{detail.status}</span>
                  </div>
                </div>
                <div className="flex gap-4 mt-1 text-xs text-gray-400">
                  <span>{detail.category}</span>
                  <span>Raised {fmt(detail.createdAt)}</span>
                  {detail.resolvedAt && <span className="text-emerald-600">Resolved {fmt(detail.resolvedAt)}</span>}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {detail.messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.isFromSupport ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                      msg.isFromSupport
                        ? 'bg-emerald-50 border border-emerald-100'
                        : 'bg-blue-600 text-white'
                    }`}>
                      <div className={`text-xs font-semibold mb-1 ${msg.isFromSupport ? 'text-emerald-700' : 'text-blue-200'}`}>
                        {msg.isFromSupport ? '🛡 MedCareAxis Support' : msg.senderName}
                      </div>
                      <div className={`text-sm whitespace-pre-wrap ${msg.isFromSupport ? 'text-gray-800' : 'text-white'}`}>
                        {msg.body}
                      </div>
                      <div className={`text-xs mt-1 ${msg.isFromSupport ? 'text-gray-400' : 'text-blue-200'}`}>
                        {fmt(msg.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply box */}
              {detail.status !== 'Closed' ? (
                <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) sendReply() }}
                    rows={2}
                    placeholder="Type your reply... (Ctrl+Enter to send)"
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                  />
                  <button
                    onClick={sendReply}
                    disabled={sending || !replyText.trim()}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 self-end"
                  >
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              ) : (
                <div className="px-6 py-4 border-t border-gray-100 text-center text-sm text-gray-400">
                  This ticket is closed. Raise a new ticket if you need further help.
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Raise a Support Ticket</h2>
              <button onClick={() => setShowNew(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{formError}</div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Subject *</label>
                <input
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="Brief description of the issue"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                  >
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                  >
                    {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Describe the issue *</label>
                <textarea
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  rows={4}
                  placeholder="What happened? What were you trying to do?"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button onClick={() => setShowNew(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
                <button
                  onClick={createTicket}
                  disabled={creating}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                >
                  {creating ? 'Raising...' : 'Raise Ticket'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
