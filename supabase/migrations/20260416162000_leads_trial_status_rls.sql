-- GÖREV 5: leads/trial status standardizasyonu + platform_owner read policy

-- Statüleri yeni standarda normalize et
UPDATE tenant_leads
SET durum = CASE
  WHEN durum = 'yeni' THEN 'pending'
  WHEN durum = 'iletisimde' THEN 'approved'
  WHEN durum = 'demo_yapildi' THEN 'approved'
  WHEN durum = 'kaybedildi' THEN 'rejected'
  WHEN durum = 'kazanildi' THEN 'converted'
  ELSE durum
END;

UPDATE trial_requests
SET durum = CASE
  WHEN durum = 'bekliyor' THEN 'pending'
  WHEN durum = 'onaylandi' THEN 'approved'
  WHEN durum = 'iptal' THEN 'rejected'
  WHEN durum = 'tamamlandi' THEN 'converted'
  ELSE durum
END;

-- CHECK kısıtlarını yeni status set'i ile güncelle
ALTER TABLE tenant_leads
  DROP CONSTRAINT IF EXISTS tenant_leads_durum_check;
ALTER TABLE tenant_leads
  ADD CONSTRAINT tenant_leads_durum_check
  CHECK (durum IN ('pending', 'approved', 'rejected', 'converted'));

ALTER TABLE trial_requests
  DROP CONSTRAINT IF EXISTS trial_requests_durum_check;
ALTER TABLE trial_requests
  ADD CONSTRAINT trial_requests_durum_check
  CHECK (durum IN ('pending', 'approved', 'rejected', 'converted'));

-- platform_owner tüm tenant lead/trial kayıtlarını okuyabilsin
-- Bu policy mevcut tenant izolasyon policy'sine ek bir SELECT istisnasıdır.
DROP POLICY IF EXISTS "tenant_leads_platform_owner_read" ON tenant_leads;
CREATE POLICY "tenant_leads_platform_owner_read"
ON tenant_leads
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM user_tenants ut
    WHERE ut.user_id = auth.uid()
      AND ut.role = 'platform_owner'
  )
  OR EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid()
      AND lower(coalesce(p.role, '')) = 'platform_owner'
  )
);

DROP POLICY IF EXISTS "trial_requests_platform_owner_read" ON trial_requests;
CREATE POLICY "trial_requests_platform_owner_read"
ON trial_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM user_tenants ut
    WHERE ut.user_id = auth.uid()
      AND ut.role = 'platform_owner'
  )
  OR EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid()
      AND lower(coalesce(p.role, '')) = 'platform_owner'
  )
);
