'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { setAuthToken, setUser } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(false)
  const [formData, setFormData] = useState({
    username: 'admin',
    password: 'admin123'
  })
  const [serverStatus, setServerStatus] = useState({
    backend: false,
    database: false,
    initialized: false
  })

  useEffect(() => {
    checkServerStatus()
  }, [])

  const checkServerStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/health')
      if (response.ok) {
        const data = await response.json()
        setServerStatus({
          backend: true,
          database: data.database === 'connected',
          initialized: false
        })
      }
    } catch (error) {
      console.log('جاري التحقق من اتصال الخلفية...')
    }
  }

  const initializeAdmin = async () => {
    setInitializing(true)
    try {
      const response = await fetch('http://localhost:5000/api/auth/init', {
        method: 'GET'
      })
      
      if (response.ok) {
        const data = await response.json()
        toast.success(data.message || 'تم إنشاء مستخدم المسؤول')
        setServerStatus(prev => ({ ...prev, initialized: true }))
      } else {
        throw new Error('فشل في إنشاء المسؤول')
      }
    } catch (error) {
      console.error('خطأ في إنشاء المسؤول:', error)
      toast.error('فشل في إنشاء مستخدم المسؤول')
    } finally {
      setInitializing(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await api.post('/auth/login', formData)
      
      setAuthToken(response.token)
      setUser(response.user)
      
      toast.success('تم تسجيل الدخول بنجاح!')
      router.push('/')
    } catch (error) {
      console.error('خطأ في تسجيل الدخول:', error)
      
      if (error.status === 401 && formData.username === 'admin') {
        toast.error('لم يتم العثور على مستخدم المسؤول. جاري الإنشاء...')
        
        try {
          const setupResponse = await fetch('http://localhost:5000/api/auth/setup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: 'admin',
              password: 'admin123'
            })
          })
          
          if (setupResponse.ok) {
            toast.success('تم إنشاء مستخدم المسؤول. جاري إعادة تسجيل الدخول...')
            
            const retryResponse = await api.post('/auth/login', formData)
            setAuthToken(retryResponse.token)
            setUser(retryResponse.user)
            toast.success('تم تسجيل الدخول بنجاح!')
            router.push('/')
          } else {
            throw new Error('فشل في إنشاء المسؤول')
          }
        } catch (setupError) {
          console.error('خطأ في الإعداد:', setupError)
          toast.error('فشل إعداد النظام. يرجى التحقق من الخلفية.')
        }
      } else {
        toast.error(error.message || 'فشل تسجيل الدخول')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* خلفية حديثة */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative sm:mx-auto sm:w-full sm:max-w-md">
        {/* منطقة الشعار */}
        <div className="text-center mb-10">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-blue-100 rounded-full border-4 border-white"></div>
            </div>
          </div>
          <h1 className="mt-6 text-4xl font-bold text-gray-900 tracking-tight">
            مستودع الأدوية
          </h1>
          <p className="mt-2 text-gray-500 text-sm">
            إدارة أدوية بسيطة وحديثة
          </p>
        </div>

        {/* بطاقات حالة النظام */}
        <div className="mb-8 grid grid-cols-3 gap-3">
          <div className={`p-4 rounded-xl border ${serverStatus.backend ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'} transition-all duration-300`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">الخلفية</span>
              <div className={`w-2 h-2 rounded-full ${serverStatus.backend ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {serverStatus.backend ? 'يعمل' : 'لا يوجد اتصال'}
            </p>
          </div>
          
          <div className={`p-4 rounded-xl border ${serverStatus.database ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'} transition-all duration-300`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">قاعدة البيانات</span>
              <div className={`w-2 h-2 rounded-full ${serverStatus.database ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {serverStatus.database ? 'متصل' : 'لا يوجد اتصال'}
            </p>
          </div>
          
          <div className="p-4 rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">المستخدم</span>
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            </div>
            <p className="mt-1 text-xs text-gray-500">نظام ثنائي المستخدم</p>
          </div>
        </div>

        {/* بطاقة تسجيل الدخول */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">تسجيل الدخول</h2>
              <p className="mt-1 text-sm text-gray-500">
                قم بتسجيل الدخول للوصول إلى النظام
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    اسم المستخدم
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-gray-900 placeholder-gray-400"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="admin"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    كلمة المرور
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-gray-900 placeholder-gray-400"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !serverStatus.backend}
                className={`w-full py-3 px-4 rounded-xl font-medium text-white transition-all duration-300 ${
                  loading || !serverStatus.backend
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl active:scale-[0.99]'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    جاري تسجيل الدخول
                  </div>
                ) : 'تسجيل الدخول'}
              </button>
            </form>

            {/* زر إنشاء المسؤول */}
            {serverStatus.backend && !serverStatus.initialized && (
              <div className="pt-6 border-t border-gray-100">
                <button
                  onClick={initializeAdmin}
                  disabled={initializing}
                  className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                    initializing
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100 border border-gray-200 text-gray-700 hover:shadow-md active:scale-[0.99]'
                  }`}
                >
                  {initializing ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                      جاري الإنشاء
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      إنشاء مستخدم المسؤول
                    </div>
                  )}
                </button>
                <p className="mt-2 text-xs text-gray-500 text-center">
                  مطلوب للإعداد الأولي
                </p>
              </div>
            )}

            {/* بيانات التجربة */}
            <div className="pt-6 border-t border-gray-100">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">بيانات التجربة</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                    <span className="text-sm text-gray-600">اسم المستخدم</span>
                    <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-gray-900">admin</code>
                  </div>
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                    <span className="text-sm text-gray-600">كلمة المرور</span>
                    <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-gray-900">admin123</code>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">
                      <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      </div>
                    </div>
                    <p className="text-xs text-blue-800 leading-relaxed">
                      تم تصميم النظام لاستخدام شخصين فقط. يوفر إدارة بسيطة وفعالة.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* التذييل */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            نظام إدارة مستودع الأدوية الإصدار 1.0
          </p>
          <div className="mt-2 flex items-center justify-center gap-4">
            <span className="text-xs text-gray-400 px-2 py-1 bg-gray-50 rounded-lg">Next.js</span>
            <span className="text-xs text-gray-400 px-2 py-1 bg-gray-50 rounded-lg">Express</span>
            <span className="text-xs text-gray-400 px-2 py-1 bg-gray-50 rounded-lg">MongoDB</span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  )
}