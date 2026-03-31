-- Ek Şube (Branches) Sistemi
-- Bir tenant birden fazla fiziksel şubeye sahip olabilir.
-- Her şube bağımsız adres, telefon, çalışma saatleri taşır.

CREATE TABLE IF NOT EXISTS tenant_branches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  ad TEXT NOT NULL,
  slug TEXT NOT NULL,
  adres TEXT,
  telefon TEXT,
  email TEXT,
  sehir TEXT,
  ilce TEXT,
  calisma_saatleri JSONB DEFAULT '{}'::jsonb,
  aktif BOOLEAN DEFAULT true,
  varsayilan BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, slug)
);

-- Indeksler
CREATE INDEX IF NOT EXISTS idx_tenant_branches_tenant ON tenant_branches(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_branches_aktif ON tenant_branches(tenant_id, aktif);

-- RLS
ALTER TABLE tenant_branches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant kendi subelerini gorebilir" ON tenant_branches;
CREATE POLICY "Tenant kendi subelerini gorebilir"
  ON tenant_branches FOR SELECT
  USING (tenant_id IN (
    SELECT ut.tenant_id FROM user_tenants ut WHERE ut.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Tenant kendi subelerini yonetebilir" ON tenant_branches;
CREATE POLICY "Tenant kendi subelerini yonetebilir"
  ON tenant_branches FOR ALL
  USING (tenant_id IN (
    SELECT ut.tenant_id FROM user_tenants ut WHERE ut.user_id = auth.uid() AND ut.role IN ('owner', 'admin')
  ));

DROP POLICY IF EXISTS "Service role tam erisim tenant_branches" ON tenant_branches;
CREATE POLICY "Service role tam erisim tenant_branches"
  ON tenant_branches FOR ALL
  USING (auth.role() = 'service_role');
