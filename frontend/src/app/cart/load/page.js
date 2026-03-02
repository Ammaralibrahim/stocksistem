'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import toast from 'react-hot-toast'

// Miktar giriş bileşeni
const QuantityInput = ({ value, onChange, max, disabled }) => (
  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden h-9">
    <button
      type="button"
      onClick={() => onChange(Math.min(max, (parseInt(value) || 1) + 1))}
      disabled={disabled || parseInt(value) >= max}
      className="w-8 h-full bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-700 text-lg"
    >
      +
    </button>
    <input
      type="number"
      min="1"
      max={max}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-14 text-center border-x border-gray-200 h-full text-sm focus:outline-none"
    />
    <button
      type="button"
      onClick={() => onChange(Math.max(1, (parseInt(value) || 1) - 1))}
      disabled={disabled || parseInt(value) <= 1}
      className="w-8 h-full bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-700 text-lg"
    >
      -
    </button>
  </div>
)

// Ürün kartı bileşeni
const ProductCard = ({ drug, isSelected, onSelect, quantity, onQuantityChange, onLoad }) => (
  <div
    className={`border rounded-xl p-3 cursor-pointer transition-all ${
      isSelected
        ? 'border-blue-400 bg-blue-50 shadow-sm'
        : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow'
    }`}
    onClick={() => onSelect(drug)}
  >
    <div className="flex items-start gap-2">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
        isSelected ? 'bg-blue-200' : 'bg-gray-100'
      }`}>
        <span className={isSelected ? 'text-blue-600' : 'text-gray-600'}>💊</span>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 text-sm truncate">{drug.name}</h4>
        <p className="text-xs text-gray-500 mt-0.5">{drug.price?.toFixed(2)} ل.س</p>
        <div className="flex items-center gap-2 mt-1 text-xs">
          <span className="text-gray-600">المخزون: {drug.stock}</span>
          <span className="text-gray-600">العربة: {drug.cartStock || 0}</span>
        </div>
      </div>
      {isSelected && (
        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
          <span className="text-white text-xs">✓</span>
        </div>
      )}
    </div>

    {isSelected && (
      <div className="mt-3 flex items-center gap-2 border-t border-blue-200 pt-3">
        <QuantityInput
          value={quantity}
          onChange={(val) => onQuantityChange(val)}
          max={drug.stock}
        />
        <button
          onClick={(e) => { e.stopPropagation(); onLoad(); }}
          disabled={!quantity || parseInt(quantity) <= 0 || parseInt(quantity) > drug.stock}
          className="flex-1 h-9 bg-blue-500 text-white rounded-lg text-sm font-medium disabled:bg-gray-200 disabled:text-gray-500"
        >
          تحميل
        </button>
      </div>
    )}
  </div>
)

// Skeleton yüklenirken
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
  const [quantity, setQuantity] = useState('1')
  // const [barcode, setBarcode] = useState('')   // 👈 معلق مؤقتًا
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

  const handleLoad = useCallback(async () => {
    if (!selectedDrug || !quantity || parseInt(quantity) <= 0) {
      toast.error('الرجاء اختيار منتج وكمية صالحة')
      return
    }

    const qty = parseInt(quantity)
    if (selectedDrug.stock < qty) {
      toast.error(`كمية غير كافية في المخزون. المتاحة: ${selectedDrug.stock}`)
      return
    }

    setLoading(true)
    try {
      await api.cart.loadToCart(selectedDrug._id, qty, cart?._id)
      toast.success(`${qty} وحدة من ${selectedDrug.name} تم تحميلها إلى العربة!`)
      setSelectedDrug(null)
      setQuantity('1')
      // setBarcode('')
      fetchData()
    } catch (error) {
      console.error('خطأ في التحميل:', error)
      toast.error(error.message || 'فشل التحميل')
    } finally {
      setLoading(false)
    }
  }, [selectedDrug, quantity, cart])

  // const handleBarcodeLoad = useCallback(async () => {
  //   if (!barcode || !quantity || parseInt(quantity) <= 0) {
  //     toast.error('الرجاء إدخال الباركود والكمية')
  //     return
  //   }

  //   setLoading(true)
  //   try {
  //     await api.cart.loadByBarcode(barcode, parseInt(quantity))
  //     toast.success(`${quantity} وحدة تم تحميلها بالباركود!`)
  //     setBarcode('')
  //     setQuantity('1')
  //     setSelectedDrug(null)
  //     fetchData()
  //   } catch (error) {
  //     console.error('خطأ في تحميل الباركود:', error)
  //     toast.error(error.message || 'فشل تحميل الباركود')
  //   } finally {
  //     setLoading(false)
  //   }
  // }, [barcode, quantity])

  const filteredDrugs = useMemo(() => {
    if (!searchTerm.trim()) return drugs.filter(d => (d.stock || 0) > 0)
    const lower = searchTerm.toLowerCase()
    return drugs.filter(d => 
      (d.stock || 0) > 0 && (
        d.name?.toLowerCase().includes(lower) ||
        d.barcode?.includes(searchTerm) ||
        d.serialNumber?.toLowerCase().includes(lower)
      )
    )
  }, [drugs, searchTerm])

  if (pageLoading) return <LoadSkeleton />

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-4" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Başlık */}
        <div className="mb-5 flex items-center gap-2">
          <Link 
            href="/cart" 
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
          >
            <span className="text-lg">←</span>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">📦 تحميل إلى العربة</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Sol: Ürün listesi */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h3 className="font-semibold text-gray-900">المنتجات المتوفرة</h3>
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    className="w-full h-10 pr-9 pl-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="ابحث بالاسم أو الباركود..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <span className="absolute right-3 top-2.5 text-gray-400 text-sm">🔍</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto p-1">
                {filteredDrugs.length === 0 ? (
                  <div className="col-span-2 text-center py-10 text-gray-500">
                    <span className="text-4xl">💊</span>
                    <p className="text-sm mt-2">لا توجد منتجات متوفرة</p>
                  </div>
                ) : (
                  filteredDrugs.map((drug) => (
                    <ProductCard
                      key={drug._id}
                      drug={drug}
                      isSelected={selectedDrug?._id === drug._id}
                      onSelect={(d) => {
                        setSelectedDrug(d)
                        setQuantity('1')
                      }}
                      quantity={selectedDrug?._id === drug._id ? quantity : '1'}
                      onQuantityChange={(val) => setQuantity(val)}
                      onLoad={handleLoad}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sağ panel: Barcode ve araba bilgisi */}
          <div className="lg:col-span-1 space-y-4">
            {/* التحميل بالباركود - معطل حالياً */}
            {/* <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm flex items-center gap-1">
                <span>📷</span> التحميل بالباركود
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  className="w-full h-10 px-3 bg-white border border-emerald-200 rounded-lg text-sm"
                  placeholder="أدخل الباركود"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <QuantityInput
                    value={quantity}
                    onChange={(val) => setQuantity(val)}
                    max={9999}
                  />
                  <button
                    onClick={handleBarcodeLoad}
                    disabled={loading || !barcode || !quantity || parseInt(quantity) <= 0}
                    className="flex-1 h-10 bg-emerald-500 text-white rounded-lg text-sm font-medium disabled:bg-gray-200 disabled:text-gray-500"
                  >
                    تحميل
                  </button>
                </div>
              </div>
            </div> */}

            {/* Aktif araba bilgisi */}
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

            {/* İpucu */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
              <p>💡 انقر على أي منتج لاختياره، ثم حدد الكمية واضغط تحميل.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}