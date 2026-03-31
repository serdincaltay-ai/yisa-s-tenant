-- ═══════════════════════════════════════════════════════════════════════════
-- GÖREV #25: Çok Şubeli Tenant — Şube Seçici, Fenerbahçe 4 Şube Modeli
-- parent_tenant_id (self-referencing), branch_id kolonları, RLS güncellemeleri
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. tenants tablosuna parent_tenant_id (self-referencing)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS parent_tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_parent ON tenants(parent_tenant_id) WHERE parent_tenant_id IS NOT NULL;

-- 2. tenant_branches tablosuna renk ve ikon kolonları
ALTER TABLE tenant_branches ADD COLUMN IF NOT EXISTS renk TEXT DEFAULT '#06b6d4';
ALTER TABLE tenant_branches ADD COLUMN IF NOT EXISTS ikon TEXT DEFAULT 'building';
ALTER TABLE tenant_branches ADD COLUMN IF NOT EXISTS personel_sayisi INTEGER DEFAULT 0;
ALTER TABLE tenant_branches ADD COLUMN IF NOT EXISTS ogrenci_sayisi INTEGER DEFAULT 0;

-- 3. staff tablosuna branch_id
ALTER TABLE staff ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES tenant_branches(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_staff_branch ON staff(branch_id) WHERE branch_id IS NOT NULL;

-- 4. athletes tablosuna branch_id
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES tenant_branches(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_athletes_branch ON athletes(branch_id) WHERE branch_id IS NOT NULL;

-- 5. tenant_schedule tablosuna branch_id (eğer tablo varsa)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenant_schedule') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_schedule' AND column_name = 'branch_id') THEN
      ALTER TABLE tenant_schedule ADD COLUMN branch_id UUID REFERENCES tenant_branches(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_tenant_schedule_branch ON tenant_schedule(branch_id) WHERE branch_id IS NOT NULL;
    END IF;
  END IF;
END $$;

-- 6. attendance tablosuna branch_id (eğer tablo varsa)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'attendance') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance' AND column_name = 'branch_id') THEN
      ALTER TABLE attendance ADD COLUMN branch_id UUID REFERENCES tenant_branches(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_attendance_branch ON attendance(branch_id) WHERE branch_id IS NOT NULL;
    END IF;
  END IF;
END $$;

-- 7. payments tablosuna branch_id (eğer tablo varsa)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'branch_id') THEN
      ALTER TABLE payments ADD COLUMN branch_id UUID REFERENCES tenant_branches(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_payments_branch ON payments(branch_id) WHERE branch_id IS NOT NULL;
    END IF;
  END IF;
END $$;

-- 8. cash_register tablosuna branch_id (eğer tablo varsa)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cash_register') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cash_register' AND column_name = 'branch_id') THEN
      ALTER TABLE cash_register ADD COLUMN branch_id UUID REFERENCES tenant_branches(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_cash_register_branch ON cash_register(branch_id) WHERE branch_id IS NOT NULL;
    END IF;
  END IF;
END $$;

-- 9a. Personel sayısını güncelleyen trigger fonksiyonu
CREATE OR REPLACE FUNCTION update_staff_branch_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Eski şubenin sayısını güncelle (transfer durumunda)
  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.branch_id IS NOT NULL) THEN
    UPDATE tenant_branches SET personel_sayisi = (
      SELECT COUNT(*) FROM staff WHERE staff.branch_id = OLD.branch_id AND staff.is_active = true
    ) WHERE id = OLD.branch_id;
  END IF;

  -- Yeni şubenin sayısını güncelle
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.branch_id IS NOT NULL) THEN
    UPDATE tenant_branches SET personel_sayisi = (
      SELECT COUNT(*) FROM staff WHERE staff.branch_id = NEW.branch_id AND staff.is_active = true
    ) WHERE id = NEW.branch_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 9b. Öğrenci sayısını güncelleyen trigger fonksiyonu
CREATE OR REPLACE FUNCTION update_athlete_branch_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Eski şubenin sayısını güncelle (transfer durumunda)
  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.branch_id IS NOT NULL) THEN
    UPDATE tenant_branches SET ogrenci_sayisi = (
      SELECT COUNT(*) FROM athletes WHERE athletes.branch_id = OLD.branch_id AND athletes.status = 'active'
    ) WHERE id = OLD.branch_id;
  END IF;

  -- Yeni şubenin sayısını güncelle
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.branch_id IS NOT NULL) THEN
    UPDATE tenant_branches SET ogrenci_sayisi = (
      SELECT COUNT(*) FROM athletes WHERE athletes.branch_id = NEW.branch_id AND athletes.status = 'active'
    ) WHERE id = NEW.branch_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 9c. Trigger'ları oluştur
DROP TRIGGER IF EXISTS trg_staff_branch_counts ON staff;
CREATE TRIGGER trg_staff_branch_counts
  AFTER INSERT OR UPDATE OF branch_id, is_active OR DELETE ON staff
  FOR EACH ROW EXECUTE FUNCTION update_staff_branch_counts();

DROP TRIGGER IF EXISTS trg_athletes_branch_counts ON athletes;
CREATE TRIGGER trg_athletes_branch_counts
  AFTER INSERT OR UPDATE OF branch_id, status OR DELETE ON athletes
  FOR EACH ROW EXECUTE FUNCTION update_athlete_branch_counts();

-- 10. RLS: Patron tüm şubeleri görsün, personel kendi şubesini görsün
-- staff tablosu için branch bazlı RLS (mevcut tenant bazlı RLS'e ek)
DROP POLICY IF EXISTS "Staff branch-based read" ON staff;
CREATE POLICY "Staff branch-based read" ON staff FOR SELECT USING (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
);

-- tenant_branches için güncelleme: personel kendi şubesini görsün
DROP POLICY IF EXISTS "Personel kendi subesini gorebilir" ON tenant_branches;
CREATE POLICY "Personel kendi subesini gorebilir"
  ON tenant_branches FOR SELECT
  USING (
    tenant_id IN (
      SELECT ut.tenant_id FROM user_tenants ut WHERE ut.user_id = auth.uid()
    )
  );

-- 11. Şube transferi için log tablosu
CREATE TABLE IF NOT EXISTS branch_transfers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  kaynak_branch_id UUID REFERENCES tenant_branches(id) ON DELETE SET NULL,
  hedef_branch_id UUID NOT NULL REFERENCES tenant_branches(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('staff', 'athlete')),
  entity_id UUID NOT NULL,
  transfer_eden_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  neden TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_branch_transfers_tenant ON branch_transfers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_branch_transfers_hedef ON branch_transfers(hedef_branch_id);

ALTER TABLE branch_transfers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant kendi transferlerini gorebilir" ON branch_transfers;
CREATE POLICY "Tenant kendi transferlerini gorebilir"
  ON branch_transfers FOR SELECT
  USING (tenant_id IN (
    SELECT ut.tenant_id FROM user_tenants ut WHERE ut.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Yonetici transfer yapabilir" ON branch_transfers;
CREATE POLICY "Yonetici transfer yapabilir"
  ON branch_transfers FOR ALL
  USING (tenant_id IN (
    SELECT ut.tenant_id FROM user_tenants ut WHERE ut.user_id = auth.uid() AND ut.role IN ('owner', 'admin')
  ));

DROP POLICY IF EXISTS "Service role tam erisim branch_transfers" ON branch_transfers;
CREATE POLICY "Service role tam erisim branch_transfers"
  ON branch_transfers FOR ALL
  USING (auth.role() = 'service_role');
