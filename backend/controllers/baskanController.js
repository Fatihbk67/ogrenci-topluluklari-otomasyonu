const pool = require('../config/db');

/**
 * Giriş yapmış başkanın yönettiği topluluğu bulur.
 * Bir başkan yalnızca kendi topluluğuna ait verileri görebilir/yönetebilir.
 */
async function kendiTopluluqunuBul(baskanId) {
  const [rows] = await pool.query(
    `SELECT t.*, d.ad AS danisman_ad, d.soyad AS danisman_soyad, d.email AS danisman_email
     FROM topluluklar t
     LEFT JOIN kullanicilar d ON t.danisman_id = d.id
     WHERE t.baskan_id = ? LIMIT 1`,
    [baskanId]
  );
  return rows[0] || null;
}

/* ================================================================
   DASHBOARD İSTATİSTİKLERİ
================================================================ */
async function getIstatistikler(req, res) {
  try {
    const topluluk = await kendiTopluluqunuBul(req.user.id);
    if (!topluluk) {
      return res.status(404).json({ basarili: false, mesaj: 'Size atanmış bir topluluk bulunamadı. Lütfen sistem yöneticisiyle iletişime geçin.' });
    }

    const [[{ toplamUye }]] = await pool.query(
      "SELECT COUNT(*) AS toplamUye FROM uyelikler WHERE topluluk_id = ? AND durum = 'onaylandi'",
      [topluluk.id]
    );
    const [[{ bekleyenBasvuru }]] = await pool.query(
      "SELECT COUNT(*) AS bekleyenBasvuru FROM uyelikler WHERE topluluk_id = ? AND durum = 'beklemede'",
      [topluluk.id]
    );
    const [[{ toplamEtkinlik }]] = await pool.query(
      'SELECT COUNT(*) AS toplamEtkinlik FROM etkinlikler WHERE topluluk_id = ?',
      [topluluk.id]
    );
    const [[{ onayBekleyenEtkinlik }]] = await pool.query(
      "SELECT COUNT(*) AS onayBekleyenEtkinlik FROM etkinlikler WHERE topluluk_id = ? AND durum = 'beklemede'",
      [topluluk.id]
    );

    const [sonBasvurular] = await pool.query(
      `SELECT u.id, u.durum, u.katilim_tarihi, k.ad, k.soyad, k.email
       FROM uyelikler u JOIN kullanicilar k ON u.ogrenci_id = k.id
       WHERE u.topluluk_id = ? ORDER BY u.id DESC LIMIT 5`,
      [topluluk.id]
    );

    return res.json({
      basarili: true,
      topluluk,
      istatistikler: { toplamUye, bekleyenBasvuru, toplamEtkinlik, onayBekleyenEtkinlik },
      sonBasvurular
    });
  } catch (err) {
    console.error('Başkan istatistik hatası:', err);
    return res.status(500).json({ basarili: false, mesaj: 'İstatistikler alınırken hata oluştu.' });
  }
}

/* ================================================================
   TOPLULUK PROFİLİ (detaylı bilgi + görsel)
================================================================ */

async function getTopluluqProfili(req, res) {
  try {
    const topluluk = await kendiTopluluqunuBul(req.user.id);
    if (!topluluk) {
      return res.status(404).json({ basarili: false, mesaj: 'Size atanmış bir topluluk bulunamadı. Lütfen sistem yöneticisiyle iletişime geçin.' });
    }
    return res.json({ basarili: true, topluluk });
  } catch (err) {
    console.error('Topluluk profili alma hatası:', err);
    return res.status(500).json({ basarili: false, mesaj: 'Topluluk profili alınırken hata oluştu.' });
  }
}

async function topluluqProfiliGuncelle(req, res) {
  try {
    const topluluk = await kendiTopluluqunuBul(req.user.id);
    if (!topluluk) {
      return res.status(404).json({ basarili: false, mesaj: 'Size atanmış bir topluluk bulunamadı.' });
    }

    const { aciklama, detay_bilgi, iletisim_bilgisi, sosyal_medya } = req.body;

    await pool.query(
      `UPDATE topluluklar SET aciklama = ?, detay_bilgi = ?, iletisim_bilgisi = ?, sosyal_medya = ? WHERE id = ?`,
      [aciklama || null, detay_bilgi || null, iletisim_bilgisi || null, sosyal_medya || null, topluluk.id]
    );

    return res.json({ basarili: true, mesaj: 'Topluluk profili güncellendi.' });
  } catch (err) {
    console.error('Topluluk profili güncelleme hatası:', err);
    return res.status(500).json({ basarili: false, mesaj: 'Topluluk profili güncellenirken hata oluştu.' });
  }
}

async function topluluqGorselYukle(req, res) {
  try {
    const topluluk = await kendiTopluluqunuBul(req.user.id);
    if (!topluluk) {
      return res.status(404).json({ basarili: false, mesaj: 'Size atanmış bir topluluk bulunamadı.' });
    }

    if (!req.file) {
      return res.status(400).json({ basarili: false, mesaj: 'Bir görsel dosyası seçmelisiniz.' });
    }

    const gorselYolu = `/uploads/topluluklar/${req.file.filename}`;
    await pool.query('UPDATE topluluklar SET kapak_gorseli = ? WHERE id = ?', [gorselYolu, topluluk.id]);

    return res.json({ basarili: true, mesaj: 'Topluluk görseli güncellendi.', kapak_gorseli: gorselYolu });
  } catch (err) {
    console.error('Topluluk görsel yükleme hatası:', err);
    return res.status(500).json({ basarili: false, mesaj: 'Görsel yüklenirken hata oluştu.' });
  }
}

/* ================================================================
   ÜYELİK YÖNETİMİ
================================================================ */

async function getUyeler(req, res) {
  try {
    const topluluk = await kendiTopluluqunuBul(req.user.id);
    if (!topluluk) return res.status(404).json({ basarili: false, mesaj: 'Size atanmış bir topluluk bulunamadı.' });

    const { durum = '' } = req.query;
    let sql = `
      SELECT u.id, u.durum, u.katilim_tarihi,
             k.id AS ogrenci_id, k.ad, k.soyad, k.email, k.ogrenci_no, k.bolum
      FROM uyelikler u
      JOIN kullanicilar k ON u.ogrenci_id = k.id
      WHERE u.topluluk_id = ?`;
    const params = [topluluk.id];

    if (durum) {
      sql += ' AND u.durum = ?';
      params.push(durum);
    }
    sql += ' ORDER BY u.id DESC';

    const [rows] = await pool.query(sql, params);
    return res.json({ basarili: true, uyeler: rows });
  } catch (err) {
    console.error('Üye listeleme hatası:', err);
    return res.status(500).json({ basarili: false, mesaj: 'Üyeler alınırken hata oluştu.' });
  }
}

async function uyelikDurumGuncelle(req, res) {
  try {
    const topluluk = await kendiTopluluqunuBul(req.user.id);
    if (!topluluk) return res.status(404).json({ basarili: false, mesaj: 'Size atanmış bir topluluk bulunamadı.' });

    const { id } = req.params;
    const { durum } = req.body;

    const gecerliDurumlar = ['onaylandi', 'reddedildi', 'ayrildi'];
    if (!gecerliDurumlar.includes(durum)) {
      return res.status(400).json({ basarili: false, mesaj: 'Geçersiz durum.' });
    }

    const [sonuc] = await pool.query(
      'UPDATE uyelikler SET durum = ? WHERE id = ? AND topluluk_id = ?',
      [durum, id, topluluk.id]
    );
    if (sonuc.affectedRows === 0) {
      return res.status(404).json({ basarili: false, mesaj: 'Üyelik kaydı bulunamadı veya size ait değil.' });
    }

    return res.json({ basarili: true, mesaj: 'Üyelik durumu güncellendi.' });
  } catch (err) {
    console.error('Üyelik durum güncelleme hatası:', err);
    return res.status(500).json({ basarili: false, mesaj: 'Durum güncellenirken hata oluştu.' });
  }
}

/* ================================================================
   ETKİNLİK YÖNETİMİ (kendi topluluğu için)
================================================================ */

async function getEtkinlikler(req, res) {
  try {
    const topluluk = await kendiTopluluqunuBul(req.user.id);
    if (!topluluk) return res.status(404).json({ basarili: false, mesaj: 'Size atanmış bir topluluk bulunamadı.' });

    const [rows] = await pool.query(
      'SELECT * FROM etkinlikler WHERE topluluk_id = ? ORDER BY tarih DESC',
      [topluluk.id]
    );
    return res.json({ basarili: true, etkinlikler: rows });
  } catch (err) {
    console.error('Etkinlik listeleme hatası:', err);
    return res.status(500).json({ basarili: false, mesaj: 'Etkinlikler alınırken hata oluştu.' });
  }
}

async function etkinlikOlustur(req, res) {
  try {
    const topluluk = await kendiTopluluqunuBul(req.user.id);
    if (!topluluk) return res.status(404).json({ basarili: false, mesaj: 'Size atanmış bir topluluk bulunamadı.' });

    const { baslik, aciklama, tarih, konum } = req.body;
    if (!baslik || !tarih) {
      return res.status(400).json({ basarili: false, mesaj: 'Başlık ve tarih zorunludur.' });
    }

    const [sonuc] = await pool.query(
      `INSERT INTO etkinlikler (topluluk_id, baslik, aciklama, tarih, konum, durum)
       VALUES (?, ?, ?, ?, ?, 'beklemede')`,
      [topluluk.id, baslik, aciklama || null, tarih, konum || null]
    );

    return res.status(201).json({ basarili: true, mesaj: 'Etkinlik oluşturuldu ve yönetici onayına gönderildi.', id: sonuc.insertId });
  } catch (err) {
    console.error('Etkinlik oluşturma hatası:', err);
    return res.status(500).json({ basarili: false, mesaj: 'Etkinlik oluşturulurken hata oluştu.' });
  }
}

async function etkinlikGuncelle(req, res) {
  try {
    const topluluk = await kendiTopluluqunuBul(req.user.id);
    if (!topluluk) return res.status(404).json({ basarili: false, mesaj: 'Size atanmış bir topluluk bulunamadı.' });

    const { id } = req.params;
    const { baslik, aciklama, tarih, konum } = req.body;

    const [sonuc] = await pool.query(
      `UPDATE etkinlikler SET baslik=?, aciklama=?, tarih=?, konum=?, durum='beklemede'
       WHERE id=? AND topluluk_id=?`,
      [baslik, aciklama || null, tarih, konum || null, id, topluluk.id]
    );
    if (sonuc.affectedRows === 0) {
      return res.status(404).json({ basarili: false, mesaj: 'Etkinlik bulunamadı veya size ait değil.' });
    }

    return res.json({ basarili: true, mesaj: 'Etkinlik güncellendi ve yeniden onaya gönderildi.' });
  } catch (err) {
    console.error('Etkinlik güncelleme hatası:', err);
    return res.status(500).json({ basarili: false, mesaj: 'Etkinlik güncellenirken hata oluştu.' });
  }
}

async function etkinlikSil(req, res) {
  try {
    const topluluk = await kendiTopluluqunuBul(req.user.id);
    if (!topluluk) return res.status(404).json({ basarili: false, mesaj: 'Size atanmış bir topluluk bulunamadı.' });

    const { id } = req.params;
    const [sonuc] = await pool.query(
      'DELETE FROM etkinlikler WHERE id = ? AND topluluk_id = ?',
      [id, topluluk.id]
    );
    if (sonuc.affectedRows === 0) {
      return res.status(404).json({ basarili: false, mesaj: 'Etkinlik bulunamadı veya size ait değil.' });
    }

    return res.json({ basarili: true, mesaj: 'Etkinlik silindi.' });
  } catch (err) {
    console.error('Etkinlik silme hatası:', err);
    return res.status(500).json({ basarili: false, mesaj: 'Etkinlik silinirken hata oluştu.' });
  }
}

module.exports = {
  getIstatistikler,
  getTopluluqProfili,
  topluluqProfiliGuncelle,
  topluluqGorselYukle,
  getUyeler,
  uyelikDurumGuncelle,
  getEtkinlikler,
  etkinlikOlustur,
  etkinlikGuncelle,
  etkinlikSil
};