'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import Link from 'next/link'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function Dashboard() {
  const [stats, setStats] = useState({
    todayOrders: 0,
    todaySales: 0,
    totalDrugs: 0,
    totalStock: 0,
    totalStockValue: 0,
    lowStockCount: 0,
    expiringCount: 0,
    recentDrugs: [],
    lowStockDrugs: [],
    expiringDrugs: [],
    activeCart: null,
    cartSales: { count: 0, total: 0 }
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await api.dashboard.getStats()
      setStats({
        todayOrders: response.todayOrders || 0,
        todaySales: response.todaySales || 0,
        totalDrugs: response.totalDrugs || 0,
        totalStock: response.totalStock || 0,
        totalStockValue: response.totalStockValue || 0,
        lowStockCount: response.lowStockCount || 0,
        expiringCount: response.expiringCount || 0,
        recentDrugs: response.recentDrugs || [],
        lowStockDrugs: response.lowStockDrugs || [],
        expiringDrugs: response.expiringDrugs || [],
        activeCart: response.activeCart || null,
        cartSales: response.cartSales || { count: 0, total: 0 }
      })
      setError(null)
    } catch (error) {
      console.error('خطأ في تحميل بيانات لوحة التحكم:', error)
      setError('فشل تحميل بيانات لوحة التحكم')
      toast.error('فشل تحميل بيانات لوحة التحكم')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-6" dir="rtl">
        <LoadingSpinner message="جاري تحميل لوحة التحكم..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-6" dir="rtl">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center mb-4 md:mb-6">
              <span className="text-3xl md:text-4xl">⚠️</span>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 md:mb-3 text-center">
              فشل تحميل لوحة التحكم
            </h3>
            <p className="text-sm md:text-base text-gray-600 mb-6 md:mb-8 max-w-md text-center px-4">
              {error} الرجاء التحقق من اتصال الإنترنت والمحاولة مرة أخرى.
            </p>
            <button
              onClick={fetchDashboardData}
              className="px-5 py-3 md:px-6 md:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm hover:shadow text-sm md:text-base min-h-[44px]"
            >
              حاول مرة أخرى
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-3 md:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between mb-4 flex-col md:flex-row">
            <div className="mb-4 md:mb-0 w-full md:w-auto">
              <h1 className="text-xl md:text-3xl font-bold text-gray-900 tracking-tight text-right">
                لوحة التحكم الرئيسية
              </h1>
              <p className="text-sm md:text-base text-gray-500 mt-1 text-right">
                مرحباً! إليك ملخص المخزون والطلبات.
              </p>
            </div>
            <div className="hidden md:block px-4 py-2 bg-white border border-gray-200 rounded-xl">
              <p className="text-sm font-medium text-gray-900 text-right">
                {format(new Date(), 'dd MMMM yyyy', { locale: ar })}
              </p>
              <p className="text-xs text-gray-500 text-right">اليوم</p>
            </div>
          </div>
          
          {/* Quick Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-6">
            <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 text-right">طلبات اليوم</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1 text-right">
                    {stats.todayOrders}
                  </p>
                </div>
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <span className="text-blue-600 text-base md:text-lg">📦</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 text-right">مبيعات اليوم</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1 text-right">
                    {stats.todaySales.toFixed(2)} <span className="text-xs">ل.س</span>
                  </p>
                </div>
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <span className="text-emerald-600 text-base md:text-lg">💰</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 text-right">إجمالي الأدوية</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1 text-right">
                    {stats.totalDrugs}
                  </p>
                </div>
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                  <span className="text-purple-600 text-base md:text-lg">💊</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 text-right">قيمة المخزون</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1 text-right">
                    {stats.totalStockValue.toFixed(2)} <span className="text-xs">ل.س</span>
                  </p>
                </div>
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                  <span className="text-amber-600 text-base md:text-lg">📊</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cart Section */}
        {stats.activeCart && (
          <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 overflow-hidden shadow-sm mb-6">
            <div className="border-b border-gray-100 p-4 md:p-5">
              <div className="flex items-center">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-blue-50 flex items-center justify-center ml-2 md:ml-3">
                  <span className="text-blue-600 text-base md:text-lg">🚚</span>
                </div>
                <div className="text-right">
                  <h2 className="font-semibold text-gray-900 text-sm md:text-base">العربة النشطة</h2>
                  <p className="text-xs text-gray-500">معلومات وتفاصيل العربة</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 md:p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">اسم العربة</span>
                    <span className="font-medium">{stats.activeCart.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">السائق</span>
                    <span className="font-medium">{stats.activeCart.driverName || 'غير معين'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">عدد المنتجات</span>
                    <span className="font-bold text-blue-600">{stats.activeCart.totalItems || 0}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">قيمة العربة</span>
                    <span className="font-bold text-emerald-600">{(stats.activeCart.totalValue || 0).toFixed(2)} ل.س</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">الحالة</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      stats.activeCart.status === 'نشطة' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {stats.activeCart.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">آخر تحميل</span>
                    <span className="text-sm">
                      {stats.activeCart.lastLoadedAt ? format(new Date(stats.activeCart.lastLoadedAt), 'dd/MM HH:mm') : '-'}
                    </span>
                  </div>
                </div>
              </div>
              
              {stats.cartSales?.count > 0 && (
                <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="flex items-center justify-between">
                    <div className="text-right">
                      <p className="text-xs text-gray-600">مبيعات العربة اليوم</p>
                      <p className="text-sm font-bold text-purple-700">{stats.cartSales.count} طلب</p>
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-gray-600">الإجمالي</p>
                      <p className="text-sm font-bold text-purple-700">{stats.cartSales.total.toFixed(2)} ل.س</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex gap-3 mt-4">
                <Link
                  href="/cart"
                  className="flex-1 py-2.5 text-center bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                >
                  عرض تفاصيل العربة
                </Link>
                <Link
                  href="/cart/sale"
                  className="flex-1 py-2.5 text-center bg-purple-50 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors"
                >
                  بيع سريع
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4 text-right">إجراءات سريعة</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <Link 
              href="/drugs/new" 
              className="group bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-100 rounded-xl md:rounded-2xl p-4 md:p-5 hover:border-blue-200 hover:shadow-md transition-all duration-300 active:scale-[0.98]"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center ml-3 md:ml-4 group-hover:scale-110 transition-transform">
                  <span className="text-lg md:text-xl text-white">✨</span>
                </div>
                <div className="text-right">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm md:text-base">
                    إضافة دواء جديد
                  </h3>
                  <p className="text-xs md:text-sm text-gray-600 mt-1">أضف دواء إلى المستودع</p>
                </div>
              </div>
            </Link>

            <Link 
              href="/orders/new" 
              className="group bg-gradient-to-br from-emerald-50 to-emerald-50/50 border border-emerald-100 rounded-xl md:rounded-2xl p-4 md:p-5 hover:border-emerald-200 hover:shadow-md transition-all duration-300 active:scale-[0.98]"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center ml-3 md:ml-4 group-hover:scale-110 transition-transform">
                  <span className="text-lg md:text-xl text-white">🚀</span>
                </div>
                <div className="text-right">
                  <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors text-sm md:text-base">
                    طلب جديد
                  </h3>
                  <p className="text-xs md:text-sm text-gray-600 mt-1">إنشاء طلب عميل جديد</p>
                </div>
              </div>
            </Link>

            <Link 
              href="/cart/load" 
              className="group bg-gradient-to-br from-amber-50 to-amber-50/50 border border-amber-100 rounded-xl md:rounded-2xl p-4 md:p-5 hover:border-amber-200 hover:shadow-md transition-all duration-300 active:scale-[0.98]"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center ml-3 md:ml-4 group-hover:scale-110 transition-transform">
                  <span className="text-lg md:text-xl text-white">📦</span>
                </div>
                <div className="text-right">
                  <h3 className="font-semibold text-gray-900 group-hover:text-amber-600 transition-colors text-sm md:text-base">
                    تحميل للعربة
                  </h3>
                  <p className="text-xs md:text-sm text-gray-600 mt-1">نقل منتجات من المستودع</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Alerts & Warnings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Low Stock Drugs */}
          <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="border-b border-gray-100 p-4 md:p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-red-50 flex items-center justify-center ml-2 md:ml-3">
                    <span className="text-red-600 text-base md:text-lg">⚠️</span>
                  </div>
                  <div className="text-right">
                    <h2 className="font-semibold text-gray-900 text-sm md:text-base">أدوية منخفضة المخزون</h2>
                    <p className="text-xs text-gray-500">أقل من الحد الأدنى</p>
                  </div>
                </div>
                <span className="bg-red-100 text-red-700 px-2 py-1 md:px-3 md:py-1 rounded-full text-xs font-medium">
                  {stats.lowStockCount}
                </span>
              </div>
            </div>
            
            <div className="p-4 md:p-5">
              {stats.lowStockDrugs.length === 0 ? (
                <div className="text-center py-6 md:py-8">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 md:mb-4">
                    <span className="text-2xl md:text-3xl">✅</span>
                  </div>
                  <p className="text-sm md:text-base text-gray-600 font-medium">جميع الأدوية بمخزون كافٍ</p>
                  <p className="text-xs text-gray-500 mt-1">لا توجد إنذارات</p>
                </div>
              ) : (
                <div className="space-y-2 md:space-y-3">
                  {stats.lowStockDrugs.slice(0, 5).map((drug) => (
                    <div 
                      key={drug._id} 
                      className="group flex items-center justify-between p-3 md:p-4 bg-gradient-to-r from-red-50/50 to-red-50/30 border border-red-100 rounded-xl hover:border-red-200 transition-all cursor-pointer active:bg-red-100/50"
                    >
                      <div className="text-right">
                        <h4 className="font-medium text-gray-900 group-hover:text-red-600 transition-colors text-sm md:text-base">
                          {drug.name}
                        </h4>
                        <p className="text-xs text-gray-600">
                          المخزون: {drug.stock} وحدة
                        </p>
                      </div>
                      <div className="flex items-center">
                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-white border border-red-200 flex items-center justify-center ml-2 md:ml-3">
                          <span className="text-red-600 text-sm md:text-base">💊</span>
                        </div>
                        <div className="text-left">
                          <span className="inline-block bg-red-100 text-red-700 px-2 py-1 md:px-2.5 md:py-1 rounded-full text-xs font-medium">
                            حرج
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {stats.lowStockDrugs.length > 5 && (
                    <div className="text-center pt-2 md:pt-3">
                      <Link 
                        href="/drugs?filter=low-stock" 
                        className="text-xs md:text-sm font-medium text-gray-600 hover:text-gray-900 inline-block p-2"
                      >
                        ← إظهار {stats.lowStockDrugs.length - 5} إضافية
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Expiring Drugs */}
          <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="border-b border-gray-100 p-4 md:p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-amber-50 flex items-center justify-center ml-2 md:ml-3">
                    <span className="text-amber-600 text-base md:text-lg">⏰</span>
                  </div>
                  <div className="text-right">
                    <h2 className="font-semibold text-gray-900 text-sm md:text-base">أدوية قريبة الانتهاء</h2>
                    <p className="text-xs text-gray-500">خلال 30 يوم</p>
                  </div>
                </div>
                <span className="bg-amber-100 text-amber-700 px-2 py-1 md:px-3 md:py-1 rounded-full text-xs font-medium">
                  {stats.expiringCount}
                </span>
              </div>
            </div>
            
            <div className="p-4 md:p-5">
              {stats.expiringDrugs.length === 0 ? (
                <div className="text-center py-6 md:py-8">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 md:mb-4">
                    <span className="text-2xl md:text-3xl">✅</span>
                  </div>
                  <p className="text-sm md:text-base text-gray-600 font-medium">لا توجد أدوية قريبة الانتهاء</p>
                  <p className="text-xs text-gray-500 mt-1">جميع التواريخ سليمة</p>
                </div>
              ) : (
                <div className="space-y-2 md:space-y-3">
                  {stats.expiringDrugs.slice(0, 5).map((drug) => {
                    const daysLeft = Math.ceil(
                      (new Date(drug.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
                    )
                    return (
                      <div 
                        key={drug._id} 
                        className="group flex items-center justify-between p-3 md:p-4 bg-gradient-to-r from-amber-50/50 to-amber-50/30 border border-amber-100 rounded-xl hover:border-amber-200 transition-all cursor-pointer active:bg-amber-100/50"
                      >
                        <div className="text-right">
                          <h4 className="font-medium text-gray-900 group-hover:text-amber-600 transition-colors text-sm md:text-base">
                            {drug.name}
                          </h4>
                          <p className="text-xs text-gray-600">
                            ينتهي في: {format(new Date(drug.expiryDate), 'dd/MM/yyyy')}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-white border border-amber-200 flex items-center justify-center ml-2 md:ml-3">
                            <span className="text-amber-600 text-sm md:text-base">💊</span>
                          </div>
                          <div className="text-left">
                            <span className={`inline-block px-2 py-1 md:px-2.5 md:py-1 rounded-full text-xs font-medium ${
                              daysLeft <= 7 
                                ? 'bg-red-100 text-red-700' 
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {daysLeft} يوم
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {stats.expiringDrugs.length > 5 && (
                    <div className="text-center pt-2 md:pt-3">
                      <Link 
                        href="/drugs?filter=expiring" 
                        className="text-xs md:text-sm font-medium text-gray-600 hover:text-gray-900 inline-block p-2"
                      >
                        ← إظهار {stats.expiringDrugs.length - 5} إضافية
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Drugs */}
        <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="border-b border-gray-100 p-4 md:p-5">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <h2 className="font-semibold text-gray-900 text-sm md:text-base">آخر الأدوية المضافة</h2>
                <p className="text-xs text-gray-500">أحدث 5 أدوية في المستودع</p>
              </div>
              <Link 
                href="/drugs" 
                className="px-3 py-2 md:px-4 md:py-2 text-xs md:text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                ← عرض الكل
              </Link>
            </div>
          </div>
          
          <div className="p-4 md:p-5 overflow-x-auto">
            {stats.recentDrugs.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <span className="text-2xl md:text-3xl">💊</span>
                </div>
                <p className="text-sm md:text-base text-gray-600 font-medium">لم يتم إضافة أي أدوية بعد</p>
                <p className="text-xs text-gray-500 mt-2">
                  استخدم "إضافة دواء جديد" للبدء
                </p>
              </div>
            ) : (
              <table className="w-full min-w-[600px] md:min-w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-right py-2 md:py-3 px-2 md:px-4 text-xs font-medium text-gray-500">الدواء</th>
                    <th className="text-right py-2 md:py-3 px-2 md:px-4 text-xs font-medium text-gray-500">المخزون</th>
                    <th className="text-right py-2 md:py-3 px-2 md:px-4 text-xs font-medium text-gray-500">السعر</th>
                    <th className="text-right py-2 md:py-3 px-2 md:px-4 text-xs font-medium text-gray-500">تاريخ الانتهاء</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentDrugs.map((drug) => {
                    const daysLeft = Math.ceil(
                      (new Date(drug.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
                    )
                    return (
                      <tr key={drug._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 md:py-4 px-2 md:px-4">
                          <div className="flex items-center justify-end">
                            <span className="font-medium text-gray-900 text-sm">{drug.name}</span>
                            <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-blue-50 flex items-center justify-center mr-2">
                              <span className="text-blue-600 text-xs md:text-sm">💊</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 md:py-4 px-2 md:px-4">
                          <div className="flex items-center justify-end">
                            {drug.stock <= (drug.lowStockThreshold || 10) && (
                              <span className="ml-2 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                            )}
                            <span className="font-semibold text-gray-900 text-sm">{drug.stock} وحدة</span>
                          </div>
                        </td>
                        <td className="py-3 md:py-4 px-2 md:px-4">
                          <span className="font-semibold text-gray-900 text-sm">{drug.price.toFixed(2)} ل.س</span>
                        </td>
                        <td className="py-3 md:py-4 px-2 md:px-4">
                          <div className="flex flex-col items-end">
                            <span className="text-xs md:text-sm text-gray-900">
                              {format(new Date(drug.expiryDate), 'dd/MM/yyyy')}
                            </span>
                            <span className={`text-xs ${
                              daysLeft <= 0 ? 'text-red-600' :
                              daysLeft <= 30 ? 'text-amber-600' : 'text-gray-500'
                            }`}>
                              {daysLeft <= 0 ? 'منتهي' : `متبقي ${daysLeft} يوم`}
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Tips */}
        <div className="mt-6 md:mt-8 p-4 md:p-5 bg-gradient-to-r from-blue-50 to-blue-50/50 border border-blue-100 rounded-xl md:rounded-2xl">
          <div className="flex items-start">
            <div className="text-right flex-1">
              <h3 className="font-medium text-gray-900 mb-2 text-sm md:text-base">💡 نصائح سريعة</h3>
              <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                • راقب الأدوية منخفضة المخزون لتجنب النفاد<br/>
                • تحقق من تواريخ الانتهاء بانتظام<br/>
                • استخدم العربة للبيع السريع من المخزون المتحرك<br/>
                • أنشئ طلبات جديدة مباشرة من لوحة التحكم
              </p>
            </div>
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-blue-100 flex items-center justify-center mr-3 md:mr-4 flex-shrink-0">
              <span className="text-blue-600 text-base md:text-lg">💡</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}