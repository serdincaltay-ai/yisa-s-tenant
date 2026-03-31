-- Hatırlatma log tablosu — aidat hatırlatma cron'u tarafından kullanılır
CREATE TABLE IF NOT EXISTS reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  veli_user_id UUID NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('push', 'email', 'sms')),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'skipped')),
  error_message TEXT,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE reminder_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Service role (cron endpoint) tam erişim — service_role key RLS'i bypass eder.
-- Patron/admin kullanıcılar kendi tenant'larının loglarını görebilir.
DROP POLICY IF EXISTS "Tenant patron can view reminder_logs" ON reminder_logs;
CREATE POLICY "Tenant patron can view reminder_logs" ON reminder_logs FOR SELECT USING (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
);
-- Performans indeksleri
CREATE INDEX IF NOT EXISTS idx_reminder_logs_payment ON reminder_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_veli ON reminder_logs(veli_user_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_sent ON reminder_logs(sent_at DESC);
