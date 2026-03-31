-- 1. staff tablosu eksik kolonlar (form UI'da var ama DB migration'da yok)
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS previous_work TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS employment_type TEXT DEFAULT 'full_time'
  CHECK (employment_type IN ('full_time','part_time','intern'));
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS employment_start_date DATE;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS is_competitive_coach BOOLEAN DEFAULT false;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS license_type TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 2. federation_info tablosu (YENİ)
CREATE TABLE IF NOT EXISTS public.federation_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch TEXT NOT NULL,
  il TEXT,
  temsilci_adi TEXT,
  temsilci_telefonu TEXT,
  federasyon_adi TEXT,
  yarisma_kulupleri JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.federation_info ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant okur" ON public.federation_info;
CREATE POLICY "Tenant okur" ON public.federation_info FOR SELECT
  USING (tenant_id = (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid() LIMIT 1));
DROP POLICY IF EXISTS "Patron yazar" ON public.federation_info;
CREATE POLICY "Patron yazar" ON public.federation_info FOR ALL USING (true) WITH CHECK (true);

-- 3. athlete_movements tablosu (YENİ)
CREATE TABLE IF NOT EXISTS public.athlete_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES public.athletes(id) ON DELETE CASCADE,
  movement_id UUID,
  tamamlandi BOOLEAN DEFAULT false,
  tamamlanma_tarihi DATE,
  antrenor_notu TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.athlete_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant okur" ON public.athlete_movements;
CREATE POLICY "Tenant okur" ON public.athlete_movements FOR SELECT
  USING (athlete_id IN (
    SELECT id FROM public.athletes WHERE tenant_id = (
      SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid() LIMIT 1
    )
  ));

-- 4. staff_leave_requests tablosu (YENİ)
CREATE TABLE IF NOT EXISTS public.staff_leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
  leave_date DATE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'bekliyor' CHECK (status IN ('bekliyor','onaylandi','reddedildi')),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.staff_leave_requests ENABLE ROW LEVEL SECURITY;

-- 5. staff_advance_requests tablosu (YENİ)
CREATE TABLE IF NOT EXISTS public.staff_advance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'bekliyor' CHECK (status IN ('bekliyor','onaylandi','reddedildi')),
  requested_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.staff_advance_requests ENABLE ROW LEVEL SECURITY;

-- 6. tenants tablosuna i18n kolonları
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS default_locale TEXT DEFAULT 'tr';
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS supported_locales TEXT[] DEFAULT '{tr,en}';
