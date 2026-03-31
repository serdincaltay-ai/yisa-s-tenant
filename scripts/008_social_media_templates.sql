-- ============================================================
-- GOREV 4: Sosyal Medya Robotu — social_media_templates tablosu
-- Instagram / WhatsApp / Facebook sablonlari
-- Tenant-branded icerik uretimi
-- ============================================================

CREATE TABLE IF NOT EXISTS social_media_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'whatsapp', 'facebook')),
  template_type TEXT NOT NULL CHECK (template_type IN ('post', 'story', 'reel', 'message', 'cover')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  media_url TEXT,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexler
CREATE INDEX IF NOT EXISTS idx_smt_tenant ON social_media_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_smt_platform ON social_media_templates(platform);
CREATE INDEX IF NOT EXISTS idx_smt_type ON social_media_templates(template_type);

-- RLS
ALTER TABLE social_media_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY smt_tenant_read ON social_media_templates
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY smt_tenant_write ON social_media_templates
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('patron', 'mudur')
    )
  );

CREATE POLICY smt_service ON social_media_templates
  FOR ALL USING (auth.role() = 'service_role');
