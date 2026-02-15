'use client'

export default function StatsCard({ title, value, icon, color = 'blue', change, description, trend = 'up' }) {
  const colors = {
    blue: { bg: 'from-blue-500 to-blue-600', light: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
    green: { bg: 'from-emerald-500 to-emerald-600', light: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
    purple: { bg: 'from-purple-500 to-purple-600', light: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100' },
    amber: { bg: 'from-amber-500 to-amber-600', light: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' }
  }

  const cfg = colors[color] || colors.blue

  return (
    <div className={`group relative bg-white rounded-xl md:rounded-2xl border ${cfg.border} p-4 md:p-5 transition-all hover:shadow-lg active:scale-[0.98]`} dir="rtl">
      <div className="flex items-start justify-between mb-3 md:mb-4">
        <div className="text-right">
          <p className="text-xs md:text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-lg md:text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${cfg.bg} flex items-center justify-center shadow-sm`}>
          <span className="text-base md:text-xl text-white">{icon}</span>
        </div>
      </div>

      {description && <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4">{description}</p>}

      {change !== undefined && (
        <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-gray-100">
          <button className="text-xs font-medium text-gray-500 hover:text-gray-700 px-2 py-1.5 md:px-3 md:py-1.5 rounded-lg hover:bg-gray-50">
            التفاصيل ←
          </button>
          <div className="flex items-center">
            <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg ${cfg.light} flex items-center justify-center ml-1 md:ml-2`}>
              <span className={`text-xs md:text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {trend === 'up' ? '↗' : '↘'}
              </span>
            </div>
            <div className="text-right">
              <p className={`text-xs md:text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {trend === 'up' ? '+' : ''}{change}%
              </p>
              <p className="text-xs text-gray-500 hidden md:block">مقارنة بالشهر السابق</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}