'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import toast from 'react-hot-toast'

export default function CartSalePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [cart, setCart] = useState(null)
  const [selectedItems, setSelectedItems] = useState([])
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    paymentMethod: 'نقدي'
  })
  const [searchTerm, setSearchTerm] = useState('')

  const fetchCart = useCallback(async () => {
    try {
      const cartData = await api.cart.getActive()
      setCart(cartData)
    } catch (error) {
      console.error('خطأ في تحميل العربة:', error)
      toast.error('فشل تحميل العربة')
    }
  }, [])

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  const handleAddItem = useCallback((item) => {
    if (!item.drug) {
      toast.error('بيانات المنتج غير مكتملة')
      return
    }
    
    const existing = selectedItems.find(i => i.drug._id === item.drug._id)
    const cartItem = cart?.items?.find(i => i.drug._id === item.drug._id)
    const availableQuantity = cartItem?.quantity || 0
    
    if (existing && existing.quantity >= availableQuantity) {
      toast.error(`لا توجد كمية كافية في العربة. المتوفر: ${availableQuantity}`)
      return
    }
    
    if (existing) {
      setSelectedItems(prev => prev.map(i =>
        i.drug._id === item.drug._id
          ? { ...i, quantity: i.quantity + 1 }
          : i
      ))
    } else {
      setSelectedItems(prev => [...prev, {
        drug: item.drug,
        quantity: 1,
        price: item.price
      }])
    }
    
    toast.success(`${item.drug.name} تمت إضافته إلى السلة`)
  }, [cart, selectedItems])

  const handleRemoveItem = useCallback((drugId) => {
    setSelectedItems(prev => prev.filter(item => item.drug._id !== drugId))
  }, [])

  const handleQuantityChange = useCallback((drugId, quantity) => {
    if (quantity < 1) {
      handleRemoveItem(drugId)
      return
    }
    
    const item = selectedItems.find(i => i.drug._id === drugId)
    const cartItem = cart?.items?.find(i => i.drug._id === drugId)
    
    if (!item || !cartItem) return
    
    if (quantity > cartItem.quantity) {
      toast.error(`لا توجد كمية كافية في العربة. المتوفر: ${cartItem.quantity}`)
      return
    }
    
    setSelectedItems(prev => prev.map(item =>
      item.drug._id === drugId
        ? { ...item, quantity }
        : item
    ))
  }, [cart, selectedItems, handleRemoveItem])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    
    if (selectedItems.length === 0) {
      toast.error('الرجاء اختيار منتج واحد على الأقل')
      return
    }
    
    if (!customerInfo.name.trim()) {
      toast.error('الرجاء إدخال اسم العميل')
      return
    }
    
    setLoading(true)
    
    try {
      const orderData = {
        cartId: cart?._id,
        items: selectedItems.map(item => ({
          drug: item.drug._id,
          quantity: item.quantity,
          price: item.price
        })),
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        paymentMethod: customerInfo.paymentMethod
      }
      
      await api.orders.cartSale(orderData)
      toast.success('تم إتمام البيع بنجاح!')
      
      // تنظيف السلة والنموذج
      setSelectedItems([])
      setCustomerInfo({
        name: '',
        phone: '',
        paymentMethod: 'نقدي'
      })
      
      // تحديث العربة
      await fetchCart()
      
      // الانتقال إلى صفحة الطلبات بعد ثانية
      setTimeout(() => {
        router.push('/orders')
      }, 1000)
      
    } catch (error) {
      console.error('خطأ في البيع:', error)
      
      if (error.message.includes('Write conflict')) {
        toast.error('حدث تعارض في الكتابة. يرجى المحاولة مرة أخرى')
      } else {
        toast.error(error.message || 'فشل البيع')
      }
    } finally {
      setLoading(false)
    }
  }, [cart, customerInfo, selectedItems, fetchCart, router])

  const calculateTotal = useCallback(() => {
    return selectedItems.reduce((sum, item) => sum + (item.quantity * item.price), 0)
  }, [selectedItems])

  const filteredItems = cart?.items?.filter(item => {
    if (!item.drug) return false
    const searchLower = searchTerm.toLowerCase()
    return (
      item.drug.name?.toLowerCase().includes(searchLower) ||
      (item.drug.barcode && item.drug.barcode.includes(searchTerm))
    )
  }) || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
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
                🚚 البيع السريع من العربة
              </h1>
              <p className="text-gray-500 mt-1">
                قم بالبيع السريع من المنتجات الموجودة في العربة
              </p>
            </div>
          </div>
        </div>

        {/* المحتوى الرئيسي */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* العمود الأيسر - المنتجات في العربة */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-6 flex-row-reverse">
                <div className="text-right">
                  <h3 className="text-lg font-semibold text-gray-900">المنتجات في العربة</h3>
                  <p className="text-sm text-gray-500 mt-1">اختر المنتجات للبيع</p>
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
                {filteredItems.length === 0 ? (
                  <div className="col-span-2 text-center py-12">
                    <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">🚚</span>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">لا توجد منتجات في العربة</h4>
                    <p className="text-gray-600">قم بتحميل المنتجات إلى العربة أولاً.</p>
                    <Link
                      href="/cart/load"
                      className="inline-block mt-4 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all"
                    >
                      📦 تحميل منتجات
                    </Link>
                  </div>
                ) : (
                  filteredItems.map((item) => {
                    const inCart = selectedItems.find(i => i.drug._id === item.drug._id)
                    const cartQuantity = inCart?.quantity || 0
                    const availableQuantity = item.quantity
                    
                    return (
                      <div
                        key={item._id || item.drug._id}
                        className={`group relative bg-white border rounded-xl p-4 hover:shadow-md transition-all duration-200 ${
                          inCart ? 'border-purple-300 bg-purple-50/50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start flex-row-reverse">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ml-3 ${
                            inCart ? 'bg-gradient-to-br from-purple-50 to-purple-100' : 'bg-gradient-to-br from-gray-50 to-gray-100'
                          }`}>
                            <span className={inCart ? 'text-purple-600 text-lg' : 'text-gray-600 text-lg'}>💊</span>
                          </div>
                          <div className="flex-1 text-right">
                            <h4 className="font-medium text-gray-900">{item.drug?.name || 'منتج غير معروف'}</h4>
                            <div className="flex items-center justify-between mt-2 flex-row-reverse">
                              <div className="text-right">
                                <p className="text-lg font-bold text-gray-900">
                                  {(item.price || 0).toFixed(2)} ل.س
                                </p>
                                <p className="text-sm text-gray-600">
                                  في العربة: <span className="font-medium">{availableQuantity} وحدة</span>
                                </p>
                                {inCart && (
                                  <p className={`text-sm font-medium ${cartQuantity > availableQuantity ? 'text-red-600' : 'text-purple-600'}`}>
                                    في السلة: {cartQuantity} وحدة
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center space-x-2 space-x-reverse">
                                {inCart && (
                                  <div className="flex items-center space-x-1 space-x-reverse">
                                    <button
                                      onClick={() => handleQuantityChange(item.drug._id, cartQuantity - 1)}
                                      className="w-6 h-6 flex items-center justify-center bg-white border border-purple-300 rounded hover:bg-purple-50 transition-colors"
                                    >
                                      -
                                    </button>
                                    <span className="w-8 text-center font-medium">{cartQuantity}</span>
                                    <button
                                      onClick={() => handleQuantityChange(item.drug._id, cartQuantity + 1)}
                                      className="w-6 h-6 flex items-center justify-center bg-white border border-purple-300 rounded hover:bg-purple-50 transition-colors"
                                    >
                                      +
                                    </button>
                                  </div>
                                )}
                                <button
                                  onClick={() => handleAddItem(item)}
                                  disabled={cartQuantity >= availableQuantity}
                                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                                    cartQuantity >= availableQuantity
                                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                      : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700'
                                  }`}
                                >
                                  {inCart ? 'إضافة أخرى' : 'إضافة إلى السلة'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* العمود الأيمن - سلة البيع */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              {/* سلة البيع */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6">
                <div className="flex items-center justify-between mb-4 flex-row-reverse">
                  <div className="text-right">
                    <h3 className="text-lg font-semibold text-gray-900">سلة البيع</h3>
                    <p className="text-sm text-gray-500 mt-1">{selectedItems.length} منتج</p>
                  </div>
                  {selectedItems.length > 0 && (
                    <button
                      onClick={() => setSelectedItems([])}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      تفريغ السلة
                    </button>
                  )}
                </div>

                {selectedItems.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🛒</span>
                    </div>
                    <p className="text-gray-600">سلة البيع فارغة</p>
                    <p className="text-sm text-gray-500 mt-1">أضف منتجات من القائمة</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {selectedItems.map((item) => {
                      const cartItem = cart?.items?.find(i => i.drug._id === item.drug._id)
                      const availableQuantity = cartItem?.quantity || 0
                      
                      return (
                        <div
                          key={item.drug._id}
                          className={`flex items-center justify-between p-3 rounded-lg flex-row-reverse ${
                            item.quantity > availableQuantity ? 'bg-red-50' : 'bg-purple-50'
                          }`}
                        >
                          <div className="flex-1 text-right">
                            <h4 className="font-medium text-gray-900">{item.drug.name}</h4>
                            <div className="flex items-center justify-between mt-2 flex-row-reverse">
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <button
                                  onClick={() => handleQuantityChange(item.drug._id, item.quantity - 1)}
                                  className="w-6 h-6 flex items-center justify-center bg-white border border-purple-300 rounded hover:bg-purple-50 transition-colors"
                                >
                                  -
                                </button>
                                <span className="w-8 text-center font-medium">{item.quantity}</span>
                                <button
                                  onClick={() => handleQuantityChange(item.drug._id, item.quantity + 1)}
                                  className="w-6 h-6 flex items-center justify-center bg-white border border-purple-300 rounded hover:bg-purple-50 transition-colors"
                                >
                                  +
                                </button>
                              </div>
                              <div className="text-left">
                                <p className="font-medium text-gray-900">
                                  {(item.quantity * item.price).toFixed(2)} ل.س
                                </p>
                                <p className="text-xs text-gray-500">الوحدة: {item.price.toFixed(2)} ل.س</p>
                              </div>
                            </div>
                            {item.quantity > availableQuantity && (
                              <p className="text-xs text-red-600 mt-1 text-right">
                                ⚠️ الكمية المطلوبة أكبر من المتاح ({availableQuantity})
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.drug._id)}
                            className="mr-2 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* الإجمالي */}
                {selectedItems.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex justify-between items-center text-lg flex-row-reverse">
                      <span className="font-semibold text-gray-900">الإجمالي</span>
                      <span className="text-2xl font-bold text-purple-600">
                        {calculateTotal().toFixed(2)} ل.س
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* معلومات العميل */}
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4 text-right">معلومات العميل</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                      اسم العميل <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-right"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                      placeholder="اسم العميل"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                      رقم الهاتف
                    </label>
                    <input
                      type="tel"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-right"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                      placeholder="05xx xxx xx xx"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                      طريقة الدفع
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {['نقدي', 'بطاقة ائتمان', 'تحويل بنكي'].map(method => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setCustomerInfo({...customerInfo, paymentMethod: method})}
                          className={`py-3 text-center rounded-xl transition-all ${
                            customerInfo.paymentMethod === method
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {method === 'نقدي' ? '💰 نقدي' : 
                           method === 'بطاقة ائتمان' ? '💳 بطاقة' : 
                           '🏦 تحويل'}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading || selectedItems.length === 0 || !customerInfo.name.trim()}
                    className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center ${
                      loading || selectedItems.length === 0 || !customerInfo.name.trim()
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700'
                    }`}
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin ml-2"></div>
                        جاري إتمام البيع...
                      </>
                    ) : (
                      '✅ إتمام البيع'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}