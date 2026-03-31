-- Tenant-Şablon kullanım ilişkisi — Hangi tenant hangi şablonu kullanıyor
-- YİSA-S Sistem Anayasası uyumu

CREATE TABLE IF NOT EXISTS tenant_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  template_id UUID NOT NULL,
  template_source TEXT NOT NULL CHECK (template_source IN ('templates', 'ceo_templates')),
  used_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, template_id, template_source)
);

CREATE INDEX IF NOT EXISTS idx_tenant_templates_tenant ON tenant_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_templates_template ON tenant_templates(template_id, template_source);
CREATE INDEX IF NOT EXISTS idx_tenant_templates_used_by ON tenant_templates(used_by_user_id);

ALTER TABLE tenant_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service can manage tenant_templates" ON tenant_templates;
CREATE POLICY "Service can manage tenant_templates" ON tenant_templates
  FOR ALL USING (true) WITH CHECK (true);
