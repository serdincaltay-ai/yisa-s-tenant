-- Onboarding Sessions tablosu
-- Robot ile konusarak tenant kurulumu icin oturum yonetimi

CREATE TABLE IF NOT EXISTS onboarding_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
  current_step integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexler
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_user_id ON onboarding_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_status ON onboarding_sessions(status);

-- RLS
ALTER TABLE onboarding_sessions ENABLE ROW LEVEL SECURITY;

-- Kullanici kendi oturumlarini gorebilir
CREATE POLICY "onboarding_sessions_select_own"
  ON onboarding_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Kullanici kendi oturumunu olusturabilir
CREATE POLICY "onboarding_sessions_insert_own"
  ON onboarding_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Kullanici kendi oturumunu guncelleyebilir
CREATE POLICY "onboarding_sessions_update_own"
  ON onboarding_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role full access (API routes icin)
CREATE POLICY "onboarding_sessions_service_all"
  ON onboarding_sessions FOR ALL
  USING (auth.role() = 'service_role');

-- Tenant settings tablosu (renk paleti, sablon tipi vb.)
CREATE TABLE IF NOT EXISTS tenant_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  renk_paleti jsonb DEFAULT '{}'::jsonb,
  sablon_tipi text DEFAULT 'standard' CHECK (sablon_tipi IN ('standard', 'medium', 'premium')),
  branslar text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_settings_tenant_id ON tenant_settings(tenant_id);

ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_settings_service_all"
  ON tenant_settings FOR ALL
  USING (auth.role() = 'service_role');

-- Tenant branches tablosu
CREATE TABLE IF NOT EXISTS tenant_branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  ad text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_branches_tenant_id ON tenant_branches(tenant_id);

ALTER TABLE tenant_branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_branches_service_all"
  ON tenant_branches FOR ALL
  USING (auth.role() = 'service_role');
