-- ============================================================
-- FAZ 2: Yeni tablolar — tenant_template_slots, tenant_leads,
-- trial_requests, system_templates, parent_profiles
-- ============================================================

-- 1. system_templates: Patron tarafından yönetilen şablon havuzu
CREATE TABLE IF NOT EXISTS system_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT NOT NULL UNIQUE,
  isim TEXT NOT NULL,
  aciklama TEXT,
  kategori TEXT DEFAULT 'genel',
  varsayilan_config JSONB DEFAULT '{}'::jsonb,
  onizleme_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. tenant_template_slots: Tenant'ın vitrin şablon slotları
CREATE TABLE IF NOT EXISTS tenant_template_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  template_id UUID REFERENCES system_templates(id) ON DELETE SET NULL,
  slot_key TEXT NOT NULL,
  slot_title TEXT,
  icerik JSONB DEFAULT '{}'::jsonb,
  sira INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, slot_key)
);

-- 3. tenant_leads: Potansiyel müşteri / demo talepleri
CREATE TABLE IF NOT EXISTS tenant_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  ad_soyad TEXT NOT NULL,
  telefon TEXT,
  email TEXT,
  kaynak TEXT DEFAULT 'vitrin',
  notlar TEXT,
  durum TEXT DEFAULT 'yeni' CHECK (durum IN ('yeni', 'iletisimde', 'demo_yapildi', 'kazanildi', 'kaybedildi')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. trial_requests: Deneme dersi talepleri
CREATE TABLE IF NOT EXISTS trial_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES tenant_leads(id) ON DELETE SET NULL,
  cocuk_adi TEXT NOT NULL,
  cocuk_yasi INTEGER,
  veli_adi TEXT NOT NULL,
  veli_telefon TEXT NOT NULL,
  brans TEXT,
  tercih_gun TEXT,
  tercih_saat TEXT,
  durum TEXT DEFAULT 'bekliyor' CHECK (durum IN ('bekliyor', 'onaylandi', 'tamamlandi', 'iptal')),
  notlar TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. parent_profiles: Veli profilleri (auth.users ile bağlantılı)
CREATE TABLE IF NOT EXISTS parent_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  ad_soyad TEXT NOT NULL,
  telefon TEXT,
  email TEXT,
  adres TEXT,
  tc_kimlik TEXT,
  acil_iletisim_adi TEXT,
  acil_iletisim_tel TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, tenant_id)
);

-- ============================================================
-- İndeksler
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_tenant_template_slots_tenant ON tenant_template_slots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_template_slots_template ON tenant_template_slots(template_id);
CREATE INDEX IF NOT EXISTS idx_tenant_leads_tenant ON tenant_leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_leads_durum ON tenant_leads(durum);
CREATE INDEX IF NOT EXISTS idx_trial_requests_tenant ON trial_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_trial_requests_durum ON trial_requests(durum);
CREATE INDEX IF NOT EXISTS idx_parent_profiles_user ON parent_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_parent_profiles_tenant ON parent_profiles(tenant_id);

-- ============================================================
-- RLS Politikaları
-- ============================================================

-- system_templates: herkes okuyabilir, sadece service_role yazabilir
ALTER TABLE system_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "system_templates_read" ON system_templates;
CREATE POLICY "system_templates_read" ON system_templates FOR SELECT USING (true);
DROP POLICY IF EXISTS "system_templates_service" ON system_templates;
CREATE POLICY "system_templates_service" ON system_templates FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- tenant_template_slots: tenant izolasyonu
ALTER TABLE tenant_template_slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_template_slots_tenant" ON tenant_template_slots;
CREATE POLICY "tenant_template_slots_tenant" ON tenant_template_slots FOR ALL USING (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
) WITH CHECK (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
);

-- tenant_leads: tenant izolasyonu
ALTER TABLE tenant_leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_leads_tenant" ON tenant_leads;
CREATE POLICY "tenant_leads_tenant" ON tenant_leads FOR ALL USING (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
) WITH CHECK (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
);

-- trial_requests: tenant izolasyonu
ALTER TABLE trial_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "trial_requests_tenant" ON trial_requests;
CREATE POLICY "trial_requests_tenant" ON trial_requests FOR ALL USING (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
) WITH CHECK (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
);

-- parent_profiles: veli kendi profilini görür + tenant yetkilileri
ALTER TABLE parent_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "parent_profiles_own" ON parent_profiles;
CREATE POLICY "parent_profiles_own" ON parent_profiles FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "parent_profiles_tenant" ON parent_profiles;
CREATE POLICY "parent_profiles_tenant" ON parent_profiles FOR ALL USING (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
) WITH CHECK (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
);
DROP POLICY IF EXISTS "parent_profiles_service" ON parent_profiles;
CREATE POLICY "parent_profiles_service" ON parent_profiles FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
