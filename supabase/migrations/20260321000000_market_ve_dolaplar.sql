-- Market ve Dolaplar (GymTekno P3): Fit Market (ürün, stok, hareket) ve Dolaplar (kiralama)
-- Market
CREATE TABLE IF NOT EXISTS market_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  kategori TEXT NOT NULL,
  urun_adi TEXT NOT NULL,
  barkod TEXT,
  stok_miktari INTEGER DEFAULT 0,
  satis_fiyati NUMERIC(10,2) NOT NULL,
  alis_fiyati NUMERIC(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS market_stock_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES market_products(id) ON DELETE CASCADE,
  hareket_tipi TEXT NOT NULL,
  miktar INTEGER NOT NULL,
  birim_fiyat NUMERIC(10,2),
  toplam_tutar NUMERIC(10,2),
  aciklama TEXT,
  islem_yapan UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Dolaplar
CREATE TABLE IF NOT EXISTS lockers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  dolap_no TEXT NOT NULL,
  konum TEXT,
  durum TEXT DEFAULT 'bos',
  kiralayan_athlete_id UUID REFERENCES athletes(id) ON DELETE SET NULL,
  kiralama_baslangic DATE,
  kiralama_bitis DATE,
  aylik_ucret NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, dolap_no)
);

CREATE INDEX IF NOT EXISTS idx_market_products_tenant ON market_products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_market_products_kategori ON market_products(tenant_id, kategori);
CREATE INDEX IF NOT EXISTS idx_market_stock_movements_tenant ON market_stock_movements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_market_stock_movements_product ON market_stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_lockers_tenant ON lockers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lockers_durum ON lockers(tenant_id, durum);

-- RLS
ALTER TABLE market_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE lockers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "market_products_tenant" ON market_products;
CREATE POLICY "market_products_tenant" ON market_products FOR ALL USING (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
) WITH CHECK (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
);

DROP POLICY IF EXISTS "market_stock_movements_tenant" ON market_stock_movements;
CREATE POLICY "market_stock_movements_tenant" ON market_stock_movements FOR ALL USING (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
) WITH CHECK (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
);

DROP POLICY IF EXISTS "lockers_tenant" ON lockers;
CREATE POLICY "lockers_tenant" ON lockers FOR ALL USING (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
) WITH CHECK (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
);
