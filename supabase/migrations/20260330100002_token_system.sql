-- ============================================================================
-- Token (Tohum) Sistemi Tablolari
-- Tarih: 30 Mart 2026
-- Amac: Token paketleri, bakiye, islem gecmisi ve fiyatlandirma kademeleri
-- RLS: tenant_id bazli izolasyon
-- ============================================================================

-- 1) token_packages: Satin alinabilir token paketleri (global referans tablo)
CREATE TABLE IF NOT EXISTS public.token_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tokens_included INTEGER NOT NULL,
  price_usd NUMERIC(10,2) NOT NULL,
  package_type TEXT NOT NULL DEFAULT 'standard',
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.token_packages IS 'Satin alinabilir token paketleri — fiyat ve icerik bilgisi';
COMMENT ON COLUMN public.token_packages.package_type IS 'Paket tipi: starter, standard, premium, enterprise';
COMMENT ON COLUMN public.token_packages.features IS 'Pakete dahil ozellikler (JSON)';

-- Indeksler
CREATE INDEX IF NOT EXISTS idx_token_packages_type ON public.token_packages(package_type);
CREATE INDEX IF NOT EXISTS idx_token_packages_active ON public.token_packages(is_active) WHERE is_active = true;

-- 2) tenant_token_balance: Tenant bazli token bakiyesi
CREATE TABLE IF NOT EXISTS public.tenant_token_balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  used_tokens INTEGER NOT NULL DEFAULT 0,
  rollover_tokens INTEGER NOT NULL DEFAULT 0,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.tenant_token_balance IS 'Tenant bazli token bakiyesi — donem bazli takip';
COMMENT ON COLUMN public.tenant_token_balance.rollover_tokens IS 'Onceki donemden devreden tokenlar';
COMMENT ON COLUMN public.tenant_token_balance.period_start IS 'Donem baslangic tarihi';
COMMENT ON COLUMN public.tenant_token_balance.period_end IS 'Donem bitis tarihi';

-- Indeksler
CREATE INDEX IF NOT EXISTS idx_tenant_token_balance_tenant_id ON public.tenant_token_balance(tenant_id);
-- Unique constraint (below) also serves as the period lookup index

-- Unique constraint: tenant basina donem basina tek kayit
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_token_balance_unique_period
  ON public.tenant_token_balance(tenant_id, period_start, period_end);

-- 3) token_transactions: Token islem gecmisi
CREATE TABLE IF NOT EXISTS public.token_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  description TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.token_transactions IS 'Token islem gecmisi — harcama, satin alma, iade kayitlari';
COMMENT ON COLUMN public.token_transactions.amount IS 'Token miktari (pozitif = ekleme, negatif = harcama)';
COMMENT ON COLUMN public.token_transactions.transaction_type IS 'Islem tipi: purchase, usage, refund, rollover, bonus';
COMMENT ON COLUMN public.token_transactions.reference_id IS 'Iliskili kayit ID (ornegin agent_call id)';

-- Indeksler
CREATE INDEX IF NOT EXISTS idx_token_transactions_tenant_id ON public.token_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_type ON public.token_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_token_transactions_created_at ON public.token_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_token_transactions_tenant_date ON public.token_transactions(tenant_id, created_at DESC);

-- 4) pricing_tiers: Fiyatlandirma kademeleri
CREATE TABLE IF NOT EXISTS public.pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  base_price_usd NUMERIC(10,2) NOT NULL,
  student_limit INTEGER NOT NULL DEFAULT 0,
  token_limit INTEGER NOT NULL DEFAULT 0,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.pricing_tiers IS 'Fiyatlandirma kademeleri — plan bazli ogrenci ve token limitleri';
COMMENT ON COLUMN public.pricing_tiers.student_limit IS 'Bu kademe icin maksimum ogrenci sayisi (0 = sinirsiz)';
COMMENT ON COLUMN public.pricing_tiers.token_limit IS 'Bu kademe icin aylik token limiti (0 = sinirsiz)';
COMMENT ON COLUMN public.pricing_tiers.features IS 'Kademeye dahil ozellikler (JSON)';

-- Indeksler
CREATE INDEX IF NOT EXISTS idx_pricing_tiers_active ON public.pricing_tiers(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_pricing_tiers_sort ON public.pricing_tiers(sort_order);

-- ============================================================================
-- RLS Politikalari
-- token_packages & pricing_tiers: Global referans — herkes okuyabilir, yazma service_role
-- tenant_token_balance & token_transactions: tenant_id bazli izolasyon
-- ============================================================================

-- token_packages RLS (global okuma, yazma service_role)
ALTER TABLE public.token_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "token_packages_select_all"
  ON public.token_packages FOR SELECT TO authenticated
  USING (true);

-- pricing_tiers RLS (global okuma, yazma service_role)
ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pricing_tiers_select_all"
  ON public.pricing_tiers FOR SELECT TO authenticated
  USING (true);

-- tenant_token_balance RLS (tenant izolasyonu)
ALTER TABLE public.tenant_token_balance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_token_balance_select_tenant"
  ON public.tenant_token_balance FOR SELECT TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
    )
  );

-- UPDATE/DELETE sadece service_role uzerinden (backend API)
-- service_role RLS'i otomatik bypass eder, ek policy gerekmez

-- token_transactions RLS (tenant izolasyonu)
ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "token_transactions_select_tenant"
  ON public.token_transactions FOR SELECT TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
    )
  );

-- INSERT/UPDATE/DELETE sadece service_role uzerinden (backend API)
-- service_role RLS'i otomatik bypass eder, ek policy gerekmez
