-- Personel (staff) ek alanları: doğum tarihi, oturduğu yer, il/ilçe, önceki iş, sürekli rahatsızlık, araba, dil bilgileri
-- Rol listesine 'cleaning' (temizlik personeli) eklenir

-- Rol kısıtını güncelle: 'cleaning' (temizlik personeli) ekle
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_role_check;
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'staff' AND c.contype = 'c' AND pg_get_constraintdef(c.oid) LIKE '%role%'
  LOOP
    EXECUTE format('ALTER TABLE staff DROP CONSTRAINT IF EXISTS %I', r.conname);
    EXIT;
  END LOOP;
END $$;
ALTER TABLE staff ADD CONSTRAINT staff_role_check
  CHECK (role IN ('admin', 'manager', 'trainer', 'receptionist', 'other', 'cleaning'));

-- Yeni kolonlar (mevcut kayıtlar için nullable)
ALTER TABLE staff ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS previous_work TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS chronic_condition TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS has_driving_license BOOLEAN;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS languages TEXT;

COMMENT ON COLUMN staff.address IS 'Oturduğu yer / adres';
COMMENT ON COLUMN staff.city IS 'İl';
COMMENT ON COLUMN staff.district IS 'İlçe';
COMMENT ON COLUMN staff.previous_work IS 'Daha önce çalıştığı yer';
COMMENT ON COLUMN staff.chronic_condition IS 'Sürekli rahatsızlık';
COMMENT ON COLUMN staff.has_driving_license IS 'Araba kullanabiliyor mu';
COMMENT ON COLUMN staff.languages IS 'Dil bilgileri (serbest metin)';
