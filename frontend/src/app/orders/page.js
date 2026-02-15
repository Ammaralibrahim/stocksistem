// app/orders/page.tsx
'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import Link from 'next/link'
import api from '@/lib/api'
import toast from 'react-hot-toast'

// İkonlar
const SearchIcon = () => <span className="text-gray-400">🔍</span>
const ClearIcon = () => <span className="text-gray-400">✕</span>
const DeleteIcon = () => <span>🗑️</span>
const EditIcon = () => <span>✏️</span>
const ViewIcon = () => <span>👁️</span>

// Durum rozeti
const StatusBadge = ({ status }) => {
  const config = useMemo(() => {
    switch (status) {
      case 'قيد الانتظار':
        return { text: 'قيد الانتظار', class: 'bg-amber-100 text-amber-800', icon: '⏳' }
      case 'قيد التوصيل':
        return { text: 'قيد التوصيل', class: 'bg-blue-100 text-blue-800', icon: '🚚' }
      case 'تم التوصيل':
        return { text: 'تم التوصيل', class: 'bg-emerald-100 text-emerald-800', icon: '✅' }
      default:
        return { text: status || 'غير معروف', class: 'bg-gray-100 text-gray-800', icon: '❓' }
    }
  }, [status])

  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${config.class} inline-flex items-center gap-1`}>
      <span>{config.icon}</span>
      <span>{config.text}</span>
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
    </div>
    <div className="grid grid-cols-2 gap-1 mt-2">
      <div className="h-3 bg-gray-200 rounded" />
      <div className="h-3 bg-gray-200 rounded" />
      <div className="h-3 bg-gray-200 rounded" />
      <div className="h-5 bg-gray-200 rounded-full" />
    </div>
    <div className="flex justify-between mt-2">
      <div className="w-16 h-5 bg-gray-200 rounded-full" />
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
    <td className="py-2 px-2"><div className="flex items-center gap-2"><div className="w-7 h-7 bg-gray-200 rounded-lg" /><div className="space-y-1"><div className="w-20 h-3 bg-gray-200 rounded" /><div className="w-12 h-2 bg-gray-200 rounded" /></div></div></td>
    <td className="py-2 px-2"><div className="space-y-1"><div className="w-16 h-3 bg-gray-200 rounded" /><div className="w-20 h-2 bg-gray-200 rounded" /></div></td>
    <td className="py-2 px-2"><div className="space-y-1"><div className="w-14 h-3 bg-gray-200 rounded" /><div className="w-10 h-2 bg-gray-200 rounded" /></div></td>
    <td className="py-2 px-2"><div className="w-12 h-3 bg-gray-200 rounded" /></td>
    <td className="py-2 px-2"><div className="w-16 h-5 bg-gray-200 rounded-full" /></td>
    <td className="py-2 px-2"><div className="flex gap-1"><div className="w-7 h-7 bg-gray-200 rounded-lg" /><div className="w-7 h-7 bg-gray-200 rounded-lg" /><div className="w-7 h-7 bg-gray-200 rounded-lg" /></div></td>
  </tr>
)

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
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
    } catch (error) {
      console.error('خطأ في تحميل الطلبات:', error)
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
      setOrders(prev => prev.filter(o => o._id !== orderId))
    } catch (error) {
      console.error('خطأ في حذف الطلب:', error)
      toast.error('فشل حذف الطلب')
    }
  }

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (!order) return false
      const term = searchTerm.toLowerCase()
      return (
        order.customerName?.toLowerCase().includes(term) ||
        order.orderNumber?.includes(searchTerm) ||
        order.customerPhone?.includes(searchTerm)
      )
    })
  }, [orders, searchTerm])

  const stats = useMemo(() => ({
    total: orders.length,
    amount: orders.reduce((sum, o) => sum + (o?.totalAmount || 0), 0),
    today: orders.filter(o => {
      if (!o?.createdAt) return false
      return new Date(o.createdAt).toDateString() === new Date().toDateString()
    }).length
  }), [orders])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 overflow-x-hidden p-2 md:p-4" dir="rtl">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/80 rounded-lg border border-gray-200 p-3 mb-3 h-16 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
            {[1,2,3].map(i => <div key={i} className="bg-white rounded-lg border border-gray-200 p-3 h-16 animate-pulse" />)}
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3 mb-3 h-24 animate-pulse" />
          <div className="space-y-2">
            {[1,2,3,4,5].map(i => <SkeletonCard key={i} />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden" dir="rtl">
      <div className="max-w-7xl mx-auto p-2 md:p-4">
        {/* Başlık ve butonlar */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 p-3 mb-3 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">الطلبات</h1>
              <p className="text-xs text-gray-500">إدارة ومتابعة الطلبات</p>
            </div>
            <Link
              href="/orders/new"
              className="w-full sm:w-auto px-3 py-2 bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1"
            >
              <span>✨</span> طلب جديد
            </Link>
          </div>
        </div>

        {/* İstatistik kartları */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
          <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-sm">📊</div>
              <div>
                <p className="text-[10px] text-gray-500">إجمالي الطلبات</p>
                <p className="text-base font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 text-sm">💰</div>
              <div>
                <p className="text-[10px] text-gray-500">إجمالي المبلغ</p>
                <p className="text-base font-bold text-gray-900">{stats.amount.toFixed(2)} ل.س</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 text-sm">📅</div>
              <div>
                <p className="text-[10px] text-gray-500">طلبات اليوم</p>
                <p className="text-base font-bold text-gray-900">{stats.today}</p>
              </div>
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
                placeholder="ابحث بالعميل، رقم الطلب أو الهاتف..."
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
            <div className="flex gap-1">
              <button
                onClick={() => setFilter('all')}
                className={`px-2 h-8 rounded-lg text-xs font-medium ${
                  filter === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setFilter('today')}
                className={`px-2 h-8 rounded-lg text-xs font-medium ${
                  filter === 'today'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                اليوم
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {['قيد الانتظار', 'قيد التوصيل', 'تم التوصيل'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-2 py-1 rounded-lg text-[10px] font-medium ${
                  filter === status
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Mobil Kartlar */}
<div className="block md:hidden">
  {filteredOrders.length === 0 ? (
    <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
      <div className="w-12 h-12 mx-auto bg-gray-100 rounded-lg flex items-center justify-center text-2xl mb-2">📦</div>
      <p className="text-gray-500 text-xs mb-3">
        {searchTerm ? 'لا توجد نتائج' : filter === 'today' ? 'لا توجد طلبات اليوم' : 'لا توجد طلبات'}
      </p>
      {!searchTerm && filter !== 'today' && (
        <Link
          href="/orders/new"
          className="inline-block px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs"
        >
          إنشاء أول طلب
        </Link>
      )}
    </div>
  ) : (
    <div className="space-y-2">
      {filteredOrders.map(order => (
        <div key={order._id} className="bg-white rounded-lg border border-gray-200 p-2 text-[10px]">
          {/* Üst satır: sipariş no, ürün sayısı, durum */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 text-xs">
                📦
              </div>
              <div>
                <span className="font-medium text-gray-900 text-xs">#{order.orderNumber || order._id?.slice(-8)}</span>
                <span className="text-gray-500 mr-1">({order.items?.length || 0})</span>
              </div>
            </div>
            <StatusBadge status={order.status} />
          </div>

          {/* Müşteri bilgileri */}
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-gray-900 truncate max-w-[120px]">{order.customerName || 'عميل'}</span>
            {order.customerPhone && <span className="text-gray-500 ltr" dir="ltr">{order.customerPhone}</span>}
          </div>

          {/* Tarih, saat, tutar */}
          <div className="flex items-center justify-between mb-2">
            <div className="text-gray-600">
              {order.createdAt ? (
                <>
                  <span>{format(new Date(order.createdAt), 'dd/MM')}</span>
                  <span className="mx-1">·</span>
                  <span>{format(new Date(order.createdAt), 'HH:mm')}</span>
                </>
              ) : '-'}
            </div>
            <span className="font-bold text-gray-900">{(order.totalAmount || 0).toFixed(0)} ل.س</span>
          </div>

          {/* Durum değiştirme ve işlemler */}
          <div className="flex items-center justify-between">
            <select
              value={order.status}
              onChange={(e) => handleStatusChange(order._id, e.target.value)}
              className="text-[9px] bg-gray-50 border border-gray-200 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="قيد الانتظار">قيد الانتظار</option>
              <option value="قيد التوصيل">قيد التوصيل</option>
              <option value="تم التوصيل">تم التوصيل</option>
            </select>
            <div className="flex gap-1">
              <button
                onClick={() => router.push(`/orders/${order._id}`)}
                className="w-6 h-6 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-600 flex items-center justify-center text-xs"
                title="عرض"
              >
                <ViewIcon />
              </button>
              <button
                onClick={() => router.push(`/orders/${order._id}/edit`)}
                className="w-6 h-6 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-600 flex items-center justify-center text-xs"
                title="تعديل"
              >
                <EditIcon />
              </button>
              <button
                onClick={() => handleDelete(order._id, order.orderNumber || order._id.slice(-8))}
                className="w-6 h-6 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center text-xs"
                title="حذف"
              >
                <DeleteIcon />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</div>

        {/* Masaüstü Tablo */}
        <div className="hidden md:block bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-xs">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="text-right py-2 px-2 font-medium text-gray-600">الطلب</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-600">العميل</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-600">التاريخ</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-600">المبلغ</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-600">الحالة</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-600"></th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center">
                      <div className="w-12 h-12 mx-auto bg-gray-100 rounded-lg flex items-center justify-center text-2xl mb-2">📦</div>
                      <p className="text-gray-500 text-xs mb-3">
                        {searchTerm ? 'لا توجد نتائج' : filter === 'today' ? 'لا توجد طلبات اليوم' : 'لا توجد طلبات'}
                      </p>
                      {!searchTerm && filter !== 'today' && (
                        <Link
                          href="/orders/new"
                          className="inline-block px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs"
                        >
                          إنشاء أول طلب
                        </Link>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(order => (
                    <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 text-sm flex-shrink-0">
                            📦
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">#{order.orderNumber || order._id?.slice(-8)}</p>
                            <p className="text-[10px] text-gray-500">{order.items?.length || 0} منتج</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <p className="font-medium text-gray-900">{order.customerName || 'عميل'}</p>
                        {order.customerPhone && <p className="text-[10px] text-gray-500">{order.customerPhone}</p>}
                      </td>
                      <td className="py-2 px-2">
                        <p className="text-gray-900">{order.createdAt ? format(new Date(order.createdAt), 'dd/MM/yyyy') : '-'}</p>
                        <p className="text-[10px] text-gray-500">{order.createdAt ? format(new Date(order.createdAt), 'HH:mm') : ''}</p>
                      </td>
                      <td className="py-2 px-2 font-bold">{(order.totalAmount || 0).toFixed(2)} ل.س</td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={order.status} />
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                            className="text-[10px] bg-gray-50 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="قيد الانتظار">قيد الانتظار</option>
                            <option value="قيد التوصيل">قيد التوصيل</option>
                            <option value="تم التوصيل">تم التوصيل</option>
                          </select>
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex gap-1">
                          <button
                            onClick={() => router.push(`/orders/${order._id}`)}
                            className="w-7 h-7 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-600 flex items-center justify-center text-xs"
                            title="عرض"
                          >
                            <ViewIcon />
                          </button>
                          <button
                            onClick={() => router.push(`/orders/${order._id}/edit`)}
                            className="w-7 h-7 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-600 flex items-center justify-center text-xs"
                            title="تعديل"
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => handleDelete(order._id, order.orderNumber || order._id.slice(-8))}
                            className="w-7 h-7 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center text-xs"
                            title="حذف"
                          >
                            <DeleteIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}