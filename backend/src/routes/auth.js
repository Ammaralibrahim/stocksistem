const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Giriş yap
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Kullanıcıyı bul
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    // Şifreyi kontrol et
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Geçersiz şifre' });
    }
    
    // JWT token oluştur
    const token = jwt.sign(
      { userId: user._id, username: user.username, isAdmin: user.isAdmin },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Admin kullanıcısını otomatik oluştur (server başladığında)
router.get('/init', async (req, res) => {
  try {
    // Admin kullanıcısı var mı kontrol et
    const existingAdmin = await User.findOne({ username: 'admin' });
    
    if (existingAdmin) {
      return res.json({ 
        message: 'Admin kullanıcısı zaten var', 
        user: existingAdmin.username 
      });
    }
    
    // Admin kullanıcısını oluştur
    const adminUser = new User({
      username: 'admin',
      password: 'admin123',
      isAdmin: true
    });
    
    await adminUser.save();
    
    res.json({ 
      message: 'Admin kullanıcısı başarıyla oluşturuldu', 
      user: adminUser.username 
    });
  } catch (error) {
    console.error('Init error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Test kullanıcısı oluştur (manuel)
router.post('/setup', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Kullanıcı var mı kontrol et
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Kullanıcı zaten var' });
    }
    
    // Yeni kullanıcı oluştur
    const newUser = new User({
      username: username || 'admin',
      password: password || 'admin123',
      isAdmin: true
    });
    
    await newUser.save();
    
    res.json({ 
      message: 'Kullanıcı başarıyla oluşturuldu', 
      user: newUser.username 
    });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;