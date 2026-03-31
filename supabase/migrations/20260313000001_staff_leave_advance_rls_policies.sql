-- staff_leave_requests ve staff_advance_requests RLS politikaları
-- Remote DB'de politikalar eksikse bu migration ile eklenir (idempotent).
-- 20260311 ile oluşturulmuş minimal tablolarda user_id/tenant_id yoksa eklenir.

-- staff_leave_requests: user_id ve tenant_id yoksa ekle (staff üzerinden)
ALTER TABLE public.staff_leave_requests ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.staff_leave_requests ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
UPDATE public.staff_leave_requests r
SET user_id = s.user_id, tenant_id = s.tenant_id
FROM public.staff s
WHERE r.staff_id = s.id AND (r.user_id IS NULL OR r.tenant_id IS NULL);

-- staff_advance_requests: user_id ve tenant_id yoksa ekle
ALTER TABLE public.staff_advance_requests ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.staff_advance_requests ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
UPDATE public.staff_advance_requests r
SET user_id = s.user_id, tenant_id = s.tenant_id
FROM public.staff s
WHERE r.staff_id = s.id AND (r.user_id IS NULL OR r.tenant_id IS NULL);

-- staff_leave_requests RLS
ALTER TABLE public.staff_leave_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS staff_leave_own_select ON public.staff_leave_requests;
CREATE POLICY staff_leave_own_select ON public.staff_leave_requests
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS staff_leave_own_insert ON public.staff_leave_requests;
CREATE POLICY staff_leave_own_insert ON public.staff_leave_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS staff_leave_tenant_select ON public.staff_leave_requests;
CREATE POLICY staff_leave_tenant_select ON public.staff_leave_requests
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS staff_leave_tenant_update ON public.staff_leave_requests;
CREATE POLICY staff_leave_tenant_update ON public.staff_leave_requests
  FOR UPDATE USING (
    tenant_id IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid())
  );

-- staff_advance_requests
ALTER TABLE public.staff_advance_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS staff_advance_own_select ON public.staff_advance_requests;
CREATE POLICY staff_advance_own_select ON public.staff_advance_requests
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS staff_advance_own_insert ON public.staff_advance_requests;
CREATE POLICY staff_advance_own_insert ON public.staff_advance_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS staff_advance_tenant_select ON public.staff_advance_requests;
CREATE POLICY staff_advance_tenant_select ON public.staff_advance_requests
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS staff_advance_tenant_update ON public.staff_advance_requests;
CREATE POLICY staff_advance_tenant_update ON public.staff_advance_requests
  FOR UPDATE USING (
    tenant_id IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid())
  );
