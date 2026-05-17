import { useState, useEffect } from 'react'
import api from '../../services/api'
import SuperAdminLayout from './SuperAdminLayout'

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

const STATUSES = ['', 'Open', 'InProgress', 'Resolved', 'Closed']

export default function SuperAdminSupport() {
  const [tickets, setTickets]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [detail, setDetail]     = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending]   = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => { load() }, [statusFilter])

  const load = async () => {
    setLoading(true)
    try {
      const params = statusFilter ? { status: statusFilter } : {}
      const res = await api.get('/support/admin/all', { params })
      if (res.data.success) setTickets(res.data.data || [])
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const openTicket = async (ticket) => {
    setLoadingDetail(true)
    try {
      const res = await api.get(`/support/admin/all`)
      // Find the full detail with messages
      const full = res.data.data?.find(t => t.id === ticket.id)
      setDetail(full || ticket)
    } catch(e) { console.error(e) }
    finally { setLoadingDetail(false) }
  }

  const sendReply = async () => {
    if (!replyText.trim()) return
    setSending(true)
    try {
      const res = await api.post(`/support/admin/${detail.id}/reply`, { message: replyText })
      if (res.data.success) {
        setDetail(res.data.data)
        setReplyText('')
        load()
      }
    } catch(e) { console.error(e) }
    finally { setSending(false) }
  }

  const updateStatus = async (status) => {
    setUpdatingStatus(true)
    try {
      const res = await api.put(`/support/admin/${detail.id}/status`, { status })
      if (res.data.success) {
        setDetail(res.data.data)
        load()
      }
    } catch(e) { console.error(e) }
    finally { setUpdatingStatus(false) }
  }

  const fmt = (iso) => new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  })

  const openCount = tickets.filter(t => t.status === 'Open').length

  return (
    <SuperAdminLayout
      title="Support Inbox"
      subtitle={openCount > 0 ? `${openCount} open ticket${openCount > 1 ? 's' : ''} need attention` : 'All tickets up to date'}
    >
      <div className="flex items-center justify-end mb-4">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none bg-white"
        >
          <option value="">All Tickets</option>
          {STATUSES.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="flex gap-6 h-[calc(100vh-230px)]">
        {/* Ticket list */}
        <div className="w-96 flex-shrink-0 overflow-y-auto space-y-2">
          {loading ? (
            <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">✅</div>
              <div className="text-gray-500 font-medium text-sm">No tickets</div>
            </div>
          ) : tickets.map(t => (
            <button
              key={t.id}
              onClick={() => openTicket(t)}
              className={`w-full text-left bg-white rounded-xl border p-4 hover:shadow-md transition ${detail?.id === t.id ? 'border-emerald-400 shadow-md' : 'border-gray-100'}`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="text-xs font-mono text-gray-400">{t.ticketNumber}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[t.status] || ''}`}>{t.status}</span>
              </div>
              <div className="text-sm font-semibold text-gray-800 truncate">{t.subject}</div>
              <div className="text-xs text-emerald-600 font-medium mt-0.5">{t.hospitalName}</div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_STYLES[t.priority] || ''}`}>{t.priority}</span>
                <span className="text-xs text-gray-400">{t.category}</span>
                <span className="text-xs text-gray-400 ml-auto">{fmt(t.createdAt)}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Detail + reply */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          {!detail ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <div className="text-5xl mb-3">💬</div>
              <div className="text-sm font-medium">Select a ticket to respond</div>
            </div>
          ) : loadingDetail ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Loading...</div>
          ) : (
            <>
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-mono text-gray-400 mb-0.5">{detail.ticketNumber} · {detail.hospitalName}</div>
                    <div className="text-base font-bold text-gray-900">{detail.subject}</div>
                    <div className="text-xs text-gray-400 mt-0.5">Raised by {detail.raisedByName} · {fmt(detail.createdAt)}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${PRIORITY_STYLES[detail.priority] || ''}`}>{detail.priority}</span>
                    <select
                      value={detail.status}
                      onChange={e => updateStatus(e.target.value)}
                      disabled={updatingStatus}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium border-0 cursor-pointer focus:outline-none ${STATUS_STYLES[detail.status] || ''}`}
                    >
                      {STATUSES.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {detail.messages?.map(msg => (
                  <div key={msg.id} className={`flex ${msg.isFromSupport ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                      msg.isFromSupport
                        ? 'bg-emerald-50 border border-emerald-100'
                        : 'bg-blue-50 border border-blue-100'
                    }`}>
                      <div className={`text-xs font-semibold mb-1 ${msg.isFromSupport ? 'text-emerald-700' : 'text-blue-700'}`}>
                        {msg.isFromSupport ? '🛡 MedCareAxis Support' : `🏥 ${msg.senderName}`}
                      </div>
                      <div className="text-sm text-gray-800 whitespace-pre-wrap">{msg.body}</div>
                      <div className="text-xs text-gray-400 mt-1">{fmt(msg.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>

              {detail.status !== 'Closed' ? (
                <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) sendReply() }}
                    rows={2}
                    placeholder="Reply to hospital... (Ctrl+Enter to send)"
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                  />
                  <button
                    onClick={sendReply}
                    disabled={sending || !replyText.trim()}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 self-end"
                  >
                    {sending ? 'Sending...' : 'Reply'}
                  </button>
                </div>
              ) : (
                <div className="px-6 py-4 border-t border-gray-100 text-center text-sm text-gray-400">Ticket closed</div>
              )}
            </>
          )}
        </div>
      </div>
    </SuperAdminLayout>
  )
}
