-- ============================================================
-- Migration: Şifremi Unuttum / E-posta Doğrulama Kodu Alanları
-- Bu scripti sadece daha önce kurulmuş (eski) bir veritabanında
-- çalıştırın. Sıfırdan kurulumda schema.sql zaten bu alanları içerir.
-- ============================================================

USE ogrenci_toplulugu_db;

ALTER TABLE kullanicilar
  ADD COLUMN sifirlama_kodu      VARCHAR(10) NULL AFTER aktif,
  ADD COLUMN sifirlama_son_tarih DATETIME    NULL AFTER sifirlama_kodu;
