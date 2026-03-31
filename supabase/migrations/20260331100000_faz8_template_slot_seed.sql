-- ============================================================
-- FAZ 8: Template + Slot Sistemi — Seed Data
-- 3 template (premium, standart, minimal) + 10 slot per template
-- ============================================================

-- 1. System Templates (3 adet)
INSERT INTO system_templates (template_key, isim, aciklama, kategori, varsayilan_config, is_active)
VALUES
  ('premium', 'Premium', 'Animasyonlar, tam sayfa, premium tasarim. Tum slotlar aktif.', 'vitrin',
   '{"hero":true,"program":true,"trainer":true,"aidat":true,"kayit":true,"olcum":true,"galeri":true,"sosyal":true,"iletisim":true,"cta":true}'::jsonb,
   true),
  ('standart', 'Standart', 'Gradientler, istatistikler, SSS. Galeri ve sosyal medya haric.', 'vitrin',
   '{"hero":true,"program":true,"trainer":true,"aidat":true,"kayit":true,"olcum":true,"galeri":false,"sosyal":false,"iletisim":true,"cta":true}'::jsonb,
   true),
  ('minimal', 'Minimal', 'Temiz, hizli, minimal tasarim. Sadece temel slotlar aktif.', 'vitrin',
   '{"hero":true,"program":true,"trainer":false,"aidat":false,"kayit":true,"olcum":false,"galeri":false,"sosyal":false,"iletisim":true,"cta":true}'::jsonb,
   true)
ON CONFLICT (template_key) DO UPDATE SET
  isim = EXCLUDED.isim,
  aciklama = EXCLUDED.aciklama,
  varsayilan_config = EXCLUDED.varsayilan_config,
  is_active = EXCLUDED.is_active,
  updated_at = now();
