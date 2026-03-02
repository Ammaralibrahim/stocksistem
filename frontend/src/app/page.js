'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import Link from 'next/link'
import api from '@/lib/api'
import toast from 'react-hot-toast'

// Skeleton bileşenleri (yüklenirken gösterilecek)
const StatsSkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-6">
    {[1, 2, 3, 4].map(i => (
      <div key={i} className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-3 w-16 bg-gray-200 rounded" />
            <div className="h-6 w-20 bg-gray-200 rounded" />
          </div>
          <div className="w-9 h-9 md:w-10 md:h-10 bg-gray-200 rounded-lg" />
        </div>
      </div>
    ))}
  </div>
)

const CartSkeleton = () => (
  <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 shadow-sm mb-6 animate-pulse">
    <div className="border-b border-gray-100 p-4 md:p-5">
      <div className="flex items-center">
        <div className="w-9 h-9 md:w-10 md:h-10 bg-gray-200 rounded-lg ml-2 md:ml-3" />
        <div className="space-y-2">
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="h-3 w-24 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
    <div className="p-4 md:p-5 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex justify-between">
              <div className="h-3 w-20 bg-gray-200 rounded" />
              <div className="h-3 w-24 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex justify-between">
              <div className="h-3 w-20 bg-gray-200 rounded" />
              <div className="h-3 w-24 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-3 mt-4">
        <div className="flex-1 h-10 bg-gray-200 rounded-lg" />
        <div className="flex-1 h-10 bg-gray-200 rounded-lg" />
      </div>
    </div>
  </div>
)

const QuickActionsSkeleton = () => (
  <div className="mb-6 md:mb-8 animate-pulse">
    <div className="h-5 w-28 bg-gray-200 rounded mb-3 md:mb-4" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-gray-100 rounded-xl md:rounded-2xl p-4 md:p-5">
          <div className="flex items-center">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-200 rounded-xl ml-3 md:ml-4" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-3 w-24 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

const AlertsSkeleton = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8 animate-pulse">
    {[1, 2].map(i => (
      <div key={i} className="bg-white rounded-xl md:rounded-2xl border border-gray-100 shadow-sm">
        <div className="border-b border-gray-100 p-4 md:p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-9 h-9 md:w-10 md:h-10 bg-gray-200 rounded-lg ml-2 md:ml-3" />
              <div className="space-y-2">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-3 w-24 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="w-8 h-6 bg-gray-200 rounded-full" />
          </div>
        </div>
        <div className="p-4 md:p-5 space-y-3">
          {[1, 2, 3].map(j => (
            <div key={j} className="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-xl">
              <div className="space-y-2">
                <div className="h-4 w-40 bg-gray-200 rounded" />
                <div className="h-3 w-24 bg-gray-200 rounded" />
              </div>
              <div className="flex items-center">
                <div className="w-9 h-9 md:w-10 md:h-10 bg-gray-200 rounded-lg ml-2" />
                <div className="w-12 h-6 bg-gray-200 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
)

const RecentDrugsSkeleton = () => (
  <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 shadow-sm animate-pulse">
    <div className="border-b border-gray-100 p-4 md:p-5">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="h-3 w-24 bg-gray-200 rounded" />
        </div>
        <div className="w-16 h-8 bg-gray-200 rounded-lg" />
      </div>
    </div>
    <div className="p-4 md:p-5">
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
            <div className="flex items-center">
              <div className="w-7 h-7 md:w-8 md:h-8 bg-gray-200 rounded-lg ml-2" />
              <div className="space-y-1">
                <div className="h-3 w-32 bg-gray-200 rounded" />
                <div className="h-2 w-20 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="h-3 w-16 bg-gray-200 rounded" />
              <div className="h-2 w-12 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)

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
      <div className="min-h-screen bg-gray-50 p-3 md:p-4" dir="rtl">
        <div className="max-w-7xl mx-auto">
          {/* Header Skeletoni */}
          <div className="mb-6 md:mb-8">
            <div className="flex items-center justify-between mb-4 flex-col md:flex-row">
              <div className="mb-4 md:mb-0 w-full md:w-auto">
                <div className="h-7 w-48 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-64 bg-gray-200 rounded" />
              </div>
              <div className="hidden md:block w-32 h-12 bg-gray-200 rounded-xl" />
            </div>
            <StatsSkeleton />
          </div>
          <CartSkeleton />
          <QuickActionsSkeleton />
          <AlertsSkeleton />
          <RecentDrugsSkeleton />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-3 md:p-4" dir="rtl">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
              <span className="text-2xl md:text-3xl">⚠️</span>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 text-center">
              فشل تحميل لوحة التحكم
            </h3>
            <p className="text-sm text-gray-600 mb-6 max-w-md text-center px-4">
              {error} الرجاء التحقق من اتصال الإنترنت والمحاولة مرة أخرى.
            </p>
            <button
              onClick={fetchDashboardData}
              className="px-5 py-3 bg-blue-500 text-white rounded-xl text-sm font-medium min-h-[44px]"
            >
              حاول مرة أخرى
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-4" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between mb-4 flex-col md:flex-row">
            <div className="mb-4 md:mb-0 w-full md:w-auto">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 text-right">
                لوحة التحكم
              </h1>
              <p className="text-sm text-gray-500 mt-1 text-right">
                مرحباً! إليك ملخص المخزون والطلبات
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
            <div className="bg-white p-3 md:p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 text-right">طلبات اليوم</p>
                  <p className="text-lg md:text-xl font-bold text-gray-900 mt-1 text-right">
                    {stats.todayOrders}
                  </p>
                </div>
                <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <span className="text-blue-600 text-sm md:text-base">📦</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-3 md:p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 text-right">مبيعات اليوم</p>
                  <p className="text-lg md:text-xl font-bold text-gray-900 mt-1 text-right">
                    {stats.todaySales.toFixed(2)} <span className="text-xs">ل.س</span>
                  </p>
                </div>
                <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <span className="text-emerald-600 text-sm md:text-base">💰</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-3 md:p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 text-right">إجمالي الأدوية</p>
                  <p className="text-lg md:text-xl font-bold text-gray-900 mt-1 text-right">
                    {stats.totalDrugs}
                  </p>
                </div>
                <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-purple-50 flex items-center justify-center">
                  <span className="text-purple-600 text-sm md:text-base">💊</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-3 md:p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 text-right">قيمة المخزون</p>
                  <p className="text-lg md:text-xl font-bold text-gray-900 mt-1 text-right">
                    {stats.totalStockValue.toFixed(2)} <span className="text-xs">ل.س</span>
                  </p>
                </div>
                <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                  <span className="text-amber-600 text-sm md:text-base">📊</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cart Section */}
        {stats.activeCart && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
            <div className="border-b border-gray-200 p-3 md:p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-blue-50 flex items-center justify-center ml-2">
                  <span className="text-blue-600 text-sm md:text-base">🚚</span>
                </div>
                <div className="text-right">
                  <h2 className="font-semibold text-gray-900 text-sm">السيارة النشطة</h2>
                  <p className="text-xs text-gray-500">معلومات السيارة</p>
                </div>
              </div>
            </div>
            
            <div className="p-3 md:p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">اسم السيارة</span>
                    <span className="font-medium">{stats.activeCart.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">السائق</span>
                    <span className="font-medium">{stats.activeCart.driverName || 'غير معين'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">عدد المنتجات</span>
                    <span className="font-bold text-blue-600">{stats.activeCart.totalItems || 0}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">قيمة السيارة</span>
                    <span className="font-bold text-emerald-600">{(stats.activeCart.totalValue || 0).toFixed(2)} ل.س</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">الحالة</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      stats.activeCart.status === 'نشطة' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {stats.activeCart.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">آخر تحميل</span>
                    <span className="text-sm">
                      {stats.activeCart.lastLoadedAt ? format(new Date(stats.activeCart.lastLoadedAt), 'dd/MM HH:mm') : '-'}
                    </span>
                  </div>
                </div>
              </div>
              
              {stats.cartSales?.count > 0 && (
                <div className="mt-3 p-2 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="flex items-center justify-between">
                    <div className="text-right">
                      <p className="text-xs text-gray-600">مبيعات السيارة اليوم</p>
                      <p className="text-sm font-bold text-purple-700">{stats.cartSales.count} طلب</p>
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-gray-600">الإجمالي</p>
                      <p className="text-sm font-bold text-purple-700">{stats.cartSales.total.toFixed(2)} ل.س</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 mt-3">
                <Link
                  href="/cart"
                  className="flex-1 py-2 text-center bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors min-h-[40px] flex items-center justify-center"
                >
                  عرض التفاصيل
                </Link>
                <Link
                  href="/cart/sale"
                  className="flex-1 py-2 text-center bg-purple-50 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-100 transition-colors min-h-[40px] flex items-center justify-center"
                >
                  بيع سريع
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-3 text-right">إجراءات سريعة</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Link 
              href="/drugs/new" 
              className="bg-blue-50 border border-blue-100 rounded-xl p-3 hover:border-blue-200 transition-all active:scale-[0.98]"
            >
              <div className="flex items-center">
                <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center ml-3">
                  <span className="text-white text-base">✨</span>
                </div>
                <div className="text-right">
                  <h3 className="font-semibold text-gray-900 text-sm">إضافة دواء</h3>
                  <p className="text-xs text-gray-600">أضف دواء جديد</p>
                </div>
              </div>
            </Link>

            <Link 
              href="/orders/new" 
              className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 hover:border-emerald-200 transition-all active:scale-[0.98]"
            >
              <div className="flex items-center">
                <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center ml-3">
                  <span className="text-white text-base">🚀</span>
                </div>
                <div className="text-right">
                  <h3 className="font-semibold text-gray-900 text-sm">طلب جديد</h3>
                  <p className="text-xs text-gray-600">إنشاء طلب عميل</p>
                </div>
              </div>
            </Link>

            <Link 
              href="/cart/load" 
              className="bg-amber-50 border border-amber-100 rounded-xl p-3 hover:border-amber-200 transition-all active:scale-[0.98]"
            >
              <div className="flex items-center">
                <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center ml-3">
                  <span className="text-white text-base">📦</span>
                </div>
                <div className="text-right">
                  <h3 className="font-semibold text-gray-900 text-sm">تحميل للعربة</h3>
                  <p className="text-xs text-gray-600">نقل منتجات</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Alerts & Warnings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Low Stock Drugs */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="border-b border-gray-200 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center ml-2">
                    <span className="text-red-600 text-sm">⚠️</span>
                  </div>
                  <div className="text-right">
                    <h2 className="font-semibold text-gray-900 text-sm">مخزون منخفض</h2>
                    <p className="text-xs text-gray-500">أقل من الحد الأدنى</p>
                  </div>
                </div>
                <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium">
                  {stats.lowStockCount}
                </span>
              </div>
            </div>
            
            <div className="p-3">
              {stats.lowStockDrugs.length === 0 ? (
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
                    <span className="text-xl">✅</span>
                  </div>
                  <p className="text-sm text-gray-600">جميع الأدوية بمخزون كافٍ</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.lowStockDrugs.slice(0, 5).map((drug) => (
                    <div 
                      key={drug._id} 
                      className="flex items-center justify-between p-2 bg-red-50/30 border border-red-100 rounded-lg"
                    >
                      <div className="text-right">
                        <h4 className="font-medium text-gray-900 text-sm">{drug.name}</h4>
                        <p className="text-xs text-gray-600">المخزون: {drug.stock} وحدة</p>
                      </div>
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-lg bg-white border border-red-200 flex items-center justify-center ml-2">
                          <span className="text-red-600 text-sm">💊</span>
                        </div>
                        <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs">
                          حرج
                        </span>
                      </div>
                    </div>
                  ))}
                  {stats.lowStockDrugs.length > 5 && (
                    <div className="text-center pt-2">
                      <Link 
                        href="/drugs?filter=low-stock" 
                        className="text-xs text-gray-600 hover:text-gray-900"
                      >
                        ← عرض الكل ({stats.lowStockDrugs.length})
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Expiring Drugs */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="border-b border-gray-200 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center ml-2">
                    <span className="text-amber-600 text-sm">⏰</span>
                  </div>
                  <div className="text-right">
                    <h2 className="font-semibold text-gray-900 text-sm">قريب الانتهاء</h2>
                    <p className="text-xs text-gray-500">خلال 30 يوم</p>
                  </div>
                </div>
                <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-medium">
                  {stats.expiringCount}
                </span>
              </div>
            </div>
            
            <div className="p-3">
              {stats.expiringDrugs.length === 0 ? (
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
                    <span className="text-xl">✅</span>
                  </div>
                  <p className="text-sm text-gray-600">لا توجد أدوية قريبة الانتهاء</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.expiringDrugs.slice(0, 5).map((drug) => {
                    const daysLeft = Math.ceil(
                      (new Date(drug.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
                    )
                    return (
                      <div 
                        key={drug._id} 
                        className="flex items-center justify-between p-2 bg-amber-50/30 border border-amber-100 rounded-lg"
                      >
                        <div className="text-right">
                          <h4 className="font-medium text-gray-900 text-sm">{drug.name}</h4>
                          <p className="text-xs text-gray-600">
                            ينتهي: {format(new Date(drug.expiryDate), 'dd/MM')}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-lg bg-white border border-amber-200 flex items-center justify-center ml-2">
                            <span className="text-amber-600 text-sm">💊</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            daysLeft <= 7 
                              ? 'bg-red-100 text-red-700' 
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {daysLeft} يوم
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  {stats.expiringDrugs.length > 5 && (
                    <div className="text-center pt-2">
                      <Link 
                        href="/drugs?filter=expiring" 
                        className="text-xs text-gray-600 hover:text-gray-900"
                      >
                        ← عرض الكل ({stats.expiringDrugs.length})
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Drugs */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="border-b border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <h2 className="font-semibold text-gray-900 text-sm">آخر الأدوية</h2>
                <p className="text-xs text-gray-500">أحدث 5 إضافات</p>
              </div>
              <Link 
                href="/drugs" 
                className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                عرض الكل
              </Link>
            </div>
          </div>
          
          <div className="p-3">
            {stats.recentDrugs.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl">💊</span>
                </div>
                <p className="text-sm text-gray-600">لم يتم إضافة أي أدوية بعد</p>
                <Link href="/drugs/new" className="inline-block mt-2 text-xs text-blue-500 underline">
                  إضافة دواء جديد
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {stats.recentDrugs.map((drug) => {
                  const daysLeft = Math.ceil(
                    (new Date(drug.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
                  )
                  return (
                    <div key={drug._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center ml-2">
                          <span className="text-blue-600 text-xs">💊</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900 text-sm">{drug.name}</p>
                          <p className="text-xs text-gray-500">{drug.category || 'غير مصنف'}</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900 text-sm">{drug.stock} وحدة</p>
                        <p className={`text-xs ${
                          daysLeft <= 0 ? 'text-red-600' :
                          daysLeft <= 30 ? 'text-amber-600' : 'text-gray-500'
                        }`}>
                          {daysLeft <= 0 ? 'منتهي' : `متبقي ${daysLeft} يوم`}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Tips */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
          <div className="flex items-start">
            <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center ml-2 flex-shrink-0">
              <span className="text-blue-600 text-sm">💡</span>
            </div>
            <div className="text-right text-xs text-gray-600">
              <p className="font-medium text-gray-900 mb-1">نصائح سريعة</p>
              <p>• راقب المخزون المنخفض لتجنب النفاد</p>
              <p>• تحقق من تواريخ الانتهاء بانتظام</p>
              <p>• استخدم السيارة للبيع السريع</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}