-- CRM tabloları — ManyChat webhook lead'leri ve aktivite kaydı
-- crm_contacts: Tüm CRM iletişim kişileri (lead, müşteri vb.)
-- crm_activities: İletişim kişilerine ait aktivite günlüğü

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. CRM_CONTACTS — İletişim kişileri
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  city TEXT,
  source TEXT DEFAULT 'manychat' CHECK (source IN ('manychat', 'website', 'manual', 'referral', 'other')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  notes TEXT,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Eski/alternatif migration ile oluşturulmuş tabloda kolonlar eksikse ekle (idempotent)
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manychat';
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new';
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}'::jsonb;
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_crm_contacts_email ON crm_contacts(email);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_source ON crm_contacts(source);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_status ON crm_contacts(status);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_tenant_id ON crm_contacts(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_contacts_created_at ON crm_contacts(created_at DESC);

ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;

-- Herkes insert yapabilir (webhook, anon). SELECT/UPDATE/DELETE: sadece service_role.
DROP POLICY IF EXISTS "Anyone can insert crm_contacts" ON crm_contacts;
CREATE POLICY "Anyone can insert crm_contacts" ON crm_contacts FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Service can manage crm_contacts" ON crm_contacts;
CREATE POLICY "Service can manage crm_contacts" ON crm_contacts FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Trigger: updated_at
CREATE OR REPLACE FUNCTION update_crm_contacts_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_crm_contacts_updated ON crm_contacts;
CREATE TRIGGER trg_crm_contacts_updated BEFORE UPDATE ON crm_contacts FOR EACH ROW EXECUTE PROCEDURE update_crm_contacts_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. CRM_ACTIVITIES — Aktivite günlüğü
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('manychat_lead', 'email_sent', 'call', 'note', 'status_change', 'demo_created', 'other')),
  description TEXT,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Eski tabloda kolonlar eksikse ekle (idempotent)
ALTER TABLE crm_activities ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE;
ALTER TABLE crm_activities ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;
ALTER TABLE crm_activities ADD COLUMN IF NOT EXISTS activity_type TEXT;
ALTER TABLE crm_activities ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE crm_activities ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}'::jsonb;
ALTER TABLE crm_activities ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_crm_activities_contact_id ON crm_activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_tenant_id ON crm_activities(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_activities_type ON crm_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_crm_activities_created_at ON crm_activities(created_at DESC);

ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;

-- Herkes insert yapabilir (webhook). SELECT/UPDATE/DELETE: sadece service_role.
DROP POLICY IF EXISTS "Anyone can insert crm_activities" ON crm_activities;
CREATE POLICY "Anyone can insert crm_activities" ON crm_activities FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Service can manage crm_activities" ON crm_activities;
CREATE POLICY "Service can manage crm_activities" ON crm_activities FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
