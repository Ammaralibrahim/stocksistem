'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import api from '@/lib/api'
import toast from 'react-hot-toast'

export default function CartPage() {
  const router = useRouter()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalItems: 0,
    totalValue: 0,
    criticalItems: []
  })
  const [transferLoading, setTransferLoading] = useState(false)

  useEffect(() => {
    fetchCartData()
  }, [])

  const fetchCartData = async () => {
    try {
      setLoading(true)
      const [cartData] = await Promise.all([
        api.get('/cart/active')
      ])
      
      setCart(cartData)
      
      // حساب الإحصائيات محليًا
      const criticalItems = [];
      const today = new Date();
      
      if (cartData && cartData.items) {
        cartData.items.forEach(item => {
          if (item.drug?.expiryDate) {
            const expiryDate = new Date(item.drug.expiryDate);
            const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
            
            if (diffDays <= 30 && diffDays >= 0) {
              criticalItems.push({
                drug: item.drug,
                quantity: item.quantity,
                daysLeft: diffDays
              });
            }
          }
        });
      }
      
      setStats({
        totalItems: cartData?.totalItems || 0,
        totalValue: cartData?.totalValue || 0,
        criticalItems: criticalItems
      })
    } catch (error) {
      console.error('خطأ في تحميل بيانات العربة:', error)
      toast.error('فشل تحميل بيانات العربة')
    } finally {
      setLoading(false)
    }
  }

  const handleUnloadAll = async () => {
    if (!cart) {
      toast.error('لا توجد عربة نشطة')
      return
    }
    
    if (!window.confirm('هل أنت متأكد من إعادة جميع المنتجات إلى المستودع؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      return
    }

    setTransferLoading(true)
    try {
      const response = await api.post('/cart/unload-all', {
        cartId: cart._id,
        notes: 'تحويل نهاية اليوم'
      })
      
      toast.success('تم إعادة جميع المنتجات إلى المستودع بنجاح!')
      fetchCartData()
    } catch (error) {
      console.error('خطأ في التحويل:', error)
      toast.error(error.response?.data?.message || 'فشل التحويل')
    } finally {
      setTransferLoading(false)
    }
  }

  const handleQuickSale = () => {
    router.push('/cart/sale')
  }

  const handleLoadItem = () => {
    router.push('/cart/load')
  }

  const handleUnloadItem = () => {
    router.push('/cart/unload')
  }

  const handleEditCart = () => {
    if (cart && cart._id) {
      router.push(`/cart/${cart._id}/edit`)
    }
  }

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return { color: 'text-gray-600', badge: 'bg-gray-100 text-gray-800' }
    
    const today = new Date()
    const expiry = new Date(expiryDate)
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return { color: 'text-red-600', badge: 'bg-red-100 text-red-800' }
    if (diffDays <= 7) return { color: 'text-red-600', badge: 'bg-red-100 text-red-800' }
    if (diffDays <= 30) return { color: 'text-amber-600', badge: 'bg-amber-100 text-amber-800' }
    return { color: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-800' }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'نشطة': return 'bg-emerald-100 text-emerald-700'
      case 'متوقفة': return 'bg-amber-100 text-amber-700'
      case 'في الصيانة': return 'bg-blue-100 text-blue-700'
      case 'مغلقة': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6" dir="rtl">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">جاري تحميل بيانات العربة...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                🚚 عربة التوزيع
              </h1>
              <p className="text-gray-500 mt-1">
                {cart?.name || 'عربة 1'} - {cart?.driverName || 'لم يتم تعيين سائق'}
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
              <button
                onClick={handleLoadItem}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm hover:shadow flex items-center"
              >
                <span className="ml-2">📦</span>
                تحميل من المستودع
              </button>
              <button
                onClick={handleUnloadItem}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-sm hover:shadow flex items-center"
              >
                <span className="ml-2">📥</span>
                إعادة إلى المستودع
              </button>
              <button
                onClick={handleQuickSale}
                className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-medium hover:from-purple-600 hover:to-purple-700 transition-all shadow-sm hover:shadow flex items-center"
              >
                <span className="ml-2">💰</span>
                بيع سريع
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">المنتجات في العربة</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {cart?.totalItems || 0}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <span className="text-blue-600 text-xl">📦</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">القيمة الإجمالية</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {(cart?.totalValue || 0).toFixed(2)} ل.س
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <span className="text-emerald-600 text-xl">💰</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">منتجات حرجة</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {stats.criticalItems?.length || 0}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                  <span className="text-red-600 text-xl">⚠️</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">آخر تحميل</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {cart?.lastLoadedAt ? format(new Date(cart.lastLoadedAt), 'dd/MM HH:mm') : 'لا يوجد'}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                  <span className="text-amber-600 text-xl">🕒</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - محتويات العربة */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="border-b border-gray-100 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center ml-3">
                      <span className="text-blue-600 text-xl">🚚</span>
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-900">المنتجات في العربة</h2>
                      <p className="text-sm text-gray-500">{cart?.items?.length || 0} نوع منتج</p>
                    </div>
                  </div>
                  <button
                    onClick={handleUnloadAll}
                    disabled={transferLoading || !cart?.items?.length}
                    className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center ${
                      transferLoading || !cart?.items?.length
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'
                    }`}
                  >
                    {transferLoading ? (
                      <>
                        <div className="w-4 h-4 border-t-2 border-white border-solid rounded-full animate-spin ml-2"></div>
                        جاري المعالجة...
                      </>
                    ) : (
                      <>
                        <span className="ml-2">📥</span>
                        إعادة الكل إلى المستودع
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              <div className="p-5">
                {!cart?.items?.length ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">🚚</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">العربة فارغة</h3>
                    <p className="text-gray-600 mb-6">لم يتم تحميل أي منتجات في العربة بعد.</p>
                    <button
                      onClick={handleLoadItem}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all flex items-center mx-auto"
                    >
                      <span className="ml-2">📦</span>
                      تحميل منتجات من المستودع
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">المنتج</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">الكمية</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">القيمة</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">تاريخ الانتهاء</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cart.items.map((item, index) => {
                          const expiryStatus = getExpiryStatus(item.drug?.expiryDate)
                          return (
                            <tr key={index} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                              <td className="py-4 px-4">
                                <div className="flex items-center flex-row-reverse">
                                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center ml-3">
                                    <span className="text-blue-600 text-lg">💊</span>
                                  </div>
                                  <div className="text-right">
                                    <h4 className="font-medium text-gray-900">{item.drug?.name || 'منتج غير معروف'}</h4>
                                    <p className="text-sm text-gray-600">
                                      {item.drug ? `المستودع: ${item.drug.stock || 0} | العربة: ${item.drug.cartStock || 0}` : 'بيانات غير متوفرة'}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="text-right">
                                  <p className="text-lg font-bold text-gray-900">{item.quantity} وحدة</p>
                                  <p className="text-sm text-gray-600">{(item.price || 0).toFixed(2)} ل.س للوحدة</p>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <p className="text-lg font-bold text-gray-900 text-right">
                                  {(item.quantity * item.price).toFixed(2)} ل.س
                                </p>
                              </td>
                              <td className="py-4 px-4">
                                <div className="text-right">
                                  {item.drug?.expiryDate ? (
                                    <>
                                      <p className="text-sm text-gray-900">
                                        {format(new Date(item.drug.expiryDate), 'dd/MM/yyyy')}
                                      </p>
                                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${expiryStatus.badge}`}>
                                        {expiryStatus.color.includes('red') ? 'عاجل' : 
                                         expiryStatus.color.includes('amber') ? 'قريب' : 'آمن'}
                                      </span>
                                    </>
                                  ) : (
                                    <p className="text-sm text-gray-500">غير محدد</p>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex space-x-2 space-x-reverse justify-end">
                                  <button
                                    onClick={() => router.push(`/cart/unload?drugId=${item.drug?._id}`)}
                                    className="w-8 h-8 rounded-lg bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center transition-colors"
                                    title="إعادة إلى المستودع"
                                  >
                                    <span className="text-emerald-600">📥</span>
                                  </button>
                                  <button
                                    onClick={() => router.push(`/orders/new?drugId=${item.drug?._id}&source=cart`)}
                                    className="w-8 h-8 rounded-lg bg-purple-100 hover:bg-purple-200 flex items-center justify-center transition-colors"
                                    title="إجراء بيع"
                                  >
                                    <span className="text-purple-600">💰</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* المنتجات الحرجة */}
            {stats.criticalItems?.length > 0 && (
              <div className="mt-6 bg-gradient-to-r from-red-50 to-red-50/50 border border-red-100 rounded-2xl p-5">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center ml-3">
                    <span className="text-red-600 text-lg">⚠️</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">المنتجات الحرجة</h3>
                    <p className="text-sm text-gray-600">المنتجات القريبة من تاريخ الانتهاء</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {stats.criticalItems.slice(0, 3).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                      <div className="text-right">
                        <h4 className="font-medium text-gray-900">{item.drug.name}</h4>
                        <p className="text-sm text-gray-600">
                          {item.quantity} وحدة • متبقي {item.daysLeft} يوم
                        </p>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                        <span className="text-red-600">⏰</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - معلومات العربة والإجراءات السريعة */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* معلومات العربة */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4 text-right">معلومات العربة</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">اسم العربة</span>
                    <span className="font-medium text-gray-900">{cart?.name || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">السائق</span>
                    <span className="font-medium text-gray-900">{cart?.driverName || 'غير معين'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">الهاتف</span>
                    <span className="font-medium text-gray-900">{cart?.driverPhone || 'لا يوجد'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">رقم اللوحة</span>
                    <span className="font-medium text-gray-900">{cart?.plateNumber || 'لا يوجد'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">الحالة</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(cart?.status)}`}>
                      {cart?.status || '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">آخر تحديث</span>
                    <span className="font-medium text-gray-900">
                      {cart?.updatedAt ? format(new Date(cart.updatedAt), 'dd/MM HH:mm') : '-'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleEditCart}
                  className="w-full mt-4 px-4 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl font-medium transition-colors flex items-center justify-center"
                >
                  <span className="ml-2">✏️</span>
                  تعديل معلومات العربة
                </button>
              </div>

              {/* الإجراءات السريعة */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-100 rounded-2xl p-5">
                <h3 className="font-semibold text-gray-900 mb-4 text-right">إجراءات سريعة</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleLoadItem}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all flex items-center justify-center"
                  >
                    <span className="ml-2">📦</span>
                    تحميل من المستودع
                  </button>
                  <button
                    onClick={handleQuickSale}
                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-medium hover:from-purple-600 hover:to-purple-700 transition-all flex items-center justify-center"
                  >
                    <span className="ml-2">💰</span>
                    إجراء بيع سريع
                  </button>
                  <button
                    onClick={() => router.push('/cart/scan')}
                    className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all flex items-center justify-center"
                  >
                    <span className="ml-2">📷</span>
                    مسح بالباركود
                  </button>
                  <button
                    onClick={handleUnloadAll}
                    disabled={transferLoading || !cart?.items?.length}
                    className={`w-full px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center ${
                      transferLoading || !cart?.items?.length
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'
                    }`}
                  >
                    <span className="ml-2">📥</span>
                    تحويل نهاية اليوم
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}