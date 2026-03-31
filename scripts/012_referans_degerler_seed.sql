-- ═══════════════════════════════════════════════════════════════════════════════
-- YİSA-S — scripts/012_referans_degerler_seed.sql
-- Faz 4: Veri Robotu — Çocuk Gelişim Referans Değerleri (WHO/TGF bazlı)
--
-- Yaş aralığı: 5–15 (spor okulu hedef kitlesi)
-- Cinsiyet: E (erkek), K (kız)
-- Parametreler: boy (cm), kilo (kg), bmi, esneklik (cm), surat (sn/20m),
--               kuvvet (tekrar), denge (sn), koordinasyon (puan/10),
--               dayaniklilik (dk), dikey_sicrama (cm)
-- Kaynaklar: WHO Growth Standards, TGF (Türkiye Jimnastik Fed.) normları
--
-- Tarih: 05 Mart 2026
-- ═══════════════════════════════════════════════════════════════════════════════

-- Önce mevcut verileri temizle (idempotent seed)
DELETE FROM referans_degerler WHERE kaynak IN ('WHO', 'TGF');

-- ─────────────────────────────────────────────────────────────────────────────
-- BOY (cm) — WHO Child Growth Standards
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO referans_degerler (yas, cinsiyet, parametre, min_deger, max_deger, optimal_deger, kaynak) VALUES
-- Erkek
(5,  'E', 'boy', 100.0, 118.0, 110.0, 'WHO'),
(6,  'E', 'boy', 106.0, 124.0, 116.0, 'WHO'),
(7,  'E', 'boy', 112.0, 130.0, 122.0, 'WHO'),
(8,  'E', 'boy', 117.0, 136.0, 128.0, 'WHO'),
(9,  'E', 'boy', 122.0, 142.0, 133.0, 'WHO'),
(10, 'E', 'boy', 127.0, 148.0, 138.0, 'WHO'),
(11, 'E', 'boy', 131.0, 153.0, 143.0, 'WHO'),
(12, 'E', 'boy', 136.0, 160.0, 149.0, 'WHO'),
(13, 'E', 'boy', 141.0, 168.0, 156.0, 'WHO'),
(14, 'E', 'boy', 148.0, 176.0, 163.0, 'WHO'),
(15, 'E', 'boy', 155.0, 181.0, 169.0, 'WHO'),
-- Kız
(5,  'K', 'boy', 99.0, 117.0, 109.0, 'WHO'),
(6,  'K', 'boy', 105.0, 123.0, 115.0, 'WHO'),
(7,  'K', 'boy', 111.0, 129.0, 121.0, 'WHO'),
(8,  'K', 'boy', 116.0, 135.0, 127.0, 'WHO'),
(9,  'K', 'boy', 121.0, 141.0, 132.0, 'WHO'),
(10, 'K', 'boy', 126.0, 148.0, 138.0, 'WHO'),
(11, 'K', 'boy', 131.0, 155.0, 144.0, 'WHO'),
(12, 'K', 'boy', 137.0, 161.0, 150.0, 'WHO'),
(13, 'K', 'boy', 142.0, 164.0, 155.0, 'WHO'),
(14, 'K', 'boy', 146.0, 167.0, 158.0, 'WHO'),
(15, 'K', 'boy', 148.0, 169.0, 160.0, 'WHO');

-- ─────────────────────────────────────────────────────────────────────────────
-- KİLO (kg) — WHO Child Growth Standards
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO referans_degerler (yas, cinsiyet, parametre, min_deger, max_deger, optimal_deger, kaynak) VALUES
-- Erkek
(5,  'E', 'kilo', 14.0, 24.0, 18.3, 'WHO'),
(6,  'E', 'kilo', 16.0, 27.0, 20.5, 'WHO'),
(7,  'E', 'kilo', 17.5, 30.0, 22.9, 'WHO'),
(8,  'E', 'kilo', 19.0, 34.0, 25.4, 'WHO'),
(9,  'E', 'kilo', 21.0, 38.0, 28.1, 'WHO'),
(10, 'E', 'kilo', 23.0, 42.0, 31.2, 'WHO'),
(11, 'E', 'kilo', 25.0, 46.0, 34.3, 'WHO'),
(12, 'E', 'kilo', 27.5, 52.0, 38.0, 'WHO'),
(13, 'E', 'kilo', 30.0, 58.0, 42.5, 'WHO'),
(14, 'E', 'kilo', 34.0, 64.0, 48.0, 'WHO'),
(15, 'E', 'kilo', 38.0, 70.0, 53.5, 'WHO'),
-- Kız
(5,  'K', 'kilo', 13.5, 23.5, 17.9, 'WHO'),
(6,  'K', 'kilo', 15.5, 26.5, 20.2, 'WHO'),
(7,  'K', 'kilo', 17.0, 30.0, 22.4, 'WHO'),
(8,  'K', 'kilo', 18.5, 34.0, 25.0, 'WHO'),
(9,  'K', 'kilo', 20.5, 38.0, 28.0, 'WHO'),
(10, 'K', 'kilo', 22.5, 42.5, 31.5, 'WHO'),
(11, 'K', 'kilo', 25.0, 48.0, 35.5, 'WHO'),
(12, 'K', 'kilo', 28.0, 54.0, 40.0, 'WHO'),
(13, 'K', 'kilo', 31.0, 58.0, 44.5, 'WHO'),
(14, 'K', 'kilo', 34.0, 62.0, 48.0, 'WHO'),
(15, 'K', 'kilo', 37.0, 65.0, 51.0, 'WHO');

-- ─────────────────────────────────────────────────────────────────────────────
-- BMI — hesaplama: kilo / (boy_m)^2
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO referans_degerler (yas, cinsiyet, parametre, min_deger, max_deger, optimal_deger, kaynak) VALUES
-- Erkek
(5,  'E', 'bmi', 13.0, 17.5, 15.1, 'WHO'),
(6,  'E', 'bmi', 13.0, 17.8, 15.3, 'WHO'),
(7,  'E', 'bmi', 13.1, 18.2, 15.5, 'WHO'),
(8,  'E', 'bmi', 13.2, 18.8, 15.7, 'WHO'),
(9,  'E', 'bmi', 13.3, 19.4, 16.0, 'WHO'),
(10, 'E', 'bmi', 13.5, 20.0, 16.4, 'WHO'),
(11, 'E', 'bmi', 13.7, 20.6, 16.9, 'WHO'),
(12, 'E', 'bmi', 14.0, 21.2, 17.5, 'WHO'),
(13, 'E', 'bmi', 14.3, 21.8, 18.1, 'WHO'),
(14, 'E', 'bmi', 14.7, 22.5, 18.8, 'WHO'),
(15, 'E', 'bmi', 15.1, 23.2, 19.4, 'WHO'),
-- Kız
(5,  'K', 'bmi', 12.7, 17.5, 15.0, 'WHO'),
(6,  'K', 'bmi', 12.8, 17.8, 15.2, 'WHO'),
(7,  'K', 'bmi', 12.9, 18.3, 15.4, 'WHO'),
(8,  'K', 'bmi', 13.0, 18.8, 15.7, 'WHO'),
(9,  'K', 'bmi', 13.2, 19.4, 16.1, 'WHO'),
(10, 'K', 'bmi', 13.4, 20.1, 16.6, 'WHO'),
(11, 'K', 'bmi', 13.7, 20.8, 17.2, 'WHO'),
(12, 'K', 'bmi', 14.1, 21.5, 17.8, 'WHO'),
(13, 'K', 'bmi', 14.5, 22.2, 18.4, 'WHO'),
(14, 'K', 'bmi', 15.0, 23.0, 19.0, 'WHO'),
(15, 'K', 'bmi', 15.4, 23.5, 19.5, 'WHO');

-- ─────────────────────────────────────────────────────────────────────────────
-- ESNEKLİK (cm, otur-uzan testi) — TGF normları
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO referans_degerler (yas, cinsiyet, parametre, min_deger, max_deger, optimal_deger, kaynak) VALUES
-- Erkek
(5,  'E', 'esneklik', 15.0, 30.0, 24.0, 'TGF'),
(6,  'E', 'esneklik', 14.0, 29.0, 23.0, 'TGF'),
(7,  'E', 'esneklik', 13.0, 28.0, 22.0, 'TGF'),
(8,  'E', 'esneklik', 12.0, 27.0, 21.0, 'TGF'),
(9,  'E', 'esneklik', 11.0, 26.0, 20.0, 'TGF'),
(10, 'E', 'esneklik', 10.0, 25.0, 19.0, 'TGF'),
(11, 'E', 'esneklik', 9.0, 24.0, 18.0, 'TGF'),
(12, 'E', 'esneklik', 8.0, 25.0, 18.0, 'TGF'),
(13, 'E', 'esneklik', 7.0, 26.0, 18.0, 'TGF'),
(14, 'E', 'esneklik', 7.0, 27.0, 19.0, 'TGF'),
(15, 'E', 'esneklik', 7.0, 28.0, 20.0, 'TGF'),
-- Kız
(5,  'K', 'esneklik', 17.0, 33.0, 26.0, 'TGF'),
(6,  'K', 'esneklik', 16.0, 32.0, 25.0, 'TGF'),
(7,  'K', 'esneklik', 15.0, 31.0, 25.0, 'TGF'),
(8,  'K', 'esneklik', 14.0, 30.0, 24.0, 'TGF'),
(9,  'K', 'esneklik', 14.0, 30.0, 24.0, 'TGF'),
(10, 'K', 'esneklik', 13.0, 29.0, 23.0, 'TGF'),
(11, 'K', 'esneklik', 13.0, 29.0, 23.0, 'TGF'),
(12, 'K', 'esneklik', 13.0, 30.0, 24.0, 'TGF'),
(13, 'K', 'esneklik', 14.0, 31.0, 25.0, 'TGF'),
(14, 'K', 'esneklik', 14.0, 32.0, 25.0, 'TGF'),
(15, 'K', 'esneklik', 14.0, 32.0, 26.0, 'TGF');

-- ─────────────────────────────────────────────────────────────────────────────
-- SÜRAT (sn, 20m sprint — düşük = iyi) — TGF normları
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO referans_degerler (yas, cinsiyet, parametre, min_deger, max_deger, optimal_deger, kaynak) VALUES
-- Erkek (min_deger=en iyi, max_deger=en kötü, optimal=orta)
(5,  'E', 'surat', 4.2, 6.5, 5.2, 'TGF'),
(6,  'E', 'surat', 4.0, 6.0, 4.9, 'TGF'),
(7,  'E', 'surat', 3.8, 5.6, 4.6, 'TGF'),
(8,  'E', 'surat', 3.6, 5.3, 4.4, 'TGF'),
(9,  'E', 'surat', 3.5, 5.0, 4.2, 'TGF'),
(10, 'E', 'surat', 3.4, 4.8, 4.0, 'TGF'),
(11, 'E', 'surat', 3.3, 4.6, 3.9, 'TGF'),
(12, 'E', 'surat', 3.2, 4.5, 3.8, 'TGF'),
(13, 'E', 'surat', 3.1, 4.3, 3.6, 'TGF'),
(14, 'E', 'surat', 3.0, 4.1, 3.5, 'TGF'),
(15, 'E', 'surat', 2.9, 4.0, 3.4, 'TGF'),
-- Kız
(5,  'K', 'surat', 4.5, 6.8, 5.5, 'TGF'),
(6,  'K', 'surat', 4.3, 6.3, 5.2, 'TGF'),
(7,  'K', 'surat', 4.1, 6.0, 5.0, 'TGF'),
(8,  'K', 'surat', 3.9, 5.7, 4.7, 'TGF'),
(9,  'K', 'surat', 3.8, 5.5, 4.5, 'TGF'),
(10, 'K', 'surat', 3.7, 5.3, 4.4, 'TGF'),
(11, 'K', 'surat', 3.6, 5.1, 4.3, 'TGF'),
(12, 'K', 'surat', 3.5, 5.0, 4.2, 'TGF'),
(13, 'K', 'surat', 3.5, 4.9, 4.1, 'TGF'),
(14, 'K', 'surat', 3.5, 4.8, 4.1, 'TGF'),
(15, 'K', 'surat', 3.5, 4.8, 4.1, 'TGF');

-- ─────────────────────────────────────────────────────────────────────────────
-- KUVVET (tekrar, mekik/şınav) — TGF normları
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO referans_degerler (yas, cinsiyet, parametre, min_deger, max_deger, optimal_deger, kaynak) VALUES
-- Erkek
(5,  'E', 'kuvvet', 3, 15, 8, 'TGF'),
(6,  'E', 'kuvvet', 5, 18, 10, 'TGF'),
(7,  'E', 'kuvvet', 7, 22, 13, 'TGF'),
(8,  'E', 'kuvvet', 10, 25, 16, 'TGF'),
(9,  'E', 'kuvvet', 12, 30, 20, 'TGF'),
(10, 'E', 'kuvvet', 15, 35, 24, 'TGF'),
(11, 'E', 'kuvvet', 18, 38, 27, 'TGF'),
(12, 'E', 'kuvvet', 20, 42, 30, 'TGF'),
(13, 'E', 'kuvvet', 22, 45, 33, 'TGF'),
(14, 'E', 'kuvvet', 25, 50, 37, 'TGF'),
(15, 'E', 'kuvvet', 28, 55, 40, 'TGF'),
-- Kız
(5,  'K', 'kuvvet', 2, 12, 6, 'TGF'),
(6,  'K', 'kuvvet', 4, 15, 8, 'TGF'),
(7,  'K', 'kuvvet', 5, 18, 10, 'TGF'),
(8,  'K', 'kuvvet', 7, 20, 12, 'TGF'),
(9,  'K', 'kuvvet', 9, 24, 15, 'TGF'),
(10, 'K', 'kuvvet', 11, 28, 18, 'TGF'),
(11, 'K', 'kuvvet', 13, 30, 20, 'TGF'),
(12, 'K', 'kuvvet', 14, 32, 22, 'TGF'),
(13, 'K', 'kuvvet', 15, 34, 24, 'TGF'),
(14, 'K', 'kuvvet', 16, 35, 25, 'TGF'),
(15, 'K', 'kuvvet', 17, 36, 26, 'TGF');

-- ─────────────────────────────────────────────────────────────────────────────
-- DENGE (sn, tek ayak üstünde durma) — TGF normları
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO referans_degerler (yas, cinsiyet, parametre, min_deger, max_deger, optimal_deger, kaynak) VALUES
-- Erkek
(5,  'E', 'denge', 3.0, 12.0, 7.0, 'TGF'),
(6,  'E', 'denge', 5.0, 15.0, 9.0, 'TGF'),
(7,  'E', 'denge', 7.0, 20.0, 12.0, 'TGF'),
(8,  'E', 'denge', 9.0, 25.0, 15.0, 'TGF'),
(9,  'E', 'denge', 12.0, 30.0, 20.0, 'TGF'),
(10, 'E', 'denge', 15.0, 35.0, 24.0, 'TGF'),
(11, 'E', 'denge', 18.0, 40.0, 28.0, 'TGF'),
(12, 'E', 'denge', 20.0, 45.0, 32.0, 'TGF'),
(13, 'E', 'denge', 22.0, 50.0, 35.0, 'TGF'),
(14, 'E', 'denge', 25.0, 55.0, 38.0, 'TGF'),
(15, 'E', 'denge', 28.0, 60.0, 42.0, 'TGF'),
-- Kız
(5,  'K', 'denge', 4.0, 14.0, 8.0, 'TGF'),
(6,  'K', 'denge', 6.0, 17.0, 10.0, 'TGF'),
(7,  'K', 'denge', 8.0, 22.0, 14.0, 'TGF'),
(8,  'K', 'denge', 10.0, 27.0, 17.0, 'TGF'),
(9,  'K', 'denge', 13.0, 32.0, 22.0, 'TGF'),
(10, 'K', 'denge', 16.0, 37.0, 26.0, 'TGF'),
(11, 'K', 'denge', 19.0, 42.0, 30.0, 'TGF'),
(12, 'K', 'denge', 22.0, 48.0, 34.0, 'TGF'),
(13, 'K', 'denge', 24.0, 52.0, 37.0, 'TGF'),
(14, 'K', 'denge', 26.0, 55.0, 40.0, 'TGF'),
(15, 'K', 'denge', 28.0, 58.0, 42.0, 'TGF');

-- ─────────────────────────────────────────────────────────────────────────────
-- KOORDİNASYON (puan/10) — TGF normları
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO referans_degerler (yas, cinsiyet, parametre, min_deger, max_deger, optimal_deger, kaynak) VALUES
-- Erkek
(5,  'E', 'koordinasyon', 2, 6, 4, 'TGF'),
(6,  'E', 'koordinasyon', 3, 7, 5, 'TGF'),
(7,  'E', 'koordinasyon', 3, 7, 5, 'TGF'),
(8,  'E', 'koordinasyon', 4, 8, 6, 'TGF'),
(9,  'E', 'koordinasyon', 4, 8, 6, 'TGF'),
(10, 'E', 'koordinasyon', 5, 9, 7, 'TGF'),
(11, 'E', 'koordinasyon', 5, 9, 7, 'TGF'),
(12, 'E', 'koordinasyon', 5, 9, 7, 'TGF'),
(13, 'E', 'koordinasyon', 6, 10, 8, 'TGF'),
(14, 'E', 'koordinasyon', 6, 10, 8, 'TGF'),
(15, 'E', 'koordinasyon', 6, 10, 8, 'TGF'),
-- Kız
(5,  'K', 'koordinasyon', 2, 6, 4, 'TGF'),
(6,  'K', 'koordinasyon', 3, 7, 5, 'TGF'),
(7,  'K', 'koordinasyon', 3, 7, 5, 'TGF'),
(8,  'K', 'koordinasyon', 4, 8, 6, 'TGF'),
(9,  'K', 'koordinasyon', 4, 8, 6, 'TGF'),
(10, 'K', 'koordinasyon', 5, 9, 7, 'TGF'),
(11, 'K', 'koordinasyon', 5, 9, 7, 'TGF'),
(12, 'K', 'koordinasyon', 5, 9, 7, 'TGF'),
(13, 'K', 'koordinasyon', 6, 10, 8, 'TGF'),
(14, 'K', 'koordinasyon', 6, 10, 8, 'TGF'),
(15, 'K', 'koordinasyon', 6, 10, 8, 'TGF');

-- ─────────────────────────────────────────────────────────────────────────────
-- DAYANIKLILIK (dk, mekik koşusu) — TGF normları
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO referans_degerler (yas, cinsiyet, parametre, min_deger, max_deger, optimal_deger, kaynak) VALUES
-- Erkek
(5,  'E', 'dayaniklilik', 1.0, 4.0, 2.5, 'TGF'),
(6,  'E', 'dayaniklilik', 1.5, 5.0, 3.0, 'TGF'),
(7,  'E', 'dayaniklilik', 2.0, 6.0, 4.0, 'TGF'),
(8,  'E', 'dayaniklilik', 2.5, 7.0, 4.5, 'TGF'),
(9,  'E', 'dayaniklilik', 3.0, 8.0, 5.5, 'TGF'),
(10, 'E', 'dayaniklilik', 3.5, 9.0, 6.0, 'TGF'),
(11, 'E', 'dayaniklilik', 4.0, 10.0, 7.0, 'TGF'),
(12, 'E', 'dayaniklilik', 4.5, 11.0, 7.5, 'TGF'),
(13, 'E', 'dayaniklilik', 5.0, 12.0, 8.5, 'TGF'),
(14, 'E', 'dayaniklilik', 5.5, 13.0, 9.0, 'TGF'),
(15, 'E', 'dayaniklilik', 6.0, 14.0, 10.0, 'TGF'),
-- Kız
(5,  'K', 'dayaniklilik', 1.0, 3.5, 2.0, 'TGF'),
(6,  'K', 'dayaniklilik', 1.5, 4.5, 2.5, 'TGF'),
(7,  'K', 'dayaniklilik', 2.0, 5.0, 3.5, 'TGF'),
(8,  'K', 'dayaniklilik', 2.5, 6.0, 4.0, 'TGF'),
(9,  'K', 'dayaniklilik', 3.0, 7.0, 5.0, 'TGF'),
(10, 'K', 'dayaniklilik', 3.0, 7.5, 5.0, 'TGF'),
(11, 'K', 'dayaniklilik', 3.5, 8.0, 5.5, 'TGF'),
(12, 'K', 'dayaniklilik', 4.0, 9.0, 6.0, 'TGF'),
(13, 'K', 'dayaniklilik', 4.0, 9.5, 6.5, 'TGF'),
(14, 'K', 'dayaniklilik', 4.5, 10.0, 7.0, 'TGF'),
(15, 'K', 'dayaniklilik', 4.5, 10.5, 7.0, 'TGF');

-- ─────────────────────────────────────────────────────────────────────────────
-- DİKEY SIÇRAMA (cm) — TGF normları
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO referans_degerler (yas, cinsiyet, parametre, min_deger, max_deger, optimal_deger, kaynak) VALUES
-- Erkek
(5,  'E', 'dikey_sicrama', 10.0, 22.0, 15.0, 'TGF'),
(6,  'E', 'dikey_sicrama', 12.0, 25.0, 17.0, 'TGF'),
(7,  'E', 'dikey_sicrama', 14.0, 28.0, 20.0, 'TGF'),
(8,  'E', 'dikey_sicrama', 16.0, 31.0, 22.0, 'TGF'),
(9,  'E', 'dikey_sicrama', 18.0, 34.0, 25.0, 'TGF'),
(10, 'E', 'dikey_sicrama', 20.0, 37.0, 28.0, 'TGF'),
(11, 'E', 'dikey_sicrama', 22.0, 40.0, 30.0, 'TGF'),
(12, 'E', 'dikey_sicrama', 24.0, 44.0, 33.0, 'TGF'),
(13, 'E', 'dikey_sicrama', 26.0, 48.0, 36.0, 'TGF'),
(14, 'E', 'dikey_sicrama', 28.0, 52.0, 39.0, 'TGF'),
(15, 'E', 'dikey_sicrama', 30.0, 56.0, 42.0, 'TGF'),
-- Kız
(5,  'K', 'dikey_sicrama', 8.0, 18.0, 12.0, 'TGF'),
(6,  'K', 'dikey_sicrama', 10.0, 21.0, 14.0, 'TGF'),
(7,  'K', 'dikey_sicrama', 12.0, 24.0, 17.0, 'TGF'),
(8,  'K', 'dikey_sicrama', 14.0, 27.0, 19.0, 'TGF'),
(9,  'K', 'dikey_sicrama', 15.0, 29.0, 21.0, 'TGF'),
(10, 'K', 'dikey_sicrama', 16.0, 31.0, 23.0, 'TGF'),
(11, 'K', 'dikey_sicrama', 17.0, 33.0, 24.0, 'TGF'),
(12, 'K', 'dikey_sicrama', 18.0, 35.0, 25.0, 'TGF'),
(13, 'K', 'dikey_sicrama', 19.0, 36.0, 26.0, 'TGF'),
(14, 'K', 'dikey_sicrama', 19.0, 37.0, 27.0, 'TGF'),
(15, 'K', 'dikey_sicrama', 20.0, 38.0, 28.0, 'TGF');


-- ─────────────────────────────────────────────────────────────────────────────
-- SPORT_TEMPLATES — Örnek şablonlar (Faz 4 demo)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO sport_templates (category, title, description, content, age_min, age_max, sport_type, difficulty) VALUES
('gelisim_olcum', 'Temel Gelişim Ölçüm Formu', 'Boy, kilo, esneklik, sürat, kuvvet, denge, koordinasyon, dayanıklılık, dikey sıçrama parametreleri', '{"alanlar": ["boy", "kilo", "esneklik", "surat", "kuvvet", "denge", "koordinasyon", "dayaniklilik", "dikey_sicrama"], "birimler": {"boy": "cm", "kilo": "kg", "esneklik": "cm", "surat": "sn", "kuvvet": "tekrar", "denge": "sn", "koordinasyon": "puan/10", "dayaniklilik": "dk", "dikey_sicrama": "cm"}}', 5, 15, 'genel', 'baslangic'),
('gelisim_olcum', 'Cimnastik Gelişim Formu', 'Cimnastiğe özel esneklik, denge, koordinasyon ağırlıklı ölçüm', '{"alanlar": ["boy", "kilo", "esneklik", "denge", "koordinasyon", "dikey_sicrama"], "birimler": {"boy": "cm", "kilo": "kg", "esneklik": "cm", "denge": "sn", "koordinasyon": "puan/10", "dikey_sicrama": "cm"}, "ozel_parametreler": ["kopru_acisi", "spagat_mesafesi"]}', 5, 15, 'cimnastik', 'baslangic'),
('antrenman', 'Cimnastik Başlangıç Antrenman Planı', '8 haftalık temel hareketler eğitimi', '{"hafta_sayisi": 8, "gun_per_hafta": 3, "hedefler": ["temel denge", "esneklik geliştirme", "temel dönel hareketler"]}', 5, 8, 'cimnastik', 'baslangic'),
('antrenman', 'Yüzme Temel Antrenman Planı', '6 haftalık su alışma + temel kulaç eğitimi', '{"hafta_sayisi": 6, "gun_per_hafta": 2, "hedefler": ["su alışkanlığı", "nefes kontrolü", "serbest stil kulaç"]}', 5, 10, 'yuzme', 'baslangic'),
('beslenme', 'Sporcu Çocuk Beslenme Rehberi', 'Yaş ve aktivite seviyesine göre günlük kalori ve makro besin önerisi', '{"ogünler": ["kahvalti", "ara_ogun_1", "ogle", "ara_ogun_2", "aksam"], "makrolar": {"protein_yuzde": 20, "karbonhidrat_yuzde": 55, "yag_yuzde": 25}}', 5, 15, 'genel', 'baslangic'),
('postur', 'Postür Değerlendirme Formu', 'Omuz, sırt, kalça, diz hizalama kontrolü', '{"kontrol_noktalari": ["omuz_hizasi", "sirt_egrisi", "kalca_simetrisi", "diz_hizasi", "ayak_arkasi", "bas_pozisyonu"], "puanlama": "0-3 (0=normal, 3=belirgin sorun)"}', 5, 15, 'genel', 'baslangic'),
('mental', 'Sporcu Motivasyon Anketi', 'Çocuk sporcular için 10 soruluk motivasyon/keyif ölçeği', '{"soru_sayisi": 10, "olcek": "1-5 (hiç katılmıyorum - kesinlikle katılıyorum)", "alt_boyutlar": ["icsel_motivasyon", "dissel_motivasyon", "kaygi", "keyif"]}', 7, 15, 'genel', 'baslangic');
