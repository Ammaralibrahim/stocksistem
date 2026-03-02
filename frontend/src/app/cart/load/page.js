'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import toast from 'react-hot-toast'

// ==================== Alt Bileşenler ====================

const QuantityInput = ({ value, onChange, max, disabled }) => (
  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden h-8 bg-white">
    <button
      type="button"
      onClick={() => onChange(Math.min(max, (parseInt(value) || 1) + 1))}
      disabled={disabled || parseInt(value) >= max}
      className="w-7 h-full bg-gray-50 hover:bg-gray-100 disabled:opacity-40 text-gray-600 text-sm transition-colors"
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
      className="w-10 text-center border-x border-gray-100 h-full text-xs focus:outline-none bg-white"
    />
    <button
      type="button"
      onClick={() => onChange(Math.max(1, (parseInt(value) || 1) - 1))}
      disabled={disabled || parseInt(value) <= 1}
      className="w-7 h-full bg-gray-50 hover:bg-gray-100 disabled:opacity-40 text-gray-600 text-sm transition-colors"
    >
      -
    </button>
  </div>
)

const ProductCard = ({ drug, onAddToCart }) => {
  const [localQty, setLocalQty] = useState('1')

  const handleAdd = () => {
    const qty = parseInt(localQty)
    if (!qty || qty <= 0) {
      toast.error('الرجاء إدخال كمية صالحة')
      return
    }
    if (qty > drug.stock) {
      toast.error(`الكمية المطلوبة (${qty}) أكبر من المخزون (${drug.stock})`)
      return
    }
    onAddToCart(drug, qty)
    setLocalQty('1')
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-2.5 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-2">
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
          <span className="text-blue-600 text-sm">💊</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 text-xs truncate">{drug.name}</h4>
          <p className="text-[11px] text-gray-500 mt-0.5">{drug.price?.toFixed(2)} ل.س</p>
          <div className="flex items-center gap-2 mt-1 text-[10px]">
            <span className="text-gray-600">المخزون: {drug.stock}</span>
            <span className="text-gray-600">السيارة: {drug.cartStock || 0}</span>
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        <QuantityInput
          value={localQty}
          onChange={setLocalQty}
          max={drug.stock}
        />
        <button
          onClick={handleAdd}
          disabled={!localQty || parseInt(localQty) <= 0 || parseInt(localQty) > drug.stock}
          className="flex-1 h-8 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-500 transition-colors"
        >
          إضافة
        </button>
      </div>
    </div>
  )
}

const CartItem = ({ item, onUpdate, onRemove }) => {
  const drug = item.drug
  const maxQty = drug.stock // sepetteki toplam miktar stoku aşamaz

  const handleQtyChange = (newQty) => {
    const qty = parseInt(newQty)
    if (isNaN(qty) || qty < 1) {
      onRemove(drug._id)
      return
    }
    if (qty > maxQty) {
      toast.error(`الحد الأقصى ${maxQty}`)
      return
    }
    onUpdate(drug._id, qty)
  }

  return (
    <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 text-xs truncate">{drug.name}</p>
        <div className="flex items-center gap-1 mt-1">
          <button
            onClick={() => handleQtyChange(item.quantity - 1)}
            className="w-6 h-6 bg-white border border-blue-200 rounded text-xs hover:bg-blue-100 transition-colors"
          >
            -
          </button>
          <span className="w-5 text-center text-xs font-medium">{item.quantity}</span>
          <button
            onClick={() => handleQtyChange(item.quantity + 1)}
            className="w-6 h-6 bg-white border border-blue-200 rounded text-xs hover:bg-blue-100 transition-colors"
          >
            +
          </button>
        </div>
      </div>
      <div className="text-left mr-2">
        <p className="font-bold text-gray-900 text-xs">{(item.quantity * item.price).toFixed(2)}</p>
        <button onClick={() => onRemove(drug._id)} className="text-gray-400 hover:text-red-500 text-[10px] transition-colors">
          ✕
        </button>
      </div>
    </div>
  )
}

const LoadSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-7 w-40 bg-gray-200 rounded-xl mb-6" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-gray-200 rounded" />
                <div className="h-3 w-1/2 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 h-40" />
        <div className="bg-white rounded-2xl border border-gray-100 p-4 h-24" />
      </div>
    </div>
  </div>
)

// ==================== Ana Sayfa ====================

export default function LoadToCartPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [drugs, setDrugs] = useState([])
  const [cart, setCart] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [cartItems, setCartItems] = useState([]) // { drug, quantity, price }
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

  const addToCart = (drug, quantity) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.drug._id === drug._id)
      if (existing) {
        const newQty = existing.quantity + quantity
        if (newQty > drug.stock) {
          toast.error(`لا يمكن إضافة ${quantity} وحدات. الحد الأقصى ${drug.stock}`)
          return prev
        }
        return prev.map(item =>
          item.drug._id === drug._id
            ? { ...item, quantity: newQty }
            : item
        )
      } else {
        if (quantity > drug.stock) {
          toast.error(`الكمية المطلوبة (${quantity}) أكبر من المخزون (${drug.stock})`)
          return prev
        }
        return [...prev, { drug, quantity, price: drug.price }]
      }
    })
    toast.success(`تمت إضافة ${quantity} وحدة من ${drug.name}`, { icon: '🛒' })
  }

  const updateCartItem = (drugId, newQuantity) => {
    setCartItems(prev =>
      prev.map(item =>
        item.drug._id === drugId
          ? { ...item, quantity: newQuantity }
          : item
      )
    )
  }

  const removeFromCart = (drugId) => {
    setCartItems(prev => prev.filter(item => item.drug._id !== drugId))
    toast.success('تمت إزالة المنتج من السلة')
  }

  const handleLoadAll = async () => {
    if (cartItems.length === 0) {
      toast.error('السلة فارغة')
      return
    }

    setLoading(true)
    const toastId = toast.loading('جاري التحميل إلى السيارة...')

    try {
      await Promise.all(
        cartItems.map(item =>
          api.cart.loadToCart(item.drug._id, item.quantity, cart?._id)
        )
      )
      toast.success('تم تحميل جميع المنتجات إلى السيارة', { id: toastId })
      setCartItems([])
      fetchData()
    } catch (error) {
      toast.error(error.message || 'فشل التحميل', { id: toastId })
    } finally {
      setLoading(false)
    }
  }

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

  const cartSummary = useMemo(() => {
    const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0)
    const totalValue = cartItems.reduce((acc, item) => acc + item.quantity * item.price, 0)
    return { totalItems, totalValue }
  }, [cartItems])

  if (pageLoading) return <LoadSkeleton />

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-5" dir="rtl">
      {/* Scroll bar stilleri */}
      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 20px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/cart"
            className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <span className="text-lg">←</span>
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">تحميل إلى السيارة</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Ürün Listesi */}
          <div className="lg:col-span-2 space-y-4">
            {/* Arama */}
            <div className="relative">
              <input
                type="text"
                className="w-full h-12 pr-10 pl-4 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="ابحث بالاسم أو الباركود..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="absolute right-3 top-3 text-gray-400">🔍</span>
            </div>

            {/* Ürün Kartları - Sabit yükseklik, scroll */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-1 scrollbar-thin">
              {filteredDrugs.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100">
                  <span className="text-5xl">💊</span>
                  <p className="text-sm mt-3">لا توجد منتجات متوفرة</p>
                </div>
              ) : (
                filteredDrugs.map((drug) => (
                  <ProductCard
                    key={drug._id}
                    drug={drug}
                    onAddToCart={addToCart}
                  />
                ))
              )}
            </div>
          </div>

          {/* Sağ Panel: Sepet + Araba Bilgisi */}
          <div className="space-y-4">
            {/* Sepet */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">🛒 السلة</h3>
                {cartItems.length > 0 && (
                  <button
                    onClick={() => setCartItems([])}
                    className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                  >
                    تفريغ
                  </button>
                )}
              </div>

              {cartItems.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <span className="text-4xl">🛒</span>
                  <p className="text-xs mt-2">السلة فارغة</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2 max-h-80 overflow-y-auto mb-4 scrollbar-thin">
                    {cartItems.map((item) => (
                      <CartItem
                        key={item.drug._id}
                        item={item}
                        onUpdate={updateCartItem}
                        onRemove={removeFromCart}
                      />
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-gray-100 text-sm">
                    <span className="text-gray-600">الإجمالي</span>
                    <span className="font-semibold text-blue-600">{cartSummary.totalValue.toFixed(2)} ل.س</span>
                  </div>

                  <button
                    onClick={handleLoadAll}
                    disabled={loading}
                    className="w-full mt-4 h-11 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-500 transition-colors"
                  >
                    {loading ? 'جاري التحميل...' : 'تحميل الكل إلى السيارة'}
                  </button>
                </>
              )}
            </div>

            {/* Aktif Araba */}
            {cart && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <span className="text-blue-600">🚚</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm">{cart.name}</h4>
                    <p className="text-xs text-gray-500">{cart.driverName || 'بدون سائق'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
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
            <div className="bg-blue-50 rounded-xl p-4 text-xs text-blue-700">
              <p>💡 أضف المنتجات إلى السلة، ثم انقلها دفعة واحدة إلى السيارة.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}