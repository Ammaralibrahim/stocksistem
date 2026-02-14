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
    expiringDrugs: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard/stats')
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
        expiringDrugs: response.expiringDrugs || []
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6" dir="rtl">
        <LoadingSpinner message="جاري تحميل لوحة التحكم..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6" dir="rtl">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center mb-6">
              <span className="text-4xl">⚠️</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">
              فشل تحميل لوحة التحكم
            </h3>
            <p className="text-gray-600 mb-8 max-w-md text-center">
              {error} الرجاء التحقق من اتصال الإنترنت والمحاولة مرة أخرى.
            </p>
            <button
              onClick={fetchDashboardData}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm hover:shadow"
            >
              حاول مرة أخرى
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 flex-col md:flex-row">
            <div className="mb-4 md:mb-0">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight text-right">
                لوحة التحكم الرئيسية
              </h1>
              <p className="text-gray-500 mt-1 text-right">
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 text-right">طلبات اليوم</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1 text-right">
                    {stats.todayOrders}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <span className="text-blue-600 text-lg">📦</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 text-right">مبيعات اليوم</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1 text-right">
                    {stats.todaySales.toFixed(2)} ر.س
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <span className="text-emerald-600 text-lg">💰</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 text-right">إجمالي الأدوية</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1 text-right">
                    {stats.totalDrugs}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                  <span className="text-purple-600 text-lg">💊</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 text-right">قيمة المخزون</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1 text-right">
                    {stats.totalStockValue.toFixed(2)} ر.س
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                  <span className="text-amber-600 text-lg">📊</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 text-right">إجراءات سريعة</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              href="/drugs/new" 
              className="group bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-100 rounded-2xl p-5 hover:border-blue-200 hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center ml-4 group-hover:scale-110 transition-transform">
                  <span className="text-xl text-white">✨</span>
                </div>
                <div className="text-right">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    إضافة دواء جديد
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">أضف دواء إلى المستودع</p>
                </div>
              </div>
            </Link>

            <Link 
              href="/orders/new" 
              className="group bg-gradient-to-br from-emerald-50 to-emerald-50/50 border border-emerald-100 rounded-2xl p-5 hover:border-emerald-200 hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center ml-4 group-hover:scale-110 transition-transform">
                  <span className="text-xl text-white">🚀</span>
                </div>
                <div className="text-right">
                  <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                    طلب جديد
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">إنشاء طلب عميل جديد</p>
                </div>
              </div>
            </Link>

            <Link 
              href="/drugs" 
              className="group bg-gradient-to-br from-purple-50 to-purple-50/50 border border-purple-100 rounded-2xl p-5 hover:border-purple-200 hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center ml-4 group-hover:scale-110 transition-transform">
                  <span className="text-xl text-white">📋</span>
                </div>
                <div className="text-right">
                  <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                    إدارة المخزون
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">عرض وتحديث الأدوية</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Alerts & Warnings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Low Stock Drugs */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="border-b border-gray-100 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center ml-3">
                    <span className="text-red-600 text-lg">⚠️</span>
                  </div>
                  <div className="text-right">
                    <h2 className="font-semibold text-gray-900">أدوية منخفضة المخزون</h2>
                    <p className="text-sm text-gray-500">أقل من الحد الأدنى</p>
                  </div>
                </div>
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                  {stats.lowStockCount}
                </span>
              </div>
            </div>
            
            <div className="p-5">
              {stats.lowStockDrugs.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">✅</span>
                  </div>
                  <p className="text-gray-600 font-medium">جميع الأدوية بمخزون كافٍ</p>
                  <p className="text-sm text-gray-500 mt-1">لا توجد إنذارات</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.lowStockDrugs.slice(0, 5).map((drug) => (
                    <div 
                      key={drug._id} 
                      className="group flex items-center justify-between p-4 bg-gradient-to-r from-red-50/50 to-red-50/30 border border-red-100 rounded-xl hover:border-red-200 transition-all cursor-pointer"
                    >
                      <div className="text-right">
                        <h4 className="font-medium text-gray-900 group-hover:text-red-600 transition-colors">
                          {drug.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          المخزون: {drug.stock} وحدة
                        </p>
                      </div>
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-lg bg-white border border-red-200 flex items-center justify-center ml-3">
                          <span className="text-red-600">💊</span>
                        </div>
                        <div className="text-left">
                          <span className="inline-block bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-medium">
                            حرج
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {stats.lowStockDrugs.length > 5 && (
                    <div className="text-center pt-3">
                      <Link 
                        href="/drugs?filter=low-stock" 
                        className="text-sm font-medium text-gray-600 hover:text-gray-900"
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
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="border-b border-gray-100 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center ml-3">
                    <span className="text-amber-600 text-lg">⏰</span>
                  </div>
                  <div className="text-right">
                    <h2 className="font-semibold text-gray-900">أدوية قريبة الانتهاء</h2>
                    <p className="text-sm text-gray-500">خلال 30 يوم</p>
                  </div>
                </div>
                <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium">
                  {stats.expiringCount}
                </span>
              </div>
            </div>
            
            <div className="p-5">
              {stats.expiringDrugs.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">✅</span>
                  </div>
                  <p className="text-gray-600 font-medium">لا توجد أدوية قريبة الانتهاء</p>
                  <p className="text-sm text-gray-500 mt-1">جميع التواريخ سليمة</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.expiringDrugs.slice(0, 5).map((drug) => {
                    const daysLeft = Math.ceil(
                      (new Date(drug.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
                    )
                    return (
                      <div 
                        key={drug._id} 
                        className="group flex items-center justify-between p-4 bg-gradient-to-r from-amber-50/50 to-amber-50/30 border border-amber-100 rounded-xl hover:border-amber-200 transition-all cursor-pointer"
                      >
                        <div className="text-right">
                          <h4 className="font-medium text-gray-900 group-hover:text-amber-600 transition-colors">
                            {drug.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            ينتهي في: {format(new Date(drug.expiryDate), 'dd/MM/yyyy')}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-lg bg-white border border-amber-200 flex items-center justify-center ml-3">
                            <span className="text-amber-600">💊</span>
                          </div>
                          <div className="text-left">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
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
                    <div className="text-center pt-3">
                      <Link 
                        href="/drugs?filter=expiring" 
                        className="text-sm font-medium text-gray-600 hover:text-gray-900"
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
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="border-b border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <h2 className="font-semibold text-gray-900">آخر الأدوية المضافة</h2>
                <p className="text-sm text-gray-500">أحدث 5 أدوية في المستودع</p>
              </div>
              <Link 
                href="/drugs" 
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                ← عرض الكل
              </Link>
            </div>
          </div>
          
          <div className="p-5">
            {stats.recentDrugs.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">💊</span>
                </div>
                <p className="text-gray-600 font-medium">لم يتم إضافة أي أدوية بعد</p>
                <p className="text-sm text-gray-500 mt-2">
                  استخدم "إضافة دواء جديد" للبدء
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">الدواء</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">المخزون</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">السعر</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">تاريخ الانتهاء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentDrugs.map((drug) => {
                      const daysLeft = Math.ceil(
                        (new Date(drug.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
                      )
                      return (
                        <tr key={drug._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-end">
                              <span className="font-medium text-gray-900">{drug.name}</span>
                              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mr-3">
                                <span className="text-blue-600">💊</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-end">
                              {drug.stock <= (drug.lowStockThreshold || 10) && (
                                <span className="ml-2 w-2 h-2 bg-red-500 rounded-full"></span>
                              )}
                              <span className="font-semibold text-gray-900">{drug.stock} وحدة</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-semibold text-gray-900">{drug.price.toFixed(2)} ر.س</span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col items-end">
                              <span className="text-sm text-gray-900">
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
              </div>
            )}
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 p-5 bg-gradient-to-r from-blue-50 to-blue-50/50 border border-blue-100 rounded-2xl">
          <div className="flex items-start">
            <div className="text-right flex-1">
              <h3 className="font-medium text-gray-900 mb-2">💡 نصائح سريعة</h3>
              <p className="text-sm text-gray-600">
                • راقب الأدوية منخفضة المخزون لتجنب النفاد<br/>
                • تحقق من تواريخ الانتهاء بانتظام<br/>
                • أنشئ طلبات جديدة مباشرة من لوحة التحكم<br/>
                • استخدم البحث للعثور على الأدوية بسرعة
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mr-4 flex-shrink-0">
              <span className="text-blue-600">💡</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}