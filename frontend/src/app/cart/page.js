'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import ConfirmModal from '@/components/ConfirmModal'

// İkonlar (opsiyonel, dilerseniz react-icons kullanabilirsiniz)
const SearchIcon = () => <span className="text-gray-400">🔍</span>
const ClearIcon = () => <span className="text-gray-400">✕</span>
const FilterIcon = () => <span>⚙️</span>

const CartSkeleton = () => (
  <div className="space-y-3 animate-pulse">
    {/* Header Skeletoni */}
    <div className="flex justify-between items-center mb-4">
      <div className="h-7 w-24 bg-gray-200 rounded-lg" />
      <div className="h-9 w-20 bg-gray-200 rounded-lg" />
    </div>
    {/* Cart Info Card Skeletoni */}
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex flex-wrap gap-4 justify-between">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="space-y-1">
            <div className="h-3 w-16 bg-gray-200 rounded" />
            <div className="h-4 w-20 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
    {/* Products Skeletoni */}
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="h-5 w-32 bg-gray-200 rounded mb-3" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="border border-gray-200 rounded-lg p-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-gray-200 rounded" />
                <div className="h-3 w-1/2 bg-gray-200 rounded" />
                <div className="flex justify-between mt-2">
                  <div className="space-y-1">
                    <div className="h-4 w-16 bg-gray-200 rounded" />
                    <div className="h-3 w-12 bg-gray-200 rounded" />
                  </div>
                  <div className="h-6 w-14 bg-gray-200 rounded-full" />
                </div>
                <div className="flex justify-end gap-2 mt-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg" />
                  <div className="w-8 h-8 bg-gray-200 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)

export default function CartPage() {
  const router = useRouter()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [unloadAllLoading, setUnloadAllLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [modal, setModal] = useState({ isOpen: false })

  // Gelişmiş filtreleme state'leri
  const [expiryFilter, setExpiryFilter] = useState('all') // 'all', 'expired', 'urgent', 'soon', 'safe'
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sortBy, setSortBy] = useState('name') // 'name', 'price', 'expiry', 'cartQuantity', 'totalValue'
  const [sortOrder, setSortOrder] = useState('asc') // 'asc', 'desc'

  useEffect(() => {
    fetchCart()
  }, [])

  const fetchCart = async () => {
    try {
      const data = await api.cart.getActive()
      setCart(data)
    } catch {
      toast.error('فشل تحميل السيارة')
    } finally {
      setLoading(false)
    }
  }

  const handleUnloadAll = () => {
    if (!cart) {
      toast.error('السيارة غير موجودة')
      return
    }
    if (!cart.items?.length) {
      toast.error('السيارة فارغة بالفعل')
      return
    }
    setModal({ isOpen: true })
  }

  const confirmUnloadAll = async () => {
    setModal({ isOpen: false })
    setUnloadAllLoading(true)
    try {
      await api.cart.unloadAll(cart._id, 'تفريغ يدوي')
      toast.success('تم التفريغ بنجاح')
      await fetchCart()
    } catch (error) {
      toast.error(error.message || 'فشل التفريغ')
    } finally {
      setUnloadAllLoading(false)
    }
  }

  // Kategorileri çıkar (benzersiz)
  const categories = useMemo(() => {
    if (!cart?.items) return []
    const cats = cart.items
      .map(item => item.drug?.category)
      .filter(Boolean)
    return [...new Set(cats)]
  }, [cart])

  // Filtrelenmiş ve sıralanmış öğeler
  const filteredAndSortedItems = useMemo(() => {
    if (!cart?.items) return []

    let items = [...cart.items]

    // Arama filtresi
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase()
      items = items.filter(item => {
        const drug = item.drug
        if (!drug) return false
        return (
          drug.name?.toLowerCase().includes(lower) ||
          drug.barcode?.toLowerCase().includes(lower) ||
          drug.category?.toLowerCase().includes(lower) ||
          drug.serialNumber?.toLowerCase().includes(lower)
        )
      })
    }

    // Kategori filtresi
    if (categoryFilter) {
      items = items.filter(item => item.drug?.category === categoryFilter)
    }

    // Son kullanma filtresi
    if (expiryFilter !== 'all') {
      const today = new Date()
      items = items.filter(item => {
        if (!item.drug?.expiryDate) return false
        const expiry = new Date(item.drug.expiryDate)
        const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))

        if (expiryFilter === 'expired') return daysLeft <= 0
        if (expiryFilter === 'urgent') return daysLeft > 0 && daysLeft <= 7
        if (expiryFilter === 'soon') return daysLeft > 7 && daysLeft <= 30
        if (expiryFilter === 'safe') return daysLeft > 30
        return true
      })
    }

    // Sıralama
    items.sort((a, b) => {
      let aVal, bVal
      const drugA = a.drug || {}
      const drugB = b.drug || {}

      switch (sortBy) {
        case 'name':
          aVal = drugA.name || ''
          bVal = drugB.name || ''
          return sortOrder === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal)
        case 'price':
          aVal = drugA.price || 0
          bVal = drugB.price || 0
          break
        case 'expiry':
          aVal = drugA.expiryDate ? new Date(drugA.expiryDate).getTime() : 0
          bVal = drugB.expiryDate ? new Date(drugB.expiryDate).getTime() : 0
          break
        case 'cartQuantity':
          aVal = a.quantity || 0
          bVal = b.quantity || 0
          break
        case 'totalValue':
          aVal = (a.quantity || 0) * (a.price || 0)
          bVal = (b.quantity || 0) * (b.price || 0)
          break
        default:
          return 0
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    })

    return items
  }, [cart, searchTerm, categoryFilter, expiryFilter, sortBy, sortOrder])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-3" dir="rtl">
        <div className="max-w-4xl mx-auto">
          <CartSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">🚚 السيارة</h1>
          <Link
            href="/cart/load"
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium min-h-[44px]"
          >
            + تحميل
          </Link>
        </div>

        {/* Cart Info Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-4">
            <div>
              <p className="text-xs text-gray-500">اسم السيارة</p>
              <p className="font-medium text-sm">{cart?.name || 'عربة 1'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">السائق</p>
              <p className="font-medium text-sm">{cart?.driverName || 'غير معين'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">عدد المنتجات</p>
              <p className="font-bold text-blue-600 text-sm">{cart?.totalItems || 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">القيمة</p>
              <p className="font-bold text-emerald-600 text-sm">
                {(cart?.totalValue || 0).toFixed(2)} ل.س
              </p>
            </div>
          </div>
        </div>

        {/* Products List */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          {/* Arama ve filtreleme alanı */}
          <div className="space-y-3 mb-4">
            {/* Arama kutusu */}
            <div className="relative w-full">
              <input
                type="text"
                className="w-full h-10 pr-9 pl-9 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="ابحث بالاسم، الباركود، الفئة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="absolute right-3 top-2.5 text-gray-400">
                <SearchIcon />
              </span>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute left-2 top-2 text-gray-400 w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded-full"
                >
                  <ClearIcon />
                </button>
              )}
            </div>

            {/* Filtre satırı */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Son kullanma filtre butonları */}
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setExpiryFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    expiryFilter === 'all' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  الكل
                </button>
                <button
                  onClick={() => setExpiryFilter('expired')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    expiryFilter === 'expired' ? 'bg-red-500 text-white' : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  منتهي
                </button>
                <button
                  onClick={() => setExpiryFilter('urgent')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    expiryFilter === 'urgent' ? 'bg-red-500 text-white' : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  عاجل
                </button>
                <button
                  onClick={() => setExpiryFilter('soon')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    expiryFilter === 'soon' ? 'bg-amber-500 text-white' : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  قريب
                </button>
                <button
                  onClick={() => setExpiryFilter('safe')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    expiryFilter === 'safe' ? 'bg-emerald-500 text-white' : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  آمن
                </button>
              </div>

              {/* Kategori filtresi */}
              {categories.length > 0 && (
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="h-9 px-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="">كل الفئات</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              )}

              {/* Sıralama seçenekleri */}
              <div className="flex items-center gap-1">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-9 px-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="name">الاسم</option>
                  <option value="price">السعر</option>
                  <option value="expiry">تاريخ الانتهاء</option>
                  <option value="cartQuantity">الكمية في السيارة</option>
                  <option value="totalValue">القيمة الإجمالية</option>
                </select>
                <button
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-sm"
                  title={sortOrder === 'asc' ? 'تصاعدي' : 'تنازلي'}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>

              {/* Filtreleri temizle */}
              {(searchTerm || categoryFilter || expiryFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setCategoryFilter('')
                    setExpiryFilter('all')
                  }}
                  className="text-xs text-red-600 underline"
                >
                  مسح الكل
                </button>
              )}
            </div>
          </div>

          {/* Gösterilen ürün sayısı */}
          {cart?.items?.length > 0 && (
            <p className="text-xs text-gray-500 mb-3">
              عرض {filteredAndSortedItems.length} من {cart.items.length} منتج
            </p>
          )}

          {!cart?.items?.length ? (
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl">📭</span>
              <p className="mt-2 text-sm">السيارة فارغة</p>
              <Link href="/cart/load" className="inline-block mt-3 text-blue-500 text-sm underline">
                تحميل منتجات
              </Link>
            </div>
          ) : filteredAndSortedItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl">🔍</span>
              <p className="mt-2 text-sm">لا توجد منتجات تطابق البحث</p>
              <button
                onClick={() => {
                  setSearchTerm('')
                  setCategoryFilter('')
                  setExpiryFilter('all')
                }}
                className="mt-3 text-blue-500 text-sm underline"
              >
                مسح الفلاتر
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredAndSortedItems.map((item, idx) => {
                const expiryDate = item.drug?.expiryDate ? new Date(item.drug.expiryDate) : null
                const today = new Date()
                const daysLeft = expiryDate ? Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24)) : null
                let expiryStatus = ''
                if (daysLeft !== null) {
                  if (daysLeft < 0) expiryStatus = 'text-red-600 bg-red-50'
                  else if (daysLeft <= 7) expiryStatus = 'text-red-600 bg-red-50'
                  else if (daysLeft <= 30) expiryStatus = 'text-amber-600 bg-amber-50'
                  else expiryStatus = 'text-emerald-600 bg-emerald-50'
                }

                const warehouseStock = item.drug?.stock || 0
                const cartStock = item.drug?.cartStock || 0
                const totalStock = warehouseStock + cartStock

                return (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow bg-white"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-lg flex-shrink-0">
                        💊
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 text-sm truncate">
                          {item.drug?.name || 'منتج'}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          المستودع: {warehouseStock}  السيارة: {cartStock}  الإجمالي: {totalStock}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div>
                            <p className="text-sm font-bold text-gray-900">
                              {(item.quantity * item.price).toFixed(2)} ل.س
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.quantity} وحدة × {item.price} ل.س
                            </p>
                          </div>
                          {expiryDate && (
                            <span className={`text-[10px] px-2 py-1 rounded-full ${expiryStatus}`}>
                              {daysLeft <= 0 ? 'منتهي' : daysLeft <= 7 ? 'عاجل' : daysLeft <= 30 ? 'قريب' : 'آمن'}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-end gap-4 mt-3">
                          <Link
                            href={`/cart/unload?drugId=${item.drug?._id}`}
                            className="w-9 h-9 rounded-lg bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center transition-colors"
                            title="إعادة إلى المستودع"
                          >
                            <span className="text-emerald-600 text-sm">📥</span>
                          </Link>
                          <Link
                            href={`/orders/new?drugId=${item.drug?._id}&source=cart`}
                            className="w-9 h-9 rounded-lg bg-purple-100 hover:bg-purple-200 flex items-center justify-center transition-colors"
                            title="بيع سريع"
                          >
                            <span className="text-purple-600 text-sm">💰</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-4">
          <Link
            href="/cart/sale"
            className={`flex-1 text-center py-3 rounded-lg text-sm font-medium min-h-[48px] flex items-center justify-center ${
              cart?.items?.length
                ? 'bg-purple-500 text-white'
                : 'bg-gray-200 text-gray-500 pointer-events-none'
            }`}
          >
            بيع سريع
          </Link>
          <button
            onClick={handleUnloadAll}
            disabled={unloadAllLoading || !cart?.items?.length}
            className={`flex-1 py-3 rounded-lg text-sm font-medium min-h-[48px] flex items-center justify-center ${
              unloadAllLoading || !cart?.items?.length
                ? 'bg-gray-200 text-gray-500'
                : 'bg-red-500 text-white'
            }`}
          >
            {unloadAllLoading ? 'جاري...' : 'تفريغ الكل'}
          </button>
        </div>

        {/* Edit Cart Link */}
        <div className="mt-4 text-center">
          <Link href={`/cart/${cart?._id}/edit`} className="text-sm text-gray-600 underline">
            تعديل معلومات السيارة
          </Link>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ isOpen: false })}
        onConfirm={confirmUnloadAll}
        title="تفريغ السيارة"
        message="هل أنت متأكد من إعادة جميع المنتجات إلى المستودع؟"
        confirmText="تفريغ"
        cancelText="إلغاء"
      />
    </div>
  )
}