-- Gelişim ölçümü tablosu
CREATE TABLE IF NOT EXISTS athlete_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  olcum_tarihi DATE NOT NULL,
  boy DECIMAL(6,2),
  kilo DECIMAL(6,2),
  esneklik DECIMAL(6,2),
  dikey_sicrama DECIMAL(6,2),
  sure_20m DECIMAL(6,2),
  denge DECIMAL(6,2),
  koordinasyon INTEGER,
  kuvvet INTEGER,
  dayaniklilik INTEGER,
  postur_notu TEXT,
  genel_degerlendirme TEXT,
  olcen_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_athlete_measurements_tenant ON athlete_measurements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_athlete_measurements_athlete ON athlete_measurements(athlete_id);
CREATE INDEX IF NOT EXISTS idx_athlete_measurements_tarih ON athlete_measurements(olcum_tarihi);

-- Referans değerler tablosu
CREATE TABLE IF NOT EXISTS reference_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parametre TEXT NOT NULL,
  cinsiyet TEXT NOT NULL CHECK (cinsiyet IN ('E', 'K')),
  yas_min INTEGER NOT NULL,
  yas_max INTEGER NOT NULL,
  deger_min DECIMAL(10,2) NOT NULL,
  deger_max DECIMAL(10,2) NOT NULL,
  seviye TEXT NOT NULL CHECK (seviye IN ('zayif', 'normal', 'iyi', 'cok_iyi', 'ustun')),
  brans_uygunluk TEXT
);

CREATE INDEX IF NOT EXISTS idx_reference_values_param ON reference_values(parametre);
CREATE INDEX IF NOT EXISTS idx_reference_values_cinsiyet ON reference_values(cinsiyet);

-- Örnek referans verileri (sadece tablo boşsa)
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM reference_values) = 0 THEN
    INSERT INTO reference_values (parametre, cinsiyet, yas_min, yas_max, deger_min, deger_max, seviye, brans_uygunluk) VALUES
      ('boy', 'E', 6, 8, 115, 130, 'normal', 'genel'),
      ('boy', 'E', 6, 8, 130, 145, 'iyi', 'artistik'),
      ('boy', 'K', 6, 8, 113, 128, 'normal', 'genel'),
      ('boy', 'K', 6, 8, 128, 142, 'iyi', 'ritmik'),
      ('esneklik', 'E', 6, 10, 20, 35, 'normal', 'genel'),
      ('esneklik', 'E', 6, 10, 35, 50, 'iyi', 'artistik'),
      ('esneklik', 'K', 6, 10, 25, 40, 'normal', 'genel'),
      ('esneklik', 'K', 6, 10, 40, 55, 'iyi', 'ritmik');
  END IF;
END $$;

ALTER TABLE athlete_measurements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "athlete_measurements_select" ON athlete_measurements;
CREATE POLICY "athlete_measurements_select" ON athlete_measurements FOR SELECT USING (
  auth.role() = 'authenticated' AND (
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
    OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
    OR athlete_id IN (SELECT id FROM athletes WHERE parent_user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "athlete_measurements_insert" ON athlete_measurements;
CREATE POLICY "athlete_measurements_insert" ON athlete_measurements FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND (
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
    OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Service can manage athlete_measurements" ON athlete_measurements;
CREATE POLICY "Service can manage athlete_measurements" ON athlete_measurements FOR ALL USING (true) WITH CHECK (true);
