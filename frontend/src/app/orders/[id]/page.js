'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import api from '@/lib/api'
import toast from 'react-hot-toast'

export default function OrderDetailPage() {
  const router = useRouter()
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statusLoading, setStatusLoading] = useState(false)

  useEffect(() => {
    if (id) fetchOrder()
  }, [id])

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${id}`)
      setOrder(res)
    } catch {
      toast.error('فشل تحميل الطلب')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    setStatusLoading(true)
    try {
      await api.put(`/orders/${id}`, { status: newStatus })
      setOrder(prev => ({ ...prev, status: newStatus }))
      toast.success('تم تحديث الحالة')
    } catch {
      toast.error('فشل التحديث')
    } finally {
      setStatusLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`هل أنت متأكد من حذف الطلب #${order.orderNumber || id.slice(-8)}؟`)) return

    try {
      await api.delete(`/orders/${id}`)
      toast.success('تم حذف الطلب')
      router.push('/orders')
    } catch (error) {
      console.error('خطأ في حذف الطلب:', error)
      toast.error('فشل حذف الطلب')
    }
  }

  const getStatusConfig = (status) => {
    switch (status) {
      case 'قيد الانتظار': return { text: 'قيد الانتظار', color: 'bg-amber-100 text-amber-800', icon: '⏳' }
      case 'قيد التوصيل': return { text: 'قيد التوصيل', color: 'bg-blue-100 text-blue-800', icon: '🚚' }
      case 'تم التوصيل': return { text: 'تم التوصيل', color: 'bg-emerald-100 text-emerald-800', icon: '✅' }
      default: return { text: status, color: 'bg-gray-100 text-gray-800', icon: '❓' }
    }
  }

  if (loading) return <div className="p-6 text-center">جاري التحميل...</div>
  if (!order) return <div className="p-6 text-center">الطلب غير موجود</div>

  const status = getStatusConfig(order.status)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-3 md:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link href="/orders" className="text-gray-600 hover:text-gray-900 text-lg">←</Link>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              الطلب #{order.orderNumber || id.slice(-8)}
            </h1>
          </div>
          <div className="flex gap-3">
            <Link href={`/orders/${id}/edit`} className="px-4 py-2 bg-amber-500 text-white rounded-xl shadow-md">✏️ تعديل</Link>
          </div>
        </div>

        {/* Status Banner */}
        <div className={`${status.color} rounded-2xl p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{status.icon}</span>
            <div>
              <h3 className="font-semibold text-lg">حالة الطلب: {status.text}</h3>
              <p className="text-sm opacity-90">
                {order.status === 'قيد الانتظار' && 'في انتظار المعالجة'}
                {order.status === 'قيد التوصيل' && 'الطلب قيد التوصيل'}
                {order.status === 'تم التوصيل' && 'تم التوصيل بنجاح'}
              </p>
            </div>
          </div>
          <select
            value={order.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={statusLoading}
            className="px-4 py-2 bg-white/30 backdrop-blur-sm border border-white/50 rounded-lg text-gray-900 font-medium"
          >
            <option value="قيد الانتظار">قيد الانتظار</option>
            <option value="قيد التوصيل">قيد التوصيل</option>
            <option value="تم التوصيل">تم التوصيل</option>
          </select>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sol: Müşteri bilgileri ve ürünler */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">معلومات العميل</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><p className="text-sm text-gray-500">الاسم</p><p className="font-medium">{order.customerName || 'غير محدد'}</p></div>
                <div><p className="text-sm text-gray-500">الهاتف</p><p className="font-medium">{order.customerPhone || 'غير محدد'}</p></div>
                <div className="md:col-span-2"><p className="text-sm text-gray-500">العنوان</p><p className="font-medium">{order.deliveryAddress || 'غير محدد'}</p></div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">الأدوية المطلوبة</h3>
              <div className="space-y-3">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">💊</div>
                      <div>
                        <p className="font-medium text-gray-900">{item.drug?.name || 'دواء'}</p>
                        <p className="text-xs text-gray-500">الكمية: {item.quantity} | السعر: {item.price} ر.س</p>
                      </div>
                    </div>
                    <p className="font-bold text-gray-900">{(item.quantity * item.price).toFixed(2)} ر.س</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center text-xl">
                  <span className="font-semibold text-gray-900">الإجمالي</span>
                  <span className="font-bold text-emerald-600">{(order.totalAmount || 0).toFixed(2)} ر.س</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sağ: Özet bilgiler */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">معلومات الطلب</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">رقم الطلب</span><span>{order.orderNumber || id.slice(-8)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">تاريخ الإنشاء</span><span>{order.createdAt ? format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm', { locale: ar }) : '-'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">طريقة الدفع</span><span>{order.paymentMethod}</span></div>
              </div>
            </div>

            {order.notes && (
              <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5">
                <h4 className="font-medium text-gray-900 mb-2">📝 ملاحظات</h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.notes}</p>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">إجراءات</h3>
              <div className="space-y-2">
                <Link href={`/orders/new?customer=${order.customerName}`} className="block w-full py-3 text-center bg-blue-500 text-white rounded-xl">✨ طلب جديد لنفس العميل</Link>
                <button onClick={() => window.print()} className="block w-full py-3 text-center bg-gray-100 text-gray-700 rounded-xl">🖨️ طباعة</button>
                <button onClick={handleDelete} className="block w-full py-3 text-center bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors">🗑️ حذف الطلب</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}