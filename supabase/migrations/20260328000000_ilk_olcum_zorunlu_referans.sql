-- GOREV #26: Ilk seans zorunlu olcum + referans araligi uyarisi
-- 1) athletes tablosuna ilk_olcum_yapildi flag'i eklenmesi
-- 2) measurement_reference_ranges tablosu (yas grubu bazli referans araliklari)
-- 3) measurement_appointments tablosu (ilk olcum randevusu)

-- 1) Athletes tablosuna ilk olcum flag'i
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS ilk_olcum_yapildi BOOLEAN DEFAULT false;
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS ilk_olcum_tarihi TIMESTAMPTZ;

-- 2) Yas grubu bazli referans araliklari tablosu
CREATE TABLE IF NOT EXISTS measurement_reference_ranges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parametre TEXT NOT NULL,
  parametre_label TEXT NOT NULL,
  birim TEXT,
  yas_min INTEGER NOT NULL,
  yas_max INTEGER NOT NULL,
  deger_min DECIMAL(10,2) NOT NULL,
  deger_max DECIMAL(10,2) NOT NULL,
  brans TEXT DEFAULT 'genel',
  cinsiyet TEXT CHECK (cinsiyet IN ('E', 'K', 'HER')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mrr_parametre ON measurement_reference_ranges(parametre);
CREATE INDEX IF NOT EXISTS idx_mrr_yas ON measurement_reference_ranges(yas_min, yas_max);
CREATE INDEX IF NOT EXISTS idx_mrr_brans ON measurement_reference_ranges(brans);

-- RLS
ALTER TABLE measurement_reference_ranges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "measurement_reference_ranges_select" ON measurement_reference_ranges;
CREATE POLICY "measurement_reference_ranges_select" ON measurement_reference_ranges
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service can manage measurement_reference_ranges" ON measurement_reference_ranges;
CREATE POLICY "Service can manage measurement_reference_ranges" ON measurement_reference_ranges
  FOR ALL USING (true) WITH CHECK (true);

-- 3) Ilk olcum randevusu tablosu
CREATE TABLE IF NOT EXISTS measurement_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  randevu_tarihi DATE,
  durum TEXT NOT NULL DEFAULT 'bekliyor' CHECK (durum IN ('bekliyor', 'tamamlandi', 'iptal')),
  olusturan_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notlar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ma_tenant ON measurement_appointments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ma_athlete ON measurement_appointments(athlete_id);
CREATE INDEX IF NOT EXISTS idx_ma_durum ON measurement_appointments(durum);

ALTER TABLE measurement_appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "measurement_appointments_select" ON measurement_appointments;
CREATE POLICY "measurement_appointments_select" ON measurement_appointments FOR SELECT USING (
  auth.role() = 'authenticated' AND (
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
    OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "measurement_appointments_insert" ON measurement_appointments;
CREATE POLICY "measurement_appointments_insert" ON measurement_appointments FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND (
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
    OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "measurement_appointments_update" ON measurement_appointments;
CREATE POLICY "measurement_appointments_update" ON measurement_appointments FOR UPDATE USING (
  auth.role() = 'authenticated' AND (
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
    OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Service can manage measurement_appointments" ON measurement_appointments;
CREATE POLICY "Service can manage measurement_appointments" ON measurement_appointments
  FOR ALL USING (true) WITH CHECK (true);

-- 4) Varsayilan referans araliklari (genel brans)
INSERT INTO measurement_reference_ranges (parametre, parametre_label, birim, yas_min, yas_max, deger_min, deger_max, brans, cinsiyet) VALUES
  -- 6-8 yas grubu
  ('mekik', 'Mekik', 'adet', 6, 8, 8, 15, 'genel', 'HER'),
  ('esneklik', 'Esneklik', 'cm', 6, 8, 10, 20, 'genel', 'HER'),
  ('sprint', '20m Sprint', 'sn', 6, 8, 5, 7, 'genel', 'HER'),
  ('boy', 'Boy', 'cm', 6, 8, 110, 135, 'genel', 'HER'),
  ('kilo', 'Kilo', 'kg', 6, 8, 18, 30, 'genel', 'HER'),
  ('dikey_sicrama', 'Dikey Sıçrama', 'cm', 6, 8, 12, 22, 'genel', 'HER'),
  ('denge', 'Denge', 'sn', 6, 8, 5, 15, 'genel', 'HER'),
  ('koordinasyon', 'Koordinasyon', 'puan', 6, 8, 3, 7, 'genel', 'HER'),
  ('kuvvet', 'Kuvvet', 'puan', 6, 8, 2, 6, 'genel', 'HER'),
  ('dayaniklilik', 'Dayanıklılık', 'puan', 6, 8, 2, 6, 'genel', 'HER'),
  -- 9-11 yas grubu
  ('mekik', 'Mekik', 'adet', 9, 11, 12, 25, 'genel', 'HER'),
  ('esneklik', 'Esneklik', 'cm', 9, 11, 15, 25, 'genel', 'HER'),
  ('sprint', '20m Sprint', 'sn', 9, 11, 4.5, 6, 'genel', 'HER'),
  ('boy', 'Boy', 'cm', 9, 11, 125, 155, 'genel', 'HER'),
  ('kilo', 'Kilo', 'kg', 9, 11, 25, 45, 'genel', 'HER'),
  ('dikey_sicrama', 'Dikey Sıçrama', 'cm', 9, 11, 18, 30, 'genel', 'HER'),
  ('denge', 'Denge', 'sn', 9, 11, 10, 25, 'genel', 'HER'),
  ('koordinasyon', 'Koordinasyon', 'puan', 9, 11, 4, 8, 'genel', 'HER'),
  ('kuvvet', 'Kuvvet', 'puan', 9, 11, 3, 7, 'genel', 'HER'),
  ('dayaniklilik', 'Dayanıklılık', 'puan', 9, 11, 3, 7, 'genel', 'HER'),
  -- 12-14 yas grubu
  ('mekik', 'Mekik', 'adet', 12, 14, 20, 35, 'genel', 'HER'),
  ('esneklik', 'Esneklik', 'cm', 12, 14, 18, 30, 'genel', 'HER'),
  ('sprint', '20m Sprint', 'sn', 12, 14, 4, 5.5, 'genel', 'HER'),
  ('boy', 'Boy', 'cm', 12, 14, 140, 175, 'genel', 'HER'),
  ('kilo', 'Kilo', 'kg', 12, 14, 35, 60, 'genel', 'HER'),
  ('dikey_sicrama', 'Dikey Sıçrama', 'cm', 12, 14, 22, 38, 'genel', 'HER'),
  ('denge', 'Denge', 'sn', 12, 14, 15, 35, 'genel', 'HER'),
  ('koordinasyon', 'Koordinasyon', 'puan', 12, 14, 5, 9, 'genel', 'HER'),
  ('kuvvet', 'Kuvvet', 'puan', 12, 14, 4, 8, 'genel', 'HER'),
  ('dayaniklilik', 'Dayanıklılık', 'puan', 12, 14, 4, 8, 'genel', 'HER'),
  -- 15-17 yas grubu
  ('mekik', 'Mekik', 'adet', 15, 17, 25, 45, 'genel', 'HER'),
  ('esneklik', 'Esneklik', 'cm', 15, 17, 20, 35, 'genel', 'HER'),
  ('sprint', '20m Sprint', 'sn', 15, 17, 3.5, 5, 'genel', 'HER'),
  ('boy', 'Boy', 'cm', 15, 17, 155, 190, 'genel', 'HER'),
  ('kilo', 'Kilo', 'kg', 15, 17, 45, 80, 'genel', 'HER'),
  ('dikey_sicrama', 'Dikey Sıçrama', 'cm', 15, 17, 28, 48, 'genel', 'HER'),
  ('denge', 'Denge', 'sn', 15, 17, 20, 45, 'genel', 'HER'),
  ('koordinasyon', 'Koordinasyon', 'puan', 15, 17, 6, 10, 'genel', 'HER'),
  ('kuvvet', 'Kuvvet', 'puan', 15, 17, 5, 9, 'genel', 'HER'),
  ('dayaniklilik', 'Dayanıklılık', 'puan', 15, 17, 5, 9, 'genel', 'HER'),
  -- Brans bazli ozel parametreler: Cimnastik
  ('esneklik', 'Esneklik', 'cm', 6, 8, 15, 30, 'cimnastik', 'HER'),
  ('esneklik', 'Esneklik', 'cm', 9, 11, 20, 35, 'cimnastik', 'HER'),
  ('esneklik', 'Esneklik', 'cm', 12, 14, 25, 40, 'cimnastik', 'HER'),
  ('esneklik', 'Esneklik', 'cm', 15, 17, 28, 45, 'cimnastik', 'HER'),
  ('denge', 'Denge', 'sn', 6, 8, 8, 20, 'cimnastik', 'HER'),
  ('denge', 'Denge', 'sn', 9, 11, 15, 35, 'cimnastik', 'HER'),
  ('denge', 'Denge', 'sn', 12, 14, 20, 45, 'cimnastik', 'HER'),
  ('denge', 'Denge', 'sn', 15, 17, 25, 55, 'cimnastik', 'HER'),
  ('koordinasyon', 'Koordinasyon', 'puan', 6, 8, 4, 8, 'cimnastik', 'HER'),
  ('koordinasyon', 'Koordinasyon', 'puan', 9, 11, 5, 9, 'cimnastik', 'HER'),
  ('koordinasyon', 'Koordinasyon', 'puan', 12, 14, 6, 10, 'cimnastik', 'HER'),
  -- Brans bazli ozel parametreler: Yuzme
  ('sprint', '20m Sprint', 'sn', 6, 8, 5.5, 7.5, 'yuzme', 'HER'),
  ('sprint', '20m Sprint', 'sn', 9, 11, 4.8, 6.5, 'yuzme', 'HER'),
  ('sprint', '20m Sprint', 'sn', 12, 14, 4.2, 5.8, 'yuzme', 'HER'),
  ('sprint', '20m Sprint', 'sn', 15, 17, 3.8, 5.2, 'yuzme', 'HER'),
  ('dayaniklilik', 'Dayanıklılık', 'puan', 6, 8, 3, 7, 'yuzme', 'HER'),
  ('dayaniklilik', 'Dayanıklılık', 'puan', 9, 11, 4, 8, 'yuzme', 'HER'),
  ('dayaniklilik', 'Dayanıklılık', 'puan', 12, 14, 5, 9, 'yuzme', 'HER'),
  ('dayaniklilik', 'Dayanıklılık', 'puan', 15, 17, 6, 10, 'yuzme', 'HER'),
  -- Brans bazli ozel parametreler: Atletizm
  ('sprint', '20m Sprint', 'sn', 6, 8, 4.8, 6.8, 'atletizm', 'HER'),
  ('sprint', '20m Sprint', 'sn', 9, 11, 4.2, 5.8, 'atletizm', 'HER'),
  ('sprint', '20m Sprint', 'sn', 12, 14, 3.8, 5.2, 'atletizm', 'HER'),
  ('sprint', '20m Sprint', 'sn', 15, 17, 3.3, 4.8, 'atletizm', 'HER'),
  ('dikey_sicrama', 'Dikey Sıçrama', 'cm', 6, 8, 14, 25, 'atletizm', 'HER'),
  ('dikey_sicrama', 'Dikey Sıçrama', 'cm', 9, 11, 20, 33, 'atletizm', 'HER'),
  ('dikey_sicrama', 'Dikey Sıçrama', 'cm', 12, 14, 25, 42, 'atletizm', 'HER'),
  ('dikey_sicrama', 'Dikey Sıçrama', 'cm', 15, 17, 32, 52, 'atletizm', 'HER')
ON CONFLICT DO NOTHING;
