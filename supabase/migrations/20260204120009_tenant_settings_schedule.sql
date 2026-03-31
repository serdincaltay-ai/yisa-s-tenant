-- Tenant ayarları: personel hedefleri, aidat kademeleri
-- Haftalık ders programı

-- tenants'a ek alanlar
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS antrenor_hedef INTEGER DEFAULT 0;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS temizlik_hedef INTEGER DEFAULT 0;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS mudur_hedef INTEGER DEFAULT 0;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS aidat_tiers JSONB DEFAULT '{"25": 500, "45": 700, "60": 900}'::jsonb;

-- Haftalık ders programı
CREATE TABLE IF NOT EXISTS tenant_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  gun TEXT NOT NULL CHECK (gun IN ('Pazartesi','Sali','Carsamba','Persembe','Cuma','Cumartesi','Pazar')),
  saat TEXT NOT NULL,
  ders_adi TEXT NOT NULL,
  antrenor_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  brans TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, gun, saat)
);
CREATE INDEX IF NOT EXISTS idx_tenant_schedule_tenant ON tenant_schedule(tenant_id);

-- celf_kasa: ödeme onayı (Patron onayı → kullanım açılır)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'celf_kasa') THEN
    ALTER TABLE celf_kasa ADD COLUMN IF NOT EXISTS odeme_onaylandi BOOLEAN DEFAULT false;
    ALTER TABLE celf_kasa ADD COLUMN IF NOT EXISTS odeme_onaylayan UUID;
    ALTER TABLE celf_kasa ADD COLUMN IF NOT EXISTS odeme_onay_tarihi TIMESTAMPTZ;
  END IF;
END $$;

-- tenant_purchases: satın alınan ürünler (ödeme onayı sonrası kullanılabilir)
CREATE TABLE IF NOT EXISTS tenant_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_key TEXT NOT NULL,
  product_name TEXT,
  amount DECIMAL(12,2) NOT NULL,
  para_birimi VARCHAR(3) DEFAULT 'TRY',
  celf_kasa_id UUID,
  odeme_onaylandi BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tenant_purchases_tenant ON tenant_purchases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_purchases_product ON tenant_purchases(tenant_id, product_key);
