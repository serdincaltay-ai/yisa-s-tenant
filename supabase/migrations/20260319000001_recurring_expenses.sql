-- Migration: Sabit Odemeler (Recurring Expenses) module
-- Kira, elektrik, su gibi tekrarlayan giderler icin tablo

CREATE TABLE IF NOT EXISTS public.recurring_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('kira','elektrik','su','dogalgaz','internet','sigorta','personel','diger')),
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'TRY',
  frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('monthly','quarterly','yearly')),
  due_day INTEGER DEFAULT 1 CHECK (due_day BETWEEN 1 AND 28),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  last_generated_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recurring_expenses_select"
  ON public.recurring_expenses FOR SELECT
  USING (
    tenant_id IN (
      SELECT ut.tenant_id FROM public.user_tenants ut WHERE ut.user_id = auth.uid()
    )
  );

CREATE POLICY "recurring_expenses_insert"
  ON public.recurring_expenses FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT ut.tenant_id FROM public.user_tenants ut WHERE ut.user_id = auth.uid()
    )
  );

CREATE POLICY "recurring_expenses_update"
  ON public.recurring_expenses FOR UPDATE
  USING (
    tenant_id IN (
      SELECT ut.tenant_id FROM public.user_tenants ut WHERE ut.user_id = auth.uid()
    )
  );

CREATE POLICY "recurring_expenses_delete"
  ON public.recurring_expenses FOR DELETE
  USING (
    tenant_id IN (
      SELECT ut.tenant_id FROM public.user_tenants ut WHERE ut.user_id = auth.uid()
    )
  );

-- Service role full access (bypasses RLS by default, this is for
-- explicit grant when using supabase-js with service_role key)
CREATE POLICY "recurring_expenses_service"
  ON public.recurring_expenses FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
