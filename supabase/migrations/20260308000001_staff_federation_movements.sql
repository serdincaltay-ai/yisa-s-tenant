-- staff eksik kolonlar (form UI'da var ama DB'de yok)
ALTER TABLE staff ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS previous_work TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS employment_type TEXT DEFAULT 'full_time'
  CHECK (employment_type IN ('full_time','part_time','intern'));
ALTER TABLE staff ADD COLUMN IF NOT EXISTS employment_start_date DATE;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS is_competitive_coach BOOLEAN DEFAULT false;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS license_type TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- federation_info tablosu (yeni)
CREATE TABLE IF NOT EXISTS federation_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  branch TEXT NOT NULL,
  il TEXT,
  temsilci_adi TEXT,
  temsilci_telefonu TEXT,
  federasyon_adi TEXT,
  yarisma_kulupleri JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE federation_info ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant okur" ON federation_info;
CREATE POLICY "Tenant okur" ON federation_info FOR SELECT
  USING (tenant_id = (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid() LIMIT 1));
DROP POLICY IF EXISTS "Patron yazar" ON federation_info;
CREATE POLICY "Patron yazar" ON federation_info FOR ALL USING (true) WITH CHECK (true);

-- athlete_movements tablosu (yeni)
CREATE TABLE IF NOT EXISTS athlete_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  movement_id UUID,
  tamamlandi BOOLEAN DEFAULT false,
  tamamlanma_tarihi DATE,
  antrenor_notu TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE athlete_movements ENABLE ROW LEVEL SECURITY;

-- staff_leave_requests
CREATE TABLE IF NOT EXISTS staff_leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  leave_date DATE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'bekliyor' CHECK (status IN ('bekliyor','onaylandi','reddedildi')),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE staff_leave_requests ENABLE ROW LEVEL SECURITY;

-- staff_advance_requests
CREATE TABLE IF NOT EXISTS staff_advance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'bekliyor' CHECK (status IN ('bekliyor','onaylandi','reddedildi')),
  requested_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE staff_advance_requests ENABLE ROW LEVEL SECURITY;

-- celf_tasks.rejection_reason kolonu (tablet ASK ekranı için)
ALTER TABLE ceo_tasks ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
