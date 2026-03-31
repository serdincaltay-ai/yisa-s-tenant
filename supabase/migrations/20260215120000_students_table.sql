-- Görev 9: Öğrenci CRUD — students tablosu
-- YİSA-S Franchise Paneli
-- Tarih: 15 Şubat 2026

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  ad_soyad TEXT NOT NULL,
  tc_kimlik VARCHAR(11) NOT NULL,
  dogum_tarihi DATE NOT NULL,
  cinsiyet TEXT CHECK (cinsiyet IN ('E', 'K', 'diger')),
  veli_adi TEXT,
  veli_telefon TEXT,
  veli_email TEXT,
  brans TEXT,
  grup_id UUID,
  saglik_notu TEXT,
  status TEXT DEFAULT 'aktif' CHECK (status IN ('aktif', 'pasif')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, tc_kimlik)
);

CREATE INDEX IF NOT EXISTS idx_students_tenant_id ON students(tenant_id);
CREATE INDEX IF NOT EXISTS idx_students_tc_kimlik ON students(tenant_id, tc_kimlik);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_ad_soyad ON students(tenant_id, ad_soyad);
CREATE INDEX IF NOT EXISTS idx_students_created_at ON students(created_at DESC);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own tenant students" ON students;
CREATE POLICY "Users see own tenant students" ON students FOR SELECT USING (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Users manage own tenant students" ON students;
CREATE POLICY "Users manage own tenant students" ON students FOR ALL USING (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
) WITH CHECK (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Service can manage students" ON students;
CREATE POLICY "Service can manage students" ON students FOR ALL USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION update_students_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_students_updated ON students;
CREATE TRIGGER trg_students_updated BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE PROCEDURE update_students_updated_at();
