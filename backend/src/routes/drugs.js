const express = require('express');
const Drug = require('../models/Drug');
const auth = require('../middlewares/auth');
const router = express.Router();

// الحصول على جميع الأدوية مع إمكانية البحث والتصفية
router.get('/', auth, async (req, res) => {
  try {
    const { search, category, minStock, maxStock, sort = 'name', order = 'asc' } = req.query;
    
    let query = {};
    
    // البحث
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    // التصفية حسب الفئة
    if (category) {
      query.category = category;
    }
    
    // التصفية حسب المخزون
    if (minStock !== undefined || maxStock !== undefined) {
      query.stock = {};
      if (minStock !== undefined) query.stock.$gte = parseInt(minStock);
      if (maxStock !== undefined) query.stock.$lte = parseInt(maxStock);
    }
    
    // الترتيب
    const sortOrder = order === 'desc' ? -1 : 1;
    
    const drugs = await Drug.find(query)
      .sort({ [sort]: sortOrder });
    
    res.json(drugs);
  } catch (error) {
    console.error('خطأ في جلب الأدوية:', error);
    res.status(500).json({ message: 'خطأ في السيرفر' });
  }
});

// البحث عن دواء
router.get('/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'كلمة البحث مطلوبة' });
    }
    
    const drugs = await Drug.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { barcode: q },
        { serialNumber: { $regex: q, $options: 'i' } }
      ]
    }).limit(20);
    
    res.json(drugs);
  } catch (error) {
    console.error('خطأ في البحث:', error);
    res.status(500).json({ message: 'خطأ في السيرفر' });
  }
});

// إضافة دواء جديد
router.post('/', auth, async (req, res) => {
  try {
    // التحقق من البيانات
    const requiredFields = ['name', 'stock', 'price', 'expiryDate'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ message: `${field} مطلوب` });
      }
    }
    
    // التحقق من الباركود الفريد
    if (req.body.barcode) {
      const existingDrug = await Drug.findOne({ barcode: req.body.barcode });
      if (existingDrug) {
        return res.status(400).json({ message: 'الباركود موجود بالفعل' });
      }
    }
    
    // التحقق من الرقم التسلسلي الفريد
    if (req.body.serialNumber) {
      const existingDrug = await Drug.findOne({ serialNumber: req.body.serialNumber });
      if (existingDrug) {
        return res.status(400).json({ message: 'الرقم التسلسلي موجود بالفعل' });
      }
    }
    
    const drug = new Drug(req.body);
    await drug.save();
    
    res.status(201).json(drug);
  } catch (error) {
    console.error('خطأ في إضافة الدواء:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'قيمة فريدة مكررة (باركود أو رقم تسلسلي)' 
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    res.status(500).json({ message: 'خطأ في السيرفر' });
  }
});

// تحديث دواء
router.put('/:id', auth, async (req, res) => {
  try {
    const drug = await Drug.findById(req.params.id);
    
    if (!drug) {
      return res.status(404).json({ message: 'الدواء غير موجود' });
    }
    
    // التحقق من الباركود الفريد إذا تم التغيير
    if (req.body.barcode && req.body.barcode !== drug.barcode) {
      const existingDrug = await Drug.findOne({ 
        barcode: req.body.barcode,
        _id: { $ne: req.params.id }
      });
      if (existingDrug) {
        return res.status(400).json({ message: 'الباركود موجود بالفعل' });
      }
    }
    
    // التحقق من الرقم التسلسلي الفريد إذا تم التغيير
    if (req.body.serialNumber && req.body.serialNumber !== drug.serialNumber) {
      const existingDrug = await Drug.findOne({ 
        serialNumber: req.body.serialNumber,
        _id: { $ne: req.params.id }
      });
      if (existingDrug) {
        return res.status(400).json({ message: 'الرقم التسلسلي موجود بالفعل' });
      }
    }
    
    Object.assign(drug, req.body);
    await drug.save();
    
    res.json(drug);
  } catch (error) {
    console.error('خطأ في تحديث الدواء:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'قيمة فريدة مكررة (باركود أو رقم تسلسلي)' 
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    res.status(500).json({ message: 'خطأ في السيرفر' });
  }
});

// حذف دواء
router.delete('/:id', auth, async (req, res) => {
  try {
    const drug = await Drug.findByIdAndDelete(req.params.id);
    
    if (!drug) {
      return res.status(404).json({ message: 'الدواء غير موجود' });
    }
    
    res.json({ message: 'تم حذف الدواء بنجاح' });
  } catch (error) {
    console.error('خطأ في حذف الدواء:', error);
    res.status(500).json({ message: 'خطأ في السيرفر' });
  }
});

// الحصول على أدوية المخزون المنخفض
router.get('/low-stock', auth, async (req, res) => {
  try {
    const drugs = await Drug.find({ 
      stock: { $lte: 10 } 
    }).sort({ stock: 1 });
    
    res.json(drugs);
  } catch (error) {
    console.error('خطأ في جلب أدوية المخزون المنخفض:', error);
    res.status(500).json({ message: 'خطأ في السيرفر' });
  }
});

// الحصول على أدوية قريبة الانتهاء
router.get('/expiring-soon', auth, async (req, res) => {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const drugs = await Drug.find({
      expiryDate: { 
        $gte: new Date(),
        $lte: thirtyDaysFromNow 
      }
    }).sort({ expiryDate: 1 });
    
    res.json(drugs);
  } catch (error) {
    console.error('خطأ في جلب أدوية قريبة الانتهاء:', error);
    res.status(500).json({ message: 'خطأ في السيرفر' });
  }
});

// الحصول على دواء بواسطة ID
router.get('/:id', auth, async (req, res) => {
  try {
    const drug = await Drug.findById(req.params.id);
    
    if (!drug) {
      return res.status(404).json({ message: 'الدواء غير موجود' });
    }
    
    res.json(drug);
  } catch (error) {
    console.error('خطأ في جلب الدواء:', error);
    res.status(500).json({ message: 'خطأ في السيرفر' });
  }
});

module.exports = router;