import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function Bills() {
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBill, setSelectedBill] = useState(null)
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => { loadBills() }, [])

  const loadBills = async () => {
    setLoading(true)
    try {
      const res = await api.get('/billing/my?page=1&pageSize=50')
      if (res.data.success) {
        setBills(res.data.data.items)
      }
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const statusColors = {
    Paid: 'bg-emerald-100 text-emerald-700',
    PartiallyPaid: 'bg-amber-100 text-amber-700',
    Pending: 'bg-red-100 text-red-700',
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-emerald-600 text-white px-4 pt-8 pb-6">
        <button onClick={() => navigate('/')} className="text-emerald-200 text-sm mb-2">← Back</button>
        <h1 className="text-xl font-bold">My Bills</h1>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : bills.length === 0 ? (
          <div className="flex flex-col items-center py-20">
            <div className="text-4xl mb-2">🧾</div>
            <div className="text-gray-500 font-medium">No bills found</div>
          </div>
        ) : bills.map(bill => (
          <div key={bill.id}
            onClick={() => setSelectedBill(selectedBill?.id === bill.id ? null : bill)}
            className="bg-white rounded-2xl shadow-sm p-4 cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-sm font-bold text-emerald-600">{bill.billNumber}</div>
                <div className="text-xs text-gray-500">
                  {new Date(bill.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })}
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[bill.paymentStatus] || 'bg-gray-100 text-gray-600'}`}>
                {bill.paymentStatus}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500">{bill.billType}</div>
              <div className="text-lg font-bold text-gray-900">₹{bill.totalAmount}</div>
            </div>
            {bill.dueAmount > 0 && (
              <div className="mt-2 bg-red-50 rounded-lg px-3 py-1.5 text-xs text-red-600 font-medium">
                Due: ₹{bill.dueAmount}
              </div>
            )}

            {/* Expanded Bill Details */}
            {selectedBill?.id === bill.id && (
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Sub Total</span>
                  <span>₹{bill.subTotal || bill.totalAmount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Paid</span>
                  <span className="text-emerald-600 font-medium">₹{bill.paidAmount}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-gray-100 pt-2">
                  <span>Total</span>
                  <span>₹{bill.totalAmount}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2">
        <div className="flex justify-around">
          {[
            { icon: '🏠', label: 'Home', path: '/' },
            { icon: '📅', label: 'Appointments', path: '/appointments' },
            { icon: '💊', label: 'Prescriptions', path: '/prescriptions' },
            { icon: '🧾', label: 'Bills', path: '/bills' },
            { icon: '👤', label: 'Profile', path: '/profile' },
          ].map(item => (
            <button key={item.path} onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-1 px-2 py-1">
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs text-gray-500">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
