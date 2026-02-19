'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { getUser } from '@/lib/auth'

export default function Header() {
  const pathname = usePathname()
  const [user, setUser] = useState(null)

  useEffect(() => {
    setUser(getUser())
  }, [])

  if (pathname === '/login') return null

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-gray-200" dir="rtl">
      <div className="px-4 py-2 md:py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 md:gap-3">
            <div className="bg-blue-100 p-1.5 md:p-2 rounded-xl">
              <span className="text-xl md:text-2xl">💊</span>
            </div>
            <div>
              <h1 className="text-base md:text-lg font-bold text-gray-900">مستودع الأدوية</h1>
              <p className="text-xs text-gray-600">نظام إدارة المخزون</p>
            </div>
          </Link>

          {user && (
            <div className="flex items-center gap-3 md:gap-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-gray-900">{user.username}</p>
                <p className="text-xs text-gray-600">مدير النظام</p>
              </div>
              {/* تمت إزالة زر logout من هنا */}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}