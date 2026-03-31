-- Görev 10.2: Paket + Ödeme sistemi
-- packages (sistem) ile çakışmayı önlemek için seans_packages kullanıyoruz

CREATE TABLE IF NOT EXISTS seans_packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  seans_count INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'TRY',
  max_taksit INTEGER DEFAULT 1,
  status TEXT DEFAULT 'aktif',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES seans_packages(id) ON DELETE CASCADE,
  toplam_seans INTEGER NOT NULL,
  kalan_seans INTEGER NOT NULL,
  baslangic_tarihi DATE NOT NULL,
  bitis_tarihi DATE,
  status TEXT DEFAULT 'aktif',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS package_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  student_package_id UUID REFERENCES student_packages(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'TRY',
  payment_date DATE,
  due_date DATE NOT NULL,
  taksit_no INTEGER DEFAULT 1,
  toplam_taksit INTEGER DEFAULT 1,
  status TEXT DEFAULT 'bekliyor' CHECK (status IN ('bekliyor', 'odendi', 'gecikmis', 'iptal')),
  payment_method TEXT CHECK (payment_method IS NULL OR payment_method IN ('nakit', 'havale', 'kredi_karti', 'diger')),
  description TEXT,
  receipt_no TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seans_packages_tenant ON seans_packages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_student_packages_tenant ON student_packages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_student_packages_student ON student_packages(student_id);
CREATE INDEX IF NOT EXISTS idx_package_payments_tenant ON package_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_package_payments_student ON package_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_package_payments_status ON package_payments(status);
CREATE INDEX IF NOT EXISTS idx_package_payments_due_date ON package_payments(due_date);

ALTER TABLE seans_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant users manage seans_packages" ON seans_packages;
CREATE POLICY "Tenant users manage seans_packages" ON seans_packages FOR ALL USING (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
) WITH CHECK (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Service can manage seans_packages" ON seans_packages;
CREATE POLICY "Service can manage seans_packages" ON seans_packages FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Tenant users manage student_packages" ON student_packages;
CREATE POLICY "Tenant users manage student_packages" ON student_packages FOR ALL USING (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
) WITH CHECK (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Service can manage student_packages" ON student_packages;
CREATE POLICY "Service can manage student_packages" ON student_packages FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Tenant users manage package_payments" ON package_payments;
CREATE POLICY "Tenant users manage package_payments" ON package_payments FOR ALL USING (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
) WITH CHECK (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Service can manage package_payments" ON package_payments;
CREATE POLICY "Service can manage package_payments" ON package_payments FOR ALL USING (true) WITH CHECK (true);
