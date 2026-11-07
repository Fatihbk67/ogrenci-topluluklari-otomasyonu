const bcrypt = require('bcryptjs');
const pool = require('../config/db');

/* ================================================================
   DASHBOARD İSTATİSTİKLERİ
================================================================ */
async function getIstatistikler(req, res) {
  try {
    const [[{ toplamKullanici }]] = await pool.query('SELECT COUNT(*) AS toplamKullanici FROM kullanicilar');
    const [[{ toplamTopluluk }]] = await pool.query('SELECT COUNT(*) AS toplamTopluluk FROM topluluklar');
    const [[{ bekleyenTopluluk }]] = await pool.query("SELECT COUNT(*) AS bekleyenTopluluk FROM topluluklar WHERE durum = 'beklemede'");
    const [[{ bekleyenEtkinlik }]] = await pool.query("SELECT COUNT(*) AS bekleyenEtkinlik FROM etkinlikler WHERE durum = 'beklemede'");
    const [[{ toplamOgrenci }]] = await pool.query("SELECT COUNT(*) AS toplamOgrenci FROM kullanicilar WHERE rol = 'ogrenci'");

    const [sonKullanicilar] = await pool.query(
      `SELECT id, ad, soyad, email, rol, olusturma_tarihi
       FROM kullanicilar ORDER BY id DESC LIMIT 5`
    );

    const [sonTopluluklar] = await pool.query(
      `SELECT id, ad, durum, kurulis_tarihi FROM topluluklar ORDER BY id DESC LIMIT 5`
    );

    return res.json({
      basarili: true,
      istatistikler: { toplamKullanici, toplamTopluluk, bekleyenTopluluk, bekleyenEtkinlik, toplamOgrenci },
      sonKullanicilar,
      sonTopluluklar
    });
  } catch (err) {
    console.error('İstatistik hatası:', err);
    return res.status(500).json({ basarili: false, mesaj: 'İstatistikler alınırken hata oluştu.' });
  }
}

/* ================================================================
   KULLANICI YÖNETİMİ
================================================================ */

// Tüm kullanıcıları listele (arama ve rol filtresi destekli)
async function getKullanicilar(req, res) {
  try {
    const { arama = '', rol = '' } = req.query;
    let sql = `SELECT id, ad, soyad, ogrenci_no, email, rol, telefon, bolum, aktif, olusturma_tarihi
               FROM kullanicilar WHERE 1=1`;
    const params = [];

    if (arama) {
      sql += ' AND (ad LIKE ? OR soyad LIKE ? OR email LIKE ? OR ogrenci_no LIKE ?)';
      const terim = `%${arama}%`;
      params.push(terim, terim, terim, terim);
    }
    if (rol) {
      sql += ' AND rol = ?';
      params.push(rol);
    }
    sql += ' ORDER BY id DESC';

    const [rows] = await pool.query(sql, params);
    return res.json({ basarili: true, kullanicilar: rows });
  } catch (err) {
    console.error('Kullanıcı listeleme hatası:', err);
    return res.status(500).json({ basarili: false, mesaj: 'Kullanıcılar alınırken hata oluştu.' });
  }
}

// Tek kullanıcı getir
async function getKullanici(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT id, ad, soyad, ogrenci_no, email, rol, telefon, bolum, aktif, olusturma_tarihi
       FROM kullanicilar WHERE id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ basarili: false, mesaj: 'Kullanıcı bulunamadı.' });
    return res.json({ basarili: true, kullanici: rows[0] });
  } catch (err) {
    console.error('Kullanıcı getirme hatası:', err);
    return res.status(500).json({ basarili: false, mesaj: 'Kullanıcı alınırken hata oluştu.' });
  }
}

// Yeni kullanıcı oluştur
async function kullaniciOlustur(req, res) {
  try {
    const { ad, soyad, email, sifre, rol, ogrenci_no, telefon, bolum } = req.body;

    if (!ad || !soyad || !email || !sifre || !rol) {
      return res.status(400).json({ basarili: false, mesaj: 'Ad, soyad, e-posta, şifre ve rol zorunludur.' });
    }

    const gecerliRoller = ['admin', 'danisman', 'baskan', 'ogrenci'];
    if (!gecerliRoller.includes(rol)) {
      return res.status(400).json({ basarili: false, mesaj: 'Geçersiz rol.' });
    }

    const [mevcut] = await pool.query('SELECT id FROM kullanicilar WHERE email = ?', [email]);
    if (mevcut.length > 0) {
      return res.status(409).json({ basarili: false, mesaj: 'Bu e-posta adresi zaten kayıtlı.' });
    }

    const hashliSifre = await bcrypt.hash(sifre, 10);

    const [sonuc] = await pool.query(
      `INSERT INTO kullanicilar (ad, soyad, ogrenci_no, email, sifre, rol, telefon, bolum)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [ad, soyad, ogrenci_no || null, email, hashliSifre, rol, telefon || null, bolum || null]
    );

    return res.status(201).json({ basarili: true, mesaj: 'Kullanıcı başarıyla oluşturuldu.', id: sonuc.insertId });
  } catch (err) {
    console.error('Kullanıcı oluşturma hatası:', err);
    return res.status(500).json({ basarili: false, mesaj: 'Kullanıcı oluşturulurken hata oluştu.' });
  }
}

// Kullanıcı güncelle
async function kullaniciGuncelle(req, res) {
  try {
    const { id } = req.params;
    const { ad, soyad, email, rol, ogrenci_no, telefon, bolum, aktif, sifre } = req.body;

    const [mevcut] = await pool.query('SELECT id FROM kullanicilar WHERE id = ?', [id]);
    if (mevcut.length === 0) return res.status(404).json({ basarili: false, mesaj: 'Kullanıcı bulunamadı.' });

    let sql = `UPDATE kullanicilar SET ad=?, soyad=?, email=?, rol=?, ogrenci_no=?, telefon=?, bolum=?, aktif=?`;
    const params = [ad, soyad, email, rol, ogrenci_no || null, telefon || null, bolum || null, aktif ? 1 : 0];

    // Şifre gönderildiyse güncelle
    if (sifre && sifre.trim() !== '') {
      const hashliSifre = await bcrypt.hash(sifre, 10);
      sql += `, sifre=?`;
      params.push(hashliSifre);
    }

    sql += ` WHERE id = ?`;
    params.push(id);

    await pool.query(sql, params);
    return res.json({ basarili: true, mesaj: 'Kullanıcı başarıyla güncellendi.' });
  } catch (err) {
    console.error('Kullanıcı güncelleme hatası:', err);
    return res.status(500).json({ basarili: false, mesaj: 'Kullanıcı güncellenirken hata oluştu.' });
  }
}

// Kullanıcı sil
async function kullaniciSil(req, res) {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ basarili: false, mesaj: 'Kendi hesabınızı silemezsiniz.' });
    }

    const [sonuc] = await pool.query('DELETE FROM kullanicilar WHERE id = ?', [id]);
    if (sonuc.affectedRows === 0) return res.status(404).json({ basarili: false, mesaj: 'Kullanıcı bulunamadı.' });

    return res.json({ basarili: true, mesaj: 'Kullanıcı başarıyla silindi.' });
  } catch (err) {
    console.error('Kullanıcı silme hatası:', err);
    return res.status(500).json({ basarili: false, mesaj: 'Kullanıcı silinirken hata oluştu.' });
  }
}

/* ================================================================
   TOPLULUK YÖNETİMİ
================================================================ */

// Tüm toplulukları listele
async function getTopluluklar(req, res) {
  try {
    const { durum = '' } = req.query;
    let sql = `
      SELECT t.id, t.ad, t.aciklama, t.logo_url, t.durum, t.kurulis_tarihi,
             b.id AS baskan_id, b.ad AS baskan_ad, b.soyad AS baskan_soyad,
             d.id AS danisman_id, d.ad AS danisman_ad, d.soyad AS danisman_soyad,
             (SELECT COUNT(*) FROM uyelikler u WHERE u.topluluk_id = t.id AND u.durum = 'onaylandi') AS uyeSayisi
      FROM topluluklar t
      LEFT JOIN kullanicilar b ON t.baskan_id = b.id
      LEFT JOIN kullanicilar d ON t.danisman_id = d.id
      WHERE 1=1`;
    const params = [];

    if (durum) {
      sql += ' AND t.durum = ?';
      params.push(durum);
    }
    sql += ' ORDER BY t.id DESC';

    const [rows] = await pool.query(sql, params);
    return res.json({ basarili: true, topluluklar: rows });
  } catch (err) {
    console.error('Topluluk listeleme hatası:', err);
    return res.status(500).json({ basarili: false, mesaj: 'Topluluklar alınırken hata oluştu.' });
  }
}

// Yeni topluluk oluştur
async function topluluklarOlustur(req, res) {
  try {
    const { ad, aciklama, baskan_id, danisman_id, logo_url } = req.body;

    if (!ad) return res.status(400).json({ basarili: false, mesaj: 'Topluluk adı zorunludur.' });

    const [sonuc] = await pool.query(
      `INSERT INTO topluluklar (ad, aciklama, baskan_id, danisman_id, logo_url, durum)
       VALUES (?, ?, ?, ?, ?, 'onaylandi')`,
      [ad, aciklama || null, baskan_id || null, danisman_id || null, logo_url || null]
    );

    return res.status(201).json({ basarili: true, mesaj: 'Topluluk başarıyla oluşturuldu.', id: sonuc.insertId });
  } catch (err) {
    console.error('Topluluk oluşturma hatası:', err);
    return res.status(500).json({ basarili: false, mesaj: 'Topluluk oluşturulurken hata oluştu.' });
  }
}

// Topluluk güncelle
async function topluluklarGuncelle(req, res) {
  try {
    const { id } = req.params;
    const { ad, aciklama, baskan_id, danisman_id, logo_url } = req.body;

    const [mevcut] = await pool.query('SELECT id FROM topluluklar WHERE id = ?', [id]);
    if (mevcut.length === 0) return res.status(404).json({ basarili: false, mesaj: 'Topluluk bulunamadı.' });

    await pool.query(
      `UPDATE topluluklar SET ad=?, aciklama=?, baskan_id=?, danisman_id=?, logo_url=? WHERE id=?`,
      [ad, aciklama || null, baskan_id || null, danisman_id || null, logo_url || null, id]
    );

    return res.json({ basarili: true, mesaj: 'Topluluk başarıyla güncellendi.' });
  } catch (err) {
    console.error('Topluluk güncelleme hatası:', err);
    return res.status(500).json({ basarili: false, mesaj: 'Topluluk güncellenirken hata oluştu.' });
  }
}

// Topluluk durumunu güncelle (onayla / reddet / pasif yap)
async function topluluklarDurumGuncelle(req, res) {
  try {
    const { id } = req.params;
    const { durum } = req.body;

    const gecerliDurumlar = ['beklemede', 'onaylandi', 'reddedildi', 'pasif'];
    if (!gecerliDurumlar.includes(durum)) {
      return res.status(400).json({ basarili: false, mesaj: 'Geçersiz durum.' });
    }

    const [sonuc] = await pool.query('UPDATE topluluklar SET durum = ? WHERE id = ?', [durum, id]);
    if (sonuc.affectedRows === 0) return res.status(404).json({ basarili: false, mesaj: 'Topluluk bulunamadı.' });

    return res.json({ basarili: true, mesaj: 'Topluluk durumu güncellendi.' });
  } catch (err) {
    console.error('Durum güncelleme hatası:', err);
    return res.status(500).json({ basarili: false, mesaj: 'Durum güncellenirken hata oluştu.' });
  }
}

// Topluluk sil
async function topluluklarSil(req, res) {
  try {
    const { id } = req.params;
    const [sonuc] = await pool.query('DELETE FROM topluluklar WHERE id = ?', [id]);
    if (sonuc.affectedRows === 0) return res.status(404).json({ basarili: false, mesaj: 'Topluluk bulunamadı.' });
    return res.json({ basarili: true, mesaj: 'Topluluk başarıyla silindi.' });
  } catch (err) {
    console.error('Topluluk silme hatası:', err);
    return res.status(500).json({ basarili: false, mesaj: 'Topluluk silinirken hata oluştu.' });
  }
}

// Başkan / danışman seçimi için basit kullanıcı listesi (rol bazlı)
async function getKullaniciSecenekleri(req, res) {
  try {
    const { rol } = req.query;
    const [rows] = await pool.query(
      'SELECT id, ad, soyad, email FROM kullanicilar WHERE rol = ? ORDER BY ad',
      [rol]
    );
    return res.json({ basarili: true, kullanicilar: rows });
  } catch (err) {
    console.error('Kullanıcı seçenekleri hatası:', err);
    return res.status(500).json({ basarili: false, mesaj: 'Kullanıcılar alınırken hata oluştu.' });
  }
}

/* ================================================================
   ETKİNLİK YÖNETİMİ
================================================================ */

// Tüm etkinlikleri listele (durum ve topluluk filtresi destekli)
async function getEtkinlikler(req, res) {
  try {
    const { durum = '', topluluk_id = '' } = req.query;
    let sql = `
      SELECT e.id, e.baslik, e.aciklama, e.tarih, e.konum, e.durum, e.olusturma_tarihi,
             t.id AS topluluk_id, t.ad AS topluluk_ad
      FROM etkinlikler e
      JOIN topluluklar t ON e.topluluk_id = t.id
      WHERE 1=1`;
    const params = [];

    if (durum) {
      sql += ' AND e.durum = ?';
      params.push(durum);
    }
    if (topluluk_id) {
      sql += ' AND e.topluluk_id = ?';
      params.push(topluluk_id);
    }
    sql += ' ORDER BY e.tarih DESC';

    const [rows] = await pool.query(sql, params);
    return res.json({ basarili: true, etkinlikler: rows });
  } catch (err) {
    console.error('Etkinlik listeleme hatası:', err);
    return res.status(500).json({ basarili: false, mesaj: 'Etkinlikler alınırken hata oluştu.' });
  }
}

// Yeni etkinlik oluştur
async function etkinlikOlustur(req, res) {
  try {
    const { topluluk_id, baslik, aciklama, tarih, konum } = req.body;

    if (!topluluk_id || !baslik || !tarih) {
      return res.status(400).json({ basarili: false, mesaj: 'Topluluk, başlık ve tarih zorunludur.' });
    }

    const [sonuc] = await pool.query(
      `INSERT INTO etkinlikler (topluluk_id, baslik, aciklama, tarih, konum, durum)
       VALUES (?, ?, ?, ?, ?, 'onaylandi')`,
      [topluluk_id, baslik, aciklama || null, tarih, konum || null]
    );

    return res.status(201).json({ basarili: true, mesaj: 'Etkinlik başarıyla oluşturuldu.', id: sonuc.insertId });
  } catch (err) {
    console.error('Etkinlik oluşturma hatası:', err);
    return res.status(500).json({ basarili: false, mesaj: 'Etkinlik oluşturulurken hata oluştu.' });
  }
}

// Etkinlik güncelle
async function etkinlikGuncelle(req, res) {
  try {
    const { id } = req.params;
    const { topluluk_id, baslik, aciklama, tarih, konum } = req.body;

    const [mevcut] = await pool.query('SELECT id FROM etkinlikler WHERE id = ?', [id]);
    if (mevcut.length === 0) return res.status(404).json({ basarili: false, mesaj: 'Etkinlik bulunamadı.' });

    await pool.query(
      `UPDATE etkinlikler SET topluluk_id=?, baslik=?, aciklama=?, tarih=?, konum=? WHERE id=?`,
      [topluluk_id, baslik, aciklama || null, tarih, konum || null, id]
    );

    return res.json({ basarili: true, mesaj: 'Etkinlik başarıyla güncellendi.' });
  } catch (err) {
    console.error('Etkinlik güncelleme hatası:', err);
    return res.status(500).json({ basarili: false, mesaj: 'Etkinlik güncellenirken hata oluştu.' });
  }
}

// Etkinlik durumunu güncelle (onayla / reddet / tamamlandı / iptal)
async function etkinlikDurumGuncelle(req, res) {
  try {
    const { id } = req.params;
    const { durum } = req.body;

    const gecerliDurumlar = ['beklemede', 'onaylandi', 'reddedildi', 'tamamlandi', 'iptal'];
    if (!gecerliDurumlar.includes(durum)) {
      return res.status(400).json({ basarili: false, mesaj: 'Geçersiz durum.' });
    }

    const [sonuc] = await pool.query('UPDATE etkinlikler SET durum = ? WHERE id = ?', [durum, id]);
    if (sonuc.affectedRows === 0) return res.status(404).json({ basarili: false, mesaj: 'Etkinlik bulunamadı.' });

    return res.json({ basarili: true, mesaj: 'Etkinlik durumu güncellendi.' });
  } catch (err) {
    console.error('Etkinlik durum güncelleme hatası:', err);
    return res.status(500).json({ basarili: false, mesaj: 'Durum güncellenirken hata oluştu.' });
  }
}

// Etkinlik sil
async function etkinlikSil(req, res) {
  try {
    const { id } = req.params;
    const [sonuc] = await pool.query('DELETE FROM etkinlikler WHERE id = ?', [id]);
    if (sonuc.affectedRows === 0) return res.status(404).json({ basarili: false, mesaj: 'Etkinlik bulunamadı.' });
    return res.json({ basarili: true, mesaj: 'Etkinlik başarıyla silindi.' });
  } catch (err) {
    console.error('Etkinlik silme hatası:', err);
    return res.status(500).json({ basarili: false, mesaj: 'Etkinlik silinirken hata oluştu.' });
  }
}

// Etkinlik formunda topluluk seçimi için basit liste (id + ad)
async function getTopluluqSecenekleri(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT id, ad FROM topluluklar WHERE durum = 'onaylandi' ORDER BY ad`
    );
    return res.json({ basarili: true, topluluklar: rows });
  } catch (err) {
    console.error('Topluluk seçenekleri hatası:', err);
    return res.status(500).json({ basarili: false, mesaj: 'Topluluklar alınırken hata oluştu.' });
  }
}

/* ================================================================
   LOG KAYDI (İşlem Kayıtları / Denetim Günlüğü)
================================================================ */

// Log kayıtlarını listeler (arama, rol ve tarih aralığı filtresi destekli).
// Performans için en son N kayıtla sınırlandırılır (varsayılan 1000).
async function getLogKayitlari(req, res) {
  try {
    const { arama = '', rol = '', baslangic = '', bitis = '', limit = 1000 } = req.query;

    let sql = `SELECT id, kullanici_id, kullanici_adi, kullanici_email, rol, yontem, yol,
                      eylem, detay, durum_kodu, basarili, ip_adresi, tarayici_bilgisi,
                      sure_ms, olusturma_tarihi
               FROM islem_kayitlari WHERE 1=1`;
    const params = [];

    if (arama) {
      sql += ` AND (kullanici_adi LIKE ? OR kullanici_email LIKE ? OR eylem LIKE ?
                     OR yol LIKE ? OR ip_adresi LIKE ? OR detay LIKE ?)`;
      const terim = `%${arama}%`;
      params.push(terim, terim, terim, terim, terim, terim);
    }
    if (rol) {
      sql += ' AND rol = ?';
      params.push(rol);
    }
    if (baslangic) {
      sql += ' AND olusturma_tarihi >= ?';
      params.push(`${baslangic} 00:00:00`);
    }
    if (bitis) {
      sql += ' AND olusturma_tarihi <= ?';
      params.push(`${bitis} 23:59:59`);
    }

    sql += ' ORDER BY olusturma_tarihi DESC LIMIT ?';
    params.push(Math.min(Number(limit) || 1000, 5000));

    const [rows] = await pool.query(sql, params);
    const [[{ toplamKayit }]] = await pool.query('SELECT COUNT(*) AS toplamKayit FROM islem_kayitlari');

    return res.json({ basarili: true, kayitlar: rows, toplamKayit });
  } catch (err) {
    console.error('Log kayıtları listeleme hatası:', err);
    return res.status(500).json({ basarili: false, mesaj: 'Log kayıtları alınırken hata oluştu.' });
  }
}

module.exports = {
  getIstatistikler,
  getKullanicilar,
  getKullanici,
  kullaniciOlustur,
  kullaniciGuncelle,
  kullaniciSil,
  getTopluluklar,
  topluluklarOlustur,
  topluluklarGuncelle,
  topluluklarDurumGuncelle,
  topluluklarSil,
  getKullaniciSecenekleri,
  getEtkinlikler,
  etkinlikOlustur,
  etkinlikGuncelle,
  etkinlikDurumGuncelle,
  etkinlikSil,
  getTopluluqSecenekleri,
  getLogKayitlari
};