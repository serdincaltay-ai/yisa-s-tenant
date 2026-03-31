-- students → athletes refactor: student_packages ve package_payments athlete_id kullanacak
-- Tarih: 17 Şubat 2026

-- student_packages: athlete_id ekle
ALTER TABLE student_packages ADD COLUMN IF NOT EXISTS athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE;
ALTER TABLE student_packages DROP CONSTRAINT IF EXISTS student_packages_student_id_fkey;
ALTER TABLE student_packages ALTER COLUMN student_id DROP NOT NULL;

-- package_payments: athlete_id ekle
ALTER TABLE package_payments ADD COLUMN IF NOT EXISTS athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE;
ALTER TABLE package_payments DROP CONSTRAINT IF EXISTS package_payments_student_id_fkey;
ALTER TABLE package_payments ALTER COLUMN student_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_student_packages_athlete ON student_packages(athlete_id);
CREATE INDEX IF NOT EXISTS idx_package_payments_athlete ON package_payments(athlete_id);
