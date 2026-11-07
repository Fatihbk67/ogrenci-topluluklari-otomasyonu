const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Gelen isteğin header'ındaki JWT token'ı doğrular.
 * Geçerliyse kullanıcı bilgisini req.user içine koyar.
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ basarili: false, mesaj: 'Yetkilendirme başlığı bulunamadı. Lütfen giriş yapın.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, rol, ad, soyad }
    next();
  } catch (err) {
    return res.status(403).json({ basarili: false, mesaj: 'Oturum süresi dolmuş veya token geçersiz. Lütfen tekrar giriş yapın.' });
  }
}

/**
 * Belirtilen rollerden birine sahip olmayan kullanıcıları engeller.
 * Kullanım: checkRole('admin') veya checkRole('admin', 'danisman')
 */
function checkRole(...izinliRoller) {
  return (req, res, next) => {
    if (!req.user || !izinliRoller.includes(req.user.rol)) {
      return res.status(403).json({ basarili: false, mesaj: 'Bu işlemi gerçekleştirmek için yetkiniz yok.' });
    }
    next();
  };
}

module.exports = { verifyToken, checkRole };