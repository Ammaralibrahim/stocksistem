'use client'
import React from 'react'
import { useRouter } from 'next/navigation'

export default function DrugCard({ drug }) {
  const router = useRouter()

  const getStockStatus = (stock) => {
    if (stock <= 0) return { text: 'غير متوفر', color: 'bg-red-50 text-red-700', icon: '🔴' }
    if (stock <= 10) return { text: 'مخزون منخفض', color: 'bg-amber-50 text-amber-700', icon: '🟡' }
    return { text: 'متوفر', color: 'bg-emerald-50 text-emerald-700', icon: '🟢' }
  }

  const status = getStockStatus(drug?.stock || 0)
  const isExpiring = drug?.expiryDays && drug.expiryDays <= 30

  return (
    <div
      className="group relative bg-white rounded-xl md:rounded-2xl border border-gray-200 p-4 md:p-5 transition-all duration-300 hover:shadow-xl hover:border-blue-200 active:scale-[0.98] cursor-pointer"
      dir="rtl"
      onClick={() => router.push(`/drugs/${drug._id}`)}
    >
      {isExpiring && (
        <span className="absolute -top-2 -left-2 text-xs bg-gradient-to-r from-amber-500 to-amber-600 text-white px-2 py-1 md:px-3 md:py-1 rounded-full shadow-sm">⏳ قريباً</span>
      )}

      <div className="mb-3 md:mb-4">
        <div className="flex items-start justify-between mb-2 md:mb-3">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors pl-10 md:pl-12">{drug?.name}</h3>
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-base md:text-lg">💊</div>
        </div>
        <p className="text-xs md:text-sm text-gray-500 mb-3 md:mb-4 line-clamp-2">{drug?.description || 'لا يوجد وصف'}</p>
        <div className="grid grid-cols-2 gap-2 md:gap-3 mb-3 md:mb-4">
          <div className="text-right">
            <p className="text-xs text-gray-500">الباركود</p>
            <p className="text-xs md:text-sm font-mono font-medium text-gray-900 bg-gray-50 p-1.5 md:p-2 rounded-lg">{drug?.barcode || 'N/A'}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">الفئة</p>
            <p className="text-xs md:text-sm font-medium text-gray-900">{drug?.category || 'عام'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 md:gap-3 border-t border-gray-100 pt-3 md:pt-4">
        <div className="text-center">
          <p className="text-xs text-gray-500">السعر</p>
          <p className="text-sm md:text-lg font-bold text-gray-900">{drug?.price ? `${drug.price} ر.س` : '—'}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">المخزون</p>
          <p className="text-sm md:text-lg font-bold text-gray-900">{drug?.stock || 0}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">الانتهاء</p>
          <p className={`text-xs md:text-sm font-medium ${isExpiring ? 'text-amber-600' : 'text-gray-900'}`}>
            {drug?.expiryDate ? new Date(drug.expiryDate).toLocaleDateString('ar-SA') : '—'}
          </p>
        </div>
      </div>

      {/* أزرار الإجراءات - تظهر دائمًا على الجوال */}
      <div className="mt-3 md:mt-4 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); router.push(`/drugs/${drug._id}/edit`); }}
          className="flex-1 py-2 px-2 md:px-3 text-xs md:text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg min-h-[40px]"
        >
          📝 تعديل
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); router.push(`/orders/new?drugId=${drug._id}`); }}
          className="flex-1 py-2 px-2 md:px-3 text-xs md:text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg min-h-[40px]"
        >
          📦 طلب
        </button>
      </div>
    </div>
  )
}