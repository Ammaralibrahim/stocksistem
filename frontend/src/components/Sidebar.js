'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { logout, getUser } from '@/lib/auth'
import toast from 'react-hot-toast'

const navigation = [
  { name: 'لوحة التحكم', href: '/', icon: '📊', desc: 'الإحصائيات العامة' },
  { name: 'الأدوية', href: '/drugs', icon: '💊', desc: 'جميع مخزون الأدوية' },
  { name: 'دواء جديد', href: '/drugs/new', icon: '✨', desc: 'إضافة دواء جديد' },
  { name: 'الطلبيات', href: '/orders', icon: '📋', desc: 'سجل الطلبيات' },
  { name: 'طلب جديد', href: '/orders/new', icon: '🚀', desc: 'إنشاء طلب جديد' },
  { name: 'بحث', href: '/search', icon: '🔍', desc: 'بحث مفصل' },
]

// أيقونة خروج SVG حديثة (من Heroicons)
const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 md:w-5 md:h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3-6l3 3m0 0l-3 3m3-3H9" />
  </svg>
)

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    setUser(getUser())
  }, [])

  // منع تمرير الصفحة الرئيسية عند فتح الشريط الجانبي في الموبايل
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleLogout = () => {
    logout()
    toast.success('تم تسجيل الخروج')
    router.push('/login')
  }

  if (pathname === '/login') return null

  return (
    <>
      {/* زر القائمة (البرغر) - تم رفعه للأعلى */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-2 left-4 z-50 p-2 rounded-lg bg-white shadow-lg border border-gray-200"
        aria-label="Toggle sidebar"
      >
        <div className="w-6 h-5 flex flex-col justify-between">
          <span className={`w-full h-0.5 bg-gray-700 rounded-full transition-all ${isOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
          <span className={`w-full h-0.5 bg-gray-700 rounded-full transition-all ${isOpen ? 'opacity-0' : ''}`}></span>
          <span className={`w-full h-0.5 bg-gray-700 rounded-full transition-all ${isOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
        </div>
      </button>

      {/* خلفية معتمة تغطي الشاشة عند فتح القائمة */}
      {isOpen && <div className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={() => setIsOpen(false)} />}

      <aside className={`
        fixed md:static inset-y-0 right-0 w-64 md:w-64 lg:w-72
        transform transition-transform duration-300 ease-in-out z-40
        ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        border-l border-gray-100 bg-white/95 backdrop-blur-lg
        flex flex-col min-h-screen
      `} dir="rtl">
        <div className="p-4 md:p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
              <span className="text-lg md:text-xl">💊</span>
            </div>
            <div>
              <h1 className="text-base md:text-lg font-bold text-gray-900">مستودع الأدوية</h1>
              <p className="text-xs text-gray-500">نظام التوزيع المتقدم</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 md:p-4">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`group flex items-center p-2 md:p-3 rounded-xl transition-all ${
                    isActive ? 'bg-gradient-to-r from-blue-50 to-blue-50/70 border border-blue-100 shadow-sm' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center ml-2 md:ml-3 transition-all ${
                    isActive ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600'
                  }`}>
                    <span className="text-sm md:text-base">{item.icon}</span>
                  </div>
                  <div className="flex-1 text-right">
                    <p className={`font-medium text-xs md:text-sm ${isActive ? 'text-blue-700' : 'text-gray-900'}`}>{item.name}</p>
                    <p className="text-xs text-gray-500 hidden md:block">{item.desc}</p>
                  </div>
                </Link>
              )
            })}

            {/* زر تسجيل الخروج - يظهر فقط إذا كان المستخدم مسجلاً للدخول، ويأتي بعد "بحث" مباشرة */}
            {user && (
              <button
                onClick={handleLogout}
                className="w-full group flex items-center p-2 md:p-3 rounded-xl transition-all text-gray-700 hover:bg-gray-50"
              >
                <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center ml-2 md:ml-3 bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all">
                  <LogoutIcon />
                </div>
                <div className="flex-1 text-right">
                  <p className="font-medium text-xs md:text-sm text-gray-900">تسجيل الخروج</p>
                  <p className="text-xs text-gray-500 hidden md:block">إنهاء الجلسة</p>
                </div>
              </button>
            )}
          </div>
        </nav>

        {/* رقم الإصدار يبقى في الأسفل */}
        <div className="p-3 md:p-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">الإصدار 1.0</p>
        </div>
      </aside>
    </>
  )
}