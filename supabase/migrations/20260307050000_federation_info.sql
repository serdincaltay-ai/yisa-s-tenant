-- Federasyon Bilgileri Tablosu
-- Her tenant için branş bazlı federasyon temsilcisi ve yarışan kulüpler bilgisi

CREATE TABLE IF NOT EXISTS federation_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  branch TEXT,              -- 'jimnastik', 'voleybol', 'basketbol', 'yuzme'
  il TEXT,
  ilce TEXT,
  temsilci_adi TEXT,
  temsilci_telefonu TEXT,
  federasyon_adi TEXT,
  yarisma_kulupleri JSONB,  -- [{ "kulup_adi": "BJK", "adres": "...", "telefon": "..." }]
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indeksler
CREATE INDEX IF NOT EXISTS idx_federation_info_tenant ON federation_info(tenant_id);
CREATE INDEX IF NOT EXISTS idx_federation_info_branch ON federation_info(tenant_id, branch);

-- RLS
ALTER TABLE federation_info ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant kendi federasyon bilgilerini gorebilir" ON federation_info;
CREATE POLICY "Tenant kendi federasyon bilgilerini gorebilir"
  ON federation_info FOR SELECT
  USING (tenant_id IN (
    SELECT ut.tenant_id FROM user_tenants ut WHERE ut.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Tenant kendi federasyon bilgilerini yonetebilir" ON federation_info;
CREATE POLICY "Tenant kendi federasyon bilgilerini yonetebilir"
  ON federation_info FOR ALL
  USING (tenant_id IN (
    SELECT ut.tenant_id FROM user_tenants ut WHERE ut.user_id = auth.uid() AND ut.role IN ('owner', 'admin')
  ));

DROP POLICY IF EXISTS "Service role tam erisim federation_info" ON federation_info;
CREATE POLICY "Service role tam erisim federation_info"
  ON federation_info FOR ALL
  USING (auth.role() = 'service_role');
