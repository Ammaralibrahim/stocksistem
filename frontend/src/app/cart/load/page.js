'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import toast from 'react-hot-toast'

export default function LoadToCartPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [drugs, setDrugs] = useState([])
  const [cart, setCart] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDrug, setSelectedDrug] = useState(null)
  const [quantity, setQuantity] = useState('')
  const [barcode, setBarcode] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [drugsData, cartData] = await Promise.all([
        api.get('/drugs?stock=available'),
        api.get('/cart/active')
      ])
      
      setDrugs(Array.isArray(drugsData) ? drugsData : [])
      setCart(cartData)
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error)
      toast.error('فشل تحميل البيانات')
    }
  }

  const handleLoad = async () => {
    if (!selectedDrug || !quantity || quantity <= 0) {
      toast.error('الرجاء اختيار منتج وكمية صالحة')
      return
    }

    if (selectedDrug.stock < quantity) {
      toast.error(`كمية غير كافية في المخزون. المتاحة: ${selectedDrug.stock}`)
      return
    }

    setLoading(true)
    try {
      await api.post('/cart/load', {
        drugId: selectedDrug._id,
        quantity: parseInt(quantity),
        cartId: cart?._id
      })
      
      toast.success(`${quantity} وحدة من ${selectedDrug.name} تم تحميلها إلى العربة!`)
      
      // تنظيف النموذج
      setSelectedDrug(null)
      setQuantity('')
      setBarcode('')
      
      // تحديث البيانات
      fetchData()
    } catch (error) {
      console.error('خطأ في التحميل:', error)
      toast.error(error.response?.data?.message || 'فشل التحميل')
    } finally {
      setLoading(false)
    }
  }

  const handleBarcodeLoad = async () => {
    if (!barcode || !quantity || quantity <= 0) {
      toast.error('الرجاء إدخال الباركود والكمية')
      return
    }

    setLoading(true)
    try {
      await api.post('/cart/load/barcode', {
        barcode,
        quantity: parseInt(quantity)
      })
      
      toast.success(`${quantity} وحدة تم تحميلها بالباركود!`)
      
      // تنظيف النموذج
      setBarcode('')
      setQuantity('')
      setSelectedDrug(null)
      
      fetchData()
    } catch (error) {
      console.error('خطأ في تحميل الباركود:', error)
      toast.error(error.response?.data?.message || 'فشل تحميل الباركود')
    } finally {
      setLoading(false)
    }
  }

  const handleScanBarcode = () => {
    toast('هذه الميزة تتطلب كاميرا. سيتم تفعيلها قريبًا.')
  }

  const filteredDrugs = drugs.filter(drug => {
    if (!drug) return false
    const searchLower = searchTerm.toLowerCase()
    return (
      drug.name?.toLowerCase().includes(searchLower) ||
      (drug.barcode && drug.barcode.includes(searchTerm)) ||
      (drug.serialNumber && drug.serialNumber.toLowerCase().includes(searchLower))
    )
  }).filter(drug => (drug.stock || 0) > 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* الرأس */}
        <div className="mb-8">
          <div className="flex items-center mb-6 flex-row-reverse">
            <Link 
              href="/cart" 
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors ml-4"
            >
              <span className="ml-2">←</span>
              العودة إلى العربة
            </Link>
            <div className="flex-1 text-right">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                📦 التحميل من المستودع إلى العربة
              </h1>
              <p className="text-gray-500 mt-1">
                اختر منتجات من المستودع لتحميلها إلى العربة
              </p>
            </div>
          </div>
        </div>

        {/* المحتوى الرئيسي */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* العمود الأيسر - قائمة المنتجات */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6">
              <div className="flex items-center justify-between mb-6 flex-row-reverse">
                <div className="text-right">
                  <h3 className="text-lg font-semibold text-gray-900">المنتجات في المستودع</h3>
                  <p className="text-sm text-gray-500 mt-1">المنتجات المتوفرة في المخزون</p>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    className="w-64 pr-10 pl-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-right"
                    placeholder="ابحث عن منتج..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <div className="absolute right-3 top-2.5 text-gray-400">
                    🔍
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDrugs.length === 0 ? (
                  <div className="col-span-2 text-center py-12">
                    <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">💊</span>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      {searchTerm ? 'لم يتم العثور على منتج' : 'لا توجد منتجات في المخزون'}
                    </h4>
                    <p className="text-gray-600">
                      {searchTerm ? 'لم يتم العثور على منتج يطابق بحثك.' : 'لا توجد منتجات في المخزون.'}
                    </p>
                  </div>
                ) : (
                  filteredDrugs.map((drug) => (
                    <div
                      key={drug._id}
                      className={`group relative bg-white border rounded-xl p-4 hover:shadow-md transition-all duration-200 cursor-pointer ${
                        selectedDrug?._id === drug._id 
                          ? 'border-blue-300 bg-blue-50/50' 
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => {
                        setSelectedDrug(drug)
                        setQuantity('1')
                      }}
                    >
                      <div className="flex items-start flex-row-reverse">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ml-3 ${
                          selectedDrug?._id === drug._id 
                            ? 'bg-gradient-to-br from-blue-50 to-blue-100' 
                            : 'bg-gradient-to-br from-gray-50 to-gray-100'
                        }`}>
                          <span className={selectedDrug?._id === drug._id ? 'text-blue-600 text-lg' : 'text-gray-600 text-lg'}>
                            💊
                          </span>
                        </div>
                        <div className="flex-1 text-right">
                          <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                            {drug.name}
                          </h4>
                          <div className="flex items-center justify-between mt-2 flex-row-reverse">
                            <div className="text-right">
                              <p className="text-lg font-bold text-gray-900">
                                {(drug.price || 0).toFixed(2)} ر.س
                              </p>
                              <div className="flex items-center space-x-2 space-x-reverse mt-1">
                                <span className="text-sm text-gray-600">
                                  المخزون: <span className="font-medium">{drug.stock || 0}</span>
                                </span>
                                <span className="text-sm text-gray-600">
                                  العربة: <span className="font-medium">{drug.cartStock || 0}</span>
                                </span>
                              </div>
                            </div>
                            {selectedDrug?._id === drug._id && (
                              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                <span className="text-white text-xs">✓</span>
                              </div>
                            )}
                          </div>
                          {drug.barcode && (
                            <p className="text-xs text-gray-500 mt-2">🏷️ الباركود: {drug.barcode}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* العمود الأيمن - نموذج التحميل */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* المنتج المحدد */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4 text-right">تفاصيل التحميل</h3>
                
                {selectedDrug ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-xl">
                      <div className="flex items-center flex-row-reverse">
                        <div className="w-10 h-10 rounded-lg bg-white border border-blue-200 flex items-center justify-center ml-3">
                          <span className="text-blue-600 text-lg">💊</span>
                        </div>
                        <div className="text-right">
                          <h4 className="font-medium text-gray-900">{selectedDrug.name}</h4>
                          <p className="text-sm text-gray-600">
                            المخزون: {selectedDrug.stock} | العربة: {selectedDrug.cartStock || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                        الكمية المراد تحميلها
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={selectedDrug.stock}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-right"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder={`الحد الأقصى: ${selectedDrug.stock}`}
                      />
                      <p className="text-xs text-gray-500 mt-2 text-right">
                        المتوفر في المخزون: {selectedDrug.stock} وحدة
                      </p>
                    </div>
                    
                    <button
                      onClick={handleLoad}
                      disabled={loading || !quantity || quantity <= 0 || quantity > selectedDrug.stock}
                      className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center ${
                        loading || !quantity || quantity <= 0 || quantity > selectedDrug.stock
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
                      }`}
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin ml-2"></div>
                          جاري التحميل...
                        </>
                      ) : (
                        <>
                          <span className="ml-2">📦</span>
                          تحميل إلى العربة
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => setSelectedDrug(null)}
                      className="w-full py-2.5 text-gray-600 hover:text-gray-900 font-medium"
                    >
                      تغيير المنتج
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">📦</span>
                    </div>
                    <p className="text-gray-600 font-medium">لم تقم باختيار منتج بعد</p>
                    <p className="text-sm text-gray-500 mt-1">اختر منتجاً من القائمة</p>
                  </div>
                )}
              </div>

              {/* التحميل بالباركود */}
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-50/50 border border-emerald-100 rounded-2xl p-5">
                <h3 className="font-semibold text-gray-900 mb-4 text-right">التحميل بالباركود</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                      رقم الباركود
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-right"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="أدخل الباركود أو امسحه"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                      الكمية
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="w-full px-4 py-3 bg-white border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-right"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="الكمية المراد تحميلها"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleBarcodeLoad}
                      disabled={loading || !barcode || !quantity || quantity <= 0}
                      className={`py-3 rounded-xl font-medium transition-all flex items-center justify-center ${
                        loading || !barcode || !quantity || quantity <= 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700'
                      }`}
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-t-2 border-white border-solid rounded-full animate-spin ml-2"></div>
                        </>
                      ) : (
                        'تحميل'
                      )}
                    </button>
                    
                    <button
                      onClick={handleScanBarcode}
                      className="py-3 text-emerald-600 bg-emerald-100 hover:bg-emerald-200 rounded-xl font-medium transition-colors flex items-center justify-center"
                    >
                      <span className="ml-2">📷</span>
                      مسح
                    </button>
                  </div>
                </div>
              </div>

              {/* معلومات العربة */}
              {cart && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center ml-3">
                      <span className="text-blue-600 text-lg">🚚</span>
                    </div>
                    <div className="text-right">
                      <h4 className="font-medium text-gray-900">{cart.name}</h4>
                      <p className="text-sm text-gray-600">{cart.driverName || 'بدون سائق'}</p>
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">إجمالي المنتجات</span>
                      <span className="font-medium">{cart.totalItems || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">القيمة الإجمالية</span>
                      <span className="font-medium">{(cart.totalValue || 0).toFixed(2)} ر.س</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">الحالة</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        cart.status === 'نشطة' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {cart.status === 'نشطة' ? 'نشطة' : 'غير نشطة'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}