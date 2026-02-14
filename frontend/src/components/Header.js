'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { logout, getUser } from '@/lib/auth'
import toast from 'react-hot-toast'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState(null)

  useEffect(() => {
    setUser(getUser())
  }, [])

  const handleLogout = () => {
    logout()
    toast.success('تم تسجيل الخروج')
    router.push('/login')
  }

  if (pathname === '/login') return null

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-gray-200" dir="rtl">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-xl">
              <span className="text-2xl">💊</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">مستودع الأدوية</h1>
              <p className="text-xs text-gray-600">نظام إدارة المخزون</p>
            </div>
          </Link>

          {user && (
            <div className="flex items-center gap-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-gray-900">{user.username}</p>
                <p className="text-xs text-gray-600">مدير النظام</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                تسجيل الخروج
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}