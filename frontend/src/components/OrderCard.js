'use client'
import React from 'react'

export default function OrderCard({ order }) {
  const getStatusConfig = (status) => {
    switch(status) {
      case 'completed': return { text: 'مكتمل', color: 'bg-emerald-50 text-emerald-700', icon: '✅', badge: 'bg-emerald-500' }
      case 'processing': return { text: 'قيد المعالجة', color: 'bg-blue-50 text-blue-700', icon: '🔄', badge: 'bg-blue-500' }
      case 'pending': return { text: 'قيد الانتظار', color: 'bg-amber-50 text-amber-700', icon: '⏳', badge: 'bg-amber-500' }
      default: return { text: 'غير معروف', color: 'bg-gray-50 text-gray-700', icon: '❓', badge: 'bg-gray-500' }
    }
  }

  const status = getStatusConfig(order?.status)

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-200 p-5 transition-all hover:shadow-lg hover:border-blue-200 cursor-pointer" dir="rtl">
      <span className={`absolute -top-2 left-4 text-xs text-white px-3 py-1.5 rounded-full shadow-sm ${status.badge}`}>
        {status.icon} {status.text}
      </span>

      <div className="mb-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">#{order?.id || '0000'}</h3>
            <p className="text-sm text-gray-500">{order?.customerName || 'العميل'}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">📦</div>
        </div>
        {order?.items && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-2">المنتجات ({order.items.length})</p>
            <div className="flex flex-wrap gap-1 justify-end">
              {order.items.slice(0, 3).map((item, idx) => (
                <span key={idx} className="text-xs px-2 py-1 bg-white border border-gray-200 rounded-md">{item}</span>
              ))}
              {order.items.length > 3 && <span className="text-xs px-2 py-1 bg-gray-100 rounded-md text-gray-500">+{order.items.length - 3}</span>}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
        <div className="text-right">
          <p className="text-xs text-gray-500">التاريخ</p>
          <p className="text-sm font-medium text-gray-900">{order?.date ? new Date(order.date).toLocaleDateString('ar-SA') : '—'}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">المجموع</p>
          <p className="text-lg font-bold text-gray-900">{order?.total ? `${order.total} ل.س` : '—'}</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <button className="text-xs text-blue-600 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50">التفاصيل</button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">التوصيل:</span>
          <span className="text-xs font-medium text-gray-900">{order?.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('ar-SA') : 'غير محدد'}</span>
        </div>
      </div>
    </div>
  )
}