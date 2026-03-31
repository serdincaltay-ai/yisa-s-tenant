-- Çalışan izin talepleri tablosu
CREATE TABLE IF NOT EXISTS staff_leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  leave_date DATE NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  is_olcum_day BOOLEAN DEFAULT false,
  substitute_needed BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Eski/minimal tabloda user_id/tenant_id yoksa ekle (20260311 ile oluşturulmuş olabilir)
ALTER TABLE staff_leave_requests ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE staff_leave_requests ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
UPDATE staff_leave_requests r SET user_id = s.user_id, tenant_id = s.tenant_id
FROM staff s WHERE r.staff_id = s.id AND (r.user_id IS NULL OR r.tenant_id IS NULL);

ALTER TABLE staff_leave_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS staff_leave_own_select ON staff_leave_requests;
CREATE POLICY staff_leave_own_select ON staff_leave_requests
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS staff_leave_own_insert ON staff_leave_requests;
CREATE POLICY staff_leave_own_insert ON staff_leave_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS staff_leave_tenant_select ON staff_leave_requests;
CREATE POLICY staff_leave_tenant_select ON staff_leave_requests
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS staff_leave_tenant_update ON staff_leave_requests;
CREATE POLICY staff_leave_tenant_update ON staff_leave_requests
  FOR UPDATE USING (
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_staff_leave_tenant ON staff_leave_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_staff_leave_user ON staff_leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_leave_date ON staff_leave_requests(leave_date);
