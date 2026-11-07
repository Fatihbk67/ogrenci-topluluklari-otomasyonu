# Öğrenci Toplulukları Otomasyonu
Malatya Turgut Özal Üniversitesi — Yazılım Mühendisliği Bitirme/Dönem Projesi

Bu aşamada tamamlanan bölüm: **Login Ekranı + Admin Paneli**
(Danışman, Başkan ve Öğrenci panelleri sıradaki adımlarda eklenecek.)

## Teknolojiler
- Node.js + Express (backend / REST API)
- MySQL (mysql2 paketi ile)
- JWT ile kimlik doğrulama, bcryptjs ile şifreleme
- Vanilla HTML / CSS / JS (frontend, framework yok)

## Klasör Yapısı
```
proje/
├── backend/
│   ├── config/db.js          -> MySQL bağlantı havuzu
│   ├── middleware/auth.js    -> JWT doğrulama + rol kontrolü
│   ├── controllers/          -> authController, adminController
│   ├── routes/                -> authRoutes, adminRoutes
│   ├── server.js              -> Express giriş noktası
│   ├── seed.js                -> Varsayılan admin kullanıcı oluşturur
│   ├── package.json
│   └── .env.example
├── database/
│   └── schema.sql             -> MySQL tablo şeması
├── frontend/
│   ├── login.html / css/login.css / js/login.js
│   └── admin/
│       ├── dashboard.html      -> İstatistik paneli
│       ├── kullanicilar.html   -> Kullanıcı CRUD
│       ├── topluluklar.html    -> Topluluk CRUD + onay/red
│       ├── css/admin.css
│       └── js/ (ortak.js, dashboard.js, kullanicilar.js, topluluklar.js)
└── docs/
    └── API.md                 -> Uç nokta (endpoint) referansı
```

## Kurulum Adımları

### 1) Veritabanını oluştur
MySQL Workbench, phpMyAdmin veya terminalden:
```bash
mysql -u root -p < database/schema.sql
```

### 2) Backend bağımlılıklarını kur
```bash
cd backend
npm install
```

### 3) Ortam değişkenlerini ayarla
`.env.example` dosyasını `.env` olarak kopyala ve kendi MySQL bilgilerinle doldur:
```bash
cp .env.example .env
```
`.env` içinde en azından `DB_PASSWORD` ve `JWT_SECRET` değerlerini kendine göre düzenle.

### 4) Varsayılan admin kullanıcısını oluştur
```bash
npm run seed
```
Bu komut şu bilgilerle bir admin hesabı oluşturur:
- E-posta: `admin@mtu.edu.tr`
- Şifre: `Admin123!`

> Giriş yaptıktan sonra bu şifreyi değiştirmen önerilir (şifre değiştirme
> ekranı ileride "profil" bölümünde eklenecek; şimdilik "Kullanıcılar"
> sayfasından admin kendi hesabını düzenleyerek şifresini değiştirebilir).

### 5) Sunucuyu başlat
```bash
npm run dev
```
(nodemon yoksa `npm start` ile de çalıştırabilirsin.)

Sunucu ayağa kalktığında tarayıcıdan:
```
http://localhost:5000
```
adresine gidildiğinde otomatik olarak giriş ekranı açılır.

## Şu An Çalışan Özellikler

**Login Ekranı**
- E-posta + şifre ile giriş
- JWT token üretimi ve `localStorage`'a kaydı
- Role göre otomatik yönlendirme (admin => admin/dashboard.html)
- Hatalı giriş / pasif hesap mesajları

**Admin Paneli**
- Kontrol paneli: toplam kullanıcı, topluluk, bekleyen onay sayıları, son kayıtlar
- Kullanıcı yönetimi: listeleme, arama, rol filtresi, ekleme, düzenleme, silme
- Topluluk yönetimi: listeleme, durum filtresi, ekleme, düzenleme, silme,
  tek tıkla onayla/reddet, başkan ve danışman atama

## Sırada Ne Var?
1. **Danışman Öğretim Üyesi Paneli** — sorumlu olduğu toplulukların
   etkinliklerini onaylama/reddetme, üye listelerini görüntüleme.
2. **Topluluk Başkanı Paneli** — etkinlik oluşturma, üyelik başvurularını
   onaylama, topluluk bilgilerini güncelleme.
3. **Öğrenci Paneli** — topluluklara göz atma, üyelik başvurusu yapma,
   katıldığı etkinlikleri görme.
4. Backend tarafında `danismanRoutes`, `baskanRoutes`, `ogrenciRoutes`
   ve ilgili controller'ların eklenmesi (routes klasöründeki admin
   yapısıyla birebir aynı desende).

Hazır olduğunda "danışman paneline geçelim" dersin, aynı desenle devam ederiz.
