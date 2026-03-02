'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import toast from 'react-hot-toast'

export default function EditCartPage() {
  const router = useRouter()
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    driverName: '',
    driverPhone: '',
    plateNumber: '',
    status: 'نشطة',
    notes: ''
  })

  useEffect(() => {
    if (id) fetchCart()
  }, [id])

  const fetchCart = async () => {
    try {
      const cart = await api.cart.getById(id)
      setFormData({
        name: cart.name || '',
        driverName: cart.driverName || '',
        driverPhone: cart.driverPhone || '',
        plateNumber: cart.plateNumber || '',
        status: cart.status || 'نشطة',
        notes: cart.notes || ''
      })
    } catch {
      toast.error('فشل تحميل بيانات العربة')
      router.push('/cart')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.cart.update(id, formData)
      toast.success('تم تحديث معلومات العربة')
      router.push('/cart')
    } catch {
      toast.error('فشل التحديث')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div>جاري التحميل...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center mb-6">
            <Link href="/cart" className="text-gray-600 hover:text-gray-900 ml-4">
              ←
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">تعديل معلومات العربة</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">اسم العربة</label>
              <input
                name="name"
                type="text"
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">اسم السائق</label>
              <input
                name="driverName"
                type="text"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={formData.driverName}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">رقم هاتف السائق</label>
              <input
                name="driverPhone"
                type="tel"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={formData.driverPhone}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">رقم اللوحة</label>
              <input
                name="plateNumber"
                type="text"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={formData.plateNumber}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
              <select
                name="status"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="نشطة">نشطة</option>
                <option value="متوقفة">متوقفة</option>
                <option value="في الصيانة">في الصيانة</option>
                <option value="مغلقة">مغلقة</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
              <textarea
                name="notes"
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                value={formData.notes}
                onChange={handleChange}
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Link
                href="/cart"
                className="flex-1 py-3 text-center bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                إلغاء
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors disabled:opacity-70"
              >
                {saving ? 'جاري...' : 'حفظ التغييرات'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}