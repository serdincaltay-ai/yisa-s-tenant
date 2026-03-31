-- tenant_schedule: kontenjan alanı (ders başına maksimum katılımcı)
ALTER TABLE tenant_schedule ADD COLUMN IF NOT EXISTS kontenjan INTEGER DEFAULT 20;
