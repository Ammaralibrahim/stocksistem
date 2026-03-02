'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import toast from 'react-hot-toast'

export default function ScanBarcodePage() {
  const router = useRouter()
  const [barcode, setBarcode] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [loading, setLoading] = useState(false)

  const handleScan = async (e) => {
    e.preventDefault()
    if (!barcode || !quantity || quantity <= 0) {
      toast.error('الرجاء إدخال الباركود والكمية')
      return
    }

    setLoading(true)
    try {
      await api.cart.loadByBarcode(barcode, parseInt(quantity))
      toast.success(`تم تحميل ${quantity} وحدة بنجاح`)
      setBarcode('')
      setQuantity('1')
      // بعد نجاح التحميل، يمكن التوجيه إلى صفحة السيارة
      setTimeout(() => router.push('/cart'), 1000)
    } catch (error) {
      toast.error(error.message || 'فشل تحميل الباركود')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-6" dir="rtl">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <Link href="/cart" className="text-gray-600 hover:text-gray-900 inline-flex items-center">
            <span className="ml-2">←</span> العودة إلى السيارة
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-2xl flex items-center justify-center mb-3">
              <span className="text-2xl">📷</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">مسح الباركود</h1>
            <p className="text-sm text-gray-500 mt-1">أدخل رقم الباركود أو استخدم الكاميرا</p>
          </div>

          <form onSubmit={handleScan} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                رقم الباركود
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-right"
                placeholder="أدخل الباركود"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                الكمية
              </label>
              <input
                type="number"
                min="1"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-right"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-70"
            >
              {loading ? 'جاري...' : '🔍 تحميل بالباركود'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-xl">
            <p className="text-xs text-blue-800">
              💡 يمكنك استخدام كاميرا الهاتف لمسح الباركود مباشرة. (الميزة قيد التطوير)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}