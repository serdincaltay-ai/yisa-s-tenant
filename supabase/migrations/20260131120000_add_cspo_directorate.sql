-- =====================================================
-- YİSA-S CSPO (Spor Direktörlüğü) Ekleme
-- Anayasa uyumu için 13. direktörlük
-- Tarih: 31 Ocak 2026
-- =====================================================

-- CSPO direktörlüğü ekle (yoksa)
INSERT INTO celf_directorates (kod, isim, tam_isim, aciklama, sorumluluk_alanlari, sira)
VALUES (
  'CSPO',
  'CSPO',
  'Chief Sports Officer - Spor Direktörlüğü',
  'Hareket havuzu, antrenman programları, sporcu değerlendirme, seviye sistemi, branş yönetimi',
  '["hareket_havuzu", "antrenman_programi", "sporcu_degerlendirme", "seviye_sistemi", "brans_yonetimi", "kamp_planlama"]'::jsonb,
  13
)
ON CONFLICT (kod) DO UPDATE SET
  tam_isim = EXCLUDED.tam_isim,
  aciklama = EXCLUDED.aciklama,
  sorumluluk_alanlari = EXCLUDED.sorumluluk_alanlari,
  sira = EXCLUDED.sira;

-- CSPO'yu da CELF robotuna bağla
UPDATE celf_directorates 
SET ana_robot_id = (SELECT id FROM robots WHERE kod = 'ROB-CELF')
WHERE kod = 'CSPO' AND ana_robot_id IS NULL;

-- Doğrulama
SELECT kod, isim, tam_isim, sira FROM celf_directorates ORDER BY sira;
