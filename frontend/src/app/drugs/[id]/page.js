'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function EditDrugPage() {
  const router = useRouter()
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    stock: '',
    price: '',
    expiryDate: '',
    location: '',
    lowStockThreshold: '10',
    description: ''
  })

  useEffect(() => {
    if (id) fetchDrug()
  }, [id])

  const fetchDrug = async () => {
    try {
      const drug = await api.get(`/drugs/${id}`)
      setFormData({
        name: drug.name || '',
        stock: drug.stock?.toString() || '',
        price: drug.price?.toString() || '',
        expiryDate: drug.expiryDate ? new Date(drug.expiryDate).toISOString().split('T')[0] : '',
        location: drug.location || '',
        lowStockThreshold: drug.lowStockThreshold?.toString() || '10',
        description: drug.description || ''
      })
    } catch {
      toast.error('فشل تحميل الدواء')
      router.push('/drugs')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.stock || !formData.price || !formData.expiryDate) {
      return toast.error('املأ الحقول الإلزامية')
    }

    setSaving(true)
    try {
      await api.put(`/drugs/${id}`, {
        name: formData.name,
        stock: parseInt(formData.stock),
        price: parseFloat(formData.price),
        expiryDate: new Date(formData.expiryDate),
        location: formData.location || undefined,
        lowStockThreshold: parseInt(formData.lowStockThreshold) || 10,
        description: formData.description || undefined
      })
      toast.success('تم تحديث الدواء')
      router.push('/drugs')
    } catch {
      toast.error('فشل التحديث')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('حذف هذا الدواء؟')) return
    try {
      await api.delete(`/drugs/${id}`)
      toast.success('تم الحذف')
      router.push('/drugs')
    } catch {
      toast.error('فشل الحذف')
    }
  }

  if (loading) return <LoadingSpinner message="جاري تحميل الدواء..." />

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-3 md:p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/drugs" className="text-gray-600 hover:text-gray-900 text-lg w-8 h-8 flex items-center justify-center">
            ←
          </Link>
          <h1 className="text-xl md:text-3xl font-bold text-gray-900">تعديل الدواء</h1>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اسم الدواء *</label>
                <input
                  name="name"
                  required
                  className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-base"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الكمية *</label>
                <input
                  name="stock"
                  type="number"
                  required
                  className="w-full h-12 px-4 bg-gray-50 border rounded-xl text-base"
                  value={formData.stock}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">السعر *</label>
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  required
                  className="w-full h-12 px-4 bg-gray-50 border rounded-xl text-base"
                  value={formData.price}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ الانتهاء *</label>
                <input
                  name="expiryDate"
                  type="date"
                  required
                  className="w-full h-12 px-4 bg-gray-50 border rounded-xl text-base"
                  value={formData.expiryDate}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الموقع (رف)</label>
                <input
                  name="location"
                  className="w-full h-12 px-4 bg-gray-50 border rounded-xl text-base"
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">حد المخزون المنخفض</label>
                <input
                  name="lowStockThreshold"
                  type="number"
                  className="w-full h-12 px-4 bg-gray-50 border rounded-xl text-base"
                  value={formData.lowStockThreshold}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
              <textarea
                name="description"
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 border rounded-xl resize-none text-base"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-between gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleDelete}
                className="w-full sm:w-auto px-8 py-3 bg-red-500 text-white rounded-xl font-medium shadow-md min-h-[48px] flex items-center justify-center text-sm md:text-base"
              >
                🗑️ حذف
              </button>
              <div className="flex flex-col-reverse sm:flex-row gap-4 w-full sm:w-auto">
                <Link
                  href="/drugs"
                  className="flex-1 sm:flex-none px-8 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium text-center min-h-[48px] flex items-center justify-center text-sm md:text-base"
                >
                  إلغاء
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 sm:flex-none px-8 py-3 bg-emerald-500 text-white rounded-xl font-medium shadow-md disabled:opacity-70 min-h-[48px] flex items-center justify-center text-sm md:text-base"
                >
                  {saving ? 'جاري...' : '✅ تحديث الدواء'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}