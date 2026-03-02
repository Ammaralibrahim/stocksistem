'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import toast from 'react-hot-toast'

// ==================== Alt Bileşenler ====================

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
    setLocalQty('1') // ekledikten sonra sıfırla
  }

  return (
    <div className="border border-gray-200 rounded-xl p-3 bg-white hover:shadow-md transition-shadow">
      <div className="flex items-start gap-2">
        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
          <span className="text-blue-600">💊</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 text-sm truncate">{drug.name}</h4>
          <p className="text-xs text-gray-500 mt-0.5">{drug.price?.toFixed(2)} ل.س</p>
          <div className="flex items-center gap-2 mt-1 text-xs">
            <span className="text-gray-600">المخزون: {drug.stock}</span>
            <span className="text-gray-600">العربة: {drug.cartStock || 0}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3">
        <QuantityInput
          value={localQty}
          onChange={setLocalQty}
          max={drug.stock}
        />
        <button
          onClick={handleAdd}
          disabled={!localQty || parseInt(localQty) <= 0 || parseInt(localQty) > drug.stock}
          className="flex-1 h-9 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-500 transition-colors"
        >
          + إضافة إلى السلة
        </button>
      </div>
    </div>
  )
}

const CartItem = ({ item, onIncrease, onDecrease, onRemove }) => {
  const drug = item.drug
  const maxAvailable = drug.stock + item.quantity // sepetteki miktar zaten ayrılmadı, stoktan düşmedi, bu yüzden maksimum stok + sepetteki? Hayır, stok fiziksel stok. Sepetteki ürünler henüz arabaya yüklenmedi, dolayısıyla stoktan düşülmedi. Maksimum, stok miktarıdır. Yani sepette zaten 5 varsa, stok 10 ise, toplamda 15 eklenemez, sadece stok kadar eklenebilir. Bu nedenle max = drug.stock (kalan stok) + item.quantity (sepetteki) olmalı ki toplamda stok aşılmasın. Ancak kullanıcı sepette miktarı artırdığında, aslında stoktan fazla talep etmemeli. Stok = 10, sepette 5 varsa, 5 daha eklenebilir (toplam 10). Yani max = drug.stock + item.quantity. Bu biraz kafa karıştırıcı. Daha basit: Kullanıcı sepette miktarı değiştirdiğinde, girilen değerin stoku aşmamasını kontrol edeceğiz. O yüzden input'un max'ı drug.stock + item.quantity olmalı. Ancak bu matematiksel olarak doğru. Uygulamada, sepetteki ürünler stoktan düşülmediği için, stok miktarı sabit kalır. Dolayısıyla toplam talep stoku geçmemeli: item.quantity (yeni) <= drug.stock + (eski item.quantity? hayır, eskiyi saymıyoruz, çünkü eski de stoktan talep edilecek). Aslında talep edilen toplam miktar = sepetteki tüm ürünlerin miktarı + yeni eklenecek. Ama biz her ürün için ayrı ayrı kontrol ediyoruz. En kolayı: Her ürün için max = drug.stock (kalan stok) + item.quantity. Yani eğer stok 10, sepette 3 varsa, kullanıcı en fazla 13 girebilir (3+10). Bu mantıklı çünkü stok 10, sepetteki 3 de stoktan gelecek, toplam 13. Ancak bu durumda stok aşımı olmaz. Evet, bu doğru. O halde max = drug.stock + item.quantity.
  const maxQty = drug.stock + item.quantity

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
    onIncrease(drug._id, qty) // aslında doğrudan miktarı set et
  }

  return (
    <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 text-xs truncate">{drug.name}</p>
        <div className="flex items-center gap-1 mt-1">
          <button
            onClick={() => handleQtyChange(item.quantity - 1)}
            className="w-6 h-6 bg-white border border-purple-300 rounded text-sm"
          >
            -
          </button>
          <span className="w-5 text-center text-xs">{item.quantity}</span>
          <button
            onClick={() => handleQtyChange(item.quantity + 1)}
            className="w-6 h-6 bg-white border border-purple-300 rounded text-sm"
          >
            +
          </button>
        </div>
      </div>
      <div className="text-left mr-2">
        <p className="font-bold text-gray-900 text-xs">{(item.quantity * item.price).toFixed(2)}</p>
        <button onClick={() => onRemove(drug._id)} className="text-red-500 text-xs">✕</button>
      </div>
    </div>
  )
}

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

// ==================== Ana Sayfa ====================

export default function LoadToCartPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false) // yükleme işlemi için
  const [drugs, setDrugs] = useState([])
  const [cart, setCart] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [cartItems, setCartItems] = useState([]) // sepetteki ürünler { drug, quantity, price }
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

  // Sepete ürün ekle (miktar belirtilerek)
  const addToCart = (drug, quantity) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.drug._id === drug._id)
      if (existing) {
        // Miktar kontrolü: yeni miktar stok + eski miktarı aşmamalı (yukarıdaki mantık)
        const newQty = existing.quantity + quantity
        if (newQty > drug.stock + existing.quantity) {
          toast.error(`لا يمكن إضافة ${quantity} وحدات. الحد الأقصى ${drug.stock + existing.quantity}`)
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
    toast.success(`تمت إضافة ${quantity} وحدة من ${drug.name} إلى السلة`, { icon: '🛒' })
  }

  // Sepetteki ürün miktarını güncelle (doğrudan set)
  const updateCartItem = (drugId, newQuantity) => {
    setCartItems(prev =>
      prev.map(item =>
        item.drug._id === drugId
          ? { ...item, quantity: newQuantity }
          : item
      )
    )
  }

  // Sepetten ürün çıkar
  const removeFromCart = (drugId) => {
    setCartItems(prev => prev.filter(item => item.drug._id !== drugId))
    toast.success('تمت إزالة المنتج من السلة', { icon: '🗑️' })
  }

  // Sepetteki tüm ürünleri arabaya yükle
  const handleLoadAll = async () => {
    if (cartItems.length === 0) {
      toast.error('السلة فارغة')
      return
    }

    setLoading(true)
    const toastId = toast.loading('جاري التحميل إلى العربة...')

    try {
      // Her ürün için API isteği (paralel)
      const promises = cartItems.map(item =>
        api.cart.loadToCart(item.drug._id, item.quantity, cart?._id)
      )
      await Promise.all(promises)

      toast.success('تم تحميل جميع المنتجات إلى العربة بنجاح!', { id: toastId })
      setCartItems([]) // sepeti boşalt
      fetchData() // güncel stokları ve arabayı getir
    } catch (error) {
      console.error('خطأ في التحميل:', error)
      toast.error(error.message || 'فشل تحميل بعض المنتجات', { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  // Filtrelenmiş ürünler (stok > 0)
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

  // Sepet özeti
  const cartSummary = useMemo(() => {
    const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0)
    const totalValue = cartItems.reduce((acc, item) => acc + item.quantity * item.price, 0)
    return { totalItems, totalValue }
  }, [cartItems])

  if (pageLoading) return <LoadSkeleton />

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-4" dir="rtl">
      <div className="max-w-7xl mx-auto">
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
                      onAddToCart={addToCart}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sağ panel: Sepet ve araba bilgisi */}
          <div className="lg:col-span-1 space-y-4">
            {/* Sepet */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 text-sm">🛒 السلة ({cartSummary.totalItems})</h3>
                {cartItems.length > 0 && (
                  <button
                    onClick={() => setCartItems([])}
                    className="text-xs text-red-600 hover:underline"
                  >
                    تفريغ السلة
                  </button>
                )}
              </div>

              {cartItems.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <span className="text-3xl">🛒</span>
                  <p className="text-xs mt-2">السلة فارغة، أضف منتجات من اليسار</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto mb-3">
                  {cartItems.map((item) => (
                    <CartItem
                      key={item.drug._id}
                      item={item}
                      onIncrease={(id, qty) => updateCartItem(id, qty)}
                      onDecrease={(id) => {
                        const current = cartItems.find(i => i.drug._id === id)
                        if (current.quantity > 1) {
                          updateCartItem(id, current.quantity - 1)
                        } else {
                          removeFromCart(id)
                        }
                      }}
                      onRemove={removeFromCart}
                    />
                  ))}
                </div>
              )}

              {cartItems.length > 0 && (
                <>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200 text-sm">
                    <span className="text-gray-600">الإجمالي:</span>
                    <span className="font-bold text-purple-600">{cartSummary.totalValue.toFixed(2)} ل.س</span>
                  </div>
                  <button
                    onClick={handleLoadAll}
                    disabled={loading || cartItems.length === 0}
                    className="w-full mt-3 h-11 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 disabled:bg-gray-200 disabled:text-gray-500 transition-colors"
                  >
                    {loading ? 'جاري التحميل...' : '⬆️ تحميل الكل إلى العربة'}
                  </button>
                </>
              )}
            </div>

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
              <p>💡 أضف المنتجات إلى السلة أولاً، ثم انقر "تحميل الكل" لنقلها دفعة واحدة إلى العربة.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}