import { useState, useEffect, useCallback } from 'react'
import { pharmacyService } from '../../services/pharmacyService'
import { patientService } from '../../services/patientService'

const ORDER_STATUS_COLORS = {
  Pending: 'bg-amber-100 text-amber-700',
  PartiallyDispensed: 'bg-blue-100 text-blue-700',
  Dispensed: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-gray-100 text-gray-500',
}

const DOSAGE_FORMS = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Ointment', 'Drops', 'Inhaler', 'Powder', 'Suppository', 'Patch', 'Other']
const CATEGORIES = ['Analgesic', 'Antibiotic', 'Antacid', 'Antidiabetic', 'Antihypertensive', 'Antihistamine', 'Antifungal', 'Antiviral', 'Cardiovascular', 'Dermatology', 'GI', 'Neurology', 'Respiratory', 'Vitamins', 'Other']
const ROUTES = ['Oral', 'Intravenous', 'Intramuscular', 'Subcutaneous', 'Topical', 'Inhalation', 'Sublingual', 'Rectal', 'Nasal', 'Ophthalmic', 'Otic']

export default function Pharmacy() {
  const [tab, setTab] = useState('prescriptions') // prescriptions | orders | medicines
  const [orders, setOrders] = useState([])
  const [medicines, setMedicines] = useState([])
  const [total, setTotal] = useState(0)
  const [medTotal, setMedTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [medPage, setMedPage] = useState(1)
  const [search, setSearch] = useState('')
  const [medSearch, setMedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Modals
  const [showNewOrder, setShowNewOrder] = useState(false)
  const [showOrderDetail, setShowOrderDetail] = useState(false)
  const [showDispense, setShowDispense] = useState(false)
  const [showAddMedicine, setShowAddMedicine] = useState(false)
  const [showAddStock, setShowAddStock] = useState(false)
  const [showBatches, setShowBatches] = useState(false)

  const [selectedOrder, setSelectedOrder] = useState(null)
  const [selectedMedicine, setSelectedMedicine] = useState(null)
  const [batches, setBatches] = useState([])
  const [saving, setSaving] = useState(false)

  // New order form
  const [patientSearch, setPatientSearch] = useState('')
  const [patientResults, setPatientResults] = useState([])
  const [medicineSearch, setMedicineSearch] = useState('')
  const [medicineResults, setMedicineResults] = useState([])
  const [orderForm, setOrderForm] = useState({
    patientId: '', patientName: '',
    prescribedBy: '', notes: '',
    items: [], // [{ medicineId, medicineName, quantityOrdered, dosage, route, frequency, duration, notes }]
  })

  // Dispense form
  const [dispenseForm, setDispenseForm] = useState({
    orderId: '',
    dispensedBy: '',
    items: [], // [{ labOrderItemId, batchId, quantityDispensed }]
  })

  // Add medicine form
  const [medicineForm, setMedicineForm] = useState({
    name: '', genericName: '', manufacturer: '', dosageForm: 'Tablet',
    strength: '', unit: 'mg', category: 'Other',
    reorderLevel: 10, description: '', hsnCode: '', gstPercentage: 0,
  })

  // Add stock form
  const [stockForm, setStockForm] = useState({
    medicineId: '', batchNumber: '', manufacturingDate: '',
    expiryDate: '', quantityAdded: '', purchasePrice: '', sellingPrice: '',
    supplier: '', invoiceNumber: '',
  })

  const [prescriptions, setPrescriptions] = useState([])
  const [rxSearch, setRxSearch] = useState('')
  const [dispensing, setDispensing] = useState(null)

  const loadPrescriptions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await pharmacyService.getPendingPrescriptions(rxSearch)
      if (res.success) setPrescriptions(res.data)
    } catch { setError('Failed to load prescriptions') }
    finally { setLoading(false) }
  }, [rxSearch])

  const dispenseRx = async (rx) => {
    setDispensing(rx.id)
    try {
      const res = await pharmacyService.markPrescriptionDispensed(rx.id)
      if (res.success) loadPrescriptions()
      else setError(res.message || 'Failed to dispense')
    } catch { setError('Failed to dispense') }
    finally { setDispensing(null) }
  }

  const loadOrders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await pharmacyService.getOrders(statusFilter, search, page)
      if (res.success) { setOrders(res.data.items); setTotal(res.data.totalCount) }
    } catch { setError('Failed to load orders') }
    finally { setLoading(false) }
  }, [statusFilter, search, page])

  const loadMedicines = useCallback(async () => {
    setLoading(true)
    try {
      const res = await pharmacyService.getMedicines(medSearch, lowStockOnly, medPage)
      if (res.success) { setMedicines(res.data.items); setMedTotal(res.data.totalCount) }
    } catch { setError('Failed to load medicines') }
    finally { setLoading(false) }
  }, [medSearch, lowStockOnly, medPage])

  useEffect(() => {
    if (tab === 'prescriptions') loadPrescriptions()
    else if (tab === 'orders') loadOrders()
    else loadMedicines()
  }, [tab, loadPrescriptions, loadOrders, loadMedicines])

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

  const searchMedicinesForOrder = useCallback(async (q) => {
    if (q.length < 2) { setMedicineResults([]); return }
    try {
      const res = await pharmacyService.getMedicines(q, false, 1, 10)
      if (res.success) setMedicineResults(res.data.items)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => searchMedicinesForOrder(medicineSearch), 300)
    return () => clearTimeout(t)
  }, [medicineSearch, searchMedicinesForOrder])

  const addMedicineToOrder = (med) => {
    setOrderForm(f => ({
      ...f,
      items: [...f.items, {
        medicineId: med.id, medicineName: med.name,
        quantityOrdered: 1, dosage: med.strength || '',
        route: 'Oral', frequency: 'Once daily',
        duration: '', notes: '',
      }]
    }))
    setMedicineSearch('')
    setMedicineResults([])
  }

  const updateOrderItem = (idx, field, val) => {
    setOrderForm(f => {
      const items = [...f.items]
      items[idx] = { ...items[idx], [field]: val }
      return { ...f, items }
    })
  }

  const removeOrderItem = (idx) => {
    setOrderForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))
  }

  const submitOrder = async () => {
    if (!orderForm.patientId) { setError('Select a patient'); return }
    if (!orderForm.items.length) { setError('Add at least one medicine'); return }
    setSaving(true)
    try {
      const res = await pharmacyService.createOrder({
        patientId: orderForm.patientId,
        prescribedBy: orderForm.prescribedBy || null,
        notes: orderForm.notes,
        items: orderForm.items.map(i => ({
          medicineId: i.medicineId,
          quantityOrdered: parseInt(i.quantityOrdered) || 1,
          dosage: i.dosage, route: i.route, frequency: i.frequency,
          duration: i.duration, notes: i.notes,
        })),
      })
      if (res.success) { setShowNewOrder(false); loadOrders() }
      else setError(res.message || 'Failed to create order')
    } catch { setError('Failed to create order') }
    finally { setSaving(false) }
  }

  const openOrderDetail = async (id) => {
    try {
      const res = await pharmacyService.getOrderById(id)
      if (res.success) { setSelectedOrder(res.data); setShowOrderDetail(true) }
    } catch { setError('Failed to load order') }
  }

  const openDispense = async (order) => {
    const itemsWithBatches = await Promise.all(
      order.items.map(async item => {
        try {
          const res = await pharmacyService.getBatches(item.medicineId)
          const availBatches = res.success ? res.data.filter(b => !b.isExpired && b.remainingQuantity > 0) : []
          return { ...item, availableBatches: availBatches, batchId: availBatches[0]?.id || '', quantityDispensed: item.quantityOrdered - (item.quantityDispensed || 0) }
        } catch { return { ...item, availableBatches: [], batchId: '', quantityDispensed: item.quantityOrdered } }
      })
    )
    setDispenseForm({ orderId: order.id, dispensedBy: '', items: itemsWithBatches })
    setShowDispense(true)
  }

  const submitDispense = async () => {
    setSaving(true)
    try {
      const payload = {
        orderId: dispenseForm.orderId,
        dispensedBy: dispenseForm.dispensedBy,
        items: dispenseForm.items
          .filter(i => i.batchId && i.quantityDispensed > 0)
          .map(i => ({ pharmacyOrderItemId: i.id, batchId: i.batchId, quantityDispensed: parseInt(i.quantityDispensed) })),
      }
      const res = await pharmacyService.dispenseOrder(payload)
      if (res.success) { setShowDispense(false); setShowOrderDetail(false); loadOrders() }
      else setError(res.message || 'Failed to dispense')
    } catch { setError('Failed to dispense medicines') }
    finally { setSaving(false) }
  }

  const submitMedicine = async () => {
    if (!medicineForm.name) { setError('Medicine name is required'); return }
    setSaving(true)
    try {
      const res = await pharmacyService.addMedicine({
        ...medicineForm,
        reorderLevel: parseInt(medicineForm.reorderLevel) || 10,
        gstPercentage: parseFloat(medicineForm.gstPercentage) || 0,
      })
      if (res.success) {
        setShowAddMedicine(false)
        setMedicineForm({ name: '', genericName: '', manufacturer: '', dosageForm: 'Tablet', strength: '', unit: 'mg', category: 'Other', reorderLevel: 10, description: '', hsnCode: '', gstPercentage: 0 })
        loadMedicines()
      } else setError(res.message || 'Failed to add medicine')
    } catch { setError('Failed to add medicine') }
    finally { setSaving(false) }
  }

  const openAddStock = (med) => {
    setStockForm({ medicineId: med.id, batchNumber: '', manufacturingDate: '', expiryDate: '', quantityAdded: '', purchasePrice: '', sellingPrice: '', supplier: '', invoiceNumber: '' })
    setSelectedMedicine(med)
    setShowAddStock(true)
  }

  const submitStock = async () => {
    if (!stockForm.batchNumber || !stockForm.expiryDate || !stockForm.quantityAdded) {
      setError('Batch number, expiry date and quantity are required'); return
    }
    setSaving(true)
    try {
      const res = await pharmacyService.addStock({
        ...stockForm,
        quantityAdded: parseInt(stockForm.quantityAdded) || 0,
        purchasePrice: parseFloat(stockForm.purchasePrice) || 0,
        sellingPrice: parseFloat(stockForm.sellingPrice) || 0,
      })
      if (res.success) { setShowAddStock(false); loadMedicines() }
      else setError(res.message || 'Failed to add stock')
    } catch { setError('Failed to add stock') }
    finally { setSaving(false) }
  }

  const viewBatches = async (med) => {
    setSelectedMedicine(med)
    try {
      const res = await pharmacyService.getBatches(med.id)
      if (res.success) setBatches(res.data)
    } catch { setBatches([]) }
    setShowBatches(true)
  }

  const PAGE_SIZE = 20
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const medTotalPages = Math.ceil(medTotal / PAGE_SIZE)
  const lowStockCount = medicines.filter(m => m.isLowStock).length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pharmacy</h1>
          <p className="text-sm text-gray-500 mt-0.5">Medicine inventory and dispensing</p>
        </div>
        <div className="flex gap-2">
          {tab === 'medicines' && (
            <button onClick={() => setShowAddMedicine(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition">
              <span className="text-lg leading-none">+</span> Add Medicine
            </button>
          )}
          {tab === 'orders' && (
            <button onClick={() => { setOrderForm({ patientId: '', patientName: '', prescribedBy: '', notes: '', items: [] }); setPatientSearch(''); setShowNewOrder(true) }} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition">
              <span className="text-lg leading-none">+</span> New Order
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex justify-between">
          {error}
          <button onClick={() => setError('')} className="ml-4 font-bold">×</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[['prescriptions', `Prescriptions${prescriptions.length ? ` (${prescriptions.length})` : ''}`], ['orders', 'Dispense Orders'], ['medicines', 'Medicine Catalog']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${tab === key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Prescriptions Tab */}
      {tab === 'prescriptions' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <input
              value={rxSearch}
              onChange={e => setRxSearch(e.target.value)}
              placeholder="Search by patient name or Rx number..."
              className="border border-gray-200 rounded-xl px-4 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading...</div>
          ) : prescriptions.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-3">💊</div>
              <div className="font-medium text-gray-500">No pending prescriptions</div>
              <div className="text-sm mt-1">Prescriptions from OPD consultations will appear here</div>
            </div>
          ) : (
            <div className="grid gap-4">
              {prescriptions.map(rx => (
                <div key={rx.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-bold text-emerald-700 text-sm">{rx.prescriptionNumber}</span>
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Pending Dispense</span>
                      </div>
                      <div className="text-base font-semibold text-gray-900">{rx.patientName}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {rx.patientUHID} · {rx.doctorName}
                        {rx.diagnosis && <span className="ml-2 text-gray-400">· {rx.diagnosis}</span>}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Date(rx.prescribedOn).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>

                      <div className="mt-3 space-y-1">
                        {rx.medicines.map((med, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs flex items-center justify-center font-bold flex-shrink-0">{i + 1}</span>
                            <span className="font-medium">{med.medicineName}</span>
                            {med.dosage && <span className="text-gray-400">·</span>}
                            {med.dosage && <span className="text-gray-500 text-xs">{med.dosage}</span>}
                            <span className="text-gray-400">·</span>
                            <span className="text-gray-500 text-xs">{med.frequency}</span>
                            <span className="text-gray-400">·</span>
                            <span className="text-gray-500 text-xs">{med.duration}</span>
                            {med.quantity > 0 && <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded ml-1">Qty: {med.quantity}</span>}
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => dispenseRx(rx)}
                      disabled={dispensing === rx.id}
                      className="flex-shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
                    >
                      {dispensing === rx.id
                        ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Dispensing...</>
                        : '✓ Mark Dispensed'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Orders Tab */}
      {tab === 'orders' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search patient or order number..."
              className="border border-gray-200 rounded-xl px-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="">All Statuses</option>
              {Object.entries(ORDER_STATUS_COLORS).map(([k]) => <option key={k} value={k}>{k}</option>)}
            </select>
            {(search || statusFilter) && (
              <button onClick={() => { setSearch(''); setStatusFilter(''); setPage(1) }} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2">Clear</button>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-400">Loading...</div>
            ) : orders.length === 0 ? (
              <div className="p-12 text-center text-gray-400">No orders found</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Order No', 'Patient', 'Medicines', 'Created', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-5 py-3.5 font-mono text-xs font-semibold text-emerald-700">{o.orderNumber}</td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-gray-900">{o.patientName}</div>
                        <div className="text-xs text-gray-400">{o.patientCode}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-gray-700 text-xs">{o.medicineNames?.join(', ') || '—'}</div>
                        <div className="text-xs text-gray-400">{o.totalItems} item{o.totalItems !== 1 ? 's' : ''}</div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 text-xs">{new Date(o.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ORDER_STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-600'}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <button onClick={() => openOrderDetail(o.id)} className="text-emerald-600 hover:text-emerald-800 font-medium text-xs">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Page {page} of {totalPages} ({total} orders)</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Previous</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Medicines Tab */}
      {tab === 'medicines' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <input
              value={medSearch}
              onChange={e => { setMedSearch(e.target.value); setMedPage(1) }}
              placeholder="Search medicines..."
              className="border border-gray-200 rounded-xl px-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={e => { setLowStockOnly(e.target.checked); setMedPage(1) }}
                className="w-4 h-4 rounded text-emerald-600"
              />
              <span className="text-gray-600">Low stock only</span>
              {lowStockCount > 0 && <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-medium">{lowStockCount}</span>}
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <div className="col-span-3 p-12 text-center text-gray-400">Loading...</div>
            ) : medicines.length === 0 ? (
              <div className="col-span-3 p-12 text-center text-gray-400">No medicines found</div>
            ) : medicines.map(m => (
              <div key={m.id} className={`bg-white rounded-2xl border shadow-sm p-5 space-y-3 ${m.isLowStock ? 'border-red-200' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{m.name}</div>
                    <div className="text-xs text-gray-400 truncate">{m.genericName || m.manufacturer}</div>
                  </div>
                  {m.isLowStock && (
                    <span className="shrink-0 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-medium">Low Stock</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{m.dosageForm}</span>
                  {m.strength && <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{m.strength} {m.unit}</span>}
                  <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{m.category}</span>
                </div>
                <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                  <div className="text-center">
                    <div className={`text-lg font-bold ${m.isLowStock ? 'text-red-600' : 'text-gray-900'}`}>{m.currentStock}</div>
                    <div className="text-xs text-gray-400">In Stock</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-400">{m.reorderLevel}</div>
                    <div className="text-xs text-gray-400">Reorder</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-semibold text-gray-700">{m.batchCount || 0}</div>
                    <div className="text-xs text-gray-400">Batches</div>
                  </div>
                </div>
                {m.nearExpiryBatches > 0 && (
                  <div className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5">
                    {m.nearExpiryBatches} batch{m.nearExpiryBatches !== 1 ? 'es' : ''} expiring within 90 days
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => openAddStock(m)} className="flex-1 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition">
                    + Add Stock
                  </button>
                  <button onClick={() => viewBatches(m)} className="flex-1 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                    View Batches
                  </button>
                </div>
              </div>
            ))}
          </div>

          {medTotalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Page {medPage} of {medTotalPages} ({medTotal} medicines)</span>
              <div className="flex gap-2">
                <button onClick={() => setMedPage(p => Math.max(1, p - 1))} disabled={medPage === 1} className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Previous</button>
                <button onClick={() => setMedPage(p => Math.min(medTotalPages, p + 1))} disabled={medPage === medTotalPages} className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* New Order Modal */}
      {showNewOrder && (
        <Modal title="New Dispense Order" onClose={() => setShowNewOrder(false)} wide>
          <div className="space-y-5">
            {/* Patient */}
            <div className="relative">
              <label className="block text-xs font-medium text-gray-600 mb-1">Patient *</label>
              {orderForm.patientId ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                  <span className="font-medium text-emerald-800">{orderForm.patientName}</span>
                  <button onClick={() => setOrderForm(f => ({ ...f, patientId: '', patientName: '' }))} className="text-emerald-400 hover:text-emerald-600 text-xs">Change</button>
                </div>
              ) : (
                <>
                  <input
                    value={patientSearch}
                    onChange={e => setPatientSearch(e.target.value)}
                    placeholder="Search by name or phone..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  {patientResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                      {patientResults.map(p => (
                        <button
                          key={p.id}
                          onClick={() => { setOrderForm(f => ({ ...f, patientId: p.id, patientName: `${p.firstName} ${p.lastName}` })); setPatientSearch(''); setPatientResults([]) }}
                          className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 text-sm"
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
              <label className="block text-xs font-medium text-gray-600 mb-1">Prescribed By</label>
              <input
                value={orderForm.prescribedBy}
                onChange={e => setOrderForm(f => ({ ...f, prescribedBy: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="Doctor name"
              />
            </div>

            {/* Medicine Search */}
            <div className="relative">
              <label className="block text-xs font-medium text-gray-600 mb-1">Add Medicines *</label>
              <input
                value={medicineSearch}
                onChange={e => setMedicineSearch(e.target.value)}
                placeholder="Search medicine to add..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              {medicineResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  {medicineResults.map(m => (
                    <button
                      key={m.id}
                      onClick={() => addMedicineToOrder(m)}
                      className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{m.name}</span>
                          {m.strength && <span className="text-gray-400 ml-1">{m.strength}{m.unit}</span>}
                        </div>
                        <span className={`text-xs ${m.isLowStock ? 'text-red-500' : 'text-gray-400'}`}>
                          {m.currentStock} in stock
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Order Items */}
            {orderForm.items.length > 0 && (
              <div className="space-y-3">
                {orderForm.items.map((item, idx) => (
                  <div key={idx} className="border border-gray-100 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 text-sm">{item.medicineName}</span>
                      <button onClick={() => removeOrderItem(idx)} className="text-gray-300 hover:text-red-500 text-lg leading-none">×</button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Qty</label>
                        <input
                          type="number"
                          value={item.quantityOrdered}
                          onChange={e => updateOrderItem(idx, 'quantityOrdered', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                          min={1}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Dosage</label>
                        <input
                          value={item.dosage}
                          onChange={e => updateOrderItem(idx, 'dosage', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                          placeholder="e.g. 500mg"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Route</label>
                        <select
                          value={item.route}
                          onChange={e => updateOrderItem(idx, 'route', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                        >
                          {ROUTES.map(r => <option key={r}>{r}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Frequency</label>
                        <input
                          value={item.frequency}
                          onChange={e => updateOrderItem(idx, 'frequency', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                          placeholder="e.g. Twice daily"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Duration</label>
                        <input
                          value={item.duration}
                          onChange={e => updateOrderItem(idx, 'duration', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                          placeholder="e.g. 5 days"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowNewOrder(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={submitOrder} disabled={saving} className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
                {saving ? 'Creating...' : 'Create Order'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Order Detail Modal */}
      {showOrderDetail && selectedOrder && (
        <Modal title={`Order: ${selectedOrder.orderNumber}`} onClose={() => setShowOrderDetail(false)} wide>
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${ORDER_STATUS_COLORS[selectedOrder.status] || 'bg-gray-100 text-gray-600'}`}>
                {selectedOrder.status}
              </span>
              <span className="text-xs text-gray-400">{new Date(selectedOrder.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4 text-sm">
              <InfoRow label="Patient" value={selectedOrder.patientName} />
              <InfoRow label="Patient Code" value={selectedOrder.patientCode} />
              {selectedOrder.prescribedBy && <InfoRow label="Prescribed By" value={selectedOrder.prescribedBy} />}
              {selectedOrder.notes && <InfoRow label="Notes" value={selectedOrder.notes} className="col-span-2" />}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Items</h3>
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr>
                      <th className="text-left px-4 py-2.5">Medicine</th>
                      <th className="text-center px-4 py-2.5">Ordered</th>
                      <th className="text-center px-4 py-2.5">Dispensed</th>
                      <th className="text-left px-4 py-2.5">Instructions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {selectedOrder.items?.map(item => (
                      <tr key={item.id}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{item.medicineName}</div>
                          {item.dosage && <div className="text-xs text-gray-400">{item.dosage}</div>}
                        </td>
                        <td className="px-4 py-3 text-center font-semibold">{item.quantityOrdered}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-semibold ${item.quantityDispensed >= item.quantityOrdered ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {item.quantityDispensed || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{[item.route, item.frequency, item.duration].filter(Boolean).join(' · ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-3 pt-2 border-t border-gray-100">
              {(selectedOrder.status === 'Pending' || selectedOrder.status === 'PartiallyDispensed') && (
                <button onClick={() => openDispense(selectedOrder)} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700">
                  Dispense Medicines
                </button>
              )}
              <button onClick={() => setShowOrderDetail(false)} className="ml-auto px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Close</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Dispense Modal */}
      {showDispense && (
        <Modal title="Dispense Medicines" onClose={() => setShowDispense(false)} wide>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Dispensed By</label>
              <input
                value={dispenseForm.dispensedBy}
                onChange={e => setDispenseForm(f => ({ ...f, dispensedBy: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="Pharmacist name"
              />
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Select Batches & Quantities</h3>
              <div className="space-y-3">
                {dispenseForm.items.map((item, idx) => (
                  <div key={item.id} className="border border-gray-100 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{item.medicineName}</div>
                        <div className="text-xs text-gray-400">Ordered: {item.quantityOrdered} · Remaining: {item.quantityOrdered - (item.quantityDispensed || 0)}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Batch</label>
                        {item.availableBatches.length === 0 ? (
                          <div className="text-xs text-red-500 p-2 bg-red-50 rounded-lg">No stock available</div>
                        ) : (
                          <select
                            value={item.batchId}
                            onChange={e => {
                              const items = [...dispenseForm.items]
                              items[idx] = { ...items[idx], batchId: e.target.value }
                              setDispenseForm(f => ({ ...f, items }))
                            }}
                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                          >
                            <option value="">Select batch</option>
                            {item.availableBatches.map(b => (
                              <option key={b.id} value={b.id}>
                                {b.batchNumber} · Exp: {new Date(b.expiryDate).toLocaleDateString('en-IN')} · Stock: {b.remainingQuantity}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Quantity to Dispense</label>
                        <input
                          type="number"
                          value={item.quantityDispensed}
                          onChange={e => {
                            const items = [...dispenseForm.items]
                            items[idx] = { ...items[idx], quantityDispensed: e.target.value }
                            setDispenseForm(f => ({ ...f, items }))
                          }}
                          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                          min={1}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowDispense(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={submitDispense} disabled={saving} className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
                {saving ? 'Dispensing...' : 'Confirm Dispense'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Medicine Modal */}
      {showAddMedicine && (
        <Modal title="Add Medicine to Catalog" onClose={() => setShowAddMedicine(false)} wide>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Medicine Name *</label>
                <input
                  value={medicineForm.name}
                  onChange={e => setMedicineForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="Brand name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Generic Name</label>
                <input
                  value={medicineForm.genericName}
                  onChange={e => setMedicineForm(f => ({ ...f, genericName: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="Generic / INN name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Manufacturer</label>
                <input
                  value={medicineForm.manufacturer}
                  onChange={e => setMedicineForm(f => ({ ...f, manufacturer: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="Company name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                <select
                  value={medicineForm.category}
                  onChange={e => setMedicineForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Dosage Form</label>
                <select
                  value={medicineForm.dosageForm}
                  onChange={e => setMedicineForm(f => ({ ...f, dosageForm: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  {DOSAGE_FORMS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Strength</label>
                  <input
                    value={medicineForm.strength}
                    onChange={e => setMedicineForm(f => ({ ...f, strength: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    placeholder="e.g. 500"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
                  <select
                    value={medicineForm.unit}
                    onChange={e => setMedicineForm(f => ({ ...f, unit: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-2 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    {['mg', 'g', 'mcg', 'ml', 'IU', '%', 'units'].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Reorder Level</label>
                <input
                  type="number"
                  value={medicineForm.reorderLevel}
                  onChange={e => setMedicineForm(f => ({ ...f, reorderLevel: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">GST %</label>
                <select
                  value={medicineForm.gstPercentage}
                  onChange={e => setMedicineForm(f => ({ ...f, gstPercentage: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  {[0, 5, 12, 18, 28].map(g => <option key={g} value={g}>{g}%</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowAddMedicine(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={submitMedicine} disabled={saving} className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Add Medicine'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Stock Modal */}
      {showAddStock && selectedMedicine && (
        <Modal title={`Add Stock: ${selectedMedicine.name}`} onClose={() => setShowAddStock(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Batch Number *</label>
                <input
                  value={stockForm.batchNumber}
                  onChange={e => setStockForm(f => ({ ...f, batchNumber: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="e.g. BATCH001"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Quantity *</label>
                <input
                  type="number"
                  value={stockForm.quantityAdded}
                  onChange={e => setStockForm(f => ({ ...f, quantityAdded: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Manufacturing Date</label>
                <input
                  type="date"
                  value={stockForm.manufacturingDate}
                  onChange={e => setStockForm(f => ({ ...f, manufacturingDate: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Expiry Date *</label>
                <input
                  type="date"
                  value={stockForm.expiryDate}
                  onChange={e => setStockForm(f => ({ ...f, expiryDate: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Purchase Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={stockForm.purchasePrice}
                  onChange={e => setStockForm(f => ({ ...f, purchasePrice: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Selling Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={stockForm.sellingPrice}
                  onChange={e => setStockForm(f => ({ ...f, sellingPrice: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Supplier</label>
                <input
                  value={stockForm.supplier}
                  onChange={e => setStockForm(f => ({ ...f, supplier: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="Supplier / Distributor"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Invoice Number</label>
                <input
                  value={stockForm.invoiceNumber}
                  onChange={e => setStockForm(f => ({ ...f, invoiceNumber: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="Invoice / PO number"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowAddStock(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={submitStock} disabled={saving} className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Add Stock'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Batches Modal */}
      {showBatches && selectedMedicine && (
        <Modal title={`Batches: ${selectedMedicine.name}`} onClose={() => setShowBatches(false)} wide>
          <div>
            {batches.length === 0 ? (
              <div className="py-8 text-center text-gray-400">No batches on record</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                    <th className="text-left py-2.5 pr-4">Batch No</th>
                    <th className="text-left py-2.5 pr-4">Expiry</th>
                    <th className="text-right py-2.5 pr-4">Qty Added</th>
                    <th className="text-right py-2.5 pr-4">Remaining</th>
                    <th className="text-right py-2.5 pr-4">MRP</th>
                    <th className="text-left py-2.5">Supplier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {batches.map(b => (
                    <tr key={b.id} className={b.isExpired ? 'opacity-50' : ''}>
                      <td className="py-3 pr-4 font-mono text-xs">{b.batchNumber}</td>
                      <td className="py-3 pr-4">
                        <div className={`text-xs font-medium ${b.isExpired ? 'text-red-600' : b.daysToExpiry <= 90 ? 'text-amber-600' : 'text-gray-700'}`}>
                          {new Date(b.expiryDate).toLocaleDateString('en-IN')}
                        </div>
                        {b.isExpired ? (
                          <div className="text-xs text-red-500">Expired</div>
                        ) : (
                          <div className="text-xs text-gray-400">{b.daysToExpiry}d left</div>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-right text-gray-700">{b.quantity}</td>
                      <td className="py-3 pr-4 text-right font-semibold text-gray-900">{b.remainingQuantity}</td>
                      <td className="py-3 pr-4 text-right text-gray-700">₹{b.sellingPrice}</td>
                      <td className="py-3 text-xs text-gray-500">{b.supplier || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
              <button onClick={() => { setShowBatches(false); openAddStock(selectedMedicine) }} className="text-sm text-emerald-600 hover:text-emerald-800 font-medium">+ Add Stock</button>
              <button onClick={() => setShowBatches(false)} className="px-4 py-2 text-sm text-gray-500">Close</button>
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
