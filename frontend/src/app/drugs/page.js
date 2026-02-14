'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import Link from 'next/link'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function DrugsPage() {
  const router = useRouter()
  const [drugs, setDrugs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState(null)
  const [selectedDrugs, setSelectedDrugs] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const fetchDrugs = useCallback(async () => {
    try {
      let url = '/drugs'
      if (filter === 'low-stock') url = '/drugs/low-stock'
      else if (filter === 'expiring') url = '/drugs/expiring-soon'

      const res = await api.get(url)
      setDrugs(Array.isArray(res) ? res : [])
      setError(null)
    } catch {
      setError('فشل تحميل الأدوية')
      toast.error('فشل تحميل الأدوية')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchDrugs()
  }, [fetchDrugs])

  const handleDelete = async (id, name) => {
    if (!confirm(`حذف "${name}"؟`)) return
    try {
      await api.delete(`/drugs/${id}`)
      setDrugs(prev => prev.filter(d => d._id !== id))
      toast.success('تم الحذف')
    } catch {
      toast.error('فشل الحذف')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedDrugs.length === 0) return toast.error('لم تختر أي دواء')
    if (!confirm(`حذف ${selectedDrugs.length} دواء؟`)) return
    try {
      await Promise.all(selectedDrugs.map(id => api.delete(`/drugs/${id}`)))
      setDrugs(prev => prev.filter(d => !selectedDrugs.includes(d._id)))
      setSelectedDrugs([])
      toast.success('تم الحذف الجماعي')
    } catch {
      toast.error('فشل الحذف الجماعي')
    }
  }

  const filteredDrugs = drugs.filter(d =>
    d?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d?.barcode?.includes(searchTerm) ||
    d?.category?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPages = Math.ceil(filteredDrugs.length / itemsPerPage)
  const start = (currentPage - 1) * itemsPerPage
  const currentDrugs = filteredDrugs.slice(start, start + itemsPerPage)

  const getStockStatus = (stock) => {
    if (stock <= 0) return { text: 'نفذ', class: 'bg-red-100 text-red-800', dot: 'bg-red-500' }
    if (stock <= 10) return { text: 'منخفض', class: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' }
    return { text: 'متوفر', class: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' }
  }

  if (loading) return <LoadingSpinner message="جاري تحميل الأدوية..." />

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-3 md:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">الأدوية</h1>
            <p className="text-gray-500 text-sm mt-1">إدارة مخزون الأدوية ({drugs.length})</p>
          </div>
          <div className="flex gap-3">
            {selectedDrugs.length > 0 && (
              <button onClick={handleBulkDelete} className="px-4 py-2 bg-red-500 text-white rounded-xl shadow-md">🗑️ حذف المختارة ({selectedDrugs.length})</button>
            )}
            <Link href="/drugs/new" className="px-5 py-2 bg-blue-500 text-white rounded-xl shadow-md flex items-center gap-2">
              <span>✨</span> إضافة دواء
            </Link>
          </div>
        </div>

        {/* Arama ve filtreler */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                className="w-full h-12 pr-11 pl-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="ابحث بالاسم، الباركود، الفئة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="absolute right-3.5 top-3.5 text-gray-400">🔍</span>
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute left-3 top-3.5 text-gray-400">✕</button>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setFilter('all')} className={`px-4 h-12 rounded-xl font-medium transition-all ${filter === 'all' ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>الكل</button>
              <button onClick={() => setFilter('low-stock')} className={`px-4 h-12 rounded-xl font-medium transition-all ${filter === 'low-stock' ? 'bg-amber-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>⚡ مخزون منخفض</button>
              <button onClick={() => setFilter('expiring')} className={`px-4 h-12 rounded-xl font-medium transition-all ${filter === 'expiring' ? 'bg-red-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>⏰ صلاحية قريبة</button>
            </div>
          </div>
        </div>

        {/* Tablo */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="py-4 px-4 w-10"><input type="checkbox" onChange={(e) => setSelectedDrugs(e.target.checked ? currentDrugs.map(d => d._id) : [])} checked={selectedDrugs.length === currentDrugs.length && currentDrugs.length > 0} className="w-5 h-5 rounded border-gray-300" /></th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-gray-500">الدواء</th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-gray-500">المخزون</th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-gray-500">السعر</th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-gray-500">تاريخ الانتهاء</th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-gray-500">الحالة</th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-gray-500">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {currentDrugs.map(drug => {
                  const stock = getStockStatus(drug.stock)
                  return (
                    <tr key={drug._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-4 px-4">
                        <input type="checkbox" checked={selectedDrugs.includes(drug._id)} onChange={() => setSelectedDrugs(prev => prev.includes(drug._id) ? prev.filter(id => id !== drug._id) : [...prev, drug._id])} className="w-5 h-5 rounded border-gray-300" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">💊</div>
                          <div>
                            <p className="font-medium text-gray-900">{drug.name}</p>
                            {drug.category && <p className="text-xs text-gray-500">{drug.category}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${stock.dot}`}></span>
                          <span>{drug.stock} وحدة</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-bold">{drug.price} ر.س</td>
                      <td className="py-4 px-4">{drug.expiryDate ? format(new Date(drug.expiryDate), 'dd/MM/yyyy', { locale: ar }) : '-'}</td>
                      <td className="py-4 px-4"><span className={`px-3 py-1 rounded-full text-xs font-medium ${stock.class}`}>{stock.text}</span></td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => router.push(`/drugs/${drug._id}`)} className="w-9 h-9 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-600">👁️</button>
                          <button onClick={() => router.push(`/drugs/${drug._id}/edit`)} className="w-9 h-9 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-600">✏️</button>
                          <button onClick={() => handleDelete(drug._id, drug.name)} className="w-9 h-9 rounded-lg bg-red-100 hover:bg-red-200 text-red-600">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {currentDrugs.length === 0 && (
                  <tr><td colSpan="7" className="py-12 text-center text-gray-500">لا توجد أدوية</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredDrugs.length > 0 && (
            <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-600">عرض {start + 1}-{Math.min(start + itemsPerPage, filteredDrugs.length)} من {filteredDrugs.length}</p>
              <div className="flex gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-3 py-2 bg-gray-100 rounded-lg disabled:opacity-50">→ السابق</button>
                <span className="px-4 py-2 bg-blue-500 text-white rounded-lg">{currentPage}</span>
                <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-2 bg-gray-100 rounded-lg disabled:opacity-50">التالي ←</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}