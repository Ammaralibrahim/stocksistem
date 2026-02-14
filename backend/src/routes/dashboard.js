const express = require('express');
const Order = require('../models/Order');
const Drug = require('../models/Drug');
const Cart = require('../models/Cart');
const auth = require('../middlewares/auth');
const router = express.Router();

// Dashboard istatistikleri (güncellendi)
router.get('/stats', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Bugünkü sipariş sayısı
    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    });
    
    // Bugünkü toplam satış tutarı
    const todaySalesAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);
    
    const todaySales = todaySalesAgg.length > 0 ? todaySalesAgg[0].total : 0;
    
    // Toplam ilaç sayısı
    const totalDrugs = await Drug.countDocuments();
    
    // Toplam stok miktarları
    const stockAgg = await Drug.aggregate([
      {
        $group: {
          _id: null,
          totalStock: { $sum: '$stock' },
          totalCartStock: { $sum: '$cartStock' },
          totalValue: { 
            $sum: { 
              $multiply: [
                { $add: ['$stock', '$cartStock'] },
                '$price'
              ]
            }
          }
        }
      }
    ]);
    
    const stockData = stockAgg.length > 0 ? stockAgg[0] : {
      totalStock: 0,
      totalCartStock: 0,
      totalValue: 0
    };
    
    // Araba bilgileri
    const activeCart = await Cart.findOne({ status: 'aktif' })
      .populate('items.drug', 'name');
    
    // Arabadan satılan ürünler
    const cartSalesAgg = await Order.aggregate([
      {
        $match: {
          cartUsed: { $exists: true },
          createdAt: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          total: { $sum: '$totalAmount' }
        }
      }
    ]);
    
    const cartSales = cartSalesAgg.length > 0 ? cartSalesAgg[0] : { count: 0, total: 0 };
    
    // Stoğu az olan ilaçlar (toplam stok düşük)
    const lowStockDrugs = await Drug.find({ 
      $expr: { $lte: [{ $add: ['$stock', '$cartStock'] }, '$lowStockThreshold'] }
    }).limit(5);
    
    // Son kullanma tarihi yaklaşan ilaçlar
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const expiringDrugs = await Drug.find({
      expiryDate: { $lte: thirtyDaysFromNow, $gte: new Date() }
    }).sort({ expiryDate: 1 }).limit(5);
    
    res.json({
      todayOrders,
      todaySales,
      totalDrugs,
      stockData,
      activeCart,
      cartSales,
      lowStockDrugs,
      expiringDrugs
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ 
      message: 'Dashboard verileri alınırken hata oluştu',
      error: error.message 
    });
  }
});

// Araba dashboard'u
router.get('/cart-stats', auth, async (req, res) => {
  try {
    const carts = await Cart.find({ status: 'aktif' })
      .populate('items.drug', 'name price expiryDate');
    
    // Arabadaki kritik ürünler (yakın tarihli)
    const criticalItems = [];
    carts.forEach(cart => {
      cart.items.forEach(item => {
        if (item.drug && item.drug.expiryDate) {
          const expiry = new Date(item.drug.expiryDate);
          const today = new Date();
          const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
          
          if (diffDays <= 30 && diffDays > 0) {
            criticalItems.push({
              drug: item.drug,
              quantity: item.quantity,
              daysLeft: diffDays,
              cart: cart.name
            });
          }
        }
      });
    });
    
    // Arabadan son 7 günlük satışlar
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const cartSales = await Order.aggregate([
      {
        $match: {
          cartUsed: { $exists: true },
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          total: { $sum: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      carts,
      criticalItems: criticalItems.sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 10),
      cartSales
    });
  } catch (error) {
    console.error('Cart dashboard error:', error);
    res.status(500).json({ 
      message: 'Araba dashboard verileri alınırken hata oluştu',
      error: error.message 
    });
  }
});

module.exports = router;