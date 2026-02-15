'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import toast from 'react-hot-toast'

export default function NewOrderPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
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
  const [activeStep, setActiveStep] = useState(1) // 1: drugs, 2: customer, 3: payment

  useEffect(() => {
    fetchDrugs()
  }, [])

  const fetchDrugs = async () => {
    try {
      const res = await api.get('/drugs')
      setDrugs(Array.isArray(res) ? res : [])
    } catch (error) {
      toast.error('فشل تحميل الأدوية')
    }
  }

  const filteredDrugs = drugs.filter(d =>
    d?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d?.barcode?.includes(searchTerm)
  ).filter(d => (d.stock || 0) > 0)

  const addDrug = (drug) => {
    const exists = selectedDrugs.find(item => item.drug._id === drug._id)
    if (exists) {
      setSelectedDrugs(prev => prev.map(item =>
        item.drug._id === drug._id ? { ...item, quantity: item.quantity + 1 } : item
      ))
    } else {
      setSelectedDrugs(prev => [...prev, { drug, quantity: 1, price: drug.price }])
    }
    setSearchTerm('')
    toast.success(`${drug.name} أضيف إلى السلة`)
  }

  const updateQuantity = (drugId, qty) => {
    if (qty < 1) {
      setSelectedDrugs(prev => prev.filter(item => item.drug._id !== drugId))
      return
    }
    const drug = selectedDrugs.find(i => i.drug._id === drugId)?.drug
    if (drug && qty > drug.stock) {
      toast.error(`الحد الأقصى ${drug.stock}`)
      return
    }
    setSelectedDrugs(prev => prev.map(item =>
      item.drug._id === drugId ? { ...item, quantity: qty } : item
    ))
  }

  const total = selectedDrugs.reduce((sum, item) => sum + item.quantity * item.price, 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (selectedDrugs.length === 0) return toast.error('اختر دواء واحد على الأقل')
    if (!formData.customerName.trim()) return toast.error('أدخل اسم العميل')

    setLoading(true)
    try {
      await api.post('/orders', {
        customerName: formData.customerName,
        customerPhone: formData.customerPhone || undefined,
        deliveryAddress: formData.deliveryAddress || undefined,
        notes: formData.notes || undefined,
        status: formData.status,
        paymentMethod: formData.paymentMethod,
        items: selectedDrugs.map(item => ({
          drug: item.drug._id,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount: total
      })
      toast.success('🎉 تم إنشاء الطلب')
      router.push('/orders')
    } catch (err) {
      toast.error('فشل إنشاء الطلب')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-3 md:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/orders" className="text-gray-600 hover:text-gray-900 text-lg">←</Link>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">طلب جديد</h1>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center mb-8">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500" style={{ width: `${(activeStep / 3) * 100}%` }} />
          </div>
          <div className="mr-4 flex gap-6">
            {[1, 2, 3].map(step => (
              <div key={step} className={`flex items-center ${activeStep >= step ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ml-2 ${activeStep >= step ? 'bg-blue-100' : 'bg-gray-100'}`}>
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
          {/* Sol: İlaç listesi */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <h3 className="text-lg font-semibold text-gray-900">اختيار الأدوية</h3>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    className="w-full h-12 pr-11 pl-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="ابحث عن دواء..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <span className="absolute right-3.5 top-3.5 text-gray-400">🔍</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto p-1">
                {filteredDrugs.map(drug => (
                  <div
                    key={drug._id}
                    onClick={() => addDrug(drug)}
                    className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">💊</div>
                      <div className="flex-1 text-right">
                        <h4 className="font-medium text-gray-900">{drug.name}</h4>
                        <p className="text-sm text-gray-600">{drug.price.toFixed(2)} ل.س</p>
                        <p className="text-xs text-gray-500">المخزون: {drug.stock}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredDrugs.length === 0 && (
                  <div className="col-span-2 text-center py-8 text-gray-500">لا توجد أدوية متوفرة</div>
                )}
              </div>
            </div>
          </div>

          {/* Sağ: Sepet ve form */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              {/* Sepet */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-900">السلة ({selectedDrugs.length})</h3>
                  {selectedDrugs.length > 0 && (
                    <button onClick={() => setSelectedDrugs([])} className="text-sm text-red-600 hover:text-red-700">إفراغ</button>
                  )}
                </div>

                {selectedDrugs.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 text-sm">لم تختر أي أدوية بعد</div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {selectedDrugs.map(item => (
                      <div key={item.drug._id} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.drug.name}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <button onClick={() => updateQuantity(item.drug._id, item.quantity - 1)} className="w-7 h-7 bg-white border border-gray-300 rounded-lg">-</button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.drug._id, item.quantity + 1)} className="w-7 h-7 bg-white border border-gray-300 rounded-lg">+</button>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-gray-900">{(item.price * item.quantity).toFixed(2)} ل.س</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedDrugs.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">الإجمالي</span>
                      <span className="text-xl font-bold text-emerald-600">{total.toFixed(2)} ل.س</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Form adımları */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {activeStep === 2 && (
                    <div className="space-y-3">
                      <input type="text" placeholder="اسم العميل *" className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} />
                      <input type="tel" placeholder="رقم الهاتف" className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl" value={formData.customerPhone} onChange={e => setFormData({...formData, customerPhone: e.target.value})} />
                      <textarea rows={3} placeholder="عنوان التوصيل" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl resize-none" value={formData.deliveryAddress} onChange={e => setFormData({...formData, deliveryAddress: e.target.value})} />
                    </div>
                  )}

                  {activeStep === 3 && (
                    <div className="space-y-3">
                      <select className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl" value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})}>
                        <option value="نقدي">💰 نقدي</option>
                        <option value="بطاقة-ائتمان">💳 بطاقة</option>
                        <option value="تحويل-بنكي">🏦 تحويل</option>
                        <option value="اخرى">📝 أخرى</option>
                      </select>
                      <select className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                        <option value="قيد الانتظار">⏳ قيد الانتظار</option>
                        <option value="قيد التوصيل">🚚 قيد التوصيل</option>
                        <option value="تم التوصيل">✅ تم التوصيل</option>
                      </select>
                      <textarea rows={3} placeholder="ملاحظات" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl resize-none" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                    </div>
                  )}

                  {/* Navigasyon butonları */}
                  <div className="flex justify-between pt-4 border-t border-gray-200">
                    {activeStep > 1 ? (
                      <button type="button" onClick={() => setActiveStep(activeStep - 1)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">→ السابق</button>
                    ) : <div />}
                    {activeStep < 3 ? (
                      <button type="button" onClick={() => setActiveStep(activeStep + 1)} className="px-4 py-2 bg-blue-500 text-white rounded-lg">التالي ←</button>
                    ) : (
                      <button type="submit" disabled={loading} className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium shadow-md disabled:opacity-70">
                        {loading ? 'جاري...' : '✅ إكمال الطلب'}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}