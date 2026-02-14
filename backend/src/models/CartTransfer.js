const mongoose = require('mongoose');

const cartTransferItemSchema = new mongoose.Schema({
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
    required: true,
    min: 0
  }
}, { _id: false });

const cartTransferSchema = new mongoose.Schema({
  cart: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cart',
    required: true
  },
  items: [cartTransferItemSchema],
  totalItems: {
    type: Number,
    required: true,
    min: 0
  },
  totalValue: {
    type: Number,
    required: true,
    min: 0
  },
  transferredAt: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware لحساب الإجماليات قبل الحفظ
cartTransferSchema.pre('save', function(next) {
  if (this.isModified('items')) {
    this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
    this.totalValue = this.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  }
  next();
});

// فهرسة للحصول على التحويلات بسرعة
cartTransferSchema.index({ cart: 1, transferredAt: -1 });
cartTransferSchema.index({ transferredAt: -1 });

const CartTransfer = mongoose.model('CartTransfer', cartTransferSchema);

module.exports = CartTransfer;