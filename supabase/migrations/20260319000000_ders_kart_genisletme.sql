-- Ders kartı: kontenjan, ders durumu (acik/onaylandi/iptal), demo katılımcı
ALTER TABLE tenant_schedule ADD COLUMN IF NOT EXISTS kontenjan INTEGER DEFAULT 20;
ALTER TABLE tenant_schedule ADD COLUMN IF NOT EXISTS ders_durumu TEXT DEFAULT 'acik';
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;
