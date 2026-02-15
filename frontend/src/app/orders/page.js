'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import Link from 'next/link'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchOrders()
  }, [filter])

  const fetchOrders = async () => {
    try {
      let url = '/orders'
      if (filter === 'today') url = '/orders/today'

      const response = await api.get(url)
      let filteredOrders = Array.isArray(response) ? response : []

      if (filter !== 'all' && filter !== 'today') {
        filteredOrders = filteredOrders.filter(order => order?.status === filter)
      }

      setOrders(filteredOrders)
      setError(null)
    } catch (error) {
      console.error('خطأ في تحميل الطلبات:', error)
      setError('فشل تحميل الطلبات')
      toast.error('فشل تحميل الطلبات')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}`, { status: newStatus })
      toast.success('تم تحديث حالة الطلب')
      fetchOrders()
    } catch (error) {
      console.error('خطأ في تحديث حالة الطلب:', error)
      toast.error('فشل تحديث الحالة')
    }
  }

  const handleDelete = async (orderId, orderNumber) => {
    if (!confirm(`هل أنت متأكد من حذف الطلب #${orderNumber}؟`)) return

    try {
      await api.delete(`/orders/${orderId}`)
      toast.success('تم حذف الطلب')
      // تحديث القائمة بدون إعادة تحميل كاملة
      setOrders(prev => prev.filter(o => o._id !== orderId))
    } catch (error) {
      console.error('خطأ في حذف الطلب:', error)
      toast.error('فشل حذف الطلب')
    }
  }

  const getStatusConfig = (status) => {
    switch (status) {
      case 'قيد الانتظار':
        return { text: 'قيد الانتظار', color: 'bg-amber-100 text-amber-800', icon: '⏳', badge: 'bg-amber-500' }
      case 'قيد التوصيل':
        return { text: 'قيد التوصيل', color: 'bg-blue-100 text-blue-800', icon: '🚚', badge: 'bg-blue-500' }
      case 'تم التوصيل':
        return { text: 'تم التوصيل', color: 'bg-emerald-100 text-emerald-800', icon: '✅', badge: 'bg-emerald-500' }
      default:
        return { text: status || 'غير معروف', color: 'bg-gray-100 text-gray-800', icon: '❓', badge: 'bg-gray-500' }
    }
  }

  const filteredOrders = orders.filter(order => {
    if (!order) return false
    const term = searchTerm.toLowerCase()
    return (
      order.customerName?.toLowerCase().includes(term) ||
      order.orderNumber?.includes(searchTerm) ||
      order.customerPhone?.includes(searchTerm)
    )
  })

  const stats = {
    total: orders.length,
    amount: orders.reduce((sum, o) => sum + (o?.totalAmount || 0), 0),
    today: orders.filter(o => {
      if (!o?.createdAt) return false
      return new Date(o.createdAt).toDateString() === new Date().toDateString()
    }).length
  }

  if (loading) return <LoadingSpinner message="جاري تحميل الطلبات..." />

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-3 md:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">الطلبات</h1>
            <p className="text-gray-500 text-sm mt-1">إدارة ومتابعة الطلبات</p>
          </div>
          <Link
            href="/orders/new"
            className="inline-flex items-center justify-center px-5 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/20 hover:shadow-xl transition-all active:scale-95 min-h-[48px]"
          >
            <span className="ml-2 text-lg">✨</span>
            طلب جديد
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 text-lg">📊</div>
              <div>
                <p className="text-xs text-gray-500">إجمالي الطلبات</p>
                <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 text-lg">💰</div>
              <div>
                <p className="text-xs text-gray-500">إجمالي المبلغ</p>
                <p className="text-xl font-bold text-gray-900">{stats.amount.toFixed(2)} ر.س</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 text-lg">📅</div>
              <div>
                <p className="text-xs text-gray-500">طلبات اليوم</p>
                <p className="text-xl font-bold text-gray-900">{stats.today}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                className="w-full h-12 pr-11 pl-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-right text-base"
                placeholder="ابحث بالعميل، رقم الطلب أو الهاتف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="absolute right-3.5 top-3.5 text-gray-400 text-lg">🔍</span>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute left-3 top-3.5 text-gray-400 hover:text-gray-600 text-lg w-8 h-8 flex items-center justify-center"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 h-12 rounded-xl font-medium transition-all text-sm ${
                  filter === 'all' ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setFilter('today')}
                className={`px-4 h-12 rounded-xl font-medium transition-all text-sm ${
                  filter === 'today' ? 'bg-purple-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                اليوم
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {['قيد الانتظار', 'قيد التوصيل', 'تم التوصيل'].map(status => {
              const cfg = getStatusConfig(status)
              return (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                    filter === status ? cfg.badge + ' text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="ml-1">{cfg.icon}</span>
                  {status}
                </button>
              )
            })}
          </div>
        </div>

        {/* Orders List (Card view on mobile, table on desktop) */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-semibold text-gray-900">الطلبات ({filteredOrders.length})</h2>
            <span className="text-sm text-gray-500">{format(new Date(), 'dd MMMM yyyy', { locale: ar })}</span>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center text-3xl mb-4">📦</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'لا توجد نتائج' : filter === 'today' ? 'لا توجد طلبات اليوم' : 'لا توجد طلبات'}
              </h3>
              <p className="text-gray-500 text-sm max-w-xs mx-auto">
                {searchTerm ? 'حاول بكلمات بحث مختلفة' : filter === 'today' ? 'لم يتم إنشاء أي طلبات اليوم' : 'ابدأ بإنشاء طلب جديد'}
              </p>
              {!searchTerm && filter !== 'today' && (
                <Link href="/orders/new" className="mt-6 inline-block px-6 py-3 bg-blue-500 text-white rounded-xl font-medium shadow-md min-h-[48px]">
                  ✨ إنشاء أول طلب
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-right py-4 px-4 text-sm font-medium text-gray-500 whitespace-nowrap">الطلب</th>
                    <th className="text-right py-4 px-4 text-sm font-medium text-gray-500 whitespace-nowrap">العميل</th>
                    <th className="text-right py-4 px-4 text-sm font-medium text-gray-500 whitespace-nowrap">التاريخ</th>
                    <th className="text-right py-4 px-4 text-sm font-medium text-gray-500 whitespace-nowrap">المبلغ</th>
                    <th className="text-right py-4 px-4 text-sm font-medium text-gray-500 whitespace-nowrap">الحالة</th>
                    <th className="text-right py-4 px-4 text-sm font-medium text-gray-500 whitespace-nowrap">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => {
                    const status = getStatusConfig(order.status)
                    return (
                      <tr key={order._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3 whitespace-nowrap">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">📦</div>
                            <div>
                              <p className="font-medium text-gray-900">#{order.orderNumber || order._id?.slice(-8)}</p>
                              <p className="text-xs text-gray-500">{order.items?.length || 0} منتج</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="whitespace-nowrap">
                            <p className="font-medium text-gray-900">{order.customerName || 'عميل'}</p>
                            {order.customerPhone && <p className="text-xs text-gray-500">{order.customerPhone}</p>}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="whitespace-nowrap">
                            <p className="text-sm text-gray-900">{order.createdAt ? format(new Date(order.createdAt), 'dd/MM/yyyy') : '-'}</p>
                            <p className="text-xs text-gray-500">{order.createdAt ? format(new Date(order.createdAt), 'HH:mm') : ''}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-bold text-gray-900 whitespace-nowrap">{(order.totalAmount || 0).toFixed(2)} ر.س</p>
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-2 whitespace-nowrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                              {status.icon} {status.text}
                            </span>
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order._id, e.target.value)}
                              className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="قيد الانتظار">قيد الانتظار</option>
                              <option value="قيد التوصيل">قيد التوصيل</option>
                              <option value="تم التوصيل">تم التوصيل</option>
                            </select>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <button
                              onClick={() => router.push(`/orders/${order._id}`)}
                              className="w-9 h-9 rounded-lg bg-blue-100 hover:bg-blue-200 flex items-center justify-center text-blue-600 transition-colors flex-shrink-0"
                              title="عرض"
                            >
                              👁️
                            </button>
                            <button
                              onClick={() => router.push(`/orders/${order._id}/edit`)}
                              className="w-9 h-9 rounded-lg bg-amber-100 hover:bg-amber-200 flex items-center justify-center text-amber-600 transition-colors flex-shrink-0"
                              title="تعديل"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(order._id, order.orderNumber || order._id.slice(-8))}
                              className="w-9 h-9 rounded-lg bg-red-100 hover:bg-red-200 flex items-center justify-center text-red-600 transition-colors flex-shrink-0"
                              title="حذف"
                            >
                              🗑️
                            </button>
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
    </div>
  )
}