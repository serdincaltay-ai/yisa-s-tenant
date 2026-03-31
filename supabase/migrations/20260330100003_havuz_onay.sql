-- ============================================================================
-- Havuz + Onay Tablolari ve ceo_tasks Cron Alanlari
-- Tarih: 30 Mart 2026
-- Amac: Icerik havuzu, duzeltme talepleri ve ceo_tasks rutin/cron destegi
-- ============================================================================

-- 1) havuz_items: Icerik havuzu (direktorlerin urettigi icerikler)
CREATE TABLE IF NOT EXISTS public.havuz_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  director_id UUID NOT NULL,
  director_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content JSONB DEFAULT '{}',
  preview_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  patron_note TEXT,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.havuz_items IS 'Icerik havuzu — direktorlerin ureterek patron onayina sundugu icerikler';
COMMENT ON COLUMN public.havuz_items.director_type IS 'Direktoru tipi: cmo, coo, cto, vb.';
COMMENT ON COLUMN public.havuz_items.status IS 'Durum: pending, approved, rejected, revision_needed';
COMMENT ON COLUMN public.havuz_items.content IS 'Icerik verisi (JSON formatinda — metin, resim URL, vb.)';
COMMENT ON COLUMN public.havuz_items.patron_note IS 'Patron tarafindan eklenen not (onay/red sebebi)';

-- Indeksler
CREATE INDEX IF NOT EXISTS idx_havuz_items_director_id ON public.havuz_items(director_id);
CREATE INDEX IF NOT EXISTS idx_havuz_items_director_type ON public.havuz_items(director_type);
CREATE INDEX IF NOT EXISTS idx_havuz_items_status ON public.havuz_items(status);
CREATE INDEX IF NOT EXISTS idx_havuz_items_tenant_id ON public.havuz_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_havuz_items_created_at ON public.havuz_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_havuz_items_pending ON public.havuz_items(status) WHERE status = 'pending';

-- 2) correction_requests: Duzeltme talepleri
CREATE TABLE IF NOT EXISTS public.correction_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  havuz_item_id UUID NOT NULL REFERENCES public.havuz_items(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.correction_requests IS 'Havuz iceriklerine yapilan duzeltme talepleri';
COMMENT ON COLUMN public.correction_requests.agent_type IS 'Duzeltmeyi yapacak agent: cmo, coo, cto, vb.';
COMMENT ON COLUMN public.correction_requests.status IS 'Durum: pending, processing, completed, failed';
COMMENT ON COLUMN public.correction_requests.result IS 'Duzeltme sonucu (JSON)';

-- Indeksler
CREATE INDEX IF NOT EXISTS idx_correction_requests_havuz_item ON public.correction_requests(havuz_item_id);
CREATE INDEX IF NOT EXISTS idx_correction_requests_status ON public.correction_requests(status);
CREATE INDEX IF NOT EXISTS idx_correction_requests_agent ON public.correction_requests(agent_type);

-- 3) ceo_tasks'a cron/rutin alanlari ekleme
ALTER TABLE public.ceo_tasks
  ADD COLUMN IF NOT EXISTS is_routine BOOLEAN DEFAULT false;

ALTER TABLE public.ceo_tasks
  ADD COLUMN IF NOT EXISTS cron_expression TEXT;

COMMENT ON COLUMN public.ceo_tasks.is_routine IS 'Bu gorev tekrarlayan bir rutin mi?';
COMMENT ON COLUMN public.ceo_tasks.cron_expression IS 'Rutin gorev icin cron ifadesi (ornek: 0 9 * * 1 = her pazartesi 09:00)';

-- ceo_tasks icin rutin filtre indeksi
CREATE INDEX IF NOT EXISTS idx_ceo_tasks_is_routine ON public.ceo_tasks(is_routine) WHERE is_routine = true;

-- ============================================================================
-- RLS Politikalari
-- havuz_items: tenant_id bazli izolasyon (tenant_id varsa), yoksa patron erisimi
-- correction_requests: havuz_item sahibi uzerinden erisim
-- ============================================================================

-- havuz_items RLS
ALTER TABLE public.havuz_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "havuz_items_select_tenant"
  ON public.havuz_items FOR SELECT TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
    )
    OR (
      tenant_id IS NULL
      AND EXISTS (SELECT 1 FROM public.user_tenants WHERE user_id = auth.uid() AND role = 'patron')
    )
  );

CREATE POLICY "havuz_items_insert_tenant"
  ON public.havuz_items FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
    )
    OR (
      tenant_id IS NULL
      AND EXISTS (SELECT 1 FROM public.user_tenants WHERE user_id = auth.uid() AND role = 'patron')
    )
  );

CREATE POLICY "havuz_items_update_tenant"
  ON public.havuz_items FOR UPDATE TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
    )
    OR (
      tenant_id IS NULL
      AND EXISTS (SELECT 1 FROM public.user_tenants WHERE user_id = auth.uid() AND role = 'patron')
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
    )
    OR (
      tenant_id IS NULL
      AND EXISTS (SELECT 1 FROM public.user_tenants WHERE user_id = auth.uid() AND role = 'patron')
    )
  );

CREATE POLICY "havuz_items_delete_tenant"
  ON public.havuz_items FOR DELETE TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
    )
    OR (
      tenant_id IS NULL
      AND EXISTS (SELECT 1 FROM public.user_tenants WHERE user_id = auth.uid() AND role = 'patron')
    )
  );

-- correction_requests RLS — havuz_item'in tenant'i uzerinden erisim
ALTER TABLE public.correction_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "correction_requests_select_via_havuz"
  ON public.correction_requests FOR SELECT TO authenticated
  USING (
    havuz_item_id IN (
      SELECT id FROM public.havuz_items
      WHERE tenant_id IN (
        SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
      )
      OR (
        tenant_id IS NULL
        AND EXISTS (SELECT 1 FROM public.user_tenants WHERE user_id = auth.uid() AND role = 'patron')
      )
    )
  );

CREATE POLICY "correction_requests_insert_via_havuz"
  ON public.correction_requests FOR INSERT TO authenticated
  WITH CHECK (
    havuz_item_id IN (
      SELECT id FROM public.havuz_items
      WHERE tenant_id IN (
        SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
      )
      OR (
        tenant_id IS NULL
        AND EXISTS (SELECT 1 FROM public.user_tenants WHERE user_id = auth.uid() AND role = 'patron')
      )
    )
  );
