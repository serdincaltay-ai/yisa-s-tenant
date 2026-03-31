-- Kasa defteri: gelir-gider kayıtları
CREATE TABLE IF NOT EXISTS cash_register (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tarih DATE NOT NULL DEFAULT CURRENT_DATE,
  tur TEXT NOT NULL CHECK (tur IN ('gelir', 'gider')),
  kategori TEXT NOT NULL CHECK (kategori IN ('aidat', 'ders_ucreti', 'kira', 'maas', 'malzeme', 'diger')),
  aciklama TEXT,
  tutar DECIMAL(12,2) NOT NULL,
  odeme_yontemi TEXT NOT NULL DEFAULT 'nakit' CHECK (odeme_yontemi IN ('nakit', 'havale', 'kart')),
  kaydeden_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cash_register_tenant ON cash_register(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cash_register_tarih ON cash_register(tarih);
CREATE INDEX IF NOT EXISTS idx_cash_register_tur ON cash_register(tur);

ALTER TABLE cash_register ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant users manage cash_register" ON cash_register;
DROP POLICY IF EXISTS "cash_register_select" ON cash_register;
CREATE POLICY "cash_register_select" ON cash_register FOR SELECT USING (
  auth.role() = 'authenticated' AND (
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
    OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "cash_register_insert" ON cash_register;
CREATE POLICY "cash_register_insert" ON cash_register FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND (
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
    OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "cash_register_update" ON cash_register;
CREATE POLICY "cash_register_update" ON cash_register FOR UPDATE USING (
  auth.role() = 'authenticated' AND (
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
    OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "cash_register_delete" ON cash_register;
CREATE POLICY "cash_register_delete" ON cash_register FOR DELETE USING (
  auth.role() = 'authenticated' AND (
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
    OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Service can manage cash_register" ON cash_register;
CREATE POLICY "Service can manage cash_register" ON cash_register FOR ALL USING (true) WITH CHECK (true);
