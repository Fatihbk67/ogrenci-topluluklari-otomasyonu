/**
 * API isteklerini (yöntem + yol) okunaklı, Türkçe eylem açıklamalarına çevirir.
 * Log Kaydı ekranında kullanıcıların "ne yaptığını" anlaşılır şekilde göstermek içindir.
 *
 * Kurallar yukarıdan aşağıya sırayla denenir, ilk eşleşen kullanılır.
 * Yeni bir endpoint eklendiğinde buraya bir satır eklemeniz yeterlidir.
 */

const KURALLAR = [
  // ---- Kimlik doğrulama ----
  { yontem: 'POST', desen: /^\/api\/auth\/login$/, eylem: 'Giriş yapmayı denedi' },
  { yontem: 'POST', desen: /^\/api\/auth\/kayit$/, eylem: 'Yeni hesap oluşturdu' },
  { yontem: 'GET', desen: /^\/api\/auth\/ben$/, eylem: 'Oturum bilgilerini görüntüledi' },
  { yontem: 'POST', desen: /^\/api\/auth\/sifremi-unuttum$/, eylem: 'Şifre sıfırlama kodu istedi' },
  { yontem: 'POST', desen: /^\/api\/auth\/kod-dogrula$/, eylem: 'Şifre sıfırlama kodunu doğrulamayı denedi' },
  { yontem: 'POST', desen: /^\/api\/auth\/sifre-sifirla$/, eylem: 'Şifresini sıfırladı' },

  // ---- Admin: kullanıcı yönetimi ----
  { yontem: 'GET', desen: /^\/api\/admin\/kullanicilar\/secenekler$/, eylem: 'Kullanıcı seçeneklerini görüntüledi' },
  { yontem: 'GET', desen: /^\/api\/admin\/kullanicilar\/\d+$/, eylem: 'Kullanıcı detayını görüntüledi' },
  { yontem: 'GET', desen: /^\/api\/admin\/kullanicilar$/, eylem: 'Kullanıcı listesini görüntüledi' },
  { yontem: 'POST', desen: /^\/api\/admin\/kullanicilar$/, eylem: 'Yeni kullanıcı oluşturdu' },
  { yontem: 'PUT', desen: /^\/api\/admin\/kullanicilar\/\d+$/, eylem: 'Kullanıcı bilgilerini güncelledi' },
  { yontem: 'DELETE', desen: /^\/api\/admin\/kullanicilar\/\d+$/, eylem: 'Kullanıcı sildi' },

  // ---- Admin: topluluk yönetimi ----
  { yontem: 'GET', desen: /^\/api\/admin\/topluluklar$/, eylem: 'Topluluk listesini görüntüledi' },
  { yontem: 'POST', desen: /^\/api\/admin\/topluluklar$/, eylem: 'Yeni topluluk oluşturdu' },
  { yontem: 'PUT', desen: /^\/api\/admin\/topluluklar\/\d+$/, eylem: 'Topluluk bilgilerini güncelledi' },
  { yontem: 'PATCH', desen: /^\/api\/admin\/topluluklar\/\d+\/durum$/, eylem: 'Topluluk durumunu güncelledi (onay/red)' },
  { yontem: 'DELETE', desen: /^\/api\/admin\/topluluklar\/\d+$/, eylem: 'Topluluk sildi' },

  // ---- Admin: etkinlik yönetimi ----
  { yontem: 'GET', desen: /^\/api\/admin\/etkinlikler\/topluluk-secenekleri$/, eylem: 'Etkinlik formu için topluluk seçeneklerini görüntüledi' },
  { yontem: 'GET', desen: /^\/api\/admin\/etkinlikler$/, eylem: 'Etkinlik listesini görüntüledi' },
  { yontem: 'POST', desen: /^\/api\/admin\/etkinlikler$/, eylem: 'Yeni etkinlik oluşturdu' },
  { yontem: 'PUT', desen: /^\/api\/admin\/etkinlikler\/\d+$/, eylem: 'Etkinlik güncelledi' },
  { yontem: 'PATCH', desen: /^\/api\/admin\/etkinlikler\/\d+\/durum$/, eylem: 'Etkinlik durumunu güncelledi' },
  { yontem: 'DELETE', desen: /^\/api\/admin\/etkinlikler\/\d+$/, eylem: 'Etkinlik sildi' },

  // ---- Admin: log kayıtları (kendi ekranı) ----
  { yontem: 'GET', desen: /^\/api\/admin\/log-kayitlari$/, eylem: 'Log kayıtlarını görüntüledi' },

  // ---- Admin: dashboard ----
  { yontem: 'GET', desen: /^\/api\/admin\/istatistikler$/, eylem: 'Yönetici panel istatistiklerini görüntüledi' },

  // ---- Başkan ----
  { yontem: 'GET', desen: /^\/api\/baskan\/istatistikler$/, eylem: 'Başkan panel istatistiklerini görüntüledi' },
  { yontem: 'GET', desen: /^\/api\/baskan\/topluluk-profili$/, eylem: 'Topluluk profilini görüntüledi' },
  { yontem: 'PUT', desen: /^\/api\/baskan\/topluluk-profili$/, eylem: 'Topluluk profilini güncelledi' },
  { yontem: 'POST', desen: /^\/api\/baskan\/topluluk-profili\/gorsel$/, eylem: 'Topluluk görseli yükledi' },
  { yontem: 'GET', desen: /^\/api\/baskan\/uyeler$/, eylem: 'Üye listesini görüntüledi' },
  { yontem: 'PATCH', desen: /^\/api\/baskan\/uyeler\/\d+\/durum$/, eylem: 'Üyelik durumunu güncelledi' },
  { yontem: 'GET', desen: /^\/api\/baskan\/etkinlikler$/, eylem: 'Etkinlik listesini görüntüledi' },
  { yontem: 'POST', desen: /^\/api\/baskan\/etkinlikler$/, eylem: 'Yeni etkinlik oluşturdu' },
  { yontem: 'PUT', desen: /^\/api\/baskan\/etkinlikler\/\d+$/, eylem: 'Etkinlik güncelledi' },
  { yontem: 'DELETE', desen: /^\/api\/baskan\/etkinlikler\/\d+$/, eylem: 'Etkinlik sildi' },

  // ---- Öğrenci ----
  { yontem: 'GET', desen: /^\/api\/ogrenci\/topluluklar$/, eylem: 'Topluluk listesini görüntüledi' },
  { yontem: 'POST', desen: /^\/api\/ogrenci\/topluluklar\/\d+\/basvuru$/, eylem: 'Topluluğa üyelik başvurusu yaptı' },
  { yontem: 'DELETE', desen: /^\/api\/ogrenci\/topluluklar\/\d+\/basvuru$/, eylem: 'Üyelik başvurusunu geri çekti / topluluktan ayrıldı' }
];

/**
 * @param {string} yontem  HTTP metodu (GET, POST, ...)
 * @param {string} yol     req.originalUrl (query string dahil olabilir, sorun değil)
 * @returns {string} okunaklı eylem açıklaması
 */
function eylemAciklamasiUret(yontem, yol) {
  const temizYol = (yol || '').split('?')[0]; // query string'i çıkar

  const eslesen = KURALLAR.find(k => k.yontem === yontem && k.desen.test(temizYol));
  if (eslesen) return eslesen.eylem;

  // Eşleşme bulunamazsa genel bir açıklama üret
  return `${yontem} isteği: ${temizYol}`;
}

module.exports = { eylemAciklamasiUret };
