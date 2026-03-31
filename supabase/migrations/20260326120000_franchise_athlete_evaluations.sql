-- İlk ölçüm / sporcu değerlendirme kayıtları (tenant-yisa-s GRUP K1)
-- Patron: Supabase Dashboard veya CLI ile push edin.

CREATE TABLE IF NOT EXISTS public.franchise_athlete_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  evaluation_type text NOT NULL DEFAULT 'ilk_olcum',
  scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  trainer_note text,
  risk_flags jsonb DEFAULT '[]'::jsonb,
  program_profile jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fae_tenant_athlete ON public.franchise_athlete_evaluations(tenant_id, athlete_id);
CREATE INDEX IF NOT EXISTS idx_fae_created ON public.franchise_athlete_evaluations(tenant_id, created_at DESC);

ALTER TABLE public.franchise_athlete_evaluations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fae_tenant_select ON public.franchise_athlete_evaluations;
CREATE POLICY fae_tenant_select ON public.franchise_athlete_evaluations
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid())
    OR tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS fae_tenant_insert ON public.franchise_athlete_evaluations;
CREATE POLICY fae_tenant_insert ON public.franchise_athlete_evaluations
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid())
    OR tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
  );
