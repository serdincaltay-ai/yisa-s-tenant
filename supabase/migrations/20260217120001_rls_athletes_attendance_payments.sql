-- RLS policy düzeltmesi: athletes, attendance, package_payments
-- Authenticated kullanıcılar kendi tenant_id'sine göre okuyabilsin/yazabilsin
-- Service role zaten bypass eder (policy true ile)

-- athletes
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users see own tenant athletes" ON athletes;
DROP POLICY IF EXISTS "Users manage own tenant athletes" ON athletes;
DROP POLICY IF EXISTS "athletes_select" ON athletes;
DROP POLICY IF EXISTS "athletes_insert" ON athletes;
DROP POLICY IF EXISTS "athletes_update" ON athletes;
DROP POLICY IF EXISTS "athletes_delete" ON athletes;

CREATE POLICY "athletes_select" ON athletes FOR SELECT USING (
  auth.role() = 'authenticated' AND (
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
    OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
    OR parent_user_id = auth.uid()
  )
);

CREATE POLICY "athletes_insert" ON athletes FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND (
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
    OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  )
);

CREATE POLICY "athletes_update" ON athletes FOR UPDATE USING (
  auth.role() = 'authenticated' AND (
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
    OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  )
);

CREATE POLICY "athletes_delete" ON athletes FOR DELETE USING (
  auth.role() = 'authenticated' AND (
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
    OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  )
);

-- Service bypass (service_role kullanıldığında)
DROP POLICY IF EXISTS "Service can manage athletes" ON athletes;
CREATE POLICY "Service can manage athletes" ON athletes FOR ALL USING (true) WITH CHECK (true);

-- attendance
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant users manage attendance" ON attendance;
DROP POLICY IF EXISTS "Parent view attendance" ON attendance;
DROP POLICY IF EXISTS "Service can manage attendance" ON attendance;
DROP POLICY IF EXISTS "attendance_select" ON attendance;
DROP POLICY IF EXISTS "attendance_insert" ON attendance;
DROP POLICY IF EXISTS "attendance_update" ON attendance;
DROP POLICY IF EXISTS "attendance_delete" ON attendance;

CREATE POLICY "attendance_select" ON attendance FOR SELECT USING (
  auth.role() = 'authenticated' AND (
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
    OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
    OR athlete_id IN (SELECT id FROM athletes WHERE parent_user_id = auth.uid())
  )
);

CREATE POLICY "attendance_insert" ON attendance FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND (
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
    OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  )
);

CREATE POLICY "attendance_update" ON attendance FOR UPDATE USING (
  auth.role() = 'authenticated' AND (
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
    OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  )
);

CREATE POLICY "attendance_delete" ON attendance FOR DELETE USING (
  auth.role() = 'authenticated' AND (
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
    OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Service can manage attendance" ON attendance;
CREATE POLICY "Service can manage attendance" ON attendance FOR ALL USING (true) WITH CHECK (true);

-- payments (aidat)
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant users manage payments" ON payments;
DROP POLICY IF EXISTS "Parent view payments" ON payments;
DROP POLICY IF EXISTS "Service can manage payments" ON payments;
DROP POLICY IF EXISTS "payments_select" ON payments;
DROP POLICY IF EXISTS "payments_insert" ON payments;
DROP POLICY IF EXISTS "payments_update" ON payments;
DROP POLICY IF EXISTS "payments_delete" ON payments;

CREATE POLICY "payments_select" ON payments FOR SELECT USING (
  auth.role() = 'authenticated' AND (
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
    OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
    OR athlete_id IN (SELECT id FROM athletes WHERE parent_user_id = auth.uid())
  )
);

CREATE POLICY "payments_insert" ON payments FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND (
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
    OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  )
);

CREATE POLICY "payments_update" ON payments FOR UPDATE USING (
  auth.role() = 'authenticated' AND (
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
    OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  )
);

CREATE POLICY "payments_delete" ON payments FOR DELETE USING (
  auth.role() = 'authenticated' AND (
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
    OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  )
);

CREATE POLICY "Service can manage payments" ON payments FOR ALL USING (true) WITH CHECK (true);
