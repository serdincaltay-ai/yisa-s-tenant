-- CELF Kasa: Gelir ve gider hareketleri (satış, ödeme, masraf)
-- Satış yapıldığında gelir buraya yazılır; kasa defteri buradan okur.

CREATE TABLE IF NOT EXISTS celf_kasa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hareket_tipi TEXT NOT NULL CHECK (hareket_tipi IN ('gelir', 'gider')),
  aciklama TEXT NOT NULL,
  tutar DECIMAL(12,2) NOT NULL,
  para_birimi VARCHAR(3) DEFAULT 'TRY',
  referans_tipi TEXT,
  referans_id UUID,
  franchise_id UUID,
  tenant_id UUID,
  kaynak TEXT,
  odeme_tarihi TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_celf_kasa_hareket_tipi ON celf_kasa(hareket_tipi);
CREATE INDEX IF NOT EXISTS idx_celf_kasa_created_at ON celf_kasa(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_celf_kasa_franchise ON celf_kasa(franchise_id);
CREATE INDEX IF NOT EXISTS idx_celf_kasa_tenant ON celf_kasa(tenant_id);

COMMENT ON TABLE celf_kasa IS 'CELF merkez kasa: satış geliri ve giderler';
