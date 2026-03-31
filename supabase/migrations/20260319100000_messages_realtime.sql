-- =====================================================
-- OTURUM 9: Real-time Mesajlasma (Veli <-> Antrenor)
-- Yeni tablo: veli_coach_messages
-- =====================================================

-- Veli-Antrenor direkt mesajlasma tablosu
CREATE TABLE IF NOT EXISTS public.veli_coach_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indeksler
CREATE INDEX IF NOT EXISTS idx_vcm_tenant ON public.veli_coach_messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vcm_sender ON public.veli_coach_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_vcm_receiver ON public.veli_coach_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_vcm_created ON public.veli_coach_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vcm_conversation ON public.veli_coach_messages(tenant_id, sender_id, receiver_id);

-- RLS
ALTER TABLE public.veli_coach_messages ENABLE ROW LEVEL SECURITY;

-- Kullanici kendi gonderdigi veya aldigi mesajlari gorebilir
CREATE POLICY "vcm_select_own" ON public.veli_coach_messages
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

-- Kullanici kendi adina mesaj gonderebilir
CREATE POLICY "vcm_insert_own" ON public.veli_coach_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
  );

-- Alici mesaji okundu olarak isaretleyebilir
CREATE POLICY "vcm_update_read" ON public.veli_coach_messages
  FOR UPDATE USING (
    auth.uid() = receiver_id
  ) WITH CHECK (
    auth.uid() = receiver_id
  );

-- Service role tam erisim
CREATE POLICY "vcm_service_role" ON public.veli_coach_messages
  FOR ALL USING (
    (current_setting('request.jwt.claims', true)::json ->> 'role') = 'service_role'
  );

-- Realtime enable
ALTER PUBLICATION supabase_realtime ADD TABLE public.veli_coach_messages;
