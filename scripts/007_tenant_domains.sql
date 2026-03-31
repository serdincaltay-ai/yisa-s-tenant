-- ============================================================
-- GOREV 2: Tenant White-Label — tenant_domains tablosu
-- Subdomain, custom domain (CNAME), embed widget destegi
-- ============================================================

-- tenant_domains: her tenant icin domain mapping
CREATE TABLE IF NOT EXISTS tenant_domains (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  domain TEXT NOT NULL UNIQUE,
  domain_type TEXT NOT NULL DEFAULT 'subdomain' CHECK (domain_type IN ('subdomain', 'custom', 'embed')),
  custom_domain TEXT,
  is_verified BOOLEAN DEFAULT false,
  theme_config JSONB DEFAULT '{}'::jsonb,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index: hizli domain lookup
CREATE INDEX IF NOT EXISTS idx_tenant_domains_domain ON tenant_domains(domain);
CREATE INDEX IF NOT EXISTS idx_tenant_domains_tenant ON tenant_domains(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_domains_custom ON tenant_domains(custom_domain) WHERE custom_domain IS NOT NULL;

-- RLS
ALTER TABLE tenant_domains ENABLE ROW LEVEL SECURITY;

-- Patron kendi tenant domain'lerini gorebilir
CREATE POLICY tenant_domains_patron_read ON tenant_domains
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- Service role full access (middleware icin)
CREATE POLICY tenant_domains_service ON tenant_domains
  FOR ALL USING (auth.role() = 'service_role');

-- Demo tenant ekle: bjktuzlacimnastik.yisa-s.com
-- NOT: Bu sadece seed data, gercek tenant_id ile degistirilmeli
INSERT INTO tenant_domains (tenant_id, domain, domain_type, theme_config)
SELECT
  t.id,
  'bjktuzlacimnastik.yisa-s.com',
  'subdomain',
  '{"primary_color": "#22d3ee", "accent_color": "#f97316", "bg_color": "#09090b", "font": "Inter"}'::jsonb
FROM tenants t
WHERE t.slug = 'bjktuzlacimnastik'
ON CONFLICT (domain) DO NOTHING;

-- Demo tenant: demo.yisa-s.com
INSERT INTO tenant_domains (tenant_id, domain, domain_type, theme_config)
SELECT
  t.id,
  'demo.yisa-s.com',
  'subdomain',
  '{"primary_color": "#22d3ee", "accent_color": "#f97316", "bg_color": "#09090b", "font": "Inter"}'::jsonb
FROM tenants t
WHERE t.slug = 'demo'
ON CONFLICT (domain) DO NOTHING;
