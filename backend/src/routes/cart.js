const express = require('express');
const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Drug = require('../models/Drug');
const CartTransfer = require('../models/CartTransfer');
const auth = require('../middlewares/auth');
const router = express.Router();

// وظيفة مساعدة للعثور على العربة النشطة
const findActiveCart = async () => {
  try {
    let cart = await Cart.findOne({ status: 'نشطة' })
      .populate('items.drug', 'name price stock cartStock barcode expiryDate');
    
    if (!cart) {
      // محاولة العثور على أي عربية نشطة بأي حالة
      cart = await Cart.findOne().populate('items.drug', 'name price stock cartStock barcode expiryDate');
      
      if (cart) {
        cart.status = 'نشطة';
        await cart.save();
      }
    }
    
    return cart;
  } catch (error) {
    console.error('خطأ في البحث عن العربة النشطة:', error);
    return null;
  }
};

// إنشاء عربة افتراضية (إذا لم تكن موجودة)
const createDefaultCart = async () => {
  try {
    const existingCart = await Cart.findOne();
    if (!existingCart) {
      const defaultCart = new Cart({
        name: 'عربة التوزيع 1',
        driverName: 'سائق 1',
        driverPhone: '0500000000',
        plateNumber: 'أ ب ج 1234',
        status: 'نشطة'
      });
      await defaultCart.save();
      console.log('✅ تم إنشاء عربة التوزيع الافتراضية');
    }
  } catch (error) {
    console.error('خطأ في إنشاء العربة الافتراضية:', error);
  }
};

// استدعاء إنشاء العربة الافتراضية مرة واحدة عند بدء التشغيل
createDefaultCart();

// مسار لإصلاح جميع العربات دفعة واحدة
router.post('/fix-all-status', auth, async (req, res) => {
  try {
    const result = await Cart.updateMany(
      { status: { $in: ['aktif', 'active'] } },
      { $set: { status: 'نشطة' } }
    );
    
    res.json({
      message: `تم إصلاح ${result.modifiedCount} عربة`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('خطأ في إصلاح حالة العربات:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// الحصول على جميع العربات
router.get('/', auth, async (req, res) => {
  try {
    const carts = await Cart.find()
      .populate('items.drug', 'name price stock cartStock barcode expiryDate')
      .sort({ updatedAt: -1 });
    
    res.json(carts);
  } catch (error) {
    console.error('خطأ في الحصول على العربات:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// الحصول على العربة النشطة
router.get('/active', auth, async (req, res) => {
  try {
    const cart = await findActiveCart();
    
    if (!cart) {
      return res.status(404).json({ message: 'لم يتم العثور على العربة' });
    }
    
    res.json(cart);
  } catch (error) {
    console.error('خطأ في الحصول على العربة النشطة:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// تحميل المنتج من المستودع إلى العربة
router.post('/load', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { drugId, quantity, cartId } = req.body;
    
    if (!drugId || !quantity || quantity <= 0) {
      return res.status(400).json({ message: 'بيانات غير صالحة' });
    }
    
    const drug = await Drug.findById(drugId).session(session);
    if (!drug) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'الدواء غير موجود' });
    }
    
    // التحقق من وجود الكمية في المخزون
    if (drug.stock < quantity) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        message: `كمية غير كافية في المخزون. المتاحة: ${drug.stock}` 
      });
    }
    
    // العثور على العربة
    let cart;
    if (cartId) {
      cart = await Cart.findById(cartId).session(session);
    } else {
      cart = await Cart.findOne({ status: 'نشطة' }).session(session);
    }
    
    if (!cart) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'لم يتم العثور على العربة النشطة' });
    }
    
    // تحديث المخزون
    drug.stock -= quantity;
    drug.cartStock += quantity;
    await drug.save({ session });
    
    // إضافة المنتج إلى العربة
    const existingItem = cart.items.find(item => item.drug.toString() === drugId);
    
    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.loadedAt = Date.now();
    } else {
      cart.items.push({
        drug: drug._id,
        quantity,
        price: drug.price,
        loadedAt: Date.now()
      });
    }
    
    await cart.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    // تحديث العربة مع البيانات الكاملة
    const updatedCart = await Cart.findById(cart._id)
      .populate('items.drug', 'name price stock cartStock barcode expiryDate');
    
    res.json({
      message: `تم تحميل ${quantity} وحدة من ${drug.name} إلى العربة`,
      cart: updatedCart,
      drug: drug
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('خطأ في التحميل إلى العربة:', error);
    res.status(500).json({ 
      message: error.message || 'خطأ في الخادم' 
    });
  }
});

// إعادة المنتج من العربة إلى المستودع
router.post('/unload', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { drugId, quantity, cartId } = req.body;
    
    if (!drugId || !quantity || quantity <= 0) {
      return res.status(400).json({ message: 'بيانات غير صالحة' });
    }
    
    const drug = await Drug.findById(drugId).session(session);
    if (!drug) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'الدواء غير موجود' });
    }
    
    // العثور على العربة
    let cart;
    if (cartId) {
      cart = await Cart.findById(cartId).session(session);
    } else {
      cart = await Cart.findOne({ status: 'نشطة' }).session(session);
    }
    
    if (!cart) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'لم يتم العثور على العربة النشطة' });
    }
    
    // التحقق من مخزون العربة
    const cartItem = cart.items.find(item => item.drug.toString() === drugId);
    if (!cartItem || cartItem.quantity < quantity) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        message: `كمية غير كافية في العربة. المتاحة: ${cartItem ? cartItem.quantity : 0}` 
      });
    }
    
    // تحديث المخزون
    drug.stock += quantity;
    drug.cartStock -= quantity;
    await drug.save({ session });
    
    // تحديث العربة
    cartItem.quantity -= quantity;
    
    // إزالة المنتج إذا كانت الكمية صفر
    if (cartItem.quantity <= 0) {
      cart.items = cart.items.filter(item => item.drug.toString() !== drugId);
    }
    
    await cart.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    const updatedCart = await Cart.findById(cart._id)
      .populate('items.drug', 'name price stock cartStock barcode expiryDate');
    
    res.json({
      message: `تم إعادة ${quantity} وحدة من ${drug.name} إلى المستودع`,
      cart: updatedCart,
      drug: drug
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('خطأ في التفريغ من العربة:', error);
    res.status(500).json({ 
      message: error.message || 'خطأ في الخادم' 
    });
  }
});

// تفريغ العربة بالكامل إلى المستودع
router.post('/unload-all', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { cartId, notes } = req.body;
    
    // العثور على العربة
    let cart;
    if (cartId) {
      cart = await Cart.findById(cartId).session(session);
    } else {
      cart = await Cart.findOne({ status: 'نشطة' }).session(session);
    }
    
    if (!cart) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'لم يتم العثور على العربة النشطة' });
    }
    
    if (cart.items.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'العربة فارغة بالفعل' });
    }
    
    // تحديث مخزون كل منتج
    for (const item of cart.items) {
      const drug = await Drug.findById(item.drug).session(session);
      if (drug) {
        drug.stock += item.quantity;
        drug.cartStock -= item.quantity;
        await drug.save({ session });
      }
    }
    
    // إنشاء سجل التحويل
    const transfer = new CartTransfer({
      cart: cart._id,
      items: cart.items.map(item => ({
        drug: item.drug,
        quantity: item.quantity,
        price: item.price
      })),
      totalItems: cart.totalItems,
      totalValue: cart.totalValue,
      notes: notes,
      transferredAt: Date.now()
    });
    
    await transfer.save({ session });
    
    // تفريغ العربة
    cart.items = [];
    cart.lastUnloadedAt = Date.now();
    await cart.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    const updatedCart = await Cart.findById(cart._id)
      .populate('items.drug', 'name price stock cartStock barcode expiryDate');
    
    res.json({
      message: 'تم إعادة جميع المنتجات إلى المستودع',
      cart: updatedCart,
      transfer: transfer
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('خطأ في التفريغ الكامل:', error);
    res.status(500).json({ 
      message: error.message || 'خطأ في الخادم' 
    });
  }
});

// تفاصيل العربة
router.get('/:id', auth, async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.id)
      .populate('items.drug', 'name price stock cartStock expiryDate barcode');
    
    if (!cart) {
      return res.status(404).json({ message: 'لم يتم العثور على العربة' });
    }
    
    res.json(cart);
  } catch (error) {
    console.error('خطأ في الحصول على العربة:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// إنشاء عربة جديدة
router.post('/', auth, async (req, res) => {
  try {
    const cart = new Cart(req.body);
    await cart.save();
    
    res.status(201).json(cart);
  } catch (error) {
    console.error('خطأ في إنشاء العربة:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// تحديث العربة
router.put('/:id', auth, async (req, res) => {
  try {
    const cart = await Cart.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('items.drug', 'name price stock cartStock barcode expiryDate');
    
    if (!cart) {
      return res.status(404).json({ message: 'لم يتم العثور على العربة' });
    }
    
    res.json(cart);
  } catch (error) {
    console.error('خطأ في تحديث العربة:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// حذف العربة
router.delete('/:id', auth, async (req, res) => {
  try {
    const cart = await Cart.findByIdAndDelete(req.params.id);
    
    if (!cart) {
      return res.status(404).json({ message: 'لم يتم العثور على العربة' });
    }
    
    res.json({ message: 'تم حذف العربة بنجاح' });
  } catch (error) {
    console.error('خطأ في حذف العربة:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// سجل تحويلات العربة
router.get('/:id/transfers', auth, async (req, res) => {
  try {
    const transfers = await CartTransfer.find({ cart: req.params.id })
      .populate('items.drug', 'name price barcode')
      .sort({ transferredAt: -1 });
    
    res.json(transfers);
  } catch (error) {
    console.error('خطأ في الحصول على التحويلات:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// تحميل المنتج بالباركود
router.post('/load/barcode', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { barcode, quantity } = req.body;
    
    if (!barcode || !quantity || quantity <= 0) {
      return res.status(400).json({ message: 'بيانات غير صالحة' });
    }
    
    // البحث عن المنتج بالباركود
    const drug = await Drug.findOne({ barcode }).session(session);
    if (!drug) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'لم يتم العثور على منتج مطابق للباركود' });
    }
    
    // التحقق من المخزون
    if (drug.stock < quantity) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        message: `كمية غير كافية في المخزون. المتاحة: ${drug.stock}` 
      });
    }
    
    // العثور على العربة النشطة
    const cart = await Cart.findOne({ status: 'نشطة' }).session(session);
    if (!cart) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'لم يتم العثور على العربة النشطة' });
    }
    
    // تحديث المخزون
    drug.stock -= quantity;
    drug.cartStock += quantity;
    await drug.save({ session });
    
    // إضافة المنتج إلى العربة
    const existingItem = cart.items.find(item => item.drug.toString() === drug._id.toString());
    
    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.loadedAt = Date.now();
    } else {
      cart.items.push({
        drug: drug._id,
        quantity,
        price: drug.price,
        loadedAt: Date.now()
      });
    }
    
    await cart.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    const updatedCart = await Cart.findById(cart._id)
      .populate('items.drug', 'name price stock cartStock barcode expiryDate');
    
    res.json({
      message: `تم تحميل ${quantity} وحدة من ${drug.name} إلى العربة`,
      cart: updatedCart,
      drug: drug
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('خطأ في التحميل بالباركود:', error);
    res.status(500).json({ 
      message: error.message || 'خطأ في الخادم' 
    });
  }
});

module.exports = router;