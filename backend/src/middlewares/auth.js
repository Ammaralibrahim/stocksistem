const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Token'ı header'dan al
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Yetkilendirme token\'ı bulunamadı' });
  }
  
  try {
    // Token'ı doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Geçersiz token' });
  }
};