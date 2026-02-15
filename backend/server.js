require('dotenv').config()
const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const connectDB = require('./src/config/db')

const authRoutes = require('./src/routes/auth')
const drugsRoutes = require('./src/routes/drugs')
const ordersRoutes = require('./src/routes/orders')
const dashboardRoutes = require('./src/routes/dashboard')
const cartRoutes = require('./src/routes/cart')

const app = express()

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://ilajuk.vercel.app',
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))

// الاتصال بقاعدة البيانات
connectDB()

// المسارات
app.use('/api/auth', authRoutes)
app.use('/api/drugs', drugsRoutes)
app.use('/api/orders', ordersRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/cart', cartRoutes)

// التحقق من صحة الخادم
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'يعمل بشكل صحيح',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    features: ['المصادقة', 'الأدوية', 'الطلبات', 'لوحة التحكم', 'العربة']
  })
})

// معالج 404
app.use('/api/*', (req, res) => {
  res.status(404).json({
    message: 'نقطة النهاية API غير موجودة'
  })
})

// معالج الأخطاء
app.use((err, req, res, next) => {
  console.error('خطأ في الخادم:', err)
  res.status(err.status || 500).json({
    message: err.message || 'خطأ داخلي في الخادم',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`✅ الخادم يعمل على المنفذ ${PORT}`)
  console.log(`🌐 رابط الواجهة الأمامية: http://localhost:3000`)
  console.log(`🔗 رابط API: http://localhost:${PORT}/api`)
  console.log(`👤 تسجيل الدخول الافتراضي: admin / admin123`)
  console.log(`🚚 نظام عربة التوزيع: نشط`)
})