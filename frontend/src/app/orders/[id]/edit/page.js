'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import toast from 'react-hot-toast'

export default function EditOrderPage() {
  const router = useRouter()
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [drugs, setDrugs] = useState([])
  const [selectedDrugs, setSelectedDrugs] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    notes: '',
    status: 'قيد الانتظار',
    paymentMethod: 'نقدي',
    deliveryAddress: ''
  })
  const [activeStep, setActiveStep] = useState(1)

  useEffect(() => {
    if (id) {
      fetchOrder()
      fetchDrugs()
    }
  }, [id])

  const fetchOrder = async () => {
    try {
      const order = await api.get(`/orders/${id}`)
      setFormData({
        customerName: order.customerName || '',
        customerPhone: order.customerPhone || '',
        notes: order.notes || '',
        status: order.status || 'قيد الانتظار',
        paymentMethod: order.paymentMethod || 'نقدي',
        deliveryAddress: order.deliveryAddress || ''
      })
      // 🔧 Güvenli: Eğer ilaç silinmişse, adı "محذوف" olarak göster
      setSelectedDrugs(order.items?.map(item => ({
        drug: item.drug || { _id: item.drug?._id, name: 'دواء محذوف', price: item.price },
        quantity: item.quantity,
        price: item.price
      })) || [])
    } catch {
      toast.error('فشل تحميل الطلب')
      router.push('/orders')
    } finally {
      setLoading(false)
    }
  }

  const fetchDrugs = async () => {
    try {
      const res = await api.get('/drugs')
      setDrugs(Array.isArray(res) ? res : [])
    } catch {
      toast.error('فشل تحميل الأدوية')
    }
  }

  // 🔧 Güvenli filtreleme: drug?._id kullan
  const filteredDrugs = drugs.filter(d =>
    d?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d?.barcode?.includes(searchTerm)
  ).filter(d => (d.stock || 0) > 0 || selectedDrugs.some(s => s.drug?._id === d._id))

  const addDrug = (drug) => {
    const exists = selectedDrugs.find(s => s.drug?._id === drug._id)
    if (exists) {
      setSelectedDrugs(prev => prev.map(s =>
        s.drug?._id === drug._id ? { ...s, quantity: s.quantity + 1 } : s
      ))
    } else {
      setSelectedDrugs(prev => [...prev, { drug, quantity: 1, price: drug.price }])
    }
    setSearchTerm('')
    toast.success(`${drug.name} أضيف`)
  }

  const updateQuantity = (drugId, qty) => {
    if (qty < 1) {
      setSelectedDrugs(prev => prev.filter(s => s.drug?._id !== drugId))
      return
    }
    setSelectedDrugs(prev => prev.map(s =>
      s.drug?._id === drugId ? { ...s, quantity: qty } : s
    ))
  }

  const total = selectedDrugs.reduce((sum, s) => sum + s.quantity * s.price, 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (selectedDrugs.length === 0) return toast.error('يجب اختيار دواء واحد على الأقل')
    if (!formData.customerName.trim()) return toast.error('أدخل اسم العميل')

    setSaving(true)
    try {
      await api.put(`/orders/${id}`, {
        ...formData,
        items: selectedDrugs.map(s => ({
          drug: s.drug._id, // s.drug her zaman tanımlı olmalı (eklenen ilaçlar için)
          quantity: s.quantity,
          price: s.price
        })),
        totalAmount: total
      })
      toast.success('تم تحديث الطلب')
      router.push(`/orders/${id}`)
    } catch {
      toast.error('فشل التحديث')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6 text-center">جاري التحميل...</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-3 md:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href={`/orders/${id}`} className="text-gray-600 hover:text-gray-900 text-lg">←</Link>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">تعديل الطلب</h1>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center mb-8">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all" style={{ width: `${(activeStep / 3) * 100}%` }} />
          </div>
          <div className="mr-4 flex gap-6">
            {[1, 2, 3].map(step => (
              <div key={step} className={`flex items-center ${activeStep >= step ? 'text-amber-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ml-2 ${activeStep >= step ? 'bg-amber-100' : 'bg-gray-100'}`}>
                  {step}
                </div>
                <span className="text-sm font-medium hidden sm:inline">
                  {step === 1 ? 'الأدوية' : step === 2 ? 'العميل' : 'الدفع'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* İlaç listesi */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <h3 className="text-lg font-semibold text-gray-900">تعديل الأدوية</h3>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    className="w-full h-12 pr-11 pl-4 bg-gray-50 border border-gray-200 rounded-xl"
                    placeholder="ابحث عن دواء..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <span className="absolute right-3.5 top-3.5 text-gray-400">🔍</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto p-1">
                {filteredDrugs.map(drug => {
                  // 🔧 Güvenli karşılaştırma
                  const inOrder = selectedDrugs.some(s => s.drug?._id === drug._id)
                  return (
                    <div
                      key={drug._id}
                      onClick={() => addDrug(drug)}
                      className={`rounded-xl p-4 border cursor-pointer transition-all ${
                        inOrder ? 'border-amber-300 bg-amber-50' : 'border-gray-200 hover:border-amber-300 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">💊</div>
                        <div className="flex-1 text-right">
                          <h4 className="font-medium text-gray-900">{drug.name}</h4>
                          <p className="text-sm text-gray-600">{drug.price} ل.س</p>
                          <p className="text-xs text-gray-500">مخزون: {drug.stock}</p>
                          {inOrder && <span className="text-xs text-amber-600">✓ موجود في الطلب</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Sepet ve form */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">أدوية الطلب ({selectedDrugs.length})</h3>
              {selectedDrugs.length === 0 ? (
                <p className="text-center py-4 text-gray-500">لم تختر أي دواء</p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {selectedDrugs.map(item => (
                    <div key={item.drug?._id || Math.random()} className="flex items-center justify-between bg-amber-50 p-3 rounded-xl">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.drug?.name || 'دواء محذوف'}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => updateQuantity(item.drug?._id, item.quantity - 1)} className="w-7 h-7 bg-white border border-amber-300 rounded-lg">-</button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.drug?._id, item.quantity + 1)} className="w-7 h-7 bg-white border border-amber-300 rounded-lg">+</button>
                        </div>
                      </div>
                      <p className="font-bold">{(item.price * item.quantity).toFixed(2)} ل.س</p>
                    </div>
                  ))}
                </div>
              )}
              {selectedDrugs.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between">
                    <span className="text-gray-600">الإجمالي</span>
                    <span className="text-xl font-bold text-emerald-600">{total.toFixed(2)} ل.س</span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-4">
                {activeStep === 2 && (
                  <div className="space-y-3">
                    <input type="text" placeholder="اسم العميل *" className="w-full h-12 px-4 bg-gray-50 border rounded-xl" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} />
                    <input type="tel" placeholder="رقم الهاتف" className="w-full h-12 px-4 bg-gray-50 border rounded-xl" value={formData.customerPhone} onChange={e => setFormData({...formData, customerPhone: e.target.value})} />
                    <textarea rows={3} placeholder="عنوان التوصيل" className="w-full px-4 py-3 bg-gray-50 border rounded-xl resize-none" value={formData.deliveryAddress} onChange={e => setFormData({...formData, deliveryAddress: e.target.value})} />
                  </div>
                )}

                {activeStep === 3 && (
                  <div className="space-y-3">
                    <select className="w-full h-12 px-4 bg-gray-50 border rounded-xl" value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})}>
                      <option value="نقدي">💰 نقدي</option>
                      <option value="بطاقة-ائتمان">💳 بطاقة</option>
                      <option value="تحويل-بنكي">🏦 تحويل</option>
                      <option value="اخرى">📝 أخرى</option>
                    </select>
                    <select className="w-full h-12 px-4 bg-gray-50 border rounded-xl" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="قيد الانتظار">⏳ قيد الانتظار</option>
                      <option value="قيد التوصيل">🚚 قيد التوصيل</option>
                      <option value="تم التوصيل">✅ تم التوصيل</option>
                    </select>
                    <textarea rows={3} placeholder="ملاحظات" className="w-full px-4 py-3 bg-gray-50 border rounded-xl resize-none" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t border-gray-200">
                  {activeStep > 1 ? (
                    <button type="button" onClick={() => setActiveStep(activeStep - 1)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">→ السابق</button>
                  ) : <div />}
                  {activeStep < 3 ? (
                    <button type="button" onClick={() => setActiveStep(activeStep + 1)} className="px-4 py-2 bg-amber-500 text-white rounded-lg">التالي ←</button>
                  ) : (
                    <button type="submit" disabled={saving} className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium shadow-md disabled:opacity-70">
                      {saving ? 'جاري...' : '✅ حفظ التغييرات'}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}