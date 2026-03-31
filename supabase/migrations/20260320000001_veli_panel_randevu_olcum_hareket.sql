-- =====================================================
-- Görev #17: Veli Paneli — Randevu, Ölçüm, Hareket Havuzu
-- =====================================================

-- 1. branch_measurement_params: Branş bazlı ölçüm parametreleri
CREATE TABLE IF NOT EXISTS branch_measurement_params (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch TEXT NOT NULL,
  param_key TEXT NOT NULL,
  param_label TEXT NOT NULL,
  unit TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(branch, param_key)
);

ALTER TABLE branch_measurement_params ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read branch_measurement_params" ON branch_measurement_params;
CREATE POLICY "Anyone can read branch_measurement_params" ON branch_measurement_params
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service can manage branch_measurement_params" ON branch_measurement_params;
CREATE POLICY "Service can manage branch_measurement_params" ON branch_measurement_params
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Seed: Branş bazlı ölçüm parametreleri
INSERT INTO branch_measurement_params (branch, param_key, param_label, unit, sort_order) VALUES
  -- Futbol
  ('Futbol', 'sprint', 'Sprint (20m)', 'sn', 1),
  ('Futbol', 'dayaniklilik', 'Dayanıklılık', 'puan', 2),
  ('Futbol', 'teknik', 'Teknik', 'puan', 3),
  ('Futbol', 'taktik', 'Taktik', 'puan', 4),
  -- Basketbol
  ('Basketbol', 'boy', 'Boy', 'cm', 1),
  ('Basketbol', 'sicrama', 'Sıçrama', 'cm', 2),
  ('Basketbol', 'top_surme', 'Top Sürme', 'puan', 3),
  ('Basketbol', 'sut', 'Şut', 'puan', 4),
  -- Yüzme
  ('Yüzme', 'tur_suresi', 'Tur Süresi', 'sn', 1),
  ('Yüzme', 'teknik_puan', 'Teknik Puan', 'puan', 2),
  ('Yüzme', 'dayaniklilik', 'Dayanıklılık', 'puan', 3),
  -- Cimnastik
  ('Cimnastik', 'esneklik', 'Esneklik', 'cm', 1),
  ('Cimnastik', 'guc', 'Güç', 'puan', 2),
  ('Cimnastik', 'denge', 'Denge', 'puan', 3),
  ('Cimnastik', 'koordinasyon', 'Koordinasyon', 'puan', 4),
  -- Tenis
  ('Tenis', 'servis_hizi', 'Servis Hızı', 'km/h', 1),
  ('Tenis', 'isabetlilik', 'İsabetlilik', '%', 2),
  ('Tenis', 'dayaniklilik', 'Dayanıklılık', 'puan', 3)
ON CONFLICT (branch, param_key) DO NOTHING;

-- 2. branch_measurement_averages: Yaş grubu ortalamaları (referans)
CREATE TABLE IF NOT EXISTS branch_measurement_averages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch TEXT NOT NULL,
  param_key TEXT NOT NULL,
  age_min INTEGER NOT NULL,
  age_max INTEGER NOT NULL,
  gender TEXT CHECK (gender IN ('E', 'K', 'U')),
  avg_value DECIMAL(10,2) NOT NULL,
  min_value DECIMAL(10,2),
  max_value DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE branch_measurement_averages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read branch_measurement_averages" ON branch_measurement_averages;
CREATE POLICY "Anyone can read branch_measurement_averages" ON branch_measurement_averages
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service can manage branch_measurement_averages" ON branch_measurement_averages;
CREATE POLICY "Service can manage branch_measurement_averages" ON branch_measurement_averages
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Seed: Örnek yaş grubu ortalamaları
INSERT INTO branch_measurement_averages (branch, param_key, age_min, age_max, gender, avg_value, min_value, max_value) VALUES
  ('Futbol', 'sprint', 6, 8, 'U', 4.5, 3.8, 5.2),
  ('Futbol', 'sprint', 9, 11, 'U', 3.8, 3.2, 4.5),
  ('Futbol', 'sprint', 12, 14, 'U', 3.3, 2.8, 3.9),
  ('Futbol', 'dayaniklilik', 6, 8, 'U', 5.0, 3.0, 7.0),
  ('Futbol', 'dayaniklilik', 9, 11, 'U', 6.0, 4.0, 8.0),
  ('Futbol', 'teknik', 6, 8, 'U', 4.0, 2.0, 6.0),
  ('Futbol', 'teknik', 9, 11, 'U', 5.5, 3.5, 7.5),
  ('Futbol', 'taktik', 6, 8, 'U', 3.5, 2.0, 5.0),
  ('Futbol', 'taktik', 9, 11, 'U', 5.0, 3.0, 7.0),
  ('Basketbol', 'boy', 6, 8, 'E', 125.0, 115.0, 135.0),
  ('Basketbol', 'boy', 9, 11, 'E', 140.0, 130.0, 150.0),
  ('Basketbol', 'sicrama', 6, 8, 'U', 20.0, 15.0, 25.0),
  ('Basketbol', 'sicrama', 9, 11, 'U', 28.0, 22.0, 34.0),
  ('Basketbol', 'top_surme', 6, 8, 'U', 4.0, 2.0, 6.0),
  ('Basketbol', 'sut', 6, 8, 'U', 3.0, 1.0, 5.0),
  ('Yüzme', 'tur_suresi', 6, 8, 'U', 45.0, 35.0, 55.0),
  ('Yüzme', 'tur_suresi', 9, 11, 'U', 35.0, 28.0, 42.0),
  ('Yüzme', 'teknik_puan', 6, 8, 'U', 5.0, 3.0, 7.0),
  ('Yüzme', 'dayaniklilik', 6, 8, 'U', 4.5, 3.0, 6.0),
  ('Cimnastik', 'esneklik', 6, 8, 'K', 35.0, 25.0, 45.0),
  ('Cimnastik', 'esneklik', 9, 11, 'K', 40.0, 30.0, 50.0),
  ('Cimnastik', 'guc', 6, 8, 'U', 4.5, 3.0, 6.0),
  ('Cimnastik', 'denge', 6, 8, 'U', 5.0, 3.0, 7.0),
  ('Cimnastik', 'koordinasyon', 6, 8, 'U', 4.5, 3.0, 6.0),
  ('Tenis', 'servis_hizi', 9, 11, 'U', 80.0, 60.0, 100.0),
  ('Tenis', 'servis_hizi', 12, 14, 'U', 110.0, 85.0, 135.0),
  ('Tenis', 'isabetlilik', 9, 11, 'U', 45.0, 30.0, 60.0),
  ('Tenis', 'dayaniklilik', 9, 11, 'U', 5.5, 4.0, 7.0)
ON CONFLICT DO NOTHING;

-- 3. branch_movements: Branş bazlı hareket havuzu
CREATE TABLE IF NOT EXISTS branch_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  branch TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  image_url TEXT,
  duration_seconds INTEGER,
  repetitions INTEGER,
  difficulty TEXT DEFAULT 'orta' CHECK (difficulty IN ('kolay', 'orta', 'zor')),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_branch_movements_branch ON branch_movements(branch);
CREATE INDEX IF NOT EXISTS idx_branch_movements_tenant ON branch_movements(tenant_id);

ALTER TABLE branch_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant users can view branch_movements" ON branch_movements;
CREATE POLICY "Tenant users can view branch_movements" ON branch_movements
  FOR SELECT USING (
    tenant_id IS NULL OR
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()) OR
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  );
DROP POLICY IF EXISTS "Service can manage branch_movements" ON branch_movements;
CREATE POLICY "Service can manage branch_movements" ON branch_movements
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Seed: Örnek hareketler
INSERT INTO branch_movements (tenant_id, branch, name, description, duration_seconds, repetitions, difficulty, sort_order) VALUES
  (NULL, 'Futbol', 'Isınma Koşusu', 'Hafif tempo ile 5 dakika koşu', 300, NULL, 'kolay', 1),
  (NULL, 'Futbol', 'Slalom Dribling', 'Koniler arasında top sürme', 120, 5, 'orta', 2),
  (NULL, 'Futbol', 'Şut Çalışması', 'Farklı açılardan kaleye şut', NULL, 20, 'orta', 3),
  (NULL, 'Futbol', 'Pas Üçgeni', '3 kişilik pas çalışması', 180, 10, 'kolay', 4),
  (NULL, 'Futbol', 'Sprint Antrenmanı', '20m sprint tekrarları', NULL, 8, 'zor', 5),
  (NULL, 'Basketbol', 'Layup Çalışması', 'Sağ ve sol el layup', NULL, 20, 'orta', 1),
  (NULL, 'Basketbol', 'Serbest Atış', 'Serbest atış çizgisinden şut', NULL, 30, 'kolay', 2),
  (NULL, 'Basketbol', 'Dribling Parkuru', 'Engeller arasında top sürme', 120, 5, 'orta', 3),
  (NULL, 'Basketbol', 'Pivot Çalışması', 'Tek ayak pivot ve şut', NULL, 15, 'zor', 4),
  (NULL, 'Yüzme', 'Serbest Stil Teknik', 'Kol ve bacak koordinasyonu', 600, NULL, 'orta', 1),
  (NULL, 'Yüzme', 'Sırtüstü Bacak Vuruşu', 'Tahta ile bacak çalışması', 300, NULL, 'kolay', 2),
  (NULL, 'Yüzme', 'Kelebek Kol Çekişi', 'Kelebek stil kol hareketi', 300, NULL, 'zor', 3),
  (NULL, 'Cimnastik', 'Köprü', 'Geriye köprü pozisyonu', 60, 5, 'orta', 1),
  (NULL, 'Cimnastik', 'Amuda Kalkma', 'Duvara yaslanarak amut', 30, 5, 'zor', 2),
  (NULL, 'Cimnastik', 'Temel Denge', 'Denge aleti üzerinde yürüme', 120, 3, 'kolay', 3),
  (NULL, 'Cimnastik', 'Takla İleri', 'İleri takla tekniği', NULL, 10, 'orta', 4),
  (NULL, 'Tenis', 'Forehand Vuruş', 'Temel forehand tekniği', NULL, 30, 'kolay', 1),
  (NULL, 'Tenis', 'Backhand Vuruş', 'İki el backhand çalışması', NULL, 30, 'orta', 2),
  (NULL, 'Tenis', 'Servis Çalışması', 'Düz ve slice servis', NULL, 20, 'zor', 3),
  (NULL, 'Tenis', 'Voley Drili', 'File önü voley çalışması', 180, 15, 'orta', 4)
ON CONFLICT DO NOTHING;

-- 4. athlete_movements: Eksik kolonları ekle (hareket havuzu detayları)
ALTER TABLE athlete_movements ADD COLUMN IF NOT EXISTS branch_movement_id UUID REFERENCES branch_movements(id) ON DELETE SET NULL;
ALTER TABLE athlete_movements ADD COLUMN IF NOT EXISTS ilerleme INTEGER DEFAULT 0;
ALTER TABLE athlete_movements ADD COLUMN IF NOT EXISTS tekrar_sayisi INTEGER DEFAULT 0;
ALTER TABLE athlete_movements ADD COLUMN IF NOT EXISTS son_calisma_tarihi DATE;

-- 5. appointments: Randevu sistemi
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  athlete_id UUID REFERENCES athletes(id) ON DELETE SET NULL,
  parent_user_id UUID NOT NULL,
  coach_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  parent_name TEXT NOT NULL,
  parent_surname TEXT,
  parent_phone TEXT,
  note TEXT,
  status TEXT DEFAULT 'bekliyor' CHECK (status IN ('bekliyor', 'onaylandi', 'reddedildi', 'iptal', 'tamamlandi')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_tenant ON appointments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_parent ON appointments(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_coach ON appointments(coach_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Veli kendi randevularını görebilir
DROP POLICY IF EXISTS "Veli can view own appointments" ON appointments;
CREATE POLICY "Veli can view own appointments" ON appointments
  FOR SELECT USING (parent_user_id = auth.uid());

-- Veli randevu oluşturabilir
DROP POLICY IF EXISTS "Veli can create appointments" ON appointments;
CREATE POLICY "Veli can create appointments" ON appointments
  FOR INSERT WITH CHECK (parent_user_id = auth.uid());

-- Veli kendi randevusunu iptal edebilir
DROP POLICY IF EXISTS "Veli can update own appointments" ON appointments;
CREATE POLICY "Veli can update own appointments" ON appointments
  FOR UPDATE USING (parent_user_id = auth.uid());

-- Tenant personeli tüm randevuları görebilir
DROP POLICY IF EXISTS "Tenant staff can view appointments" ON appointments;
CREATE POLICY "Tenant staff can view appointments" ON appointments
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  );

-- Service role tam erişim
DROP POLICY IF EXISTS "Service can manage appointments" ON appointments;
CREATE POLICY "Service can manage appointments" ON appointments
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- 6. coach_availability: Antrenör müsait saatler
CREATE TABLE IF NOT EXISTS coach_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE coach_availability ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone in tenant can view coach_availability" ON coach_availability;
CREATE POLICY "Anyone in tenant can view coach_availability" ON coach_availability
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()) OR
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  );
DROP POLICY IF EXISTS "Service can manage coach_availability" ON coach_availability;
CREATE POLICY "Service can manage coach_availability" ON coach_availability
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Seed: Varsayılan antrenör müsaitlikleri (Pazartesi-Cuma 09:00-17:00)
-- Bu veriler tenant ve coach_id olmadan genel şablon olarak kalır
