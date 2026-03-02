'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import toast from 'react-hot-toast'

// Skeleton bileşeni
const SaleSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-7 w-40 bg-gray-200 rounded-lg mb-6" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-gray-200 rounded" />
                    <div className="h-3 w-1/2 bg-gray-200 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="h-5 w-24 bg-gray-200 rounded mb-3" />
          <div className="h-24 bg-gray-200 rounded-lg" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="h-5 w-28 bg-gray-200 rounded mb-3" />
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 rounded-lg" />
            <div className="h-10 bg-gray-200 rounded-lg" />
            <div className="h-10 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  </div>
)

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
  const [pageLoading, setPageLoading] = useState(true)

  const fetchCart = useCallback(async () => {
    try {
      const cartData = await api.cart.getActive()
      setCart(cartData)
    } catch (error) {
      console.error('خطأ في تحميل السيارة:', error)
      toast.error('فشل تحميل السيارة')
    } finally {
      setPageLoading(false)
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
      toast.error(`لا توجد كمية كافية. المتوفر: ${availableQuantity}`)
      return
    }
    
    if (existing) {
      setSelectedItems(prev => prev.map(i =>
        i.drug._id === item.drug._id ? { ...i, quantity: i.quantity + 1 } : i
      ))
    } else {
      setSelectedItems(prev => [...prev, {
        drug: item.drug,
        quantity: 1,
        price: item.price
      }])
    }
    
    toast.success(`${item.drug.name} أضيف إلى السلة`, { icon: '🛒' })
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
      toast.error(`الحد الأقصى ${cartItem.quantity}`)
      return
    }
    
    setSelectedItems(prev => prev.map(item =>
      item.drug._id === drugId ? { ...item, quantity } : item
    ))
  }, [cart, selectedItems, handleRemoveItem])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    
    if (selectedItems.length === 0) {
      toast.error('اختر منتج واحد على الأقل')
      return
    }
    
    if (!customerInfo.name.trim()) {
      toast.error('أدخل اسم العميل')
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
      toast.success('تم البيع بنجاح!')
      setSelectedItems([])
      setCustomerInfo({ name: '', phone: '', paymentMethod: 'نقدي' })
      await fetchCart()
      setTimeout(() => router.push('/orders'), 1000)
    } catch (error) {
      console.error('خطأ في البيع:', error)
      toast.error(error.message || 'فشل البيع')
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

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-3" dir="rtl">
        <div className="max-w-7xl mx-auto">
          <SaleSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Link 
              href="/cart" 
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
            >
              <span className="text-lg">←</span>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">🚚 بيع سريع من السيارة</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1 pr-11">اختر المنتجات للبيع</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Ürün Listesi */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h3 className="font-semibold text-gray-900">المنتجات في السيارة</h3>
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    className="w-full h-10 pr-9 pl-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                    placeholder="ابحث..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <span className="absolute right-3 top-2.5 text-gray-400">🔍</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto p-1">
                {filteredItems.length === 0 ? (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    <span className="text-4xl">🚚</span>
                    <p className="text-sm mt-2">السيارة فارغة</p>
                    <Link href="/cart/load" className="inline-block mt-3 text-blue-500 text-sm underline">
                      تحميل منتجات
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
                        className={`border rounded-lg p-3 ${
                          inCart ? 'border-purple-300 bg-purple-50' : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            inCart ? 'bg-purple-200' : 'bg-gray-100'
                          }`}>
                            <span className={inCart ? 'text-purple-600' : 'text-gray-600'}>💊</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 text-sm truncate">{item.drug?.name}</h4>
                            <p className="text-xs text-gray-500 mt-0.5">{item.price.toFixed(2)} ل.س</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-600">المتوفر: {availableQuantity}</span>
                              {inCart && (
                                <span className="text-xs text-purple-600">في السلة: {cartQuantity}</span>
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              {inCart && (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleQuantityChange(item.drug._id, cartQuantity - 1)}
                                    className="w-7 h-7 bg-white border border-purple-300 rounded-lg text-sm"
                                  >
                                    -
                                  </button>
                                  <span className="w-6 text-center text-sm">{cartQuantity}</span>
                                  <button
                                    onClick={() => handleQuantityChange(item.drug._id, cartQuantity + 1)}
                                    className="w-7 h-7 bg-white border border-purple-300 rounded-lg text-sm"
                                  >
                                    +
                                  </button>
                                </div>
                              )}
                              <button
                                onClick={() => handleAddItem(item)}
                                disabled={cartQuantity >= availableQuantity}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                                  cartQuantity >= availableQuantity
                                    ? 'bg-gray-100 text-gray-400'
                                    : 'bg-purple-500 text-white'
                                }`}
                              >
                                {inCart ? '➕ إضافة' : '➕ أضف'}
                              </button>
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

          {/* Sepet ve Müşteri Formu */}
          <div className="lg:col-span-1 space-y-4">
            {/* Sepet */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 text-sm">السلة ({selectedItems.length})</h3>
                {selectedItems.length > 0 && (
                  <button
                    onClick={() => setSelectedItems([])}
                    className="text-xs text-red-600"
                  >
                    تفريغ
                  </button>
                )}
              </div>

              {selectedItems.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <span className="text-3xl">🛒</span>
                  <p className="text-xs mt-2">سلة البيع فارغة</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedItems.map((item) => (
                    <div key={item.drug._id} className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-xs truncate">{item.drug.name}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <button
                            onClick={() => handleQuantityChange(item.drug._id, item.quantity - 1)}
                            className="w-6 h-6 bg-white border border-purple-300 rounded text-sm"
                          >
                            -
                          </button>
                          <span className="w-5 text-center text-xs">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(item.drug._id, item.quantity + 1)}
                            className="w-6 h-6 bg-white border border-purple-300 rounded text-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="text-left mr-2">
                        <p className="font-bold text-gray-900 text-xs">{(item.quantity * item.price).toFixed(2)}</p>
                        <button onClick={() => handleRemoveItem(item.drug._id)} className="text-red-500 text-xs">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedItems.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-xs text-gray-600">الإجمالي</span>
                  <span className="font-bold text-purple-600">{calculateTotal().toFixed(2)} ل.س</span>
                </div>
              )}
            </div>

            {/* Müşteri Formu */}
            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 text-sm mb-3">معلومات العميل</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="الاسم *"
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                  required
                />
                <input
                  type="tel"
                  placeholder="الهاتف"
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                />
                <select
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  value={customerInfo.paymentMethod}
                  onChange={(e) => setCustomerInfo({...customerInfo, paymentMethod: e.target.value})}
                >
                  <option value="نقدي">💰 نقدي</option>
                  <option value="بطاقة ائتمان">💳 بطاقة</option>
                  <option value="تحويل بنكي">🏦 تحويل</option>
                </select>
                <button
                  type="submit"
                  disabled={loading || selectedItems.length === 0 || !customerInfo.name.trim()}
                  className="w-full h-11 bg-purple-500 text-white rounded-lg text-sm font-medium disabled:bg-gray-200 disabled:text-gray-500"
                >
                  {loading ? 'جاري...' : '✅ إتمام البيع'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}