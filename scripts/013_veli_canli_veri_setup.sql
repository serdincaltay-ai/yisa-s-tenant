-- ═══════════════════════════════════════════════════════════════════════════════
-- YİSA-S — scripts/013_veli_canli_veri_setup.sql
-- Veli Paneli Canlı Veri Kurulumu (BJK Tenant)
--
-- Bu script aşağıdakileri yapar:
--   1) Kırık trigger düzeltmesi (trg_update_athletes → guncelleme_tarihi)
--   2) Test veli hesapları için athletes tablosunda parent_email + parent_user_id bağlantısı
--   3) user_tenants tablosuna veli rolü ile kayıt
--
-- NOT: Supabase auth kullanıcıları Admin API ile oluşturulmuştur (script dışı).
--       veli1@bjktuzla.test → bcf6cdae-6b87-49e2-96b2-6a784e1ca497
--       veli2@bjktuzla.test → 435cb408-9f69-4486-b0e9-893b13dd2790
--       Şifreler ortam değişkenlerinden alınır (VELI_TEST_PASSWORD).
--
-- Tarih: 05 Mart 2026
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- 1) Kırık trigger düzeltmesi
--    athletes tablosunda "guncelleme_tarihi" alanını referans eden ama
--    bu alan tabloda olmayan trg_update_athletes trigger'ı kaldırılır.
--    Tablo zaten updated_at alanına sahip ve trg_athletes_updated trigger'ı
--    bu alanı doğru şekilde güncellemektedir.
-- ─────────────────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_update_athletes ON athletes;
-- İlgili fonksiyon artık kullanılmıyor; temizlik için kaldırılabilir:
-- DROP FUNCTION IF EXISTS update_guncelleme_tarihi();


-- ─────────────────────────────────────────────────────────────────────────────
-- 2) Test veli hesapları — athletes tablosu parent bağlantısı
--    BJK Tuzla Cimnastik tenant: 8cc3ea1d-27a0-496e-a0fb-1625be7a9b35
-- ─────────────────────────────────────────────────────────────────────────────

-- Veli 1: veli1@bjktuzla.test → Ali Yılmaz (1 çocuk)
UPDATE athletes
SET parent_email   = 'veli1@bjktuzla.test',
    parent_user_id = 'bcf6cdae-6b87-49e2-96b2-6a784e1ca497'
WHERE id = 'cebe3e89-0157-43de-8bca-ed5699d3ba3d'
  AND tenant_id = '8cc3ea1d-27a0-496e-a0fb-1625be7a9b35';

-- Veli 2: veli2@bjktuzla.test → Elif Kaya + Mert Demir (2 çocuk)
UPDATE athletes
SET parent_email   = 'veli2@bjktuzla.test',
    parent_user_id = '435cb408-9f69-4486-b0e9-893b13dd2790'
WHERE id IN (
  '7aec65ec-a71e-4163-b26c-347db46a7909',
  '06d9809a-f42a-4d2e-a9d1-e4ceaf140441'
)
  AND tenant_id = '8cc3ea1d-27a0-496e-a0fb-1625be7a9b35';


-- ─────────────────────────────────────────────────────────────────────────────
-- 3) user_tenants — veli rolü ile kayıt
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO user_tenants (user_id, tenant_id, role)
VALUES
  ('bcf6cdae-6b87-49e2-96b2-6a784e1ca497', '8cc3ea1d-27a0-496e-a0fb-1625be7a9b35', 'veli'),
  ('435cb408-9f69-4486-b0e9-893b13dd2790', '8cc3ea1d-27a0-496e-a0fb-1625be7a9b35', 'veli')
ON CONFLICT DO NOTHING;
