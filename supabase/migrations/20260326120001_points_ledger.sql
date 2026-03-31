-- Puan defteri (GRUP M5) — 1 işlem = 1 puan kuralına uygun kayıt tablosu
-- Patron: Supabase Dashboard veya CLI ile push edin.

CREATE TABLE IF NOT EXISTS public.points_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  athlete_id uuid REFERENCES public.athletes(id) ON DELETE SET NULL,
  source text NOT NULL,
  points integer NOT NULL DEFAULT 1,
  note text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT points_ledger_source_check CHECK (char_length(trim(source)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_points_ledger_tenant ON public.points_ledger(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_points_ledger_athlete ON public.points_ledger(athlete_id);

ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS points_ledger_tenant_select ON public.points_ledger;
CREATE POLICY points_ledger_tenant_select ON public.points_ledger
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid())
    OR tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS points_ledger_tenant_insert ON public.points_ledger;
CREATE POLICY points_ledger_tenant_insert ON public.points_ledger
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid())
    OR tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
  );
