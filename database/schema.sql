-- ============================================================
-- Öğrenci Toplulukları Otomasyonu - Veritabanı Şeması
-- Malatya Turgut Özal Üniversitesi
-- ============================================================

CREATE DATABASE IF NOT EXISTS ogrenci_toplulugu_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_turkish_ci;

USE ogrenci_toplulugu_db;

-- ------------------------------------------------------------
-- Kullanıcılar (admin, danışman, başkan, öğrenci -> tek tablo)
-- ------------------------------------------------------------
CREATE TABLE kullanicilar (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    ad              VARCHAR(50)  NOT NULL,
    soyad           VARCHAR(50)  NOT NULL,
    ogrenci_no      VARCHAR(20)  UNIQUE,          -- öğrenci/başkan için, danışman/admin NULL olabilir
    email           VARCHAR(100) NOT NULL UNIQUE,
    sifre           VARCHAR(255) NOT NULL,        -- bcrypt hash
    rol             ENUM('admin','danisman','baskan','ogrenci') NOT NULL DEFAULT 'ogrenci',
    telefon         VARCHAR(20),
    bolum           VARCHAR(100),
    aktif           TINYINT(1) NOT NULL DEFAULT 1,
    sifirlama_kodu       VARCHAR(10)  NULL,       -- şifremi unuttum: e-postaya gönderilen 6 haneli doğrulama kodu
    sifirlama_son_tarih  DATETIME     NULL,       -- doğrulama kodunun geçerlilik süresi
    olusturma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Topluluklar
-- ------------------------------------------------------------
CREATE TABLE topluluklar (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    ad              VARCHAR(100) NOT NULL,
    aciklama        TEXT,
    logo_url        VARCHAR(255),
    kapak_gorseli   VARCHAR(255),                 -- başkanın yüklediği topluluk tanıtım görseli
    detay_bilgi     TEXT,                         -- başkanın girdiği detaylı topluluk bilgisi
    iletisim_bilgisi VARCHAR(150),                -- iletişim e-postası / telefonu
    sosyal_medya    VARCHAR(150),                 -- Instagram/website vb. link
    baskan_id       INT,
    danisman_id     INT,
    durum           ENUM('beklemede','onaylandi','reddedildi','pasif') NOT NULL DEFAULT 'beklemede',
    kurulis_tarihi  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (baskan_id)   REFERENCES kullanicilar(id) ON DELETE SET NULL,
    FOREIGN KEY (danisman_id) REFERENCES kullanicilar(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Üyelikler (öğrenci - topluluk ilişkisi)
-- ------------------------------------------------------------
CREATE TABLE uyelikler (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    topluluk_id     INT NOT NULL,
    ogrenci_id      INT NOT NULL,
    durum           ENUM('beklemede','onaylandi','reddedildi','ayrildi') NOT NULL DEFAULT 'beklemede',
    katilim_tarihi  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (topluluk_id) REFERENCES topluluklar(id) ON DELETE CASCADE,
    FOREIGN KEY (ogrenci_id)  REFERENCES kullanicilar(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_uyelik (topluluk_id, ogrenci_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Etkinlikler
-- ------------------------------------------------------------
CREATE TABLE etkinlikler (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    topluluk_id     INT NOT NULL,
    baslik          VARCHAR(150) NOT NULL,
    aciklama        TEXT,
    tarih           DATETIME NOT NULL,
    konum           VARCHAR(150),
    durum           ENUM('beklemede','onaylandi','reddedildi','tamamlandi','iptal') NOT NULL DEFAULT 'beklemede',
    olusturma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (topluluk_id) REFERENCES topluluklar(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- İşlem Kayıtları (Log) — admin panelinde görüntülenen denetim kaydı
-- Sistemdeki her API isteği için kimin, ne zaman, nereden (IP/tarayıcı),
-- ne kadar sürede hangi işlemi yaptığını tutar.
-- ------------------------------------------------------------
CREATE TABLE islem_kayitlari (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    kullanici_id      INT NULL,                    -- kullanıcı silinse de kayıt kalsın diye ON DELETE SET NULL
    kullanici_adi     VARCHAR(100),                 -- işlem anındaki ad soyad (anlık görüntü)
    kullanici_email   VARCHAR(100),
    rol               VARCHAR(20),
    yontem            VARCHAR(10) NOT NULL,         -- GET / POST / PUT / PATCH / DELETE
    yol               VARCHAR(255) NOT NULL,        -- /api/baskan/etkinlikler/5
    eylem             VARCHAR(255) NOT NULL,        -- okunaklı açıklama: "Etkinlik güncelledi"
    detay             VARCHAR(255),                 -- ek bağlam (kayıt no, denenen e-posta vb.)
    durum_kodu        INT,                          -- HTTP yanıt kodu (200, 401, 500 ...)
    basarili          TINYINT(1) NOT NULL DEFAULT 1,
    ip_adresi         VARCHAR(64),
    tarayici_bilgisi  VARCHAR(255),                 -- User-Agent
    sure_ms           INT,                          -- isteğin işlenme süresi (milisaniye)
    olusturma_tarihi  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (kullanici_id) REFERENCES kullanicilar(id) ON DELETE SET NULL,
    INDEX idx_olusturma_tarihi (olusturma_tarihi),
    INDEX idx_kullanici_id (kullanici_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Varsayılan admin kullanıcısı
-- Şifre: Admin123! (bcrypt hash aşağıda örnektir, seed.js ile de oluşturulabilir)
-- NOT: Gerçek hash'i backend/seed.js scripti üretip buraya yazar / veya scripti çalıştırın.
-- ------------------------------------------------------------
-- INSERT INTO kullanicilar (ad, soyad, email, sifre, rol)
-- VALUES ('Sistem', 'Yöneticisi', 'admin@mtu.edu.tr', '$2a$10$REPLACE_WITH_HASH', 'admin');
