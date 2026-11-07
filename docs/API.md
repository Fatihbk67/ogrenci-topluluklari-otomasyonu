# API Referansı — Login & Admin

Tüm istekler `Content-Type: application/json` ile gönderilmelidir.
Admin uç noktaları `Authorization: Bearer <token>` header'ı gerektirir.

## Auth

### POST /api/auth/login
İstek gövdesi:
```json
{ "email": "admin@mtu.edu.tr", "sifre": "Admin123!" }
```
Başarılı yanıt:
```json
{
  "basarili": true,
  "token": "...",
  "kullanici": { "id": 1, "ad": "Sistem", "soyad": "Yöneticisi", "email": "...", "rol": "admin" }
}
```

### GET /api/auth/ben
Giriş yapmış kullanıcının bilgilerini döner. Token zorunlu.

---

## Admin — Dashboard

### GET /api/admin/istatistikler
Toplam kullanıcı/topluluk/öğrenci sayıları, bekleyen onaylar,
son 5 kullanıcı ve son 5 topluluk döner.

---

## Admin — Kullanıcılar

| Metot | Yol | Açıklama |
|---|---|---|
| GET | /api/admin/kullanicilar?arama=&rol= | Listele (filtreli) |
| GET | /api/admin/kullanicilar/secenekler?rol= | Role göre kısa liste (dropdown için) |
| GET | /api/admin/kullanicilar/:id | Tek kullanıcı getir |
| POST | /api/admin/kullanicilar | Yeni kullanıcı oluştur |
| PUT | /api/admin/kullanicilar/:id | Kullanıcı güncelle |
| DELETE | /api/admin/kullanicilar/:id | Kullanıcı sil |

POST/PUT gövdesi:
```json
{
  "ad": "Ayşe", "soyad": "Yılmaz", "email": "ayse@ogr.mtu.edu.tr",
  "sifre": "en_az_6_karakter", "rol": "ogrenci",
  "ogrenci_no": "2021123456", "telefon": "5xx...", "bolum": "Yazılım Mühendisliği"
}
```
PUT isteğinde `sifre` boş bırakılırsa mevcut şifre korunur.

---

## Admin — Topluluklar

| Metot | Yol | Açıklama |
|---|---|---|
| GET | /api/admin/topluluklar?durum= | Listele (durum filtreli) |
| POST | /api/admin/topluluklar | Yeni topluluk oluştur |
| PUT | /api/admin/topluluklar/:id | Topluluk bilgilerini güncelle |
| PATCH | /api/admin/topluluklar/:id/durum | Durumu güncelle (onayla/reddet/pasif) |
| DELETE | /api/admin/topluluklar/:id | Topluluk sil |

POST/PUT gövdesi:
```json
{
  "ad": "Yazılım Topluluğu",
  "aciklama": "...",
  "baskan_id": 5,
  "danisman_id": 8
}
```

PATCH gövdesi:
```json
{ "durum": "onaylandi" }
```
Geçerli değerler: `beklemede`, `onaylandi`, `reddedildi`, `pasif`

---

## Hata Formatı
Tüm hatalar aynı formatta döner:
```json
{ "basarili": false, "mesaj": "Açıklayıcı hata mesajı" }
```
