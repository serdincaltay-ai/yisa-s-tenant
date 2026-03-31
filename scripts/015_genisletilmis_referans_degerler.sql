-- ═══════════════════════════════════════════════════════════════════════════════
-- YİSA-S — scripts/015_genisletilmis_referans_degerler.sql
-- Genişletilmiş Çocuk Ölçüm Sistemi — Yeni Parametreler + Seed Verileri
--
-- Yeni parametreler:
--   postur_skoru (0-18, 6 nokta x 0-3 puan: omuz, sırt, kalça, diz, ayak, baş)
--   asimetri_skoru (0-10, sağ/sol güç farkı yüzdesi)
--   beighton_skoru (0-9, hipermobilite testi)
--   duz_taban_derecesi (0-3: normal/hafif/orta/belirgin)
--   bmi_persentil (0-100, WHO persentil)
--   maturity_offset (yıl, PHV tahmini — Mirwald formülü)
--   psikomotor_puan (0-100, motor beceri bataryası)
--   patlayici_kuvvet (watt, dikey sıçrama x kilo bazlı)
--
-- Yaş aralığı: 5–15, Cinsiyet: E/K
-- Kaynaklar: WHO Child Growth Standards, TGF normları, Mirwald 2002, literatür
--
-- Tarih: 07 Mart 2026
-- ═══════════════════════════════════════════════════════════════════════════════

-- Mevcut genişletilmiş verileri temizle (idempotent seed)
DELETE FROM referans_degerler WHERE parametre IN (
  'postur_skoru', 'asimetri_skoru', 'beighton_skoru', 'duz_taban_derecesi',
  'bmi_persentil', 'maturity_offset', 'psikomotor_puan', 'patlayici_kuvvet'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- POSTÜR SKORU (0-18, 6 nokta x 0-3 puan: omuz, sırt, kalça, diz, ayak, baş)
-- Düşük skor = iyi postür, yüksek skor = sorunlu postür
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO referans_degerler (yas, cinsiyet, parametre, min_deger, max_deger, optimal_deger, kaynak) VALUES
-- Erkek (min=en iyi, max=kötü, optimal=ortalama)
(5,  'E', 'postur_skoru', 0, 6, 2, 'TGF'),
(6,  'E', 'postur_skoru', 0, 6, 2, 'TGF'),
(7,  'E', 'postur_skoru', 0, 7, 2, 'TGF'),
(8,  'E', 'postur_skoru', 0, 7, 3, 'TGF'),
(9,  'E', 'postur_skoru', 0, 8, 3, 'TGF'),
(10, 'E', 'postur_skoru', 0, 9, 3, 'TGF'),
(11, 'E', 'postur_skoru', 0, 10, 4, 'TGF'),
(12, 'E', 'postur_skoru', 0, 11, 4, 'TGF'),
(13, 'E', 'postur_skoru', 0, 12, 5, 'TGF'),
(14, 'E', 'postur_skoru', 0, 12, 5, 'TGF'),
(15, 'E', 'postur_skoru', 0, 12, 4, 'TGF'),
-- Kız
(5,  'K', 'postur_skoru', 0, 6, 2, 'TGF'),
(6,  'K', 'postur_skoru', 0, 6, 2, 'TGF'),
(7,  'K', 'postur_skoru', 0, 7, 2, 'TGF'),
(8,  'K', 'postur_skoru', 0, 8, 3, 'TGF'),
(9,  'K', 'postur_skoru', 0, 9, 3, 'TGF'),
(10, 'K', 'postur_skoru', 0, 10, 4, 'TGF'),
(11, 'K', 'postur_skoru', 0, 11, 4, 'TGF'),
(12, 'K', 'postur_skoru', 0, 11, 4, 'TGF'),
(13, 'K', 'postur_skoru', 0, 11, 4, 'TGF'),
(14, 'K', 'postur_skoru', 0, 10, 4, 'TGF'),
(15, 'K', 'postur_skoru', 0, 10, 3, 'TGF');

-- ─────────────────────────────────────────────────────────────────────────────
-- ASİMETRİ SKORU (0-10, sağ/sol güç farkı yüzdesi)
-- 0 = mükemmel simetri, 10 = ciddi asimetri
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO referans_degerler (yas, cinsiyet, parametre, min_deger, max_deger, optimal_deger, kaynak) VALUES
-- Erkek
(5,  'E', 'asimetri_skoru', 0, 4, 1.5, 'TGF'),
(6,  'E', 'asimetri_skoru', 0, 4, 1.5, 'TGF'),
(7,  'E', 'asimetri_skoru', 0, 4, 1.5, 'TGF'),
(8,  'E', 'asimetri_skoru', 0, 4, 1.5, 'TGF'),
(9,  'E', 'asimetri_skoru', 0, 5, 2.0, 'TGF'),
(10, 'E', 'asimetri_skoru', 0, 5, 2.0, 'TGF'),
(11, 'E', 'asimetri_skoru', 0, 5, 2.0, 'TGF'),
(12, 'E', 'asimetri_skoru', 0, 5, 2.0, 'TGF'),
(13, 'E', 'asimetri_skoru', 0, 6, 2.5, 'TGF'),
(14, 'E', 'asimetri_skoru', 0, 6, 2.5, 'TGF'),
(15, 'E', 'asimetri_skoru', 0, 5, 2.0, 'TGF'),
-- Kız
(5,  'K', 'asimetri_skoru', 0, 4, 1.5, 'TGF'),
(6,  'K', 'asimetri_skoru', 0, 4, 1.5, 'TGF'),
(7,  'K', 'asimetri_skoru', 0, 4, 1.5, 'TGF'),
(8,  'K', 'asimetri_skoru', 0, 4, 1.5, 'TGF'),
(9,  'K', 'asimetri_skoru', 0, 5, 2.0, 'TGF'),
(10, 'K', 'asimetri_skoru', 0, 5, 2.0, 'TGF'),
(11, 'K', 'asimetri_skoru', 0, 5, 2.0, 'TGF'),
(12, 'K', 'asimetri_skoru', 0, 5, 2.0, 'TGF'),
(13, 'K', 'asimetri_skoru', 0, 5, 2.0, 'TGF'),
(14, 'K', 'asimetri_skoru', 0, 5, 2.0, 'TGF'),
(15, 'K', 'asimetri_skoru', 0, 4, 1.5, 'TGF');

-- ─────────────────────────────────────────────────────────────────────────────
-- BEIGHTON SKORU (0-9, hipermobilite testi)
-- 0 = normal, ≥4 = hipermobil (Beighton criteria)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO referans_degerler (yas, cinsiyet, parametre, min_deger, max_deger, optimal_deger, kaynak) VALUES
-- Erkek (çocuklarda doğal olarak daha yüksek olabilir)
(5,  'E', 'beighton_skoru', 0, 6, 3, 'WHO'),
(6,  'E', 'beighton_skoru', 0, 6, 3, 'WHO'),
(7,  'E', 'beighton_skoru', 0, 6, 3, 'WHO'),
(8,  'E', 'beighton_skoru', 0, 5, 2, 'WHO'),
(9,  'E', 'beighton_skoru', 0, 5, 2, 'WHO'),
(10, 'E', 'beighton_skoru', 0, 5, 2, 'WHO'),
(11, 'E', 'beighton_skoru', 0, 5, 2, 'WHO'),
(12, 'E', 'beighton_skoru', 0, 4, 2, 'WHO'),
(13, 'E', 'beighton_skoru', 0, 4, 1, 'WHO'),
(14, 'E', 'beighton_skoru', 0, 4, 1, 'WHO'),
(15, 'E', 'beighton_skoru', 0, 3, 1, 'WHO'),
-- Kız (kızlarda doğal olarak daha hipermobil)
(5,  'K', 'beighton_skoru', 0, 7, 4, 'WHO'),
(6,  'K', 'beighton_skoru', 0, 7, 4, 'WHO'),
(7,  'K', 'beighton_skoru', 0, 7, 3, 'WHO'),
(8,  'K', 'beighton_skoru', 0, 6, 3, 'WHO'),
(9,  'K', 'beighton_skoru', 0, 6, 3, 'WHO'),
(10, 'K', 'beighton_skoru', 0, 6, 3, 'WHO'),
(11, 'K', 'beighton_skoru', 0, 6, 3, 'WHO'),
(12, 'K', 'beighton_skoru', 0, 5, 2, 'WHO'),
(13, 'K', 'beighton_skoru', 0, 5, 2, 'WHO'),
(14, 'K', 'beighton_skoru', 0, 5, 2, 'WHO'),
(15, 'K', 'beighton_skoru', 0, 4, 2, 'WHO');

-- ─────────────────────────────────────────────────────────────────────────────
-- DÜZ TABAN DERECESİ (0-3: 0=normal, 1=hafif, 2=orta, 3=belirgin)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO referans_degerler (yas, cinsiyet, parametre, min_deger, max_deger, optimal_deger, kaynak) VALUES
-- Erkek (küçük yaşlarda düz taban daha yaygın, yaşla düzelir)
(5,  'E', 'duz_taban_derecesi', 0, 2, 1, 'WHO'),
(6,  'E', 'duz_taban_derecesi', 0, 2, 1, 'WHO'),
(7,  'E', 'duz_taban_derecesi', 0, 2, 0, 'WHO'),
(8,  'E', 'duz_taban_derecesi', 0, 2, 0, 'WHO'),
(9,  'E', 'duz_taban_derecesi', 0, 2, 0, 'WHO'),
(10, 'E', 'duz_taban_derecesi', 0, 2, 0, 'WHO'),
(11, 'E', 'duz_taban_derecesi', 0, 2, 0, 'WHO'),
(12, 'E', 'duz_taban_derecesi', 0, 2, 0, 'WHO'),
(13, 'E', 'duz_taban_derecesi', 0, 2, 0, 'WHO'),
(14, 'E', 'duz_taban_derecesi', 0, 2, 0, 'WHO'),
(15, 'E', 'duz_taban_derecesi', 0, 2, 0, 'WHO'),
-- Kız
(5,  'K', 'duz_taban_derecesi', 0, 2, 1, 'WHO'),
(6,  'K', 'duz_taban_derecesi', 0, 2, 1, 'WHO'),
(7,  'K', 'duz_taban_derecesi', 0, 2, 0, 'WHO'),
(8,  'K', 'duz_taban_derecesi', 0, 2, 0, 'WHO'),
(9,  'K', 'duz_taban_derecesi', 0, 2, 0, 'WHO'),
(10, 'K', 'duz_taban_derecesi', 0, 2, 0, 'WHO'),
(11, 'K', 'duz_taban_derecesi', 0, 2, 0, 'WHO'),
(12, 'K', 'duz_taban_derecesi', 0, 2, 0, 'WHO'),
(13, 'K', 'duz_taban_derecesi', 0, 2, 0, 'WHO'),
(14, 'K', 'duz_taban_derecesi', 0, 2, 0, 'WHO'),
(15, 'K', 'duz_taban_derecesi', 0, 2, 0, 'WHO');

-- ─────────────────────────────────────────────────────────────────────────────
-- BMI PERSENTİL (0-100, WHO persentil)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO referans_degerler (yas, cinsiyet, parametre, min_deger, max_deger, optimal_deger, kaynak) VALUES
-- Erkek (5-85 persentil = normal, >85 = fazla kilolu, >95 = obez)
(5,  'E', 'bmi_persentil', 5, 85, 50, 'WHO'),
(6,  'E', 'bmi_persentil', 5, 85, 50, 'WHO'),
(7,  'E', 'bmi_persentil', 5, 85, 50, 'WHO'),
(8,  'E', 'bmi_persentil', 5, 85, 50, 'WHO'),
(9,  'E', 'bmi_persentil', 5, 85, 50, 'WHO'),
(10, 'E', 'bmi_persentil', 5, 85, 50, 'WHO'),
(11, 'E', 'bmi_persentil', 5, 85, 50, 'WHO'),
(12, 'E', 'bmi_persentil', 5, 85, 50, 'WHO'),
(13, 'E', 'bmi_persentil', 5, 85, 50, 'WHO'),
(14, 'E', 'bmi_persentil', 5, 85, 50, 'WHO'),
(15, 'E', 'bmi_persentil', 5, 85, 50, 'WHO'),
-- Kız
(5,  'K', 'bmi_persentil', 5, 85, 50, 'WHO'),
(6,  'K', 'bmi_persentil', 5, 85, 50, 'WHO'),
(7,  'K', 'bmi_persentil', 5, 85, 50, 'WHO'),
(8,  'K', 'bmi_persentil', 5, 85, 50, 'WHO'),
(9,  'K', 'bmi_persentil', 5, 85, 50, 'WHO'),
(10, 'K', 'bmi_persentil', 5, 85, 50, 'WHO'),
(11, 'K', 'bmi_persentil', 5, 85, 50, 'WHO'),
(12, 'K', 'bmi_persentil', 5, 85, 50, 'WHO'),
(13, 'K', 'bmi_persentil', 5, 85, 50, 'WHO'),
(14, 'K', 'bmi_persentil', 5, 85, 50, 'WHO'),
(15, 'K', 'bmi_persentil', 5, 85, 50, 'WHO');

-- ─────────────────────────────────────────────────────────────────────────────
-- MATURITY OFFSET (yıl, PHV tahmini — Mirwald 2002 formülü)
-- Negatif = PHV'ye ulaşmadı, 0 = PHV anında, Pozitif = PHV'yi geçti
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO referans_degerler (yas, cinsiyet, parametre, min_deger, max_deger, optimal_deger, kaynak) VALUES
-- Erkek (PHV ortalama ~14 yaş)
(5,  'E', 'maturity_offset', -10.0, -7.0, -8.5, 'WHO'),
(6,  'E', 'maturity_offset', -9.0, -6.0, -7.5, 'WHO'),
(7,  'E', 'maturity_offset', -8.0, -5.0, -6.5, 'WHO'),
(8,  'E', 'maturity_offset', -7.0, -4.0, -5.5, 'WHO'),
(9,  'E', 'maturity_offset', -6.0, -3.0, -4.5, 'WHO'),
(10, 'E', 'maturity_offset', -5.0, -2.0, -3.5, 'WHO'),
(11, 'E', 'maturity_offset', -4.0, -1.0, -2.5, 'WHO'),
(12, 'E', 'maturity_offset', -3.0, 0.0, -1.5, 'WHO'),
(13, 'E', 'maturity_offset', -2.0, 1.0, -0.5, 'WHO'),
(14, 'E', 'maturity_offset', -1.0, 2.0, 0.5, 'WHO'),
(15, 'E', 'maturity_offset', 0.0, 3.0, 1.5, 'WHO'),
-- Kız (PHV ortalama ~12 yaş)
(5,  'K', 'maturity_offset', -8.0, -5.0, -6.5, 'WHO'),
(6,  'K', 'maturity_offset', -7.0, -4.0, -5.5, 'WHO'),
(7,  'K', 'maturity_offset', -6.0, -3.0, -4.5, 'WHO'),
(8,  'K', 'maturity_offset', -5.0, -2.0, -3.5, 'WHO'),
(9,  'K', 'maturity_offset', -4.0, -1.0, -2.5, 'WHO'),
(10, 'K', 'maturity_offset', -3.0, 0.0, -1.5, 'WHO'),
(11, 'K', 'maturity_offset', -2.0, 1.0, -0.5, 'WHO'),
(12, 'K', 'maturity_offset', -1.0, 2.0, 0.5, 'WHO'),
(13, 'K', 'maturity_offset', 0.0, 3.0, 1.5, 'WHO'),
(14, 'K', 'maturity_offset', 0.5, 3.5, 2.0, 'WHO'),
(15, 'K', 'maturity_offset', 1.0, 4.0, 2.5, 'WHO');

-- ─────────────────────────────────────────────────────────────────────────────
-- PSİKOMOTOR PUAN (0-100, motor beceri bataryası)
-- Koşma, zıplama, fırlatma, yakalama, denge, koordinasyon bileşik skoru
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO referans_degerler (yas, cinsiyet, parametre, min_deger, max_deger, optimal_deger, kaynak) VALUES
-- Erkek
(5,  'E', 'psikomotor_puan', 25, 70, 45, 'TGF'),
(6,  'E', 'psikomotor_puan', 30, 75, 50, 'TGF'),
(7,  'E', 'psikomotor_puan', 35, 80, 55, 'TGF'),
(8,  'E', 'psikomotor_puan', 40, 82, 60, 'TGF'),
(9,  'E', 'psikomotor_puan', 42, 85, 62, 'TGF'),
(10, 'E', 'psikomotor_puan', 45, 87, 65, 'TGF'),
(11, 'E', 'psikomotor_puan', 48, 88, 68, 'TGF'),
(12, 'E', 'psikomotor_puan', 50, 90, 70, 'TGF'),
(13, 'E', 'psikomotor_puan', 50, 92, 72, 'TGF'),
(14, 'E', 'psikomotor_puan', 52, 93, 74, 'TGF'),
(15, 'E', 'psikomotor_puan', 55, 95, 76, 'TGF'),
-- Kız
(5,  'K', 'psikomotor_puan', 25, 68, 44, 'TGF'),
(6,  'K', 'psikomotor_puan', 30, 73, 48, 'TGF'),
(7,  'K', 'psikomotor_puan', 33, 78, 53, 'TGF'),
(8,  'K', 'psikomotor_puan', 38, 80, 58, 'TGF'),
(9,  'K', 'psikomotor_puan', 40, 83, 60, 'TGF'),
(10, 'K', 'psikomotor_puan', 42, 85, 62, 'TGF'),
(11, 'K', 'psikomotor_puan', 45, 87, 65, 'TGF'),
(12, 'K', 'psikomotor_puan', 47, 88, 66, 'TGF'),
(13, 'K', 'psikomotor_puan', 48, 89, 67, 'TGF'),
(14, 'K', 'psikomotor_puan', 48, 90, 68, 'TGF'),
(15, 'K', 'psikomotor_puan', 50, 90, 70, 'TGF');

-- ─────────────────────────────────────────────────────────────────────────────
-- PATLAYICI KUVVET (watt, dikey sıçrama x kilo bazlı — Lewis formülü)
-- Güç(W) = √4.9 × vücut ağırlığı(kg) × √sıçrama yüksekliği(m) × 9.81
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO referans_degerler (yas, cinsiyet, parametre, min_deger, max_deger, optimal_deger, kaynak) VALUES
-- Erkek
(5,  'E', 'patlayici_kuvvet', 50, 150, 90, 'TGF'),
(6,  'E', 'patlayici_kuvvet', 60, 180, 110, 'TGF'),
(7,  'E', 'patlayici_kuvvet', 75, 220, 140, 'TGF'),
(8,  'E', 'patlayici_kuvvet', 90, 260, 170, 'TGF'),
(9,  'E', 'patlayici_kuvvet', 110, 310, 200, 'TGF'),
(10, 'E', 'patlayici_kuvvet', 130, 370, 240, 'TGF'),
(11, 'E', 'patlayici_kuvvet', 150, 430, 280, 'TGF'),
(12, 'E', 'patlayici_kuvvet', 180, 510, 330, 'TGF'),
(13, 'E', 'patlayici_kuvvet', 220, 600, 400, 'TGF'),
(14, 'E', 'patlayici_kuvvet', 270, 700, 470, 'TGF'),
(15, 'E', 'patlayici_kuvvet', 320, 800, 550, 'TGF'),
-- Kız
(5,  'K', 'patlayici_kuvvet', 45, 130, 80, 'TGF'),
(6,  'K', 'patlayici_kuvvet', 55, 160, 100, 'TGF'),
(7,  'K', 'patlayici_kuvvet', 65, 190, 120, 'TGF'),
(8,  'K', 'patlayici_kuvvet', 80, 220, 145, 'TGF'),
(9,  'K', 'patlayici_kuvvet', 95, 260, 170, 'TGF'),
(10, 'K', 'patlayici_kuvvet', 110, 300, 200, 'TGF'),
(11, 'K', 'patlayici_kuvvet', 130, 340, 230, 'TGF'),
(12, 'K', 'patlayici_kuvvet', 150, 380, 260, 'TGF'),
(13, 'K', 'patlayici_kuvvet', 165, 410, 280, 'TGF'),
(14, 'K', 'patlayici_kuvvet', 175, 430, 295, 'TGF'),
(15, 'K', 'patlayici_kuvvet', 185, 450, 310, 'TGF');
