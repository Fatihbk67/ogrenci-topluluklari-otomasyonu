const pool = require('../config/db');

async function getTopluluklar(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT t.id, t.ad, t.aciklama, t.logo_url, t.kapak_gorseli, t.detay_bilgi,
              t.iletisim_bilgisi, t.sosyal_medya,
              b.ad AS baskan_ad, b.soyad AS baskan_soyad,
              (SELECT COUNT(*) FROM uyelikler u2 WHERE u2.topluluk_id = t.id AND u2.durum = 'onaylandi') AS uyeSayisi,
              u.durum AS uyelik_durumu
       FROM topluluklar t
       LEFT JOIN kullanicilar b ON t.baskan_id = b.id
       LEFT JOIN uyelikler u ON u.topluluk_id = t.id AND u.ogrenci_id = ?
       WHERE t.durum = 'onaylandi'
       ORDER BY t.ad`,
      [req.user.id]
    );
    return res.json({ basarili: true, topluluklar: rows });
  } catch (err) {
    console.error('Topluluk listeleme hatası:', err);
    return res.status(500).json({ basarili: false, mesaj: 'Topluluklar alınırken hata oluştu.' });
  }
}

async function basvuruYap(req, res) {
  try {
    const { id } = req.params;
    const ogrenciId = req.user.id;

    const [topluluk] = await pool.query(
      "SELECT id FROM topluluklar WHERE id = ? AND durum = 'onaylandi'",
      [id]
    );
    if (topluluk.length === 0) {
      return res.status(404).json({ basarili: false, mesaj: 'Topluluk bulunamadı.' });
    }

    const [mevcut] = await pool.query(
      'SELECT id, durum FROM uyelikler WHERE topluluk_id = ? AND ogrenci_id = ?',
      [id, ogrenciId]
    );

    if (mevcut.length > 0) {
      if (mevcut[0].durum === 'onaylandi' || mevcut[0].durum === 'beklemede') {
        return res.status(409).json({ basarili: false, mesaj: 'Bu topluluğa zaten üyesiniz veya başvurunuz inceleniyor.' });
      }
      await pool.query("UPDATE uyelikler SET durum = 'beklemede' WHERE id = ?", [mevcut[0].id]);
      return res.json({ basarili: true, mesaj: 'Başvurunuz tekrar gönderildi.' });
    }

    await pool.query(
      "INSERT INTO uyelikler (topluluk_id, ogrenci_id, durum) VALUES (?, ?, 'beklemede')",
      [id, ogrenciId]
    );
    return res.status(201).json({ basarili: true, mesaj: 'Başvurunuz alındı, topluluk başkanının onayı bekleniyor.' });

  } catch (err) {
    console.error('Başvuru hatası:', err);
    return res.status(500).json({ basarili: false, mesaj: 'Başvuru gönderilirken hata oluştu.' });
  }
}

async function basvuruIptal(req, res) {
  try {
    const { id } = req.params;
    const ogrenciId = req.user.id;

    const [sonuc] = await pool.query(
      'DELETE FROM uyelikler WHERE topluluk_id = ? AND ogrenci_id = ?',
      [id, ogrenciId]
    );
    if (sonuc.affectedRows === 0) {
      return res.status(404).json({ basarili: false, mesaj: 'Üyelik kaydı bulunamadı.' });
    }
    return res.json({ basarili: true, mesaj: 'İşlem tamamlandı.' });
  } catch (err) {
    console.error('Başvuru iptal hatası:', err);
    return res.status(500).json({ basarili: false, mesaj: 'İşlem sırasında hata oluştu.' });
  }
}

module.exports = { getTopluluklar, basvuruYap, basvuruIptal };