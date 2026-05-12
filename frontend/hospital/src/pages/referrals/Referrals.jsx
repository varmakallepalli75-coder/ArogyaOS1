import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { referralService } from '../../services/referralService'
import { useAuth } from '../../context/AuthContext'

const URGENCY_COLORS = {
  Routine:   'bg-gray-100 text-gray-700',
  Urgent:    'bg-amber-100 text-amber-700',
  Emergency: 'bg-red-100 text-red-700',
}

const STATUS_COLORS = {
  Sent:      'bg-blue-100 text-blue-700',
  Viewed:    'bg-purple-100 text-purple-700',
  Accepted:  'bg-green-100 text-green-700',
  Declined:  'bg-red-100 text-red-700',
  Completed: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-gray-100 text-gray-500',
}

function ReferralCard({ referral, mode, onAction }) {
  const [expanded, setExpanded] = useState(false)
  const [declining, setDeclining]   = useState(false)
  const [declineReason, setDeclineReason] = useState('')
  const [completing, setCompleting] = useState(false)
  const [outcomeNotes, setOutcomeNotes]   = useState('')
  const [busy, setBusy] = useState(false)

  const act = async (fn) => {
    setBusy(true)
    try { await fn() } finally { setBusy(false) }
  }

  const snapshot = (() => {
    try { return JSON.parse(referral.patientSnapshot || '{}') } catch { return {} }
  })()

  return (
    <div className={`bg-white rounded-xl border ${referral.urgency === 'Emergency' ? 'border-red-300' : 'border-gray-200'} overflow-hidden`}>
      {/* Header row */}
      <div className="px-5 py-4 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900">{referral.patientName}</span>
            <span className="text-xs text-gray-500">{referral.patientUHID}</span>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-500">{referral.patientAge} · {referral.patientGender}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${URGENCY_COLORS[referral.urgency]}`}>
              {referral.urgency}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[referral.status]}`}>
              {referral.status}
            </span>
          </div>
          <div className="mt-1 text-sm text-gray-600">
            <span className="font-medium">{mode === 'inbox' ? referral.fromHospitalName : referral.toHospitalName}</span>
            {' · '}
            <span>{referral.reason}</span>
          </div>
          <div className="mt-0.5 text-xs text-gray-400">
            {mode === 'inbox' ? `From Dr. ${referral.referringDoctorName}` : `By Dr. ${referral.referringDoctorName}`}
            {' · '}
            {new Date(referral.referredAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
        </div>
        <button onClick={() => setExpanded(e => !e)}
          className="text-gray-400 hover:text-gray-600 text-sm flex-shrink-0">
          {expanded ? '▲ Less' : '▼ More'}
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-5 pb-4 border-t border-gray-100 space-y-3 pt-3">
          {referral.clinicalNotes && (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-0.5">Clinical Notes</div>
              <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{referral.clinicalNotes}</div>
            </div>
          )}

          {/* Patient snapshot */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            {snapshot.knownAllergies && (
              <div><span className="text-gray-500 text-xs">Allergies: </span><span className="text-red-600">{snapshot.knownAllergies}</span></div>
            )}
            {snapshot.chronicConditions && (
              <div><span className="text-gray-500 text-xs">Conditions: </span>{snapshot.chronicConditions}</div>
            )}
            {snapshot.mobileNumber && (
              <div><span className="text-gray-500 text-xs">Mobile: </span>{snapshot.mobileNumber}</div>
            )}
            {snapshot.bloodGroup && (
              <div><span className="text-gray-500 text-xs">Blood: </span>{snapshot.bloodGroup.replace('Positive','+').replace('Negative','-')}</div>
            )}
          </div>

          {referral.declineReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              Declined: {referral.declineReason}
            </div>
          )}
          {referral.outcomeNotes && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-700">
              Outcome: {referral.outcomeNotes}
            </div>
          )}
          {referral.acceptedAt && (
            <div className="text-xs text-gray-400">
              Accepted: {new Date(referral.acceptedAt).toLocaleDateString('en-IN')}
              {referral.completedAt && ` · Completed: ${new Date(referral.completedAt).toLocaleDateString('en-IN')}`}
            </div>
          )}

          {/* Actions for inbox */}
          {mode === 'inbox' && referral.status === 'Viewed' && (
            <div className="flex gap-2 pt-1">
              <button disabled={busy} onClick={() => act(() => onAction('accept', referral.id))}
                className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
                Accept & Register Patient
              </button>
              <button onClick={() => setDeclining(d => !d)}
                className="px-4 py-1.5 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50">
                Decline
              </button>
            </div>
          )}
          {mode === 'inbox' && referral.status === 'Accepted' && (
            <div className="flex gap-2 pt-1">
              <button onClick={() => setCompleting(c => !c)}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                Mark Completed
              </button>
            </div>
          )}
          {mode === 'sent' && (referral.status === 'Sent' || referral.status === 'Viewed') && (
            <button disabled={busy} onClick={() => act(() => onAction('cancel', referral.id))}
              className="px-4 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">
              Cancel Referral
            </button>
          )}

          {/* Decline inline form */}
          {declining && (
            <div className="border border-red-200 rounded-lg p-3 space-y-2">
              <textarea value={declineReason} onChange={e => setDeclineReason(e.target.value)}
                placeholder="Reason for declining..."
                className="w-full text-sm border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-red-400"
                rows={2} />
              <div className="flex gap-2">
                <button disabled={busy || !declineReason.trim()}
                  onClick={() => act(() => onAction('decline', referral.id, declineReason))}
                  className="px-3 py-1.5 bg-red-600 text-white rounded text-sm disabled:opacity-50">
                  Confirm Decline
                </button>
                <button onClick={() => setDeclining(false)} className="px-3 py-1.5 text-gray-500 text-sm">Cancel</button>
              </div>
            </div>
          )}

          {/* Complete inline form */}
          {completing && (
            <div className="border border-blue-200 rounded-lg p-3 space-y-2">
              <textarea value={outcomeNotes} onChange={e => setOutcomeNotes(e.target.value)}
                placeholder="Outcome notes (optional)..."
                className="w-full text-sm border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                rows={2} />
              <div className="flex gap-2">
                <button disabled={busy}
                  onClick={() => act(() => onAction('complete', referral.id, outcomeNotes))}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm disabled:opacity-50">
                  Mark Completed
                </button>
                <button onClick={() => setCompleting(false)} className="px-3 py-1.5 text-gray-500 text-sm">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ReferralList({ mode }) {
  const [items, setItems]       = useState([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const pageSize = 20

  const load = useCallback(async (p = 1, sf = statusFilter) => {
    setLoading(true)
    setError('')
    try {
      const fn = mode === 'inbox' ? referralService.getInbox : referralService.getSent
      const res = await fn(p, pageSize, sf)
      if (res.success) {
        setItems(res.data.items)
        setTotal(res.data.totalCount)
        setPage(p)
      } else setError(res.message || 'Failed to load')
    } catch { setError('Failed to load referrals') }
    finally { setLoading(false) }
  }, [mode, statusFilter])

  useEffect(() => { load(1) }, [mode])

  const handleAction = async (action, id, extra) => {
    try {
      let res
      if (action === 'accept')  res = await referralService.accept(id)
      if (action === 'decline') res = await referralService.decline(id, extra)
      if (action === 'complete') res = await referralService.complete(id, extra)
      if (action === 'cancel')  res = await referralService.cancel(id)
      if (res?.success) load(page)
    } catch { setError('Action failed') }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="flex gap-2 flex-wrap">
        {['', 'Sent', 'Viewed', 'Accepted', 'Declined', 'Completed', 'Cancelled'].map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); load(1, s) }}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              statusFilter === s
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No referrals found</div>
      ) : (
        <div className="space-y-3">
          {items.map(r => (
            <ReferralCard key={r.id} referral={r} mode={mode} onAction={handleAction} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600 pt-2">
          <span>{total} total</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => load(page - 1)}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50">← Prev</button>
            <span>Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => load(page + 1)}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50">Next →</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Referrals() {
  const [tab, setTab] = useState('inbox')
  const [inboxCount, setInboxCount] = useState(0)

  useEffect(() => {
    referralService.getInboxCount().then(res => {
      if (res.success) setInboxCount(res.data)
    }).catch(() => {})
  }, [])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Referrals</h1>
        <p className="text-gray-500 text-sm mt-1">Cross-hospital patient referrals within the ArogyaOS network</p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-1">
          <button onClick={() => setTab('inbox')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 ${
              tab === 'inbox' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            Inbox
            {inboxCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {inboxCount > 9 ? '9+' : inboxCount}
              </span>
            )}
          </button>
          <button onClick={() => setTab('sent')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === 'sent' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            Sent
          </button>
        </nav>
      </div>

      <ReferralList key={tab} mode={tab} />
    </div>
  )
}
