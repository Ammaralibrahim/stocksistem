'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import toast from 'react-hot-toast'

// Skeleton bileşeni
const LoadSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-7 w-40 bg-gray-200 rounded-lg mb-6" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg" />
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
      <div className="lg:col-span-1">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="h-5 w-24 bg-gray-200 rounded mb-4" />
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 rounded-xl" />
            <div className="h-10 bg-gray-200 rounded-xl" />
            <div className="h-12 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  </div>
)

export default function LoadToCartPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [drugs, setDrugs] = useState([])
  const [cart, setCart] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDrug, setSelectedDrug] = useState(null)
  const [quantity, setQuantity] = useState('')
  const [barcode, setBarcode] = useState('')
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [drugsData, cartData] = await Promise.all([
        api.drugs.getAll(),
        api.cart.getActive()
      ])
      setDrugs(Array.isArray(drugsData) ? drugsData : [])
      setCart(cartData)
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error)
      toast.error('فشل تحميل البيانات')
    } finally {
      setPageLoading(false)
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
      await api.cart.loadToCart(selectedDrug._id, parseInt(quantity), cart?._id)
      toast.success(`${quantity} وحدة من ${selectedDrug.name} تم تحميلها إلى العربة!`)
      setSelectedDrug(null)
      setQuantity('')
      setBarcode('')
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
      await api.cart.loadByBarcode(barcode, parseInt(quantity))
      toast.success(`${quantity} وحدة تم تحميلها بالباركود!`)
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

  const filteredDrugs = drugs.filter(drug => {
    if (!drug) return false
    const searchLower = searchTerm.toLowerCase()
    return (
      drug.name?.toLowerCase().includes(searchLower) ||
      (drug.barcode && drug.barcode.includes(searchTerm)) ||
      (drug.serialNumber && drug.serialNumber.toLowerCase().includes(searchLower))
    )
  }).filter(drug => (drug.stock || 0) > 0)

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
        <div className="max-w-4xl mx-auto">
          <LoadSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-4" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Link 
              href="/cart" 
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
            >
              <span className="text-lg">←</span>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">📦 التحميل إلى العربة</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1 pr-11">اختر منتجات من المستودع</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Ürün Listesi */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h3 className="font-semibold text-gray-900">المنتجات المتوفرة</h3>
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    className="w-full h-10 pr-9 pl-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="ابحث..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <span className="absolute right-3 top-2.5 text-gray-400 text-sm">🔍</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto p-1">
                {filteredDrugs.length === 0 ? (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    <span className="text-4xl">💊</span>
                    <p className="text-sm mt-2">لا توجد منتجات</p>
                  </div>
                ) : (
                  filteredDrugs.map((drug) => (
                    <div
                      key={drug._id}
                      className={`border rounded-lg p-3 cursor-pointer transition-all ${
                        selectedDrug?._id === drug._id 
                          ? 'border-blue-300 bg-blue-50' 
                          : 'border-gray-200 hover:border-blue-300 bg-white'
                      }`}
                      onClick={() => {
                        setSelectedDrug(drug)
                        setQuantity('1')
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          selectedDrug?._id === drug._id ? 'bg-blue-200' : 'bg-gray-100'
                        }`}>
                          <span className={selectedDrug?._id === drug._id ? 'text-blue-600' : 'text-gray-600'}>💊</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm truncate">{drug.name}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">{drug.price.toFixed(2)} ل.س</p>
                          <div className="flex items-center gap-2 mt-1 text-xs">
                            <span className="text-gray-600">المخزون: {drug.stock}</span>
                            <span className="text-gray-600">العربة: {drug.cartStock || 0}</span>
                          </div>
                        </div>
                        {selectedDrug?._id === drug._id && (
                          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sağ Panel: Yükleme Formu */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              {/* Seçili Ürün */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">تفاصيل التحميل</h3>
                {selectedDrug ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-white border border-blue-200 flex items-center justify-center">
                          <span className="text-blue-600">💊</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm truncate">{selectedDrug.name}</h4>
                          <p className="text-xs text-gray-600">المخزون: {selectedDrug.stock}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">الكمية</label>
                      <input
                        type="number"
                        min="1"
                        max={selectedDrug.stock}
                        className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder={`max ${selectedDrug.stock}`}
                      />
                    </div>

                    <button
                      onClick={handleLoad}
                      disabled={loading || !quantity || quantity <= 0 || quantity > selectedDrug.stock}
                      className="w-full h-11 bg-blue-500 text-white rounded-lg text-sm font-medium disabled:bg-gray-200 disabled:text-gray-500 flex items-center justify-center"
                    >
                      {loading ? 'جاري...' : '📦 تحميل'}
                    </button>

                    <button
                      onClick={() => setSelectedDrug(null)}
                      className="w-full text-xs text-gray-600 hover:text-gray-900"
                    >
                      تغيير المنتج
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <span className="text-3xl">📦</span>
                    <p className="text-sm mt-2">اختر منتجاً</p>
                  </div>
                )}
              </div>

              {/* Barcode Yükleme */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">التحميل بالباركود</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    className="w-full h-10 px-3 bg-white border border-emerald-200 rounded-lg text-sm"
                    placeholder="رقم الباركود"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                  />
                  <input
                    type="number"
                    min="1"
                    className="w-full h-10 px-3 bg-white border border-emerald-200 rounded-lg text-sm"
                    placeholder="الكمية"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleBarcodeLoad}
                      disabled={loading || !barcode || !quantity || quantity <= 0}
                      className="h-10 bg-emerald-500 text-white rounded-lg text-sm font-medium disabled:bg-gray-200 disabled:text-gray-500"
                    >
                      تحميل
                    </button>
                    <button
                      onClick={() => toast('مسح الباركود قريباً')}
                      className="h-10 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium"
                    >
                      📷 مسح
                    </button>
                  </div>
                </div>
              </div>

              {/* Araba Bilgisi */}
              {cart && (
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600">🚚</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm truncate">{cart.name}</h4>
                      <p className="text-xs text-gray-500">{cart.driverName || 'بدون سائق'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                    <div>
                      <span className="text-gray-500">المنتجات:</span>
                      <span className="mr-1 font-medium">{cart.totalItems || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">القيمة:</span>
                      <span className="mr-1 font-medium">{(cart.totalValue || 0).toFixed(2)} ل.س</span>
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