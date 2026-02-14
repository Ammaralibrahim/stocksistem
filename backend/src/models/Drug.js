const mongoose = require('mongoose');

const drugSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'اسم الدواء مطلوب'],
    trim: true
  },
  stock: {
    type: Number,
    required: [true, 'الكمية مطلوبة'],
    min: 0,
    default: 0
  },
  cartStock: {
    type: Number,
    default: 0,
    min: 0
  },
  price: {
    type: Number,
    required: [true, 'السعر مطلوب'],
    min: 0
  },
  expiryDate: {
    type: Date,
    required: [true, 'تاريخ الانتهاء مطلوب']
  },
  barcode: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  serialNumber: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    trim: true
  },
  manufacturer: {
    type: String,
    trim: true
  },
  purchasePrice: {
    type: Number,
    min: 0
  },
  supplier: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  lowStockThreshold: {
    type: Number,
    default: 10,
    min: 1
  },
  minStockLevel: {
    type: Number,
    default: 5,
    min: 0
  },
  imageUrl: {
    type: String,
    default: ''
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

// Virtual للحالة الإجمالية
drugSchema.virtual('totalStock').get(function() {
  return (this.stock || 0) + (this.cartStock || 0);
});

// Virtual لحالة المخزون
drugSchema.virtual('stockStatus').get(function() {
  const total = (this.stock || 0) + (this.cartStock || 0);
  if (total === 0) return 'منتهي';
  if (total <= this.lowStockThreshold) return 'منخفض';
  return 'متوفر';
});

// Middleware لتحديث updatedAt
drugSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// إعداد فهارس للأداء
drugSchema.index({ name: 1 });
drugSchema.index({ barcode: 1 });
drugSchema.index({ serialNumber: 1 });
drugSchema.index({ expiryDate: 1 });
drugSchema.index({ stock: 1 });
drugSchema.index({ cartStock: 1 });
drugSchema.index({ stockStatus: 1 });

// Method للتحديث الآمن للمخزون
drugSchema.methods.updateStock = async function(warehouseChange = 0, cartChange = 0, session = null) {
  if (warehouseChange < 0 && Math.abs(warehouseChange) > this.stock) {
    throw new Error(`مخزون المستودع غير كافٍ: ${this.name}. المتاح: ${this.stock}, المطلوب: ${Math.abs(warehouseChange)}`);
  }
  
  if (cartChange < 0 && Math.abs(cartChange) > this.cartStock) {
    throw new Error(`مخزون العربة غير كافٍ: ${this.name}. مخزون العربة: ${this.cartStock}, المطلوب: ${Math.abs(cartChange)}`);
  }
  
  this.stock += warehouseChange;
  this.cartStock += cartChange;
  
  const options = session ? { session } : {};
  return this.save(options);
};

module.exports = mongoose.model('Drug', drugSchema);