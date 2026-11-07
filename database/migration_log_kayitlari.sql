-- ============================================================
-- Migration: İşlem Kayıtları (Log) Tablosu
-- Bu scripti sadece daha önce kurulmuş (eski) bir veritabanında
-- çalıştırın. Sıfırdan kurulumda schema.sql zaten bu tabloyu içerir.
-- ============================================================

USE ogrenci_toplulugu_db;

CREATE TABLE IF NOT EXISTS islem_kayitlari (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    kullanici_id      INT NULL,
    kullanici_adi     VARCHAR(100),
    kullanici_email   VARCHAR(100),
    rol               VARCHAR(20),
    yontem            VARCHAR(10) NOT NULL,
    yol               VARCHAR(255) NOT NULL,
    eylem             VARCHAR(255) NOT NULL,
    detay             VARCHAR(255),
    durum_kodu        INT,
    basarili          TINYINT(1) NOT NULL DEFAULT 1,
    ip_adresi         VARCHAR(64),
    tarayici_bilgisi  VARCHAR(255),
    sure_ms           INT,
    olusturma_tarihi  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (kullanici_id) REFERENCES kullanicilar(id) ON DELETE SET NULL,
    INDEX idx_olusturma_tarihi (olusturma_tarihi),
    INDEX idx_kullanici_id (kullanici_id)
) ENGINE=InnoDB;
