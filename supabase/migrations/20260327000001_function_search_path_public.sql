-- Supabase Linter: "function_search_path_mutable" uyarısı
-- Tüm public fonksiyonlara SET search_path ekle

-- rls_is_patron
CREATE OR REPLACE FUNCTION public.rls_is_patron()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_tenants
    WHERE user_id = auth.uid() AND role = 'patron'
  )
  OR EXISTS (
    SELECT 1 FROM public.tenants
    WHERE owner_id = auth.uid()
  );
$$;

-- rls_parent_athlete_ids
CREATE OR REPLACE FUNCTION public.rls_parent_athlete_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.athletes
  WHERE parent_user_id = auth.uid();
$$;

-- rls_trainer_athlete_ids
CREATE OR REPLACE FUNCTION public.rls_trainer_athlete_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id FROM public.athletes a
  JOIN public.user_tenants ut ON ut.tenant_id = a.tenant_id
  WHERE ut.user_id = auth.uid()
    AND ut.role IN ('antrenor', 'trainer');
$$;
