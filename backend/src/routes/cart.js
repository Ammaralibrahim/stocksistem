const express = require('express');
const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Drug = require('../models/Drug');
const CartTransfer = require('../models/CartTransfer');
const auth = require('../middlewares/auth');
const router = express.Router();

// Yardımcı: aktif arabayı bul, yoksa yeni oluştur
const getOrCreateActiveCart = async () => {
  let cart = await Cart.findOne({ status: 'نشطة' }).populate('items.drug', 'name price stock cartStock barcode expiryDate');
  if (!cart) {
    // hiç araba yoksa varsayılan oluştur
    cart = await Cart.findOne();
    if (cart) {
      cart.status = 'نشطة';
      await cart.save();
    } else {
      cart = new Cart({
        name: 'عربة التوزيع 1',
        driverName: 'سائق 1',
        driverPhone: '0500000000',
        plateNumber: 'أ ب ج 1234',
        status: 'نشطة'
      });
      await cart.save();
    }
    cart = await Cart.findById(cart._id).populate('items.drug', 'name price stock cartStock barcode expiryDate');
  }
  return cart;
};

// الحصول على العربة النشطة (مع إنشاء تلقائي إذا لم توجد)
router.get('/active', auth, async (req, res) => {
  try {
    const cart = await getOrCreateActiveCart();
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
    if (!drug) throw new Error('الدواء غير موجود');
    if (drug.stock < quantity) throw new Error(`كمية غير كافية في المخزون. المتاحة: ${drug.stock}`);

    let cart;
    if (cartId) cart = await Cart.findById(cartId).session(session);
    else cart = await Cart.findOne({ status: 'نشطة' }).session(session);
    if (!cart) throw new Error('لم يتم العثور على العربة النشطة');

    drug.stock -= quantity;
    drug.cartStock += quantity;
    await drug.save({ session });

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

    const updatedCart = await Cart.findById(cart._id).populate('items.drug', 'name price stock cartStock barcode expiryDate');
    res.json({
      message: `تم تحميل ${quantity} وحدة من ${drug.name} إلى العربة`,
      cart: updatedCart,
      drug
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('خطأ في التحميل:', error);
    res.status(500).json({ message: error.message });
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
    if (!drug) throw new Error('الدواء غير موجود');

    let cart;
    if (cartId) cart = await Cart.findById(cartId).session(session);
    else cart = await Cart.findOne({ status: 'نشطة' }).session(session);
    if (!cart) throw new Error('لم يتم العثور على العربة');

    const cartItem = cart.items.find(item => item.drug.toString() === drugId);
    if (!cartItem || cartItem.quantity < quantity) {
      throw new Error(`كمية غير كافية في العربة. المتاحة: ${cartItem ? cartItem.quantity : 0}`);
    }

    drug.stock += quantity;
    drug.cartStock -= quantity;
    await drug.save({ session });

    cartItem.quantity -= quantity;
    if (cartItem.quantity <= 0) {
      cart.items = cart.items.filter(item => item.drug.toString() !== drugId);
    }
    await cart.save({ session });

    await session.commitTransaction();
    session.endSession();

    const updatedCart = await Cart.findById(cart._id).populate('items.drug', 'name price stock cartStock barcode expiryDate');
    res.json({
      message: `تم إعادة ${quantity} وحدة من ${drug.name} إلى المستودع`,
      cart: updatedCart,
      drug
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('خطأ في التفريغ:', error);
    res.status(500).json({ message: error.message });
  }
});

// تفريغ العربة بالكامل
router.post('/unload-all', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { cartId, notes } = req.body;
    let cart;
    if (cartId) cart = await Cart.findById(cartId).session(session);
    else cart = await Cart.findOne({ status: 'نشطة' }).session(session);
    if (!cart) throw new Error('لم يتم العثور على العربة');
    if (cart.items.length === 0) throw new Error('العربة فارغة بالفعل');

    for (const item of cart.items) {
      const drug = await Drug.findById(item.drug).session(session);
      if (drug) {
        drug.stock += item.quantity;
        drug.cartStock -= item.quantity;
        await drug.save({ session });
      }
    }

    const transfer = new CartTransfer({
      cart: cart._id,
      items: cart.items.map(item => ({
        drug: item.drug,
        quantity: item.quantity,
        price: item.price
      })),
      notes,
      transferredAt: Date.now()
    });
    await transfer.save({ session });

    cart.items = [];
    cart.lastUnloadedAt = Date.now();
    await cart.save({ session });

    await session.commitTransaction();
    session.endSession();

    const updatedCart = await Cart.findById(cart._id).populate('items.drug', 'name price stock cartStock barcode expiryDate');
    res.json({
      message: 'تم إعادة جميع المنتجات إلى المستودع',
      cart: updatedCart,
      transfer
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('خطأ في التفريغ الكامل:', error);
    res.status(500).json({ message: error.message });
  }
});

// تحميل بالباركود
router.post('/load/barcode', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { barcode, quantity } = req.body;
    if (!barcode || !quantity || quantity <= 0) {
      return res.status(400).json({ message: 'بيانات غير صالحة' });
    }

    const drug = await Drug.findOne({ barcode }).session(session);
    if (!drug) throw new Error('لم يتم العثور على منتج مطابق للباركود');
    if (drug.stock < quantity) throw new Error(`كمية غير كافية في المخزون. المتاحة: ${drug.stock}`);

    const cart = await Cart.findOne({ status: 'نشطة' }).session(session);
    if (!cart) throw new Error('لم يتم العثور على العربة النشطة');

    drug.stock -= quantity;
    drug.cartStock += quantity;
    await drug.save({ session });

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

    const updatedCart = await Cart.findById(cart._id).populate('items.drug', 'name price stock cartStock barcode expiryDate');
    res.json({
      message: `تم تحميل ${quantity} وحدة من ${drug.name} إلى العربة`,
      cart: updatedCart,
      drug
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('خطأ في التحميل بالباركود:', error);
    res.status(500).json({ message: error.message });
  }
});

// الحصول على جميع العربات
router.get('/', auth, async (req, res) => {
  try {
    const carts = await Cart.find().populate('items.drug', 'name price stock cartStock barcode expiryDate').sort({ updatedAt: -1 });
    res.json(carts);
  } catch (error) {
    console.error('خطأ في الحصول على العربات:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// الحصول على عربة بواسطة ID
router.get('/:id', auth, async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.id).populate('items.drug', 'name price stock cartStock expiryDate barcode');
    if (!cart) return res.status(404).json({ message: 'لم يتم العثور على العربة' });
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

// تحديث عربة
router.put('/:id', auth, async (req, res) => {
  try {
    const cart = await Cart.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('items.drug', 'name price stock cartStock barcode expiryDate');
    if (!cart) return res.status(404).json({ message: 'لم يتم العثور على العربة' });
    res.json(cart);
  } catch (error) {
    console.error('خطأ في تحديث العربة:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// حذف عربة (مع التحقق من عدم وجود منتجات)
router.delete('/:id', auth, async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.id);
    if (!cart) return res.status(404).json({ message: 'لم يتم العثور على العربة' });
    if (cart.items.length > 0) {
      return res.status(400).json({ message: 'لا يمكن حذف عربة تحتوي على منتجات. قم بتفريغها أولاً.' });
    }
    await Cart.findByIdAndDelete(req.params.id);
    res.json({ message: 'تم حذف العربة بنجاح' });
  } catch (error) {
    console.error('خطأ في حذف العربة:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// الحصول على تحويلات عربة
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

module.exports = router;