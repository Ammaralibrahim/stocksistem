'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import toast from 'react-hot-toast'

export default function NewDrugPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    stock: '',
    price: '',
    expiryDate: '',
    barcode: '',
    serialNumber: '',
    description: '',
    category: '',
    manufacturer: '',
    purchasePrice: '',
    supplier: '',
    location: '',
    lowStockThreshold: '10'
  })

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const generateBarcode = () => {
    const barcode = '869' + Math.floor(1000000000000 + Math.random() * 9000000000000).toString().substring(0, 10)
    setFormData(prev => ({ ...prev, barcode }))
    toast.success('تم إنشاء الباركود')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.stock || !formData.price || !formData.expiryDate) {
      return toast.error('املأ الحقول الإلزامية')
    }

    setLoading(true)
    try {
      // payload hazırla – boş string'leri undefined yap
      const payload = {
        ...formData,
        stock: parseInt(formData.stock),
        price: parseFloat(formData.price),
        purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
        lowStockThreshold: parseInt(formData.lowStockThreshold) || 10,
        expiryDate: new Date(formData.expiryDate),
        // opsiyonel alanlar – boş string yerine undefined
        barcode: formData.barcode || undefined,
        serialNumber: formData.serialNumber || undefined,
        category: formData.category || undefined,
        manufacturer: formData.manufacturer || undefined,
        supplier: formData.supplier || undefined,
        location: formData.location || undefined,
        description: formData.description || undefined
      }

      await api.post('/drugs', payload)
      toast.success('تم إضافة الدواء')
      router.push('/drugs')
    } catch (err) {
      console.error(err)
      toast.error('فشل الإضافة')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-3 md:p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/drugs" className="text-gray-600 hover:text-gray-900 text-lg w-8 h-8 flex items-center justify-center">
            ←
          </Link>
          <h1 className="text-xl md:text-3xl font-bold text-gray-900">إضافة دواء جديد</h1>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اسم الدواء *</label>
                <input
                  name="name"
                  type="text"
                  required
                  className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-base"
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
                  min="0"
                  className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-base"
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
                  className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-base"
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
                  className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-base"
                  value={formData.expiryDate}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الباركود</label>
                <div className="flex gap-2">
                  <input
                    name="barcode"
                    type="text"
                    className="flex-1 h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-base"
                    value={formData.barcode}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={generateBarcode}
                    className="px-4 h-12 bg-purple-500 text-white rounded-xl text-base min-w-[44px]"
                  >
                    🔄
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الرقم التسلسلي</label>
                <input
                  name="serialNumber"
                  type="text"
                  className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-base"
                  value={formData.serialNumber}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الفئة</label>
                <input
                  name="category"
                  type="text"
                  className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-base"
                  value={formData.category}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الشركة المصنعة</label>
                <input
                  name="manufacturer"
                  type="text"
                  className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-base"
                  value={formData.manufacturer}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">سعر الشراء</label>
                <input
                  name="purchasePrice"
                  type="number"
                  step="0.01"
                  className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-base"
                  value={formData.purchasePrice}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الموقع (رف)</label>
                <input
                  name="location"
                  type="text"
                  className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-base"
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">حد المخزون المنخفض</label>
                <input
                  name="lowStockThreshold"
                  type="number"
                  min="1"
                  className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-base"
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
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl resize-none text-base"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <Link
                href="/drugs"
                className="flex-1 px-8 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium text-center min-h-[48px] flex items-center justify-center text-sm md:text-base"
              >
                إلغاء
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-8 py-3 bg-emerald-500 text-white rounded-xl font-medium shadow-md disabled:opacity-70 min-h-[48px] flex items-center justify-center text-sm md:text-base"
              >
                {loading ? 'جاري...' : '✅ حفظ الدواء'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}