-- =====================================================
-- YİSA-S 7 ROBOT + 13 DİREKTÖRLÜK SEED
-- Omurga Adım 6: Çekirdek veri
-- Tarih: 31 Ocak 2026
-- =====================================================

-- 1. 7 ÇEKİRDEK ROBOT
INSERT INTO robots (kod, isim, hiyerarsi_sirasi, aciklama, ai_model, durum)
VALUES
  ('ROB-PATRON', 'Patron Asistanı', 1, 'Claude + GPT + Gemini + Together + V0 + Cursor - Patronun kişisel asistanı, danışmanlık, özel işler', 'multi', 'aktif'),
  ('ROB-CIO', 'CIO Robot', 2, 'Strateji Beyin - Komut yorumlama, önceliklendirme, koordinasyon', 'claude', 'aktif'),
  ('ROB-SIBER', 'Siber Güvenlik', 3, '3 Duvar sistemi, bypass önleme, güvenlik denetimi', NULL, 'aktif'),
  ('ROB-ARSIV', 'Veri Arşivleme', 4, 'Yedekleme, şablon kütüphanesi, AES-256 şifreleme', NULL, 'aktif'),
  ('ROB-CEO', 'CEO Organizatör', 5, 'Kural tabanlı, AI yok - Görev dağıtımı, CELF yönetimi', NULL, 'aktif'),
  ('ROB-CELF', 'CELF Merkez', 6, '13 Direktörlük havuzu, AI motor koordinasyonu', 'multi', 'aktif'),
  ('ROB-COO', 'COO Yardımcı', 7, 'Operasyon koordinasyonu, franchise yönetimi', 'gemini', 'aktif'),
  ('ROB-VITRIN', 'YİSA-S Vitrin', 8, 'Franchise hizmetleri, tenant yüzü', 'gemini', 'aktif')
ON CONFLICT (kod) DO UPDATE SET
  isim = EXCLUDED.isim,
  hiyerarsi_sirasi = EXCLUDED.hiyerarsi_sirasi,
  aciklama = EXCLUDED.aciklama,
  ai_model = EXCLUDED.ai_model,
  durum = EXCLUDED.durum;

-- 2. 13 DİREKTÖRLÜK
INSERT INTO celf_directorates (kod, isim, tam_isim, aciklama, sorumluluk_alanlari, sira)
VALUES
  ('CFO', 'CFO', 'Chief Financial Officer', 'Finans yönetimi, bütçe, gelir-gider, tahsilat', '["finans", "butce", "gelir", "gider", "tahsilat"]'::jsonb, 1),
  ('CTO', 'CTO', 'Chief Technology Officer', 'Teknoloji yönetimi, kod, API, sistem', '["sistem", "kod", "api", "performans", "hata"]'::jsonb, 2),
  ('CIO', 'CIO', 'Chief Information Officer', 'Bilgi sistemleri, veri yönetimi, entegrasyon', '["veri", "database", "entegrasyon", "tablo"]'::jsonb, 3),
  ('CMO', 'CMO', 'Chief Marketing Officer', 'Pazarlama, kampanya, sosyal medya', '["kampanya", "reklam", "sosyal_medya", "tanitim"]'::jsonb, 4),
  ('CHRO', 'CHRO', 'Chief Human Resources Officer', 'İnsan kaynakları, personel, eğitim', '["personel", "egitim", "performans", "izin"]'::jsonb, 5),
  ('CLO', 'CLO', 'Chief Legal Officer', 'Hukuk, sözleşme, KVKK, uyum', '["sozlesme", "patent", "uyum", "kvkk"]'::jsonb, 6),
  ('CSO_SATIS', 'CSO-Satış', 'Chief Sales Officer', 'Satış, müşteri, CRM', '["musteri", "siparis", "crm", "satis"]'::jsonb, 7),
  ('CPO', 'CPO', 'Chief Product Officer', 'Ürün, tasarım, şablon, UI/UX', '["sablon", "tasarim", "ozellik", "ui", "sayfa"]'::jsonb, 8),
  ('CDO', 'CDO', 'Chief Data Officer', 'Veri analizi, rapor, dashboard', '["analiz", "rapor", "dashboard", "istatistik"]'::jsonb, 9),
  ('CISO', 'CISO', 'Chief Information Security Officer', 'Bilgi güvenliği, audit, erişim', '["guvenlik", "audit", "erisim", "sifre"]'::jsonb, 10),
  ('CCO', 'CCO', 'Chief Customer Officer', 'Müşteri deneyimi, destek, şikayet', '["destek", "sikayet", "memnuniyet", "ticket"]'::jsonb, 11),
  ('CSO_STRATEJI', 'CSO-Strateji', 'Chief Strategy Officer', 'Strateji, plan, hedef, büyüme', '["plan", "hedef", "buyume", "strateji", "vizyon"]'::jsonb, 12),
  ('CSPO', 'CSPO', 'Chief Sports Officer', 'Spor yönetimi, antrenman, hareket havuzu', '["antrenman", "hareket", "sporcu", "program", "seviye", "brans"]'::jsonb, 13)
ON CONFLICT (kod) DO UPDATE SET
  isim = EXCLUDED.isim,
  tam_isim = EXCLUDED.tam_isim,
  aciklama = EXCLUDED.aciklama,
  sorumluluk_alanlari = EXCLUDED.sorumluluk_alanlari,
  sira = EXCLUDED.sira;

-- 3. DİREKTÖRLÜKLERİ CELF ROBOTUNA BAĞLA
UPDATE celf_directorates 
SET ana_robot_id = (SELECT id FROM robots WHERE kod = 'ROB-CELF')
WHERE ana_robot_id IS NULL;

-- 4. 13 ROL
INSERT INTO role_permissions (rol_kodu, rol_adi, hiyerarsi_seviyesi, aciklama)
VALUES
  ('ROL-0', 'Patron', 0, 'Tek yetkili - Serdinç Altay'),
  ('ROL-1', 'Patron Asistanı', 1, 'AI asistan katmanı'),
  ('ROL-2', 'Alt Admin', 2, 'Sistem yöneticisi'),
  ('ROL-3', 'Tesis Müdürü', 3, 'Tesis operasyon yönetimi'),
  ('ROL-4', 'Sportif Direktör', 4, 'Spor programları yönetimi'),
  ('ROL-5', 'Uzman Antrenör', 5, 'Kıdemli antrenör'),
  ('ROL-6', 'Antrenör', 6, 'Standart antrenör'),
  ('ROL-7', 'Yardımcı/Stajyer', 7, 'Yardımcı antrenör, stajyer'),
  ('ROL-8', 'Kayıt Personeli', 8, 'Resepsiyon, kayıt işlemleri'),
  ('ROL-9', 'Temizlik/Bakım', 9, 'Temizlik ve bakım personeli'),
  ('ROL-10', 'Veli', 10, 'Sporcu velisi'),
  ('ROL-11', 'Sporcu', 11, 'Aktif sporcu'),
  ('ROL-12', 'Misafir Sporcu', 12, 'Deneme/misafir sporcu')
ON CONFLICT (rol_kodu) DO UPDATE SET
  rol_adi = EXCLUDED.rol_adi,
  hiyerarsi_seviyesi = EXCLUDED.hiyerarsi_seviyesi,
  aciklama = EXCLUDED.aciklama;

-- 5. 7 ÇEKİRDEK KURAL
INSERT INTO core_rules (kural_no, kural_kodu, baslik, aciklama, kategori, zorunlu)
VALUES
  (1, 'KURAL-1', 'Hiyerarşi Koruma', 'Katman 0-7 hiyerarşisi değiştirilemez', 'hiyerarsi', true),
  (2, 'KURAL-2', 'Patron Onayı', 'Deploy, commit, fiyat, yetki değişikliği Patron onayı gerektirir', 'onay', true),
  (3, 'KURAL-3', 'Veri Silme Yasağı', 'AI audit_log, core_rules, patron verisi silemez', 'veri', true),
  (4, 'KURAL-4', 'RLS Zorunluluğu', 'Tüm tablolarda tenant izolasyonu aktif', 'guvenlik', true),
  (5, 'KURAL-5', 'Token Limiti', 'Günlük token limiti aşılamaz, otomatik durdurma', 'maliyet', true),
  (6, 'KURAL-6', 'Yasak Bölgeler', 'AI .env, API_KEY, şifre alanlarına erişemez', 'guvenlik', true),
  (7, 'KURAL-7', 'Franchise Veri İzolasyonu', 'Franchise birbirinin verisine erişemez', 'veri', true)
ON CONFLICT (kural_kodu) DO NOTHING;

-- DOĞRULAMA
SELECT 'ROBOTLAR:' AS kontrol, COUNT(*) AS sayi FROM robots WHERE durum = 'aktif';
SELECT 'DİREKTÖRLÜKLER:' AS kontrol, COUNT(*) AS sayi FROM celf_directorates;
SELECT 'ROLLER:' AS kontrol, COUNT(*) AS sayi FROM role_permissions;
SELECT 'KURALLAR:' AS kontrol, COUNT(*) AS sayi FROM core_rules;
