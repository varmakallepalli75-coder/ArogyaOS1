import { useState, useEffect, useCallback } from 'react'
import { labService } from '../../services/labService'
import { patientService } from '../../services/patientService'

const STATUS_COLORS = {
  Ordered: 'bg-blue-100 text-blue-700',
  SampleCollected: 'bg-amber-100 text-amber-700',
  InProcess: 'bg-purple-100 text-purple-700',
  ResultAvailable: 'bg-cyan-100 text-cyan-700',
  Reported: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-gray-100 text-gray-500',
}

const STATUS_LABELS = {
  Ordered: 'Ordered',
  SampleCollected: 'Sample Collected',
  InProcess: 'In Process',
  ResultAvailable: 'Result Available',
  Reported: 'Reported',
  Cancelled: 'Cancelled',
}

const SAMPLE_TYPES = ['Blood', 'Urine', 'Stool', 'Sputum', 'CSF', 'Swab', 'Tissue', 'Other']
const UNITS = ['mg/dL', 'g/dL', 'mmol/L', 'U/L', 'IU/L', 'mEq/L', '%', 'cells/μL', 'cells/mm³', 'pg/mL', 'ng/mL', 'μg/dL', 'μIU/mL', 'sec', 'ratio', 'cells/hpf', 'mg/L', 'nmol/L', 'pmol/L', '']

export default function Lab() {
  const [tab, setTab] = useState('orders') // orders | tests
  const [orders, setOrders] = useState([])
  const [tests, setTests] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [testSearch, setTestSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Modals
  const [showNewOrder, setShowNewOrder] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [showCollect, setShowCollect] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showNewTest, setShowNewTest] = useState(false)

  const [selectedOrder, setSelectedOrder] = useState(null)
  const [saving, setSaving] = useState(false)

  // New order form
  const [patientSearch, setPatientSearch] = useState('')
  const [patientResults, setPatientResults] = useState([])
  const [testCatalog, setTestCatalog] = useState([])
  const [orderForm, setOrderForm] = useState({
    patientId: '', patientName: '',
    referringDoctorId: '', clinicalNotes: '',
    selectedTests: [], // [{ testId, testName, sampleType }]
  })

  // Sample collection form
  const [collectForm, setCollectForm] = useState({
    orderId: '', collectedBy: '', sampleCondition: 'Good',
    items: [], // [{ labOrderItemId, sampleType, collectionNotes }]
  })

  // Results form
  const [resultsForm, setResultsForm] = useState({
    orderId: '', performedBy: '', reviewedBy: '',
    results: [], // [{ labOrderItemId, parameterName, value, unit, referenceRange, isAbnormal, notes }]
  })

  // New test form
  const [testForm, setTestForm] = useState({
    name: '', code: '', category: '', sampleType: 'Blood',
    turnaroundHours: 24, price: '', description: '',
    parameters: [{ name: '', unit: '', referenceRange: '', sortOrder: 0 }],
  })

  const loadOrders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await labService.getOrders(statusFilter, search, dateFilter, page)
      if (res.success) { setOrders(res.data.items); setTotal(res.data.totalCount) }
    } catch { setError('Failed to load orders') }
    finally { setLoading(false) }
  }, [statusFilter, search, dateFilter, page])

  const loadTests = useCallback(async () => {
    setLoading(true)
    try {
      const res = await labService.getTests(testSearch)
      if (res.success) setTests(res.data)
    } catch { setError('Failed to load tests') }
    finally { setLoading(false) }
  }, [testSearch])

  useEffect(() => {
    if (tab === 'orders') loadOrders()
    else loadTests()
  }, [tab, loadOrders, loadTests])

  const searchPatients = useCallback(async (q) => {
    if (q.length < 2) { setPatientResults([]); return }
    try {
      const res = await patientService.getAll(q, 1, 8)
      if (res.success) setPatientResults(res.data.items)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => searchPatients(patientSearch), 300)
    return () => clearTimeout(t)
  }, [patientSearch, searchPatients])

  const openNewOrder = async () => {
    const res = await labService.getTests('')
    if (res.success) setTestCatalog(res.data)
    setOrderForm({ patientId: '', patientName: '', referringDoctorId: '', clinicalNotes: '', selectedTests: [] })
    setPatientSearch('')
    setPatientResults([])
    setShowNewOrder(true)
  }

  const toggleTestInOrder = (test) => {
    setOrderForm(f => {
      const exists = f.selectedTests.find(t => t.testId === test.id)
      if (exists) return { ...f, selectedTests: f.selectedTests.filter(t => t.testId !== test.id) }
      return { ...f, selectedTests: [...f.selectedTests, { testId: test.id, testName: test.name, sampleType: test.sampleType }] }
    })
  }

  const submitOrder = async () => {
    if (!orderForm.patientId) { setError('Select a patient'); return }
    if (!orderForm.selectedTests.length) { setError('Select at least one test'); return }
    setSaving(true)
    try {
      const payload = {
        patientId: orderForm.patientId,
        referringDoctorId: orderForm.referringDoctorId || null,
        clinicalNotes: orderForm.clinicalNotes,
        items: orderForm.selectedTests.map(t => ({ labTestId: t.testId, sampleType: t.sampleType })),
      }
      const res = await labService.createOrder(payload)
      if (res.success) { setShowNewOrder(false); loadOrders() }
      else setError(res.message || 'Failed to create order')
    } catch { setError('Failed to create order') }
    finally { setSaving(false) }
  }

  const openDetail = async (id) => {
    try {
      const res = await labService.getOrderById(id)
      if (res.success) { setSelectedOrder(res.data); setShowDetail(true) }
    } catch { setError('Failed to load order details') }
  }

  const openCollect = (order) => {
    setCollectForm({
      orderId: order.id,
      collectedBy: '',
      sampleCondition: 'Good',
      items: order.items.map(i => ({ labOrderItemId: i.id, sampleType: i.sampleType, collectionNotes: '' })),
    })
    setShowCollect(true)
  }

  const submitCollect = async () => {
    setSaving(true)
    try {
      const res = await labService.collectSample(collectForm)
      if (res.success) { setShowCollect(false); setShowDetail(false); loadOrders() }
      else setError(res.message || 'Failed to record sample collection')
    } catch { setError('Failed to record sample collection') }
    finally { setSaving(false) }
  }

  const openResults = (order) => {
    const allParams = []
    order.items.forEach(item => {
      if (item.parameters && item.parameters.length > 0) {
        item.parameters.forEach(p => {
          const existing = item.results?.find(r => r.parameterName === p.name)
          allParams.push({
            labOrderItemId: item.id,
            testName: item.testName,
            parameterName: p.name,
            unit: p.unit || '',
            referenceRange: p.referenceRange || '',
            value: existing?.value || '',
            isAbnormal: existing?.isAbnormal || false,
            notes: existing?.notes || '',
          })
        })
      } else {
        const existing = item.results?.[0]
        allParams.push({
          labOrderItemId: item.id,
          testName: item.testName,
          parameterName: item.testName,
          unit: '',
          referenceRange: '',
          value: existing?.value || '',
          isAbnormal: existing?.isAbnormal || false,
          notes: existing?.notes || '',
        })
      }
    })
    setResultsForm({ orderId: order.id, performedBy: '', reviewedBy: '', results: allParams })
    setShowResults(true)
  }

  const updateResult = (idx, field, val) => {
    setResultsForm(f => {
      const results = [...f.results]
      results[idx] = { ...results[idx], [field]: val }
      return { ...f, results }
    })
  }

  const submitResults = async () => {
    setSaving(true)
    try {
      const res = await labService.enterResults(resultsForm)
      if (res.success) { setShowResults(false); setShowDetail(false); loadOrders() }
      else setError(res.message || 'Failed to enter results')
    } catch { setError('Failed to enter results') }
    finally { setSaving(false) }
  }

  const reportOrder = async (orderId) => {
    setSaving(true)
    try {
      const res = await labService.reportOrder({ orderId, reportedBy: '' })
      if (res.success) { setShowDetail(false); loadOrders() }
      else setError(res.message || 'Failed to mark as reported')
    } catch { setError('Failed to report order') }
    finally { setSaving(false) }
  }

  const addParam = () => setTestForm(f => ({
    ...f,
    parameters: [...f.parameters, { name: '', unit: '', referenceRange: '', sortOrder: f.parameters.length }]
  }))

  const removeParam = (idx) => setTestForm(f => ({
    ...f, parameters: f.parameters.filter((_, i) => i !== idx)
  }))

  const updateParam = (idx, field, val) => {
    setTestForm(f => {
      const params = [...f.parameters]
      params[idx] = { ...params[idx], [field]: val }
      return { ...f, parameters: params }
    })
  }

  const submitTest = async () => {
    if (!testForm.name || !testForm.code) { setError('Name and code are required'); return }
    setSaving(true)
    try {
      const res = await labService.createTest({
        ...testForm,
        price: parseFloat(testForm.price) || 0,
        parameters: testForm.parameters.filter(p => p.name),
      })
      if (res.success) {
        setShowNewTest(false)
        setTestForm({ name: '', code: '', category: '', sampleType: 'Blood', turnaroundHours: 24, price: '', description: '', parameters: [{ name: '', unit: '', referenceRange: '', sortOrder: 0 }] })
        loadTests()
      } else setError(res.message || 'Failed to create test')
    } catch { setError('Failed to create test') }
    finally { setSaving(false) }
  }

  const PAGE_SIZE = 20
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laboratory</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage lab orders, tests and results</p>
        </div>
        <button
          onClick={tab === 'orders' ? openNewOrder : () => setShowNewTest(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition"
        >
          <span className="text-lg leading-none">+</span>
          {tab === 'orders' ? 'New Order' : 'Add Test'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex justify-between">
          {error}
          <button onClick={() => setError('')} className="ml-4 font-bold">×</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[['orders', 'Lab Orders'], ['tests', 'Test Catalog']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${tab === key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Orders Tab */}
      {tab === 'orders' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search patient or order number..."
              className="border border-gray-200 rounded-xl px-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            >
              <option value="">All Statuses</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input
              type="date"
              value={dateFilter}
              onChange={e => { setDateFilter(e.target.value); setPage(1) }}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
            {(search || statusFilter || dateFilter) && (
              <button onClick={() => { setSearch(''); setStatusFilter(''); setDateFilter(''); setPage(1) }} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2">Clear</button>
            )}
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-400">Loading...</div>
            ) : orders.length === 0 ? (
              <div className="p-12 text-center text-gray-400">No lab orders found</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Order No', 'Patient', 'Tests', 'Ordered On', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-5 py-3.5 font-mono text-xs font-semibold text-violet-700">{o.orderNumber}</td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-gray-900">{o.patientName}</div>
                        <div className="text-xs text-gray-400">{o.patientCode}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-gray-700">{o.testNames?.join(', ') || '—'}</div>
                        <div className="text-xs text-gray-400">{o.totalTests} test{o.totalTests !== 1 ? 's' : ''}</div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 text-xs">{new Date(o.orderedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABELS[o.status] || o.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <button onClick={() => openDetail(o.id)} className="text-violet-600 hover:text-violet-800 font-medium text-xs">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Showing page {page} of {totalPages} ({total} orders)</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Previous</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Test Catalog Tab */}
      {tab === 'tests' && (
        <div className="space-y-4">
          <input
            value={testSearch}
            onChange={e => setTestSearch(e.target.value)}
            placeholder="Search tests..."
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <div className="col-span-3 p-12 text-center text-gray-400">Loading...</div>
            ) : tests.length === 0 ? (
              <div className="col-span-3 p-12 text-center text-gray-400">No tests in catalog</div>
            ) : tests.map(t => (
              <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{t.name}</div>
                    <div className="text-xs text-gray-400 font-mono mt-0.5">{t.code}</div>
                  </div>
                  <span className="bg-violet-50 text-violet-700 text-xs px-2.5 py-1 rounded-full font-medium">₹{t.price}</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t.sampleType}</span>
                  {t.category && <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{t.category}</span>}
                  <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">{t.turnaroundHours}h TAT</span>
                </div>
                {t.parameters?.length > 0 && (
                  <div className="text-xs text-gray-500">
                    <div className="font-medium mb-1">Parameters ({t.parameters.length})</div>
                    <div className="space-y-0.5">
                      {t.parameters.slice(0, 3).map(p => (
                        <div key={p.id} className="flex justify-between">
                          <span>{p.name}</span>
                          <span className="text-gray-400">{p.unit} {p.referenceRange && `(${p.referenceRange})`}</span>
                        </div>
                      ))}
                      {t.parameters.length > 3 && <div className="text-gray-400">+{t.parameters.length - 3} more</div>}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Order Modal */}
      {showNewOrder && (
        <Modal title="New Lab Order" onClose={() => setShowNewOrder(false)} wide>
          <div className="space-y-5">
            {/* Patient Search */}
            <div className="relative">
              <label className="block text-xs font-medium text-gray-600 mb-1">Patient *</label>
              {orderForm.patientId ? (
                <div className="flex items-center justify-between bg-violet-50 border border-violet-200 rounded-xl px-4 py-2.5">
                  <span className="font-medium text-violet-800">{orderForm.patientName}</span>
                  <button onClick={() => setOrderForm(f => ({ ...f, patientId: '', patientName: '' }))} className="text-violet-400 hover:text-violet-600 text-xs">Change</button>
                </div>
              ) : (
                <>
                  <input
                    value={patientSearch}
                    onChange={e => setPatientSearch(e.target.value)}
                    placeholder="Search by name or phone..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                  {patientResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                      {patientResults.map(p => (
                        <button
                          key={p.id}
                          onClick={() => { setOrderForm(f => ({ ...f, patientId: p.id, patientName: `${p.firstName} ${p.lastName}` })); setPatientSearch(''); setPatientResults([]) }}
                          className="w-full text-left px-4 py-2.5 hover:bg-violet-50 text-sm"
                        >
                          <div className="font-medium">{p.firstName} {p.lastName}</div>
                          <div className="text-xs text-gray-400">{p.patientCode} · {p.phone}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Clinical Notes</label>
              <textarea
                value={orderForm.clinicalNotes}
                onChange={e => setOrderForm(f => ({ ...f, clinicalNotes: e.target.value }))}
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                placeholder="Reason for tests, symptoms..."
              />
            </div>

            {/* Test Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Select Tests *</label>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                  {testCatalog.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-400">No tests available. Add tests to the catalog first.</div>
                  ) : testCatalog.map(t => {
                    const selected = orderForm.selectedTests.some(s => s.testId === t.id)
                    return (
                      <label key={t.id} className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition ${selected ? 'bg-violet-50' : 'hover:bg-gray-50'}`}>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleTestInOrder(t)}
                          className="w-4 h-4 rounded text-violet-600"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900">{t.name}</div>
                          <div className="text-xs text-gray-400">{t.sampleType} · {t.turnaroundHours}h TAT</div>
                        </div>
                        <span className="text-sm font-semibold text-violet-700">₹{t.price}</span>
                      </label>
                    )
                  })}
                </div>
                {orderForm.selectedTests.length > 0 && (
                  <div className="bg-violet-50 px-4 py-2.5 border-t border-violet-100 flex items-center justify-between">
                    <span className="text-sm text-violet-700 font-medium">{orderForm.selectedTests.length} test{orderForm.selectedTests.length !== 1 ? 's' : ''} selected</span>
                    <span className="text-sm font-bold text-violet-800">
                      Total: ₹{orderForm.selectedTests.reduce((sum, s) => sum + (testCatalog.find(t => t.id === s.testId)?.price || 0), 0).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowNewOrder(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
              <button
                onClick={submitOrder}
                disabled={saving}
                className="px-5 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create Order'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Order Detail Modal */}
      {showDetail && selectedOrder && (
        <Modal title={`Order: ${selectedOrder.orderNumber}`} onClose={() => setShowDetail(false)} wide>
          <div className="space-y-5">
            {/* Status Badge */}
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[selectedOrder.status] || 'bg-gray-100 text-gray-600'}`}>
                {STATUS_LABELS[selectedOrder.status] || selectedOrder.status}
              </span>
              <span className="text-xs text-gray-400">{new Date(selectedOrder.orderedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>

            {/* Patient Info */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4 text-sm">
              <InfoRow label="Patient" value={selectedOrder.patientName} />
              <InfoRow label="Patient Code" value={selectedOrder.patientCode} />
              {selectedOrder.referringDoctorName && <InfoRow label="Referring Doctor" value={selectedOrder.referringDoctorName} />}
              {selectedOrder.clinicalNotes && <InfoRow label="Clinical Notes" value={selectedOrder.clinicalNotes} className="col-span-2" />}
            </div>

            {/* Tests */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Tests ({selectedOrder.items?.length})</h3>
              <div className="space-y-3">
                {selectedOrder.items?.map(item => (
                  <div key={item.id} className="border border-gray-100 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{item.testName}</div>
                        <div className="text-xs text-gray-400">Sample: {item.sampleType}</div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-600'}`}>{item.status}</span>
                    </div>
                    {item.results?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="text-xs font-medium text-gray-500 mb-1">Results</div>
                        {item.results.map((r, i) => (
                          <div key={i} className={`flex items-center justify-between text-sm px-3 py-1.5 rounded-lg ${r.isAbnormal ? 'bg-red-50' : 'bg-gray-50'}`}>
                            <span className="text-gray-700">{r.parameterName}</span>
                            <span className={`font-semibold ${r.isAbnormal ? 'text-red-600' : 'text-gray-900'}`}>
                              {r.value} {r.unit} {r.isAbnormal && '⚠'}
                            </span>
                            {r.referenceRange && <span className="text-xs text-gray-400">Ref: {r.referenceRange}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
              {selectedOrder.status === 'Ordered' && (
                <button onClick={() => openCollect(selectedOrder)} className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600">
                  Collect Sample
                </button>
              )}
              {(selectedOrder.status === 'SampleCollected' || selectedOrder.status === 'InProcess') && (
                <button onClick={() => openResults(selectedOrder)} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700">
                  Enter Results
                </button>
              )}
              {selectedOrder.status === 'ResultAvailable' && (
                <>
                  <button onClick={() => openResults(selectedOrder)} className="px-4 py-2 bg-purple-100 text-purple-700 rounded-xl text-sm font-medium hover:bg-purple-200">
                    Edit Results
                  </button>
                  <button onClick={() => reportOrder(selectedOrder.id)} disabled={saving} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
                    {saving ? 'Reporting...' : 'Mark as Reported'}
                  </button>
                </>
              )}
              <button onClick={() => setShowDetail(false)} className="ml-auto px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Close</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Sample Collection Modal */}
      {showCollect && (
        <Modal title="Collect Sample" onClose={() => setShowCollect(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Collected By</label>
              <input
                value={collectForm.collectedBy}
                onChange={e => setCollectForm(f => ({ ...f, collectedBy: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                placeholder="Phlebotomist name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sample Condition</label>
              <select
                value={collectForm.sampleCondition}
                onChange={e => setCollectForm(f => ({ ...f, sampleCondition: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              >
                {['Good', 'Haemolysed', 'Lipemic', 'Insufficient', 'Contaminated'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Samples</label>
              <div className="space-y-2">
                {collectForm.items.map((item, idx) => (
                  <div key={item.labOrderItemId} className="bg-gray-50 rounded-xl p-3 space-y-2">
                    <div className="text-sm font-medium text-gray-700">Sample #{idx + 1}: {item.sampleType}</div>
                    <input
                      value={item.collectionNotes}
                      onChange={e => {
                        const items = [...collectForm.items]
                        items[idx] = { ...items[idx], collectionNotes: e.target.value }
                        setCollectForm(f => ({ ...f, items }))
                      }}
                      placeholder="Collection notes (optional)"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowCollect(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={submitCollect} disabled={saving} className="px-5 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 disabled:opacity-50">
                {saving ? 'Saving...' : 'Confirm Collection'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Enter Results Modal */}
      {showResults && (
        <Modal title="Enter Lab Results" onClose={() => setShowResults(false)} wide>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Performed By</label>
                <input
                  value={resultsForm.performedBy}
                  onChange={e => setResultsForm(f => ({ ...f, performedBy: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  placeholder="Lab technician name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Reviewed By</label>
                <input
                  value={resultsForm.reviewedBy}
                  onChange={e => setResultsForm(f => ({ ...f, reviewedBy: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  placeholder="Pathologist / Doctor"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Results</label>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr>
                      <th className="text-left px-4 py-2.5">Parameter</th>
                      <th className="text-left px-4 py-2.5">Value</th>
                      <th className="text-left px-4 py-2.5">Unit</th>
                      <th className="text-left px-4 py-2.5">Ref Range</th>
                      <th className="text-center px-4 py-2.5">Abnormal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {resultsForm.results.map((r, idx) => (
                      <tr key={idx} className={r.isAbnormal ? 'bg-red-50/50' : ''}>
                        <td className="px-4 py-2.5">
                          <div className="font-medium text-gray-900">{r.parameterName}</div>
                          <div className="text-xs text-gray-400">{r.testName}</div>
                        </td>
                        <td className="px-4 py-2.5">
                          <input
                            value={r.value}
                            onChange={e => updateResult(idx, 'value', e.target.value)}
                            className="w-28 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                            placeholder="Value"
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          <input
                            value={r.unit}
                            onChange={e => updateResult(idx, 'unit', e.target.value)}
                            className="w-24 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                            placeholder="Unit"
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          <input
                            value={r.referenceRange}
                            onChange={e => updateResult(idx, 'referenceRange', e.target.value)}
                            className="w-32 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                            placeholder="e.g. 70-110"
                          />
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={r.isAbnormal}
                            onChange={e => updateResult(idx, 'isAbnormal', e.target.checked)}
                            className="w-4 h-4 rounded text-red-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowResults(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={submitResults} disabled={saving} className="px-5 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Results'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* New Test Modal */}
      {showNewTest && (
        <Modal title="Add Lab Test to Catalog" onClose={() => setShowNewTest(false)} wide>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Test Name *</label>
                <input
                  value={testForm.name}
                  onChange={e => setTestForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  placeholder="e.g. Complete Blood Count"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Test Code *</label>
                <input
                  value={testForm.code}
                  onChange={e => setTestForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-400"
                  placeholder="e.g. CBC"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                <input
                  value={testForm.category}
                  onChange={e => setTestForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  placeholder="e.g. Haematology"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Sample Type</label>
                <select
                  value={testForm.sampleType}
                  onChange={e => setTestForm(f => ({ ...f, sampleType: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                >
                  {SAMPLE_TYPES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Price (₹)</label>
                <input
                  type="number"
                  value={testForm.price}
                  onChange={e => setTestForm(f => ({ ...f, price: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Turnaround Time (hours)</label>
                <input
                  type="number"
                  value={testForm.turnaroundHours}
                  onChange={e => setTestForm(f => ({ ...f, turnaroundHours: parseInt(e.target.value) || 24 }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <textarea
                value={testForm.description}
                onChange={e => setTestForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                placeholder="Optional description"
              />
            </div>

            {/* Parameters */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-600">Parameters</label>
                <button onClick={addParam} className="text-xs text-violet-600 hover:text-violet-800 font-medium">+ Add Parameter</button>
              </div>
              <div className="space-y-2">
                {testForm.parameters.map((p, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      value={p.name}
                      onChange={e => updateParam(idx, 'name', e.target.value)}
                      placeholder="Parameter name"
                      className="col-span-4 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                    />
                    <select
                      value={p.unit}
                      onChange={e => updateParam(idx, 'unit', e.target.value)}
                      className="col-span-3 border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                    >
                      <option value="">Unit</option>
                      {UNITS.map(u => u && <option key={u} value={u}>{u}</option>)}
                    </select>
                    <input
                      value={p.referenceRange}
                      onChange={e => updateParam(idx, 'referenceRange', e.target.value)}
                      placeholder="Ref range"
                      className="col-span-4 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                    />
                    <button onClick={() => removeParam(idx)} className="col-span-1 text-gray-300 hover:text-red-500 text-lg leading-none">×</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowNewTest(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={submitTest} disabled={saving} className="px-5 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Add Test'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Modal({ title, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition text-xl leading-none">×</button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, className = '' }) {
  return (
    <div className={className}>
      <div className="text-xs text-gray-400 mb-0.5">{label}</div>
      <div className="text-sm font-medium text-gray-900">{value || '—'}</div>
    </div>
  )
}
