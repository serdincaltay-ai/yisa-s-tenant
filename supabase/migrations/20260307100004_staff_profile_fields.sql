-- Staff tablosu: antrenör profil alanları
-- employment_type, is_competitive_coach, license_type, employment_start_date, bio
-- (version 20260307100004 — 20260307100000 çakışması nedeniyle taşındı)

ALTER TABLE staff ADD COLUMN IF NOT EXISTS employment_type TEXT DEFAULT 'full_time';
ALTER TABLE staff ADD COLUMN IF NOT EXISTS is_competitive_coach BOOLEAN DEFAULT false;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS license_type TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS employment_start_date DATE;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS bio TEXT;

COMMENT ON COLUMN staff.employment_type IS 'Çalışma türü: full_time / part_time / intern';
COMMENT ON COLUMN staff.is_competitive_coach IS 'Yarışmacı antrenör mü';
COMMENT ON COLUMN staff.license_type IS 'Federasyon belgesi türü';
COMMENT ON COLUMN staff.employment_start_date IS 'İşe başlama tarihi';
COMMENT ON COLUMN staff.bio IS 'Kısa özgeçmiş';

-- RLS: staff kendi kaydını güncelleyebilir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'staff_self_update' AND tablename = 'staff'
  ) THEN
    CREATE POLICY staff_self_update ON staff
      FOR UPDATE USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;
