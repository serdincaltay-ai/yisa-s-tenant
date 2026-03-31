-- =====================================================
-- ROL SLOTLARI (On tanimli slot + varsayilan sifre yapisi)
-- ROL_VARSAYILAN_SIFRELER.md ile uyumlu
-- =====================================================
-- Kullanim: CHRO atama yaptiginda slotun kullanici_adi + gecici_sifre
-- bir kerelik gosterilir; kisi ilk giriste sifreyi degistirir.

-- Tablo: franchise bazinda rol slotlari (opsiyonel; ilk asamada doc ile de yurutulebilir)
CREATE TABLE IF NOT EXISTS public.role_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id UUID REFERENCES public.franchises(id) ON DELETE CASCADE,
  slot_label TEXT NOT NULL,           -- ornek: antrenor_1, mudur_1
  role_type TEXT NOT NULL,            -- antrenor, franchise, veli vb.
  default_username TEXT,              -- ornek: antrenor1
  temp_password_plain TEXT,           -- Sadece kurulumda bir kerelik; sonra silinir veya hash'lenir
  assigned_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(franchise_id, slot_label)
);

-- Ornek veri (Patron / tek franchise icin): slotlar hazir, sifreler sonra atanacak
-- INSERT ornegi (franchise_id ve temp_password gercek degerlerle degistirilecek):
/*
INSERT INTO public.role_slots (franchise_id, slot_label, role_type, default_username, temp_password_plain)
VALUES
  ('FRANCHISE_UUID_BURAYA', 'firma_sahibi_1', 'franchise', 'isletme1', 'GECICI_SIFRE_1'),
  ('FRANCHISE_UUID_BURAYA', 'mudur_1', 'franchise', 'mudur1', 'GECICI_SIFRE_2'),
  ('FRANCHISE_UUID_BURAYA', 'antrenor_1', 'antrenor', 'antrenor1', 'GECICI_SIFRE_3'),
  ('FRANCHISE_UUID_BURAYA', 'antrenor_2', 'antrenor', 'antrenor2', 'GECICI_SIFRE_4');
*/

-- RLS (franchise sahibi ve patron gorebilir)
ALTER TABLE public.role_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "role_slots_franchise_owner" ON public.role_slots
  FOR ALL USING (
    franchise_id IN (SELECT id FROM public.franchises WHERE owner_id = auth.uid())
  );

CREATE POLICY "role_slots_patron" ON public.role_slots
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'patron')
  );

COMMENT ON TABLE public.role_slots IS 'On tanimli rol slotlari; varsayilan kullanici adi + gecici sifre bir kerelik gosterilir (CHRO atama).';
