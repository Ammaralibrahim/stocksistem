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
    // Load recent searches from localStorage
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
    const newSearch = {
      term,
      type,
      timestamp: new Date().toISOString()
    }
    
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
        // Add advanced filters
        if (advancedFilters.category) params.category = advancedFilters.category
        if (advancedFilters.minPrice) params.minPrice = advancedFilters.minPrice
        if (advancedFilters.maxPrice) params.maxPrice = advancedFilters.maxPrice
        if (advancedFilters.minStock) params.minStock = advancedFilters.minStock
        
        const response = await api.get('/drugs/search', { params })
        results = Array.isArray(response) ? response : []
        saveRecentSearch(searchTerm, 'drugs')
      } else if (searchType === 'orders') {
        const params = {}
        if (dateRange.startDate) params.startDate = dateRange.startDate
        if (dateRange.endDate) params.endDate = dateRange.endDate
        // Add advanced filters
        if (advancedFilters.status) params.status = advancedFilters.status
        if (advancedFilters.paymentMethod) params.paymentMethod = advancedFilters.paymentMethod
        
        const response = await api.get('/orders', { params })
        results = Array.isArray(response) ? response : []
        saveRecentSearch(`${dateRange.startDate} - ${dateRange.endDate}`, 'orders')
      }
      
      setSearchResults(results)
      
      if (results.length === 0) {
        toast('لم يتم العثور على نتائج', {
          icon: '🔍',
          duration: 3000
        })
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
        return { 
          text: 'قيد الانتظار', 
          color: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: '⏳'
        }
      case 'قيد التوصيل':
        return { 
          text: 'قيد التوصيل', 
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: '🚚'
        }
      case 'تم التوصيل':
        return { 
          text: 'تم التوصيل', 
          color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: '✅'
        }
      default:
        return { 
          text: status || 'غير معروف', 
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: '❓'
        }
    }
  }

  const getStockStatus = (stock) => {
    if (stock === 0) return { 
      text: 'لا يوجد مخزون', 
      color: 'bg-red-100 text-red-800 border-red-200',
      dot: 'bg-red-500'
    }
    if (stock <= 10) return { 
      text: 'مخزون منخفض', 
      color: 'bg-amber-100 text-amber-800 border-amber-200',
      dot: 'bg-amber-500'
    }
    return { 
      text: 'في المخزون', 
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500'
    }
  }

  const handleQuickSearch = (term, type) => {
    if (type === 'drugs') {
      setSearchType('drugs')
      setSearchTerm(term)
      setTimeout(() => {
        handleSearch()
      }, 100)
    } else {
      setSearchType('orders')
      const dates = term.split(' - ')
      if (dates.length === 2) {
        setDateRange({
          startDate: dates[0],
          endDate: dates[1]
        })
        setTimeout(() => {
          handleSearch()
        }, 100)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 flex-row-reverse">
            <div className="text-right">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                بحث ذكي
              </h1>
              <p className="text-gray-500 mt-1">
                بحث سريع ومفصل في أدويتك وطلباتك
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="text-xs text-gray-500">اختصار:</span>
                <kbd className="px-2 py-1 text-xs bg-white border border-gray-300 rounded-lg text-gray-600">⌘K</kbd>
              </div>
            </div>
          </div>
        </div>

        {/* Search Container */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6">
          {/* Search Type Tabs */}
          <div className="flex border-b border-gray-100 mb-6 flex-row-reverse">
            <button
              onClick={() => setSearchType('drugs')}
              className={`flex-1 py-3 text-center font-medium transition-all relative ${
                searchType === 'drugs'
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center">
                <span className="ml-2">💊</span>
                بحث الأدوية
              </div>
              {searchType === 'drugs' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600"></div>
              )}
            </button>
            <button
              onClick={() => setSearchType('orders')}
              className={`flex-1 py-3 text-center font-medium transition-all relative ${
                searchType === 'orders'
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center">
                <span className="ml-2">📦</span>
                بحث الطلبات
              </div>
              {searchType === 'orders' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600"></div>
              )}
            </button>
          </div>

          {/* Search Input */}
          <div className="mb-6">
            {searchType === 'drugs' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                  اسم الدواء أو الباركود
                </label>
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    className="w-full pr-12 pl-12 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg text-right"
                    placeholder="اكتب اسم الدواء، الباركود أو الرقم التسلسلي..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <div className="absolute right-4 top-4 text-gray-400">
                    🔍
                  </div>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute left-4 top-4 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                  <div className="absolute left-16 top-4">
                    <kbd className="px-2 py-1 text-xs bg-white border border-gray-300 rounded text-gray-500">Enter</kbd>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2 text-right">
                  أمثلة: "بارول 500 مجم"، "8691234567890"، "SN20230001"
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                      تاريخ البداية
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-right"
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                      />
                      <div className="absolute left-4 top-3 text-gray-400">
                        📅
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                      تاريخ النهاية
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-right"
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                      />
                      <div className="absolute left-4 top-3 text-gray-400">
                        📅
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Advanced Filters Toggle */}
          <div className="mb-6">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900 flex-row-reverse"
            >
              <span className="mr-2">⚙️</span>
              فلاتر متقدمة
              <span className={`ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {searchType === 'drugs' ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                          الفئة
                        </label>
                        <select
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-right"
                          value={advancedFilters.category}
                          onChange={(e) => setAdvancedFilters({...advancedFilters, category: e.target.value})}
                        >
                          <option value="">جميع الفئات</option>
                          <option value="مسكن-للآلام">مسكن للآلام</option>
                          <option value="مضاد-حيوي">مضاد حيوي</option>
                          <option value="فيتامين">فيتامين</option>
                          <option value="كريم">كريم/مرهم</option>
                          <option value="شراب">شراب</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                          الحد الأدنى للسعر (ر.س)
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-right"
                          value={advancedFilters.minPrice}
                          onChange={(e) => setAdvancedFilters({...advancedFilters, minPrice: e.target.value})}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                          الحد الأدنى للمخزون
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-right"
                          value={advancedFilters.minStock}
                          onChange={(e) => setAdvancedFilters({...advancedFilters, minStock: e.target.value})}
                          placeholder="0"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                          الحالة
                        </label>
                        <select
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-right"
                          value={advancedFilters.status}
                          onChange={(e) => setAdvancedFilters({...advancedFilters, status: e.target.value})}
                        >
                          <option value="">جميع الحالات</option>
                          <option value="قيد الانتظار">قيد الانتظار</option>
                          <option value="قيد التوصيل">قيد التوصيل</option>
                          <option value="تم التوصيل">تم التوصيل</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                          طريقة الدفع
                        </label>
                        <select
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-right"
                          value={advancedFilters.paymentMethod}
                          onChange={(e) => setAdvancedFilters({...advancedFilters, paymentMethod: e.target.value})}
                        >
                          <option value="">جميع طرق الدفع</option>
                          <option value="نقدي">نقدي</option>
                          <option value="بطاقة-ائتمان">بطاقة ائتمان</option>
                          <option value="تحويل-بنكي">تحويل بنكي</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 flex-row-reverse">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm hover:shadow disabled:opacity-70"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin ml-2"></div>
                  جاري البحث...
                </>
              ) : (
                <>
                  <span className="ml-2">🔍</span>
                  بحث
                </>
              )}
            </button>
            <button
              onClick={clearSearch}
              className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl font-medium transition-colors"
            >
              مسح
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-50/50 border border-red-100 rounded-2xl">
            <div className="flex items-center flex-row-reverse">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center ml-4">
                <span className="text-red-600">⚠️</span>
              </div>
              <div className="flex-1 text-right">
                <h3 className="font-medium text-gray-900">خطأ في البحث</h3>
                <p className="text-sm text-gray-600 mt-1">{error}</p>
                <button
                  onClick={handleSearch}
                  className="mt-2 text-sm font-medium text-red-600 hover:text-red-700"
                >
                  ← حاول مرة أخرى
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recent Searches */}
        {recentSearches.length > 0 && searchResults.length === 0 && !loading && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3 text-right">عمليات البحث الأخيرة</h3>
            <div className="flex flex-wrap gap-2 justify-end">
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickSearch(search.term, search.type)}
                  className="inline-flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
                >
                  <span className="ml-2">
                    {search.type === 'drugs' ? '💊' : '📦'}
                  </span>
                  {search.term}
                  <span className="mr-2 text-xs text-gray-500">
                    {format(new Date(search.timestamp), 'HH:mm')}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner message="جاري البحث عن النتائج..." />
          </div>
        ) : searchResults.length > 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            {/* Results Header */}
            <div className="border-b border-gray-100 p-5">
              <div className="flex items-center justify-between flex-row-reverse">
                <div className="text-right">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {searchType === 'drugs' ? 'نتائج الأدوية' : 'نتائج الطلبات'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    تم العثور على {searchResults.length} نتيجة
                    {searchTerm && ` - "${searchTerm}"`}
                  </p>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <button className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                    📊 تقرير
                  </button>
                  <button className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                    📤 تصدير
                  </button>
                </div>
              </div>
            </div>

            {/* Results Content */}
            <div className="p-5">
              {searchType === 'drugs' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.map((drug) => {
                    const stockStatus = getStockStatus(drug.stock || 0)
                    return (
                      <div
                        key={drug._id}
                        className="group bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer"
                        onClick={() => router.push(`/drugs/${drug._id}`)}
                      >
                        <div className="flex items-start flex-row-reverse">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center ml-3">
                            <span className="text-blue-600">💊</span>
                          </div>
                          <div className="flex-1 text-right">
                            <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                              {drug.name || 'دواء بدون اسم'}
                            </h4>
                            <div className="flex items-center justify-between mt-2 flex-row-reverse">
                              <div className="space-y-1 text-right">
                                <div className="flex items-center flex-row-reverse">
                                  <div className={`w-2 h-2 rounded-full ml-2 ${stockStatus.dot}`}></div>
                                  <span className="text-sm font-medium text-gray-900">
                                    {drug.stock || 0} وحدة
                                  </span>
                                </div>
                                <p className="text-lg font-bold text-gray-900">
                                  {(drug.price || 0).toFixed(2)} ر.س
                                </p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${stockStatus.color}`}>
                                {stockStatus.text}
                              </span>
                            </div>
                            {drug.barcode && (
                              <p className="text-xs text-gray-500 mt-2">🏷️ {drug.barcode}</p>
                            )}
                            {drug.expiryDate && (
                              <p className="text-xs text-gray-500 mt-1">
                                تاريخ الانتهاء: {format(new Date(drug.expiryDate), 'dd/MM/yyyy', { locale: ar })}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  {searchResults.map((order) => {
                    const statusConfig = getStatusConfig(order.status)
                    return (
                      <div
                        key={order._id}
                        className="group bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer"
                        onClick={() => router.push(`/orders/${order._id}`)}
                      >
                        <div className="flex items-start justify-between flex-row-reverse">
                          <div className="flex items-start flex-row-reverse">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center ml-3">
                              <span className="text-blue-600">📦</span>
                            </div>
                            <div className="text-right">
                              <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                #{order.orderNumber || order._id?.slice(-8) || 'S-001'}
                              </h4>
                              <div className="flex items-center space-x-4 space-x-reverse mt-2">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{order.customerName}</p>
                                  {order.customerPhone && (
                                    <p className="text-xs text-gray-500">{order.customerPhone}</p>
                                  )}
                                </div>
                                <div className="flex items-center">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                                    {statusConfig.icon} {statusConfig.text}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-left">
                            <p className="text-xl font-bold text-gray-900">
                              {(order.totalAmount || 0).toFixed(2)} ر.س
                            </p>
                            <p className="text-sm text-gray-500">
                              {order.createdAt ? format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm', { locale: ar }) : '-'}
                            </p>
                          </div>
                        </div>
                        {order.notes && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-sm text-gray-600 line-clamp-2 text-right">{order.notes}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Results Footer */}
            <div className="border-t border-gray-100 p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 text-right">
                  إظهار {searchResults.length} نتيجة
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <button className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                    → التالي
                  </button>
                  <button className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                    السابق ←
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          searchTerm || dateRange.startDate || Object.values(advancedFilters).some(v => v) ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🔍</span>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">لم يتم العثور على نتائج</h3>
              <p className="text-gray-600 max-w-md mx-auto mb-6">
                لم يتم العثور على نتائج تطابق معايير بحثك. 
                يمكنك تجربة مصطلح بحث مختلف أو فلتر آخر.
              </p>
              <div className="flex justify-center space-x-3 space-x-reverse">
                <button
                  onClick={clearSearch}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  مسح الفلاتر
                </button>
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setDateRange({ startDate: '', endDate: format(new Date(), 'yyyy-MM-dd') })
                    setAdvancedFilters({
                      category: '',
                      minPrice: '',
                      maxPrice: '',
                      minStock: '',
                      status: '',
                      paymentMethod: ''
                    })
                    searchInputRef.current?.focus()
                  }}
                  className="px-4 py-2 text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg font-medium transition-all"
                >
                  بحث جديد
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🔍</span>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">ابدأ بالبحث</h3>
              <p className="text-gray-600 max-w-md mx-auto mb-6">
                ابحث باسم الدواء، الباركود أو النطاق الزمني لتسهيل إدارة المستودع الخاص بك.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3 mx-auto">
                    <span className="text-blue-600">💊</span>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2">بحث الأدوية</h4>
                  <p className="text-sm text-gray-600">
                    ابحث باسم الدواء، الباركود أو الرقم التسلسلي
                  </p>
                </div>
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center mb-3 mx-auto">
                    <span className="text-emerald-600">📦</span>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2">بحث الطلبات</h4>
                  <p className="text-sm text-gray-600">
                    قم بتصفية طلباتك حسب النطاق الزمني والحالة
                  </p>
                </div>
              </div>
            </div>
          )
        )}

        {/* Quick Tips */}
        <div className="mt-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-50/50 border border-blue-100 rounded-2xl p-5">
            <div className="flex items-start flex-row-reverse">
              <div className="w-10 h-10 rounded-lg bg-white border border-blue-200 flex items-center justify-center ml-4 flex-shrink-0">
                <span className="text-blue-600">💡</span>
              </div>
              <div className="text-right">
                <h3 className="font-medium text-gray-900 mb-2">نصائح البحث</h3>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>• اكتب الأحرف الأولى من اسم الدواء للعثور عليه بسرعة</p>
                  <p>• يمكنك البحث السريع باستخدام قارئ الباركود</p>
                  <p>• استخدم الفلاتر المتقدمة لإجراء عمليات بحث أكثر دقة</p>
                  <p>• يتم حفظ عمليات البحث التي تجريها بشكل متكرر تلقائياً</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}