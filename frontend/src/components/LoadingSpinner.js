'use client'

export default function LoadingSpinner({ message = 'جاري التحميل', size = 'medium' }) {
  const sizeMap = {
    small: { container: 'w-6 h-6', text: 'text-sm' },
    medium: { container: 'w-12 h-12', text: 'text-base' },
    large: { container: 'w-16 h-16', text: 'text-lg' }
  }

  return (
    <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4" dir="rtl">
      <div className="relative mb-6">
        <div className={`${sizeMap[size].container} border-2 border-gray-100 rounded-full`}></div>
        <div className={`absolute inset-0 ${sizeMap[size].container} border-2 border-transparent border-t-blue-500 border-r-blue-400 rounded-full animate-spin`}></div>
      </div>
      <p className={`font-medium text-gray-900 ${sizeMap[size].text} mb-2`}>{message}</p>
      <p className="text-sm text-gray-600 animate-pulse">الرجاء الانتظار</p>
    </div>
  )
}