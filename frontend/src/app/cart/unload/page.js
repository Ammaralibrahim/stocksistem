'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import ConfirmModal from '@/components/ConfirmModal'

export default function UnloadPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const drugId = searchParams.get('drugId')

  const [loading, setLoading] = useState(false)
  const [drug, setDrug] = useState(null)
  const [cart, setCart] = useState(null)
  const [quantity, setQuantity] = useState('1')
  const [modal, setModal] = useState({ isOpen: false })

  useEffect(() => {
    if (!drugId) {
      toast.error('معرف المنتج غير موجود')
      router.push('/cart')
      return
    }
    fetchData()
  }, [drugId])

  const fetchData = async () => {
    try {
      const [drugData, cartData] = await Promise.all([
        api.drugs.getById(drugId),
        api.cart.getActive()
      ])
      setDrug(drugData)
      setCart(cartData)

      const cartItem = cartData.items?.find(item => item.drug?._id === drugId)
      if (cartItem) {
        setQuantity(cartItem.quantity.toString())
      } else {
        toast.error('هذا المنتج غير موجود في السيارة')
        router.push('/cart')
      }
    } catch (error) {
      toast.error('فشل تحميل البيانات')
      router.push('/cart')
    }
  }

  const handleUnload = async () => {
    const qty = parseInt(quantity)
    if (!qty || qty <= 0) {
      toast.error('الرجاء إدخال كمية صالحة')
      return
    }

    const cartItem = cart?.items?.find(item => item.drug?._id === drugId)
    if (!cartItem || qty > cartItem.quantity) {
      toast.error(`الكمية المطلوبة أكبر من المتوفر في السيارة (${cartItem?.quantity || 0})`)
      return
    }

    setLoading(true)
    try {
      await api.cart.unload(drugId, qty, cart._id)
      toast.success(`تم إعادة ${qty} وحدة من ${drug?.name} إلى المستودع`)
      router.push('/cart')
    } catch (error) {
      toast.error(error.message || 'فشل الإعادة')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = () => {
    // Önce miktar kontrolünü yap, geçersizse modal açılmasın
    const qty = parseInt(quantity)
    const cartItem = cart?.items?.find(item => item.drug?._id === drugId)
    if (!qty || qty <= 0) {
      toast.error('الرجاء إدخال كمية صالحة')
      return
    }
    if (!cartItem || qty > cartItem.quantity) {
      toast.error(`الكمية المطلوبة أكبر من المتوفر في السيارة (${cartItem?.quantity || 0})`)
      return
    }
    // Miktar geçerliyse modalı aç
    setModal({ isOpen: true })
  }

  if (!drug || !cart) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div>جاري التحميل...</div>
      </div>
    )
  }

  const cartItem = cart.items.find(item => item.drug?._id === drugId)
  const maxQuantity = cartItem?.quantity || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4" dir="rtl">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          {/* Başlık */}
          <div className="flex items-center mb-6">
            <Link href="/cart" className="text-gray-600 hover:text-gray-900 ml-4">
              ←
            </Link>
            <h1 className="text-xl font-bold text-gray-900">إعادة المنتج إلى المستودع</h1>
          </div>

          {/* Ürün bilgisi */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center ml-3">
                <span className="text-amber-600 text-xl">📦</span>
              </div>
              <div>
                <h2 className="font-medium text-gray-900">{drug.name}</h2>
                <p className="text-sm text-gray-600">
                  في السيارة: <span className="font-bold">{maxQuantity}</span> وحدة
                </p>
              </div>
            </div>
          </div>

          {/* Miktar girişi */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
              الكمية المراد إعادتها
            </label>
            <input
              type="number"
              min="1"
              max={maxQuantity}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-right"
              placeholder={`الحد الأقصى: ${maxQuantity}`}
            />
            <p className="text-xs text-gray-500 mt-2 text-right">
              المتوفر في السيارة: {maxQuantity} وحدة
            </p>
          </div>

          {/* Butonlar */}
          <div className="flex gap-3">
            <Link
              href="/cart"
              className="flex-1 py-3 text-center bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              إلغاء
            </Link>
            <button
              onClick={handleConfirm}
              disabled={loading || !quantity || parseInt(quantity) <= 0 || parseInt(quantity) > maxQuantity}
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                loading || !quantity || parseInt(quantity) <= 0 || parseInt(quantity) > maxQuantity
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-amber-500 text-white hover:bg-amber-600'
              }`}
            >
              {loading ? 'جاري...' : 'تأكيد الإعادة'}
            </button>
          </div>
        </div>
      </div>

      {/* Onay Modalı */}
      <ConfirmModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ isOpen: false })}
        onConfirm={() => {
          setModal({ isOpen: false })
          handleUnload()
        }}
        title="تأكيد الإعادة"
        message={`هل أنت متأكد من إعادة ${quantity} وحدة من "${drug?.name}" إلى المستودع؟`}
        confirmText="تأكيد"
        cancelText="إلغاء"
      />
    </div>
  )
}