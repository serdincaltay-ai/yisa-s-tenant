-- SMS log tablosu — tüm SMS gönderimlerini kaydeder (başarılı + başarısız)
CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_number TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  provider TEXT NOT NULL DEFAULT 'twilio',
  provider_sid TEXT,
  error_message TEXT,
  tenant_id UUID REFERENCES tenants(id),
  trigger_type TEXT,
  athlete_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

-- Performans indeksleri
CREATE INDEX IF NOT EXISTS idx_sms_logs_tenant ON sms_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created ON sms_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_logs_trigger ON sms_logs(trigger_type);
