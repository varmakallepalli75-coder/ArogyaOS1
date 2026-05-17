import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import healthRecordsService from '../services/healthRecordsService'

const DOC_TYPES = [
  { value: 'Prescription', label: '💊 Prescription', color: 'bg-blue-100 text-blue-700' },
  { value: 'LabReport', label: '🧪 Lab Report', color: 'bg-purple-100 text-purple-700' },
  { value: 'Discharge', label: '🏥 Discharge Summary', color: 'bg-red-100 text-red-700' },
  { value: 'Scan', label: '🖼 Scan / X-Ray', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'Vaccination', label: '💉 Vaccination', color: 'bg-green-100 text-green-700' },
  { value: 'Other', label: '📄 Other', color: 'bg-gray-100 text-gray-700' },
]

function typeColor(type) {
  return DOC_TYPES.find(d => d.value === type)?.color || 'bg-gray-100 text-gray-700'
}

export default function MyDocuments() {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [viewDoc, setViewDoc] = useState(null)
  const [filter, setFilter] = useState('All')
  const fileRef = useRef()

  const [form, setForm] = useState({
    documentType: 'LabReport',
    description: '',
    hospitalName: '',
    documentDate: new Date().toISOString().split('T')[0],
  })

  useEffect(() => { loadDocs() }, [])

  const loadDocs = async () => {
    setLoading(true)
    try {
      const res = await healthRecordsService.getDocuments()
      if (res.data.success) setDocs(res.data.data)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e) => {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) return alert('Please select a file.')
    if (file.size > 5 * 1024 * 1024) return alert('File too large. Max 5 MB.')

    setUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const base64 = ev.target.result.split(',')[1]
        const payload = {
          documentType: form.documentType,
          fileName: file.name,
          fileBase64: base64,
          mimeType: file.type,
          description: form.description,
          hospitalName: form.hospitalName,
          documentDate: form.documentDate,
        }
        const res = await healthRecordsService.uploadDocument(payload)
        if (res.data.success) {
          await loadDocs()
          setShowUpload(false)
          setForm({ documentType: 'LabReport', description: '', hospitalName: '', documentDate: new Date().toISOString().split('T')[0] })
          if (fileRef.current) fileRef.current.value = ''
        } else {
          alert(res.data.message || 'Upload failed.')
        }
        setUploading(false)
      }
      reader.readAsDataURL(file)
    } catch {
      alert('Upload failed.')
      setUploading(false)
    }
  }

  const handleView = async (doc) => {
    const res = await healthRecordsService.getDocument(doc.id)
    if (res.data.success) {
      const fullDoc = res.data.data
      setViewDoc(fullDoc)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this document?')) return
    const res = await healthRecordsService.deleteDocument(id)
    if (res.data.success) {
      setDocs(prev => prev.filter(d => d.id !== id))
      if (viewDoc?.id === id) setViewDoc(null)
    }
  }

  const filtered = filter === 'All' ? docs : docs.filter(d => d.documentType === filter)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-3">⟳</div>
          <p className="text-gray-500">Loading documents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white px-4 pt-8 pb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">My Documents</h1>
            <p className="text-indigo-100 text-sm mt-1">
              {docs.length} document{docs.length !== 1 ? 's' : ''} stored
            </p>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="bg-white text-indigo-700 font-semibold text-sm px-4 py-2 rounded-xl shadow-sm">
            + Upload
          </button>
        </div>
      </div>

      {/* Filter chips */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
        {['All', ...DOC_TYPES.map(d => d.value)].map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === type
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}>
            {type === 'All' ? 'All' : DOC_TYPES.find(d => d.value === type)?.label || type}
          </button>
        ))}
      </div>

      {/* Document list */}
      <div className="px-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-5xl mb-3">📂</div>
            <p className="text-sm font-medium">No documents yet</p>
            <p className="text-xs mt-1">Upload prescriptions, lab reports, discharge summaries, and more.</p>
            <button
              onClick={() => setShowUpload(true)}
              className="mt-4 bg-indigo-600 text-white text-sm px-6 py-2 rounded-xl font-semibold">
              Upload First Document
            </button>
          </div>
        ) : (
          filtered.map(doc => (
            <div key={doc.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-2xl flex-shrink-0">
                {DOC_TYPES.find(d => d.value === doc.documentType)?.label?.split(' ')[0] || '📄'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{doc.fileName}</p>
                <div className="flex flex-wrap items-center gap-1 mt-0.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColor(doc.documentType)}`}>
                    {doc.documentType}
                  </span>
                  {doc.hospitalName && (
                    <span className="text-xs text-gray-500">{doc.hospitalName}</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(doc.documentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                {doc.description && (
                  <p className="text-xs text-gray-500 truncate mt-0.5">{doc.description}</p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleView(doc)}
                  className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg font-medium">
                  View
                </button>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg font-medium">
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white rounded-t-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Upload Document</h2>
              <button onClick={() => setShowUpload(false)} className="text-gray-400 text-2xl">✕</button>
            </div>

            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Document Type *</label>
                <select
                  value={form.documentType}
                  onChange={e => setForm(f => ({ ...f, documentType: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {DOC_TYPES.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">File * (PDF, JPG, PNG — max 5 MB)</label>
                <input
                  type="file"
                  ref={fileRef}
                  accept=".pdf,.jpg,.jpeg,.png"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Hospital Name</label>
                <input
                  value={form.hospitalName}
                  onChange={e => setForm(f => ({ ...f, hospitalName: e.target.value }))}
                  placeholder="e.g. Apollo Hospitals, Delhi"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Document Date</label>
                <input
                  type="date"
                  value={form.documentDate}
                  onChange={e => setForm(f => ({ ...f, documentDate: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description (optional)</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  placeholder="e.g. Blood test for thyroid"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50">
                {uploading ? 'Uploading...' : 'Upload Document'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2">
        <div className="flex justify-around">
          {[
            { icon: '📋', label: 'Records',   path: '/health-records' },
            { icon: '📂', label: 'Documents', path: '/documents' },
            { icon: '👤', label: 'Profile',   path: '/profile' },
          ].map(item => (
            <Link key={item.path} to={item.path}
              className={`flex flex-col items-center text-xs gap-0.5 ${
                window.location.pathname === item.path ? 'text-indigo-600' : 'text-gray-400'
              }`}>
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* View document modal */}
      {viewDoc && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <div>
                <p className="font-semibold text-gray-800 text-sm">{viewDoc.fileName}</p>
                <p className="text-xs text-gray-500">{viewDoc.documentType} · {viewDoc.hospitalName}</p>
              </div>
              <button onClick={() => setViewDoc(null)} className="text-gray-400 text-2xl">✕</button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-100">
              {viewDoc.mimeType?.startsWith('image/') ? (
                <img
                  src={`data:${viewDoc.mimeType};base64,${viewDoc.fileBase64}`}
                  alt={viewDoc.fileName}
                  className="max-w-full max-h-full object-contain rounded"
                />
              ) : viewDoc.mimeType === 'application/pdf' ? (
                <iframe
                  src={`data:application/pdf;base64,${viewDoc.fileBase64}`}
                  className="w-full h-96 rounded"
                  title={viewDoc.fileName}
                />
              ) : (
                <p className="text-gray-500 text-sm">Cannot preview this file type.</p>
              )}
            </div>
            <div className="p-4 border-t">
              <a
                href={`data:${viewDoc.mimeType};base64,${viewDoc.fileBase64}`}
                download={viewDoc.fileName}
                className="w-full block text-center bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold">
                Download
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
