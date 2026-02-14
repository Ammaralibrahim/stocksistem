'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import LoadingSpinner from '@/components/LoadingSpinner'
import { checkAuth } from '@/lib/auth'

export default function RootLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const verifyAuth = async () => {
      if (pathname === '/login') {
        setLoading(false)
        return
      }

      const auth = await checkAuth()
      if (!auth) {
        router.push('/login')
      } else {
        setIsAuthenticated(true)
      }
      setLoading(false)
    }

    verifyAuth()
  }, [pathname, router])

  if (loading) {
    return (
      <html lang="tr">
        <body className="min-h-screen flex items-center justify-center bg-gray-50">
          <LoadingSpinner />
        </body>
      </html>
    )
  }

  if (pathname === '/login') {
    return (
      <html lang="tr">
        <body className="min-h-screen">
          <Toaster position="top-right" />
          {children}
        </body>
      </html>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <html lang="tr">
      <body className="min-h-screen bg-gray-50">
        <Toaster position="top-right" />
        <div className="flex flex-col min-h-screen">
          <Header />
          <div className="flex flex-1">
            <Sidebar />
            <main className="flex-1 p-4 md:p-6">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}