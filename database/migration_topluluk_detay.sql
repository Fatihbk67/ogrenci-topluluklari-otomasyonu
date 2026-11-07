USE ogrenci_toplulugu_db;

ALTER TABLE topluluklar
  ADD COLUMN kapak_gorseli    VARCHAR(255) NULL AFTER logo_url,
  ADD COLUMN detay_bilgi      TEXT         NULL AFTER kapak_gorseli,
  ADD COLUMN iletisim_bilgisi VARCHAR(150) NULL AFTER detay_bilgi,
  ADD COLUMN sosyal_medya     VARCHAR(150) NULL AFTER iletisim_bilgisi;