const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Drug = require('../models/Drug');
const Cart = require('../models/Cart');
const auth = require('../middlewares/auth');
const router = express.Router();

// الحصول على جميع الطلبات
router.get('/', auth, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('items.drug', 'name price stock cartStock')
      .populate('cartUsed', 'name driverName')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('خطأ في الحصول على الطلبات:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// طلبات اليوم
router.get('/today', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const orders = await Order.find({
      createdAt: { $gte: today, $lt: tomorrow }
    })
      .populate('items.drug', 'name price stock cartStock')
      .populate('cartUsed', 'name driverName')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('خطأ في الحصول على طلبات اليوم:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// إنشاء طلب جديد
router.post('/', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items, cartUsed, ...orderData } = req.body;

    // معالجة العناصر: تقسيم أي عنصر يحتاج إلى مصدرين
    const processedItems = [];

    for (const item of items) {
      const drug = await Drug.findById(item.drug).session(session);
      if (!drug) {
        throw new Error(`الدواء غير موجود: ${item.drug}`);
      }

      const totalStock = drug.stock + drug.cartStock;
      if (totalStock < item.quantity) {
        throw new Error(`مخزون غير كافٍ: ${drug.name}. إجمالي المتاح: ${totalStock}, المطلوب: ${item.quantity}`);
      }

      // إذا كانت السيارة محددة والمخزون في السيارة كافٍ
      if (cartUsed && drug.cartStock >= item.quantity) {
        processedItems.push({
          drug: item.drug,
          quantity: item.quantity,
          price: item.price,
          source: 'السيارة'
        });
      } 
      // إذا كان مخزون المستودع كافٍ
      else if (drug.stock >= item.quantity) {
        processedItems.push({
          drug: item.drug,
          quantity: item.quantity,
          price: item.price,
          source: 'المستودع'
        });
      } 
      // نحتاج للتقسيم
      else {
        const fromCart = Math.min(item.quantity, drug.cartStock);
        const fromWarehouse = item.quantity - fromCart;

        if (fromCart > 0) {
          processedItems.push({
            drug: item.drug,
            quantity: fromCart,
            price: item.price,
            source: 'السيارة'
          });
        }
        if (fromWarehouse > 0) {
          processedItems.push({
            drug: item.drug,
            quantity: fromWarehouse,
            price: item.price,
            source: 'المستودع'
          });
        }
      }
    }

    // إنشاء رقم الطلب
    const date = new Date();
    const orderNumber = `ORD-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const order = new Order({
      ...orderData,
      orderNumber,
      items: processedItems,
      cartUsed,
      totalAmount: processedItems.reduce((sum, item) => sum + (item.quantity * item.price), 0)
    });

    await order.save({ session });

    // خصم المخزون
    for (const item of processedItems) {
      const drug = await Drug.findById(item.drug).session(session);
      if (!drug) continue;

      if (item.source === 'السيارة') {
        drug.cartStock -= item.quantity;

        if (cartUsed) {
          const cart = await Cart.findById(cartUsed).session(session);
          if (cart) {
            await cart.removeItem(item.drug, item.quantity);
          }
        }
      } else {
        drug.stock -= item.quantity;
      }

      await drug.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    const populatedOrder = await Order.findById(order._id)
      .populate('items.drug', 'name price stock cartStock')
      .populate('cartUsed', 'name driverName');

    res.status(201).json(populatedOrder);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('خطأ في إنشاء الطلب:', error);
    res.status(500).json({ message: error.message || 'خطأ في الخادم' });
  }
});

// تحديث الطلب
router.put('/:id', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const orderId = req.params.id;
    const { items: newItems, cartUsed, ...updateData } = req.body;

    const existingOrder = await Order.findById(orderId).session(session);
    if (!existingOrder) {
      throw new Error('الطلب غير موجود');
    }

    // استعادة المخزون القديم
    for (const oldItem of existingOrder.items) {
      if (!oldItem.drug) continue;

      const drug = await Drug.findById(oldItem.drug).session(session);
      if (!drug) continue;

      if (oldItem.source === 'السيارة') {
        drug.cartStock += oldItem.quantity;

        if (existingOrder.cartUsed) {
          const cart = await Cart.findById(existingOrder.cartUsed).session(session);
          if (cart) {
            // إعادة إلى السيارة
            const existingCartItem = cart.items.find(i => i.drug.toString() === drug._id.toString());
            if (existingCartItem) {
              existingCartItem.quantity += oldItem.quantity;
            } else {
              cart.items.push({ drug: drug._id, quantity: oldItem.quantity, price: drug.price, loadedAt: Date.now() });
            }
            await cart.save({ session });
          }
        }
      } else {
        drug.stock += oldItem.quantity;
      }

      await drug.save({ session });
    }

    // إذا لم يتم إرسال items جديدة، نستخدم القديمة (بدون تغيير)
    let itemsToProcess = newItems;
    if (!itemsToProcess) {
      itemsToProcess = existingOrder.items.map(item => ({
        drug: item.drug,
        quantity: item.quantity,
        price: item.price,
        source: item.source
      }));
    }

    // معالجة العناصر الجديدة (تقسيم إذا لزم الأمر)
    const processedItems = [];

    for (const item of itemsToProcess) {
      const drug = await Drug.findById(item.drug).session(session);
      if (!drug) {
        throw new Error(`الدواء غير موجود: ${item.drug}`);
      }

      const totalStock = drug.stock + drug.cartStock;
      if (totalStock < item.quantity) {
        throw new Error(`مخزون غير كافٍ: ${drug.name}. إجمالي المتاح: ${totalStock}, المطلوب: ${item.quantity}`);
      }

      if (cartUsed && drug.cartStock >= item.quantity) {
        processedItems.push({
          drug: item.drug,
          quantity: item.quantity,
          price: item.price,
          source: 'السيارة'
        });
      } else if (drug.stock >= item.quantity) {
        processedItems.push({
          drug: item.drug,
          quantity: item.quantity,
          price: item.price,
          source: 'المستودع'
        });
      } else {
        const fromCart = Math.min(item.quantity, drug.cartStock);
        const fromWarehouse = item.quantity - fromCart;

        if (fromCart > 0) {
          processedItems.push({
            drug: item.drug,
            quantity: fromCart,
            price: item.price,
            source: 'السيارة'
          });
        }
        if (fromWarehouse > 0) {
          processedItems.push({
            drug: item.drug,
            quantity: fromWarehouse,
            price: item.price,
            source: 'المستودع'
          });
        }
      }
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        ...updateData,
        items: processedItems,
        cartUsed: cartUsed !== undefined ? cartUsed : existingOrder.cartUsed,
        totalAmount: processedItems.reduce((sum, item) => sum + (item.quantity * item.price), 0),
        updatedAt: Date.now()
      },
      { new: true, session, runValidators: true }
    )
      .populate('items.drug', 'name price stock cartStock')
      .populate('cartUsed', 'name driverName');

    // خصم المخزون الجديد
    for (const item of processedItems) {
      const drug = await Drug.findById(item.drug).session(session);
      if (!drug) continue;

      if (item.source === 'السيارة') {
        drug.cartStock -= item.quantity;

        if (cartUsed) {
          const cart = await Cart.findById(cartUsed).session(session);
          if (cart) {
            await cart.removeItem(item.drug, item.quantity);
          }
        }
      } else {
        drug.stock -= item.quantity;
      }

      await drug.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    res.json(updatedOrder);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('خطأ في تحديث الطلب:', error);
    res.status(500).json({ message: error.message || 'خطأ في الخادم' });
  }
});

// تفاصيل الطلب
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.drug', 'name price stock cartStock expiryDate')
      .populate('cartUsed', 'name driverName plateNumber');

    if (!order) {
      return res.status(404).json({ message: 'الطلب غير موجود' });
    }

    res.json(order);
  } catch (error) {
    console.error('خطأ في الحصول على الطلب:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// بيع سريع من السيارة
router.post('/cart-sale', auth, async (req, res) => {
  let retries = 3;

  while (retries > 0) {
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        const { cartId, items, customerName, customerPhone, paymentMethod } = req.body;

        if (!cartId || !items || items.length === 0 || !customerName) {
          throw new Error('معلومات مطلوبة ناقصة');
        }

        const cart = await Cart.findById(cartId).session(session);
        if (!cart) {
          throw new Error('السيارة غير موجودة');
        }

        for (const item of items) {
          const cartItem = cart.items.find(i => i.drug.toString() === item.drug);
          if (!cartItem || cartItem.quantity < item.quantity) {
            throw new Error(`مخزون غير كافٍ في السيارة: ${item.drug}`);
          }
        }

        const date = new Date();
        const orderNumber = `CART-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

        for (const item of items) {
          const drug = await Drug.findById(item.drug).session(session);
          if (!drug) {
            throw new Error(`الدواء غير موجود: ${item.drug}`);
          }

          if (drug.cartStock < item.quantity) {
            throw new Error(`مخزون السيارة غير كافٍ: ${drug.name}. مخزون السيارة: ${drug.cartStock}, المطلوب: ${item.quantity}`);
          }

          drug.cartStock -= item.quantity;
          await drug.save({ session });
          await cart.removeItem(item.drug, item.quantity);
        }

        const order = new Order({
          orderNumber,
          items: items.map(item => ({
            drug: item.drug,
            quantity: item.quantity,
            price: item.price,
            source: 'السيارة'
          })),
          totalAmount: items.reduce((sum, item) => sum + (item.quantity * item.price), 0),
          customerName,
          customerPhone,
          paymentMethod: paymentMethod || 'نقدي',
          cartUsed: cartId,
          status: 'تم التوصيل',
          notes: 'بيع سريع من السيارة'
        });

        await order.save({ session });

        const populatedOrder = await Order.findById(order._id)
          .populate('items.drug', 'name price')
          .populate('cartUsed', 'name driverName');

        retries = 0;
        return res.status(201).json(populatedOrder);
      });

      await session.endSession();
      break;

    } catch (error) {
      await session.endSession();

      if (error.message.includes('Write conflict') && retries > 1) {
        console.log(`Write conflict hatası, tekrar deniyor (${retries - 1} deneme kaldı)...`);
        retries--;
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }

      console.error('خطأ في بيع السيارة:', error);
      return res.status(500).json({ message: error.message || 'خطأ في الخادم' });
    }
  }
});

// حذف طلب
router.delete('/:id', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const orderId = req.params.id;

    const order = await Order.findById(orderId)
      .populate('items.drug')
      .session(session);

    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'الطلب غير موجود' });
    }

    for (const item of order.items) {
      if (!item.drug) {
        console.warn(`⚠️ الدواء غير موجود للعنصر: ${item._id}`);
        continue;
      }

      const drug = await Drug.findById(item.drug._id).session(session);
      if (!drug) {
        console.warn(`⚠️ الدواء غير موجود في قاعدة البيانات: ${item.drug._id}`);
        continue;
      }

      if (item.source === 'السيارة') {
        drug.cartStock += item.quantity;

        if (order.cartUsed) {
          const cart = await Cart.findById(order.cartUsed).session(session);
          if (cart) {
            const existingCartItem = cart.items.find(i => i.drug.toString() === drug._id.toString());
            if (existingCartItem) {
              existingCartItem.quantity += item.quantity;
            } else {
              cart.items.push({ drug: drug._id, quantity: item.quantity, price: drug.price, loadedAt: Date.now() });
            }
            await cart.save({ session });
          }
        }
      } else {
        drug.stock += item.quantity;
      }

      await drug.save({ session });
    }

    await Order.findByIdAndDelete(orderId).session(session);

    await session.commitTransaction();
    session.endSession();

    res.json({ message: 'تم حذف الطلب بنجاح' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('خطأ في حذف الطلب:', error);
    res.status(500).json({ message: error.message || 'خطأ في الخادم' });
  }
});

module.exports = router;