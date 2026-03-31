-- Tenant iletişim: duyurular ve anketler (tenant_id ile filtreli)
-- Tarih: 24 Şubat 2026

CREATE TABLE IF NOT EXISTS tenant_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tenant_announcements_tenant ON tenant_announcements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_announcements_created ON tenant_announcements(created_at DESC);

CREATE TABLE IF NOT EXISTS tenant_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tenant_surveys_tenant ON tenant_surveys(tenant_id);

ALTER TABLE tenant_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_surveys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant announcements" ON tenant_announcements;
CREATE POLICY "Tenant announcements" ON tenant_announcements FOR ALL USING (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
) WITH CHECK (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Tenant surveys" ON tenant_surveys;
CREATE POLICY "Tenant surveys" ON tenant_surveys FOR ALL USING (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
) WITH CHECK (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
);
