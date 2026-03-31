-- Robot Kota/Limit Sistemi: robot_usage tablosu
-- Her robot komutu calistirildiginda bir kayit eklenir.
-- Kota kontrolu bu tablodan COUNT ile yapilir.

CREATE TABLE IF NOT EXISTS robot_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  robot_type TEXT NOT NULL CHECK (robot_type IN ('celf','veri','guvenlik','sosyal','coo','whatsapp','strateji')),
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indeksler: kota sorgulari icin hiz
CREATE INDEX IF NOT EXISTS idx_robot_usage_tenant_type ON robot_usage(tenant_id, robot_type);
CREATE INDEX IF NOT EXISTS idx_robot_usage_created ON robot_usage(created_at);

-- RLS
ALTER TABLE robot_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant kendi robot kullanimini gorebilir" ON robot_usage;
CREATE POLICY "Tenant kendi robot kullanimini gorebilir"
  ON robot_usage FOR SELECT
  USING (tenant_id IN (
    SELECT ut.tenant_id FROM user_tenants ut WHERE ut.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Service role tam erisim robot_usage" ON robot_usage;
CREATE POLICY "Service role tam erisim robot_usage"
  ON robot_usage FOR ALL
  USING (auth.role() = 'service_role');
