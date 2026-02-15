'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import api from '@/lib/api'
import toast from 'react-hot-toast'

// İkonlar (dilediğiniz kütüphane ile değiştirin)
const SearchIcon = () => <span className="text-gray-400">🔍</span>
const ClearIcon = () => <span className="text-gray-400">✕</span>
const DeleteIcon = () => <span>🗑️</span>
const EditIcon = () => <span>✏️</span>
const ViewIcon = () => <span>👁️</span>
const PrevIcon = () => <span>→</span>
const NextIcon = () => <span>←</span>

// Stok durumu rozeti (mini)
const StockStatusBadge = ({ stock }) => {
  const status = useMemo(() => {
    if (stock <= 0) return { text: 'نفذ', class: 'bg-red-100 text-red-800' }
    if (stock <= 10) return { text: 'منخفض', class: 'bg-amber-100 text-amber-800' }
    return { text: 'متوفر', class: 'bg-emerald-100 text-emerald-800' }
  }, [stock])

  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${status.class}`}>
      {status.text}
    </span>
  )
}

// İskelet kart (yüklenirken)
const SkeletonCard = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-2.5 mb-2 animate-pulse">
    <div className="flex items-start gap-2">
      <div className="w-8 h-8 bg-gray-200 rounded-lg" />
      <div className="flex-1 space-y-1">
        <div className="w-3/4 h-3 bg-gray-200 rounded" />
        <div className="w-1/2 h-2 bg-gray-200 rounded" />
      </div>
      <div className="w-4 h-4 bg-gray-200 rounded" />
    </div>
    <div className="grid grid-cols-2 gap-1 mt-2">
      <div className="h-3 bg-gray-200 rounded" />
      <div className="h-3 bg-gray-200 rounded" />
      <div className="h-3 bg-gray-200 rounded" />
    </div>
    <div className="flex justify-between mt-2">
      <div className="w-12 h-5 bg-gray-200 rounded-full" />
      <div className="flex gap-1">
        <div className="w-7 h-7 bg-gray-200 rounded-lg" />
        <div className="w-7 h-7 bg-gray-200 rounded-lg" />
        <div className="w-7 h-7 bg-gray-200 rounded-lg" />
      </div>
    </div>
  </div>
)

// İskelet satır (tablo için)
const SkeletonRow = () => (
  <tr className="border-b border-gray-100 animate-pulse">
    <td className="py-2 px-2"><div className="w-4 h-4 bg-gray-200 rounded" /></td>
    <td className="py-2 px-2"><div className="flex items-center gap-2"><div className="w-7 h-7 bg-gray-200 rounded-lg" /><div className="space-y-1"><div className="w-20 h-3 bg-gray-200 rounded" /><div className="w-12 h-2 bg-gray-200 rounded" /></div></div></td>
    <td className="py-2 px-2"><div className="w-10 h-3 bg-gray-200 rounded" /></td>
    <td className="py-2 px-2"><div className="w-8 h-3 bg-gray-200 rounded" /></td>
    <td className="py-2 px-2"><div className="w-14 h-3 bg-gray-200 rounded" /></td>
    <td className="py-2 px-2"><div className="w-12 h-5 bg-gray-200 rounded-full" /></td>
    <td className="py-2 px-2"><div className="flex gap-1"><div className="w-7 h-7 bg-gray-200 rounded-lg" /><div className="w-7 h-7 bg-gray-200 rounded-lg" /><div className="w-7 h-7 bg-gray-200 rounded-lg" /></div></td>
  </tr>
)

export default function DrugsPage() {
  const router = useRouter()
  const [drugs, setDrugs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [selectedDrugs, setSelectedDrugs] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Verileri çek
  const fetchDrugs = useCallback(async () => {
    try {
      let url = '/drugs'
      if (filter === 'low-stock') url = '/drugs/low-stock'
      else if (filter === 'expiring') url = '/drugs/expiring-soon'

      const res = await api.get(url)
      setDrugs(Array.isArray(res) ? res : [])
    } catch {
      toast.error('فشل تحميل الأدوية')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchDrugs()
  }, [fetchDrugs])

  // Filtrelenmiş ilaçlar
  const filteredDrugs = useMemo(() => {
    return drugs.filter(d =>
      d?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d?.barcode?.includes(searchTerm) ||
      d?.category?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [drugs, searchTerm])

  // Sayfalama
  const totalPages = Math.ceil(filteredDrugs.length / itemsPerPage)
  const paginatedDrugs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredDrugs.slice(start, start + itemsPerPage)
  }, [filteredDrugs, currentPage])

  // Silme işlemleri
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

  // Tümünü seç / seçimi kaldır (mevcut sayfadaki)
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedDrugs(prev => [...new Set([...prev, ...paginatedDrugs.map(d => d._id)])])
    } else {
      setSelectedDrugs(prev => prev.filter(id => !paginatedDrugs.some(d => d._id === id)))
    }
  }

  const allSelected = paginatedDrugs.length > 0 && paginatedDrugs.every(d => selectedDrugs.includes(d._id))

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden" dir="rtl">
      <div className="max-w-7xl mx-auto p-2 md:p-4">
        {/* Başlık ve butonlar */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 p-3 mb-3 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">الأدوية</h1>
              <p className="text-xs text-gray-500">({drugs.length})</p>
            </div>
            <div className="flex flex-col w-full sm:w-auto sm:flex-row gap-2">
              {selectedDrugs.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="w-full sm:w-auto px-3 py-2 bg-red-500 text-white rounded-lg text-xs font-medium"
                >
                  <span className="flex items-center justify-center gap-1">
                    <DeleteIcon /> حذف ({selectedDrugs.length})
                  </span>
                </button>
              )}
              <Link
                href="/drugs/new"
                className="w-full sm:w-auto px-3 py-2 bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1"
              >
                <span>✨</span> إضافة
              </Link>
            </div>
          </div>
        </div>

        {/* Arama ve filtreler */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 mb-3 shadow-sm">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                className="w-full h-9 pr-8 pl-8 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                placeholder="ابحث..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="absolute right-2.5 top-2.5 text-gray-400 text-xs">
                <SearchIcon />
              </span>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute left-2 top-2 text-gray-400 w-5 h-5 flex items-center justify-center hover:bg-gray-100 rounded-full"
                >
                  <ClearIcon />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setFilter('all')}
                className={`flex-1 min-w-[60px] px-2 h-8 rounded-lg text-xs font-medium ${
                  filter === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setFilter('low-stock')}
                className={`flex-1 min-w-[80px] px-2 h-8 rounded-lg text-xs font-medium ${
                  filter === 'low-stock'
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ⚡ منخفض
              </button>
              <button
                onClick={() => setFilter('expiring')}
                className={`flex-1 min-w-[80px] px-2 h-8 rounded-lg text-xs font-medium ${
                  filter === 'expiring'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ⏰ قريب
              </button>
            </div>
          </div>
        </div>

        {/* Mobil Kartlar */}
        <div className="block md:hidden">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : paginatedDrugs.length > 0 ? (
            <div className="space-y-2">
              {paginatedDrugs.map((drug) => (
                <div
                  key={drug._id}
                  className={`bg-white rounded-lg border p-2.5 ${
                    selectedDrugs.includes(drug._id) ? 'border-blue-500 bg-blue-50/30' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-sm flex-shrink-0">
                      💊
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm truncate">{drug.name}</h3>
                      {drug.category && <p className="text-[10px] text-gray-500 truncate">{drug.category}</p>}
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedDrugs.includes(drug._id)}
                      onChange={() =>
                        setSelectedDrugs(prev =>
                          prev.includes(drug._id)
                            ? prev.filter(id => id !== drug._id)
                            : [...prev, drug._id]
                        )
                      }
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 flex-shrink-0"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-1 mt-2 text-[10px]">
                    <div>
                      <span className="text-gray-500">المخزون:</span>
                      <span className="mr-1 font-medium">{drug.stock}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">السعر:</span>
                      <span className="mr-1 font-medium">{drug.price}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">انتهاء:</span>
                      <span className="mr-1 font-medium">
                        {drug.expiryDate ? format(new Date(drug.expiryDate), 'dd/MM') : '-'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <StockStatusBadge stock={drug.stock} />
                    <div className="flex gap-1">
                      <button
                        onClick={() => router.push(`/drugs/${drug._id}`)}
                        className="w-7 h-7 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-600 flex items-center justify-center text-xs"
                        title="عرض"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => router.push(`/drugs/${drug._id}/edit`)}
                        className="w-7 h-7 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-600 flex items-center justify-center text-xs"
                        title="تعديل"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(drug._id, drug.name)}
                        className="w-7 h-7 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center text-xs"
                        title="حذف"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
              <span className="text-4xl">💊</span>
              <p className="text-gray-500 text-xs mt-2">لا توجد أدوية</p>
              <Link
                href="/drugs/new"
                className="inline-block mt-3 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs"
              >
                إضافة دواء جديد
              </Link>
            </div>
          )}

          {/* Sayfalama (Mobil) */}
          {filteredDrugs.length > 0 && (
            <div className="mt-3 flex flex-col items-center gap-2">
              <p className="text-[10px] text-gray-600">
                {Math.min((currentPage - 1) * itemsPerPage + 1, filteredDrugs.length)}-
                {Math.min(currentPage * itemsPerPage, filteredDrugs.length)} من {filteredDrugs.length}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1 bg-gray-100 rounded disabled:opacity-50 min-w-[32px] h-7 text-xs"
                >
                  <PrevIcon />
                </button>
                <span className="px-3 py-1 bg-blue-500 text-white rounded min-w-[32px] text-center text-xs">
                  {currentPage}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 bg-gray-100 rounded disabled:opacity-50 min-w-[32px] h-7 text-xs"
                >
                  <NextIcon />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Masaüstü Tablo */}
        <div className="hidden md:block bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-xs">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="py-2 px-2 w-8">
                    <input
                      type="checkbox"
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      checked={allSelected}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600"
                    />
                  </th>
                  <th className="text-right py-2 px-2 font-medium text-gray-600">الدواء</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-600">المخزون</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-600">السعر</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-600">انتهاء</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-600">الحالة</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-600"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                ) : paginatedDrugs.length > 0 ? (
                  paginatedDrugs.map((drug) => (
                    <tr key={drug._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-2">
                        <input
                          type="checkbox"
                          checked={selectedDrugs.includes(drug._id)}
                          onChange={() =>
                            setSelectedDrugs(prev =>
                              prev.includes(drug._id)
                                ? prev.filter(id => id !== drug._id)
                                : [...prev, drug._id]
                            )
                          }
                          className="w-4 h-4 rounded border-gray-300 text-blue-600"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-sm flex-shrink-0">
                            💊
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{drug.name}</p>
                            {drug.category && <p className="text-[10px] text-gray-500">{drug.category}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-2">{drug.stock}</td>
                      <td className="py-2 px-2 font-medium">{drug.price} ل.س</td>
                      <td className="py-2 px-2">
                        {drug.expiryDate ? format(new Date(drug.expiryDate), 'dd/MM/yyyy') : '-'}
                      </td>
                      <td className="py-2 px-2">
                        <StockStatusBadge stock={drug.stock} />
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex gap-1">
                          <button
                            onClick={() => router.push(`/drugs/${drug._id}`)}
                            className="w-7 h-7 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-600 flex items-center justify-center text-xs"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => router.push(`/drugs/${drug._id}/edit`)}
                            className="w-7 h-7 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-600 flex items-center justify-center text-xs"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(drug._id, drug.name)}
                            className="w-7 h-7 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center text-xs"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-8 text-center">
                      <span className="text-4xl">💊</span>
                      <p className="text-gray-500 text-xs mt-2">لا توجد أدوية</p>
                      <Link
                        href="/drugs/new"
                        className="inline-block mt-3 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs"
                      >
                        إضافة دواء جديد
                      </Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Sayfalama (Masaüstü) */}
          {filteredDrugs.length > 0 && (
            <div className="p-2 border-t border-gray-100 flex items-center justify-between">
              <p className="text-[10px] text-gray-600">
                عرض {Math.min((currentPage - 1) * itemsPerPage + 1, filteredDrugs.length)}-
                {Math.min(currentPage * itemsPerPage, filteredDrugs.length)} من {filteredDrugs.length}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1 bg-gray-100 rounded disabled:opacity-50 min-w-[32px] h-7 text-xs"
                >
                  <PrevIcon />
                </button>
                <span className="px-3 py-1 bg-blue-500 text-white rounded min-w-[32px] text-center text-xs">
                  {currentPage}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 bg-gray-100 rounded disabled:opacity-50 min-w-[32px] h-7 text-xs"
                >
                  <NextIcon />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}