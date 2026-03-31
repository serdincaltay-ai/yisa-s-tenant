-- reminder_logs: tenant_id kolonu + RLS policy ekleme
-- Not: Orijinal migration (20260306210000) zaten uygulanmış olabilir,
-- bu yüzden ALTER TABLE ile ekliyoruz.

ALTER TABLE reminder_logs ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE reminder_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Service role (cron endpoint) tam erişim — service_role key RLS'i bypass eder.
-- Patron/admin kullanıcılar kendi tenant'larının loglarını görebilir.
DROP POLICY IF EXISTS "Tenant patron can view reminder_logs" ON reminder_logs;
CREATE POLICY "Tenant patron can view reminder_logs" ON reminder_logs FOR SELECT USING (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
);
