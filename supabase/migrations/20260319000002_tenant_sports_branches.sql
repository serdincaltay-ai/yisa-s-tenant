-- Per-tenant branş aktivasyon tablosu
-- sports_branches global referans tablosudur, bu junction table
-- her tenant'ın hangi branşları aktif ettiğini takip eder.

CREATE TABLE IF NOT EXISTS tenant_sports_branches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sports_branch_id UUID NOT NULL REFERENCES sports_branches(id) ON DELETE CASCADE,
  aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, sports_branch_id)
);

-- Indeksler
CREATE INDEX IF NOT EXISTS idx_tenant_sports_branches_tenant ON tenant_sports_branches(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_sports_branches_aktif ON tenant_sports_branches(tenant_id, aktif);

-- RLS
ALTER TABLE tenant_sports_branches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant kendi branslarini gorebilir" ON tenant_sports_branches;
CREATE POLICY "Tenant kendi branslarini gorebilir"
  ON tenant_sports_branches FOR SELECT
  USING (tenant_id IN (
    SELECT ut.tenant_id FROM user_tenants ut WHERE ut.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Tenant kendi branslarini yonetebilir" ON tenant_sports_branches;
CREATE POLICY "Tenant kendi branslarini yonetebilir"
  ON tenant_sports_branches FOR ALL
  USING (tenant_id IN (
    SELECT ut.tenant_id FROM user_tenants ut WHERE ut.user_id = auth.uid() AND ut.role IN ('owner', 'admin')
  ));

DROP POLICY IF EXISTS "Service role tam erisim tenant_sports_branches" ON tenant_sports_branches;
CREATE POLICY "Service role tam erisim tenant_sports_branches"
  ON tenant_sports_branches FOR ALL
  USING (auth.role() = 'service_role');
