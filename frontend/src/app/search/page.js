'use client'

import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function SearchPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [searchType, setSearchType] = useState('drugs')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: format(new Date(), 'yyyy-MM-dd')
  })
  const [error, setError] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [advancedFilters, setAdvancedFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    minStock: '',
    status: '',
    paymentMethod: ''
  })
  const searchInputRef = useRef(null)
  const [recentSearches, setRecentSearches] = useState([])

  useEffect(() => {
    const savedSearches = localStorage.getItem('recentSearches')
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches))
    }
  }, [])

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [searchType])

  const saveRecentSearch = (term, type) => {
    const newSearch = { term, type, timestamp: new Date().toISOString() }
    const updatedSearches = [
      newSearch,
      ...recentSearches.filter(s => s.term !== term || s.type !== type)
    ].slice(0, 5)
    setRecentSearches(updatedSearches)
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches))
  }

  const handleSearch = async () => {
    if (searchType === 'drugs' && !searchTerm.trim()) {
      toast.error('الرجاء إدخال مصطلح البحث')
      return
    }

    setLoading(true)
    setSearchResults([])
    setError(null)

    try {
      let results = []
      
      if (searchType === 'drugs') {
        const params = { q: searchTerm }
        if (advancedFilters.category) params.category = advancedFilters.category
        if (advancedFilters.minPrice) params.minPrice = advancedFilters.minPrice
        if (advancedFilters.maxPrice) params.maxPrice = advancedFilters.maxPrice
        if (advancedFilters.minStock) params.minStock = advancedFilters.minStock
        
        const response = await api.get('/drugs/search', { params })
        results = Array.isArray(response) ? response : []
        saveRecentSearch(searchTerm, 'drugs')
      } else {
        const params = {}
        if (dateRange.startDate) params.startDate = dateRange.startDate
        if (dateRange.endDate) params.endDate = dateRange.endDate
        if (advancedFilters.status) params.status = advancedFilters.status
        if (advancedFilters.paymentMethod) params.paymentMethod = advancedFilters.paymentMethod
        
        const response = await api.get('/orders', { params })
        results = Array.isArray(response) ? response : []
        saveRecentSearch(`${dateRange.startDate} - ${dateRange.endDate}`, 'orders')
      }
      
      setSearchResults(results)
      if (results.length === 0) {
        toast('لم يتم العثور على نتائج', { icon: '🔍', duration: 3000 })
      }
    } catch (error) {
      console.error('خطأ أثناء البحث:', error)
      setError('حدث خطأ أثناء البحث')
      toast.error('حدث خطأ أثناء البحث')
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  const clearSearch = () => {
    setSearchTerm('')
    setDateRange({ startDate: '', endDate: format(new Date(), 'yyyy-MM-dd') })
    setSearchResults([])
    setError(null)
    setAdvancedFilters({
      category: '',
      minPrice: '',
      maxPrice: '',
      minStock: '',
      status: '',
      paymentMethod: ''
    })
  }

  const getStatusConfig = (status) => {
    switch (status) {
      case 'قيد الانتظار':
        return { text: 'قيد الانتظار', color: 'bg-amber-100 text-amber-800', icon: '⏳' }
      case 'قيد التوصيل':
        return { text: 'قيد التوصيل', color: 'bg-blue-100 text-blue-800', icon: '🚚' }
      case 'تم التوصيل':
        return { text: 'تم التوصيل', color: 'bg-emerald-100 text-emerald-800', icon: '✅' }
      default:
        return { text: status || 'غير معروف', color: 'bg-gray-100 text-gray-800', icon: '❓' }
    }
  }

  const getStockStatus = (stock) => {
    if (stock === 0) return { text: 'نفذ', color: 'bg-red-100 text-red-800', dot: 'bg-red-500' }
    if (stock <= 10) return { text: 'منخفض', color: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' }
    return { text: 'متوفر', color: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' }
  }

  const handleQuickSearch = (term, type) => {
    if (type === 'drugs') {
      setSearchType('drugs')
      setSearchTerm(term)
      setTimeout(() => handleSearch(), 100)
    } else {
      setSearchType('orders')
      const dates = term.split(' - ')
      if (dates.length === 2) {
        setDateRange({ startDate: dates[0], endDate: dates[1] })
        setTimeout(() => handleSearch(), 100)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden p-2 md:p-4" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 p-3 mb-3 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">بحث ذكي</h1>
              <p className="text-xs text-gray-500">بحث سريع ومفصل في أدويتك وطلباتك</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">اختصار:</span>
              <kbd className="px-2 py-1 text-xs bg-white border border-gray-300 rounded text-gray-600">⌘K</kbd>
            </div>
          </div>
        </div>

        {/* Search Container */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 mb-3 shadow-sm">
          {/* Search Type Tabs */}
          <div className="flex border-b border-gray-100 mb-3">
            <button
              onClick={() => setSearchType('drugs')}
              className={`flex-1 py-2 text-center text-xs font-medium transition-all relative ${
                searchType === 'drugs' ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <span className="ml-1">💊</span> بحث الأدوية
              {searchType === 'drugs' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>}
            </button>
            <button
              onClick={() => setSearchType('orders')}
              className={`flex-1 py-2 text-center text-xs font-medium transition-all relative ${
                searchType === 'orders' ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <span className="ml-1">📦</span> بحث الطلبات
              {searchType === 'orders' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>}
            </button>
          </div>

          {/* Search Input */}
          <div className="mb-3">
            {searchType === 'drugs' ? (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 text-right">اسم الدواء أو الباركود</label>
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    className="w-full pr-8 pl-8 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm text-right"
                    placeholder="اكتب اسم الدواء، الباركود..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <span className="absolute right-2.5 top-2 text-gray-400 text-sm">🔍</span>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute left-2 top-2 text-gray-400 hover:text-gray-600 text-sm"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1 text-right">تاريخ البداية</label>
                    <input
                      type="date"
                      className="w-full px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-right"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1 text-right">تاريخ النهاية</label>
                    <input
                      type="date"
                      className="w-full px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-right"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Advanced Filters Toggle */}
          <div className="mb-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center text-xs text-gray-600 hover:text-gray-900"
            >
              <span className="ml-1">⚙️</span> فلاتر متقدمة
              <span className={`mr-1 transition-transform ${showFilters ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {showFilters && (
              <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {searchType === 'drugs' ? (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1 text-right">الفئة</label>
                        <select
                          className="w-full px-2 py-1.5 text-xs bg-white border border-gray-300 rounded"
                          value={advancedFilters.category}
                          onChange={(e) => setAdvancedFilters({...advancedFilters, category: e.target.value})}
                        >
                          <option value="">الكل</option>
                          <option value="مسكن-للآلام">مسكن</option>
                          <option value="مضاد-حيوي">مضاد حيوي</option>
                          <option value="فيتامين">فيتامين</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1 text-right">أقل سعر</label>
                        <input
                          type="number"
                          className="w-full px-2 py-1.5 text-xs bg-white border border-gray-300 rounded"
                          value={advancedFilters.minPrice}
                          onChange={(e) => setAdvancedFilters({...advancedFilters, minPrice: e.target.value})}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1 text-right">أقل مخزون</label>
                        <input
                          type="number"
                          className="w-full px-2 py-1.5 text-xs bg-white border border-gray-300 rounded"
                          value={advancedFilters.minStock}
                          onChange={(e) => setAdvancedFilters({...advancedFilters, minStock: e.target.value})}
                          placeholder="0"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1 text-right">الحالة</label>
                        <select
                          className="w-full px-2 py-1.5 text-xs bg-white border border-gray-300 rounded"
                          value={advancedFilters.status}
                          onChange={(e) => setAdvancedFilters({...advancedFilters, status: e.target.value})}
                        >
                          <option value="">الكل</option>
                          <option value="قيد الانتظار">قيد الانتظار</option>
                          <option value="قيد التوصيل">قيد التوصيل</option>
                          <option value="تم التوصيل">تم التوصيل</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1 text-right">طريقة الدفع</label>
                        <select
                          className="w-full px-2 py-1.5 text-xs bg-white border border-gray-300 rounded"
                          value={advancedFilters.paymentMethod}
                          onChange={(e) => setAdvancedFilters({...advancedFilters, paymentMethod: e.target.value})}
                        >
                          <option value="">الكل</option>
                          <option value="نقدي">نقدي</option>
                          <option value="بطاقة-ائتمان">بطاقة</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 disabled:opacity-70"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-t-2 border-white border-solid rounded-full animate-spin ml-1"></div>
                  جاري...
                </div>
              ) : (
                <span className="flex items-center justify-center gap-1">🔍 بحث</span>
              )}
            </button>
            <button
              onClick={clearSearch}
              className="px-3 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium"
            >
              مسح
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-100 rounded-lg">
            <div className="flex items-center">
              <span className="text-red-600 ml-2">⚠️</span>
              <span className="text-xs text-gray-800">{error}</span>
              <button onClick={handleSearch} className="mr-auto text-xs text-red-600 font-medium">إعادة المحاولة</button>
            </div>
          </div>
        )}

        {/* Recent Searches */}
        {recentSearches.length > 0 && searchResults.length === 0 && !loading && (
          <div className="mb-3">
            <h3 className="text-xs font-medium text-gray-700 mb-2 text-right">عمليات البحث الأخيرة</h3>
            <div className="flex flex-wrap gap-1 justify-end">
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickSearch(search.term, search.type)}
                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs"
                >
                  <span className="ml-1">{search.type === 'drugs' ? '💊' : '📦'}</span>
                  {search.term.length > 20 ? search.term.substring(0, 20) + '…' : search.term}
                  <span className="mr-1 text-gray-500">{format(new Date(search.timestamp), 'HH:mm')}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-6">
            <LoadingSpinner message="جاري البحث..." />
          </div>
        ) : searchResults.length > 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            {/* Results Header */}
            <div className="border-b border-gray-100 p-3">
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {searchType === 'drugs' ? 'نتائج الأدوية' : 'نتائج الطلبات'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {searchResults.length} نتيجة {searchTerm && `لـ "${searchTerm}"`}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">📊</button>
                  <button className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">📤</button>
                </div>
              </div>
            </div>

            {/* Mobile Results (Cards) */}
            <div className="block md:hidden p-2">
              {searchType === 'drugs' ? (
                <div className="space-y-2">
                  {searchResults.map((drug) => {
                    const stockStatus = getStockStatus(drug.stock || 0)
                    return (
                      <div
                        key={drug._id}
                        className="bg-white border border-gray-200 rounded-lg p-2 hover:border-blue-300 transition-colors cursor-pointer"
                        onClick={() => router.push(`/drugs/${drug._id}`)}
                      >
                        <div className="flex items-start gap-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-sm flex-shrink-0">💊</div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 text-sm truncate">{drug.name || 'دواء'}</h4>
                            <div className="flex items-center justify-between mt-1">
                              <div>
                                <span className="text-xs text-gray-500">المخزون:</span>{' '}
                                <span className="text-xs font-medium">{drug.stock || 0}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${stockStatus.color}`}>
                                {stockStatus.text}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-sm font-bold text-gray-900">{(drug.price || 0).toFixed(2)} ل.س</span>
                              {drug.expiryDate && (
                                <span className="text-[10px] text-gray-500">انتهاء: {format(new Date(drug.expiryDate), 'dd/MM')}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((order) => {
                    const statusConfig = getStatusConfig(order.status)
                    return (
                      <div
                        key={order._id}
                        className="bg-white border border-gray-200 rounded-lg p-2 hover:border-blue-300 transition-colors cursor-pointer"
                        onClick={() => router.push(`/orders/${order._id}`)}
                      >
                        <div className="flex items-start gap-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-sm flex-shrink-0">📦</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-gray-900 text-sm">#{order.orderNumber || order._id?.slice(-8)}</h4>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusConfig.color}`}>
                                {statusConfig.icon} {statusConfig.text}
                              </span>
                            </div>
                            <p className="text-xs text-gray-900 truncate">{order.customerName}</p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-gray-600">{(order.totalAmount || 0).toFixed(2)} ل.س</span>
                              <span className="text-[10px] text-gray-500">
                                {order.createdAt ? format(new Date(order.createdAt), 'dd/MM/yyyy') : '-'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Desktop Results (Table) */}
            <div className="hidden md:block overflow-x-auto">
              {searchType === 'drugs' ? (
                <table className="w-full min-w-[700px] text-xs">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-200">
                      <th className="text-right py-2 px-3 font-medium text-gray-600">الدواء</th>
                      <th className="text-right py-2 px-3 font-medium text-gray-600">المخزون</th>
                      <th className="text-right py-2 px-3 font-medium text-gray-600">السعر</th>
                      <th className="text-right py-2 px-3 font-medium text-gray-600">انتهاء</th>
                      <th className="text-right py-2 px-3 font-medium text-gray-600">الحالة</th>
                      <th className="text-right py-2 px-3 font-medium text-gray-600"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map((drug) => {
                      const stockStatus = getStockStatus(drug.stock || 0)
                      return (
                        <tr
                          key={drug._id}
                          className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                          onClick={() => router.push(`/drugs/${drug._id}`)}
                        >
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center text-xs">💊</div>
                              <span className="font-medium text-gray-900">{drug.name || 'دواء'}</span>
                            </div>
                          </td>
                          <td className="py-2 px-3">{drug.stock || 0}</td>
                          <td className="py-2 px-3 font-bold">{(drug.price || 0).toFixed(2)} ل.س</td>
                          <td className="py-2 px-3">
                            {drug.expiryDate ? format(new Date(drug.expiryDate), 'dd/MM/yyyy') : '-'}
                          </td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${stockStatus.color}`}>
                              {stockStatus.text}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <button className="text-blue-600 hover:text-blue-800">عرض</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              ) : (
                <table className="w-full min-w-[700px] text-xs">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-200">
                      <th className="text-right py-2 px-3 font-medium text-gray-600">الطلب</th>
                      <th className="text-right py-2 px-3 font-medium text-gray-600">العميل</th>
                      <th className="text-right py-2 px-3 font-medium text-gray-600">التاريخ</th>
                      <th className="text-right py-2 px-3 font-medium text-gray-600">المبلغ</th>
                      <th className="text-right py-2 px-3 font-medium text-gray-600">الحالة</th>
                      <th className="text-right py-2 px-3 font-medium text-gray-600"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map((order) => {
                      const statusConfig = getStatusConfig(order.status)
                      return (
                        <tr
                          key={order._id}
                          className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                          onClick={() => router.push(`/orders/${order._id}`)}
                        >
                          <td className="py-2 px-3 font-medium">#{order.orderNumber || order._id?.slice(-8)}</td>
                          <td className="py-2 px-3">{order.customerName || 'عميل'}</td>
                          <td className="py-2 px-3">
                            {order.createdAt ? format(new Date(order.createdAt), 'dd/MM/yyyy') : '-'}
                          </td>
                          <td className="py-2 px-3 font-bold">{(order.totalAmount || 0).toFixed(2)} ل.س</td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusConfig.color}`}>
                              {statusConfig.icon} {statusConfig.text}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <button className="text-blue-600 hover:text-blue-800">عرض</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Results Footer (Pagination) */}
            <div className="border-t border-gray-100 p-2 flex items-center justify-between">
              <span className="text-xs text-gray-600">{searchResults.length} نتيجة</span>
              <div className="flex gap-1">
                <button className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50">→</button>
                <button className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50">←</button>
              </div>
            </div>
          </div>
        ) : (
          searchTerm || dateRange.startDate || Object.values(advancedFilters).some(v => v) ? (
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <span className="text-2xl">🔍</span>
              <h3 className="text-sm font-medium text-gray-900 mt-2">لا توجد نتائج</h3>
              <p className="text-xs text-gray-500 mt-1">حاول تغيير معايير البحث</p>
              <button onClick={clearSearch} className="mt-3 px-3 py-1.5 text-xs bg-blue-500 text-white rounded-lg">بحث جديد</button>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <span className="text-2xl">🔍</span>
              <h3 className="text-sm font-medium text-gray-900 mt-2">ابدأ البحث</h3>
              <p className="text-xs text-gray-500 mt-1">أدخل كلمة البحث أو حدد تاريخاً</p>
            </div>
          )
        )}

        {/* Quick Tips */}
        <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
          <div className="flex items-start">
            <span className="text-blue-600 ml-2">💡</span>
            <div className="text-xs text-gray-700">
              <p className="font-medium mb-1">نصائح البحث:</p>
              <p>• اكتب الأحرف الأولى من اسم الدواء</p>
              <p>• استخدم الفلاتر المتقدمة لدقة أكثر</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}