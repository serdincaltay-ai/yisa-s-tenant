-- Sözleşme ve KVKK onayları
CREATE TABLE IF NOT EXISTS public.sozlesme_onaylari (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  sozlesme_tipi text NOT NULL,
  onay_durumu boolean DEFAULT false,
  onay_tarihi timestamptz,
  ip_adresi text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sozlesme_onaylari_user ON sozlesme_onaylari(user_id);
CREATE INDEX IF NOT EXISTS idx_sozlesme_onaylari_tenant ON sozlesme_onaylari(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sozlesme_onaylari_tipi ON sozlesme_onaylari(sozlesme_tipi);

ALTER TABLE public.sozlesme_onaylari ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Kendi onaylarini gorebilir" ON public.sozlesme_onaylari;
CREATE POLICY "Kendi onaylarini gorebilir" ON public.sozlesme_onaylari
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Kendi onayini verebilir" ON public.sozlesme_onaylari;
CREATE POLICY "Kendi onayini verebilir" ON public.sozlesme_onaylari
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can manage sozlesme_onaylari" ON public.sozlesme_onaylari;
CREATE POLICY "Service can manage sozlesme_onaylari" ON public.sozlesme_onaylari
  FOR ALL USING (true) WITH CHECK (true);

-- athletes: fotograf_izni, video_izni (veli onayları için)
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS fotograf_izni boolean DEFAULT false;
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS video_izni boolean DEFAULT false;
