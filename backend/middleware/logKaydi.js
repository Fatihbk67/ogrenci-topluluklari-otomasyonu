const pool = require('../config/db');
const { eylemAciklamasiUret } = require('../utils/eylemAciklamasi');

/**
 * İstekten gerçek IP adresini çıkarır. Ters proxy arkasındaysa
 * x-forwarded-for başlığını, yoksa doğrudan bağlantı adresini kullanır.
 */
function istekIpAdresi(req) {
  const ileriIp = req.headers['x-forwarded-for'];
  if (ileriIp) return ileriIp.split(',')[0].trim();
  return req.socket?.remoteAddress || req.ip || 'bilinmiyor';
}

/**
 * İstekle ilgili kısa bir bağlam bilgisi üretir (ör. hangi kayıt no
 * etkilendi, giriş denemesinde hangi e-posta kullanıldı).
 */
function detayUret(req) {
  if (!req.user && req.body && req.body.email) {
    return `E-posta: ${req.body.email}`;
  }
  if (req.params && req.params.id) {
    return `Kayıt No: ${req.params.id}`;
  }
  return null;
}

/**
 * Tüm /api/* isteklerini kaydeden global middleware.
 * Ana isteği YAVAŞLATMAMAK için loglama işlemi yanıt tamamlandıktan
 * (res.on('finish')) sonra, arka planda ve beklenmeden yapılır.
 * Bu middleware route'lardan ÖNCE bağlandığı için, yanıt tamamlandığında
 * (finish anında) ilgili route içindeki verifyToken zaten req.user'ı
 * doldurmuş olur — böylece kullanıcı bilgisi doğru şekilde yakalanır.
 */
function logKaydiMiddleware(req, res, next) {
  const baslangicZamani = Date.now();

  res.on('finish', () => {
    kaydiOlustur(req, res, baslangicZamani).catch(hata => {
      // Loglama asla ana uygulamayı bozmamalı, sadece konsola yazılır.
      console.error('Log kaydı oluşturulamadı:', hata.message);
    });
  });

  next();
}

async function kaydiOlustur(req, res, baslangicZamani) {
  const sureMs = Date.now() - baslangicZamani;
  const eylem = eylemAciklamasiUret(req.method, req.originalUrl);
  const kullanici = req.user || null;

  await pool.query(
    `INSERT INTO islem_kayitlari
      (kullanici_id, kullanici_adi, kullanici_email, rol, yontem, yol, eylem, detay, durum_kodu, basarili, ip_adresi, tarayici_bilgisi, sure_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      kullanici ? kullanici.id : null,
      kullanici ? `${kullanici.ad} ${kullanici.soyad}` : 'Ziyaretçi (giriş yapmamış)',
      kullanici ? kullanici.email : null,
      kullanici ? kullanici.rol : null,
      req.method,
      req.originalUrl,
      eylem,
      detayUret(req),
      res.statusCode,
      res.statusCode < 400 ? 1 : 0,
      istekIpAdresi(req),
      (req.headers['user-agent'] || '').slice(0, 255),
      sureMs
    ]
  );
}

module.exports = logKaydiMiddleware;
