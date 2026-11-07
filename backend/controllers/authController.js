const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { dogrulamaKoduGonder } = require('../utils/mailer');
require('dotenv').config();

/**
 * POST /api/auth/login
 * E-posta ve şifre ile giriş yapar, başarılıysa JWT token döner.
 */
async function login(req, res) {
  try {
    const { email, sifre } = req.body;

    if (!email || !sifre) {
      return res.status(400).json({ basarili: false, mesaj: 'E-posta ve şifre zorunludur.' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM kullanicilar WHERE email = ? LIMIT 1',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ basarili: false, mesaj: 'E-posta veya şifre hatalı.' });
    }

    const kullanici = rows[0];

    if (!kullanici.aktif) {
      return res.status(403).json({ basarili: false, mesaj: 'Hesabınız pasif durumda. Lütfen yönetici ile iletişime geçin.' });
    }

    const sifreDogruMu = await bcrypt.compare(sifre, kullanici.sifre);
    if (!sifreDogruMu) {
      return res.status(401).json({ basarili: false, mesaj: 'E-posta veya şifre hatalı.' });
    }

    const token = jwt.sign(
      {
        id: kullanici.id,
        email: kullanici.email,
        rol: kullanici.rol,
        ad: kullanici.ad,
        soyad: kullanici.soyad
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return res.json({
      basarili: true,
      mesaj: 'Giriş başarılı.',
      token,
      kullanici: {
        id: kullanici.id,
        ad: kullanici.ad,
        soyad: kullanici.soyad,
        email: kullanici.email,
        rol: kullanici.rol
      }
    });

  } catch (err) {
    console.error('Login hatası:', err);
    return res.status(500).json({ basarili: false, mesaj: 'Sunucu hatası oluştu.' });
  }
}

/**
 * GET /api/auth/ben
 */
async function ben(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, ad, soyad, email, rol, telefon, bolum FROM kullanicilar WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ basarili: false, mesaj: 'Kullanıcı bulunamadı.' });
    }
    return res.json({ basarili: true, kullanici: rows[0] });
  } catch (err) {
    console.error('Ben hatası:', err);
    return res.status(500).json({ basarili: false, mesaj: 'Sunucu hatası oluştu.' });
  }
}

/**
 * POST /api/auth/kayit
 * Herkesin kendi kendine kayıt olabildiği herkese açık uç nokta.
 * Yeni kayıt olan her kullanıcı otomatik olarak "ogrenci" rolüyle oluşturulur.
 * Admin daha sonra bu rolü değiştirebilir (örn. topluluk başkanı, danışman).
 */
async function kayitOl(req, res) {
  try {
    const { ad, soyad, email, sifre, ogrenci_no, bolum } = req.body;

    if (!ad || !soyad || !email || !sifre) {
      return res.status(400).json({ basarili: false, mesaj: 'Ad, soyad, e-posta ve şifre zorunludur.' });
    }
    if (sifre.length < 6) {
      return res.status(400).json({ basarili: false, mesaj: 'Şifre en az 6 karakter olmalıdır.' });
    }

    const [mevcut] = await pool.query('SELECT id FROM kullanicilar WHERE email = ?', [email]);
    if (mevcut.length > 0) {
      return res.status(409).json({ basarili: false, mesaj: 'Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin.' });
    }

    const hashliSifre = await bcrypt.hash(sifre, 10);

    const [sonuc] = await pool.query(
      `INSERT INTO kullanicilar (ad, soyad, ogrenci_no, email, sifre, rol, bolum)
       VALUES (?, ?, ?, ?, ?, 'ogrenci', ?)`,
      [ad, soyad, ogrenci_no || null, email, hashliSifre, bolum || null]
    );

    const token = jwt.sign(
      { id: sonuc.insertId, email, rol: 'ogrenci', ad, soyad },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return res.status(201).json({
      basarili: true,
      mesaj: 'Kaydınız oluşturuldu. Hoş geldiniz!',
      token,
      kullanici: { id: sonuc.insertId, ad, soyad, email, rol: 'ogrenci' }
    });

  } catch (err) {
    console.error('Kayıt hatası:', err);
    return res.status(500).json({ basarili: false, mesaj: 'Kayıt oluşturulurken hata oluştu.' });
  }
}

/* ================================================================
   ŞİFREMİ UNUTTUM (3 adımlı, e-posta doğrulama kodlu akış)
================================================================ */

/**
 * POST /api/auth/sifremi-unuttum
 * Adım 1: E-posta girilir, 6 haneli doğrulama kodu üretilip e-postaya gönderilir.
 */
async function sifremiUnuttum(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ basarili: false, mesaj: 'E-posta adresi zorunludur.' });
    }

    const [rows] = await pool.query('SELECT id, ad, soyad, email FROM kullanicilar WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(404).json({ basarili: false, mesaj: 'Bu e-posta adresine ait bir hesap bulunamadı.' });
    }

    const kullanici = rows[0];
    const kod = String(Math.floor(100000 + Math.random() * 900000)); // 6 haneli kod
    const sonTarih = new Date(Date.now() + 10 * 60 * 1000); // 10 dakika geçerli

    await pool.query(
      'UPDATE kullanicilar SET sifirlama_kodu = ?, sifirlama_son_tarih = ? WHERE id = ?',
      [kod, sonTarih, kullanici.id]
    );

    const sonuc = await dogrulamaKoduGonder({
      aliciEmail: kullanici.email,
      aliciAd: `${kullanici.ad} ${kullanici.soyad}`,
      kod
    });

    return res.json({
      basarili: true,
      mesaj: 'Doğrulama kodu e-posta adresinize gönderildi.',
      // SMTP yapılandırılmamışsa (geliştirme ortamı) kodu doğrudan cevapta da döndürüyoruz
      // ki gerçek bir e-posta hesabı olmadan da akış test edilebilsin.
      testKodu: sonuc.testModu ? kod : undefined
    });

  } catch (err) {
    console.error('Şifremi unuttum hatası:', err);
    return res.status(500).json({ basarili: false, mesaj: 'Doğrulama kodu gönderilirken hata oluştu.' });
  }
}

/**
 * POST /api/auth/kod-dogrula
 * Adım 2: Kullanıcı e-postasına gelen kodu girer. Doğruysa, şifre sıfırlama
 * için kısa ömürlü (10 dk) bir işlem tokenı üretilip döndürülür.
 */
async function kodDogrula(req, res) {
  try {
    const { email, kod } = req.body;
    if (!email || !kod) {
      return res.status(400).json({ basarili: false, mesaj: 'E-posta ve kod zorunludur.' });
    }

    const [rows] = await pool.query(
      'SELECT id, sifirlama_kodu, sifirlama_son_tarih FROM kullanicilar WHERE email = ?',
      [email]
    );
    if (rows.length === 0) {
      return res.status(404).json({ basarili: false, mesaj: 'Kullanıcı bulunamadı.' });
    }

    const kullanici = rows[0];

    if (!kullanici.sifirlama_kodu || kullanici.sifirlama_kodu !== kod) {
      return res.status(400).json({ basarili: false, mesaj: 'Doğrulama kodu hatalı.' });
    }
    if (!kullanici.sifirlama_son_tarih || new Date(kullanici.sifirlama_son_tarih) < new Date()) {
      return res.status(400).json({ basarili: false, mesaj: 'Doğrulama kodunun süresi dolmuş. Lütfen yeni bir kod isteyin.' });
    }

    const sifirlamaToken = jwt.sign(
      { id: kullanici.id, amac: 'sifre_sifirlama' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    return res.json({ basarili: true, mesaj: 'Kod doğrulandı.', sifirlamaToken });

  } catch (err) {
    console.error('Kod doğrulama hatası:', err);
    return res.status(500).json({ basarili: false, mesaj: 'Kod doğrulanırken hata oluştu.' });
  }
}

/**
 * POST /api/auth/sifre-sifirla
 * Adım 3: kod-dogrula adımından alınan geçici token ile yeni şifre belirlenir.
 */
async function sifreSifirla(req, res) {
  try {
    const { sifirlamaToken, yeniSifre } = req.body;
    if (!sifirlamaToken || !yeniSifre) {
      return res.status(400).json({ basarili: false, mesaj: 'Eksik bilgi gönderildi.' });
    }
    if (yeniSifre.length < 6) {
      return res.status(400).json({ basarili: false, mesaj: 'Şifre en az 6 karakter olmalıdır.' });
    }

    let payload;
    try {
      payload = jwt.verify(sifirlamaToken, process.env.JWT_SECRET);
    } catch (hataDetayi) {
      return res.status(401).json({ basarili: false, mesaj: 'Oturumunuzun süresi doldu. Lütfen işlemi baştan başlatın.' });
    }

    if (payload.amac !== 'sifre_sifirlama') {
      return res.status(401).json({ basarili: false, mesaj: 'Geçersiz işlem tokenı.' });
    }

    const hashliSifre = await bcrypt.hash(yeniSifre, 10);
    await pool.query(
      'UPDATE kullanicilar SET sifre = ?, sifirlama_kodu = NULL, sifirlama_son_tarih = NULL WHERE id = ?',
      [hashliSifre, payload.id]
    );

    return res.json({ basarili: true, mesaj: 'Şifreniz başarıyla güncellendi. Şimdi giriş yapabilirsiniz.' });

  } catch (err) {
    console.error('Şifre sıfırlama hatası:', err);
    return res.status(500).json({ basarili: false, mesaj: 'Şifre güncellenirken hata oluştu.' });
  }
}

module.exports = { login, ben, kayitOl, sifremiUnuttum, kodDogrula, sifreSifirla };