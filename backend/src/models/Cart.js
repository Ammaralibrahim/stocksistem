const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  drug: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Drug',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  loadedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'اسم العربة مطلوب'],
    trim: true,
    maxlength: 100,
    default: 'عربة التوزيع 1'
  },
  driverName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  driverPhone: {
    type: String,
    trim: true,
    maxlength: 20
  },
  plateNumber: {
    type: String,
    trim: true,
    maxlength: 20
  },
  items: [cartItemSchema],
  totalItems: {
    type: Number,
    default: 0,
    min: 0
  },
  totalValue: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['نشطة', 'متوقفة', 'في الصيانة', 'مغلقة'],
    default: 'نشطة'
  },
  lastLoadedAt: {
    type: Date,
    default: Date.now
  },
  lastUnloadedAt: {
    type: Date
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
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

// Middleware لتحديث updatedAt وحساب الإجماليات
cartSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  if (this.items.length === 0) {
    this.lastLoadedAt = null;
  }
  
  this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
  this.totalValue = this.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  
  next();
});

// Middleware لتحديث lastLoadedAt عند إضافة منتجات
cartSchema.pre('save', function(next) {
  if (this.isModified('items') && this.items.length > 0) {
    this.lastLoadedAt = Date.now();
  }
  next();
});

// الطرق المخصصة للنموذج
cartSchema.methods.addItem = async function(drug, quantity) {
  const existingItem = this.items.find(item => 
    item.drug.toString() === drug._id.toString()
  );
  
  if (existingItem) {
    existingItem.quantity += quantity;
    existingItem.loadedAt = Date.now();
  } else {
    this.items.push({
      drug: drug._id,
      quantity: quantity,
      price: drug.price,
      loadedAt: Date.now()
    });
  }
  
  return this.save();
};

cartSchema.methods.removeItem = async function(drugId, quantity) {
  const itemIndex = this.items.findIndex(item => 
    item.drug.toString() === drugId.toString()
  );
  
  if (itemIndex === -1) {
    throw new Error('المنتج غير موجود في العربة');
  }
  
  const item = this.items[itemIndex];
  
  if (item.quantity < quantity) {
    throw new Error(`كمية غير كافية في العربة. المتاحة: ${item.quantity}`);
  }
  
  item.quantity -= quantity;
  
  if (item.quantity <= 0) {
    this.items.splice(itemIndex, 1);
  }
  
  return this.save();
};

cartSchema.methods.clearItems = async function() {
  this.items = [];
  this.lastUnloadedAt = Date.now();
  return this.save();
};

cartSchema.methods.getItemQuantity = function(drugId) {
  const item = this.items.find(item => 
    item.drug.toString() === drugId.toString()
  );
  return item ? item.quantity : 0;
};

// فهرسة للحصول على العربات بسرعة
cartSchema.index({ status: 1 });
cartSchema.index({ updatedAt: -1 });
cartSchema.index({ 'items.drug': 1 });

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;