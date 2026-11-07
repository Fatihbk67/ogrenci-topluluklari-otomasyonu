const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Yüklenen topluluk görsellerinin saklanacağı klasör
const YUKLEME_KLASORU = path.join(__dirname, '..', 'uploads', 'topluluklar');
fs.mkdirSync(YUKLEME_KLASORU, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, YUKLEME_KLASORU),
  filename: (req, file, cb) => {
    const uzanti = path.extname(file.originalname).toLowerCase();
    const benzersizAd = `topluluk_${req.user.id}_${Date.now()}${uzanti}`;
    cb(null, benzersizAd);
  }
});

const IZIN_VERILEN_TURLER = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function dosyaFiltresi(req, file, cb) {
  if (!IZIN_VERILEN_TURLER.includes(file.mimetype)) {
    return cb(new Error('Yalnızca JPG, PNG, WEBP veya GIF formatında görsel yükleyebilirsiniz.'));
  }
  cb(null, true);
}

const toplulukGorselYukle = multer({
  storage,
  fileFilter: dosyaFiltresi,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

module.exports = { toplulukGorselYukle };
