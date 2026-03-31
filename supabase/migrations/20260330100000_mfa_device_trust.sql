-- ============================================================================
-- MFA ve Device Trust Tablolari
-- Tarih: 30 Mart 2026
-- Amac: Guvenilir cihaz yonetimi ve giris denemesi takibi
-- ============================================================================

-- 1) trusted_devices: Kullanicinin guvendigi cihazlar
CREATE TABLE IF NOT EXISTS public.trusted_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  browser TEXT,
  os TEXT,
  last_used_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

COMMENT ON TABLE public.trusted_devices IS 'Kullanicinin MFA ile guvendigi cihazlar';
COMMENT ON COLUMN public.trusted_devices.device_fingerprint IS 'Cihaz parmak izi (tarayici/cihaz bazli unique hash)';
COMMENT ON COLUMN public.trusted_devices.is_active IS 'Cihaz hala guvenilir mi? false = iptal edilmis';

-- Indeksler
CREATE INDEX IF NOT EXISTS idx_trusted_devices_user_id ON public.trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_fingerprint ON public.trusted_devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_user_fingerprint ON public.trusted_devices(user_id, device_fingerprint);

-- 2) login_attempts: Giris denemesi kayitlari
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET NOT NULL,
  device_fingerprint TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  mfa_method TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.login_attempts IS 'Giris denemesi kayitlari — basarili ve basarisiz';
COMMENT ON COLUMN public.login_attempts.mfa_method IS 'Kullanilan MFA yontemi: totp, sms, email, vb.';
COMMENT ON COLUMN public.login_attempts.success IS 'Giris basarili mi?';

-- Indeksler
CREATE INDEX IF NOT EXISTS idx_login_attempts_user_id ON public.login_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON public.login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON public.login_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_user_success ON public.login_attempts(user_id, success);

-- ============================================================================
-- RLS Politikalari
-- trusted_devices: Kullanici sadece kendi cihazlarini gorebilir/yonetebilir
-- login_attempts: Kullanici sadece kendi giris denemelerini gorebilir, yazma service_role ile
-- ============================================================================

-- trusted_devices RLS
ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trusted_devices_select_own"
  ON public.trusted_devices FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "trusted_devices_insert_own"
  ON public.trusted_devices FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "trusted_devices_update_own"
  ON public.trusted_devices FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "trusted_devices_delete_own"
  ON public.trusted_devices FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- login_attempts RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "login_attempts_select_own"
  ON public.login_attempts FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Yazma islemleri sadece service_role uzerinden (backend API)
-- service_role RLS'i otomatik bypass eder, ek policy gerekmez
