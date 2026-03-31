-- sms_logs: ON DELETE CASCADE + RLS policy ekleme
-- Not: Orijinal migration (20260306200000) zaten uygulanmış olabilir,
-- bu yüzden ALTER TABLE ile ekliyoruz.

-- FK constraint'i ON DELETE CASCADE ile güncelle
ALTER TABLE sms_logs DROP CONSTRAINT IF EXISTS sms_logs_tenant_id_fkey;
ALTER TABLE sms_logs ADD CONSTRAINT sms_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- RLS Policies
-- Service role (SMS gönderim endpoint'leri) tam erişim — service_role key RLS'i bypass eder.
-- Patron/admin kullanıcılar kendi tenant'larının SMS loglarını görebilir.
DROP POLICY IF EXISTS "Tenant patron can view sms_logs" ON sms_logs;
CREATE POLICY "Tenant patron can view sms_logs" ON sms_logs FOR SELECT USING (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
);
