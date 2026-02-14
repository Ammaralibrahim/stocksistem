const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  drug: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Drug',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  },
  source: {
    type: String,
    enum: ['المستودع', 'العربة'],
    default: 'المستودع'
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['قيد الانتظار', 'قيد التوصيل', 'تم التوصيل'],
    default: 'قيد الانتظار'
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerPhone: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  paymentMethod: {
    type: String,
    enum: ['نقدي', 'بطاقة ائتمان', 'تحويل بنكي', 'أخرى'],
    default: 'نقدي'
  },
  deliveryAddress: {
    type: String,
    trim: true
  },
  cartUsed: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cart'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

orderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// إنشاء رقم طلب فريد
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000);
    this.orderNumber = `ORD-${year}${month}${day}-${random}`;
  }
  next();
});

// إعداد فهارس للأداء
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ cartUsed: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', orderSchema);