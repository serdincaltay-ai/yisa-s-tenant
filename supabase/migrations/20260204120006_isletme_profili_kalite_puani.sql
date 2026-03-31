-- İşletme profili ve kalite puanı alanları (OKUTULDU raporu — anayasa uyumlu)
-- Referans: archive/OKUTULDU_ESKİ_KODLAR_INCELEME_RAPORU.md §3.1, §3.2
-- Mevcut şemayı bozmadan ek kolonlar; robotlar bu verileri kullanacak (VERI_KAYNAKLARI_ROBOT_GOREVLENDIRME.md)

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 1. TENANTS — İşletme profili (genel / patron birimi)
-- ═══════════════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tenants' AND column_name = 'slogan') THEN
    ALTER TABLE tenants ADD COLUMN slogan TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tenants' AND column_name = 'primary_color') THEN
    ALTER TABLE tenants ADD COLUMN primary_color VARCHAR(20);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tenants' AND column_name = 'secondary_color') THEN
    ALTER TABLE tenants ADD COLUMN secondary_color VARCHAR(20);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tenants' AND column_name = 'logo_url') THEN
    ALTER TABLE tenants ADD COLUMN logo_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tenants' AND column_name = 'logo_dark_url') THEN
    ALTER TABLE tenants ADD COLUMN logo_dark_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tenants' AND column_name = 'working_hours') THEN
    ALTER TABLE tenants ADD COLUMN working_hours JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 2. FRANCHISES — İşletme profili (franchise / şube vitrin)
-- ═══════════════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'franchises' AND column_name = 'slogan') THEN
    ALTER TABLE franchises ADD COLUMN slogan TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'franchises' AND column_name = 'vergi_no') THEN
    ALTER TABLE franchises ADD COLUMN vergi_no VARCHAR(20);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'franchises' AND column_name = 'map_url') THEN
    ALTER TABLE franchises ADD COLUMN map_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'franchises' AND column_name = 'working_hours') THEN
    ALTER TABLE franchises ADD COLUMN working_hours JSONB DEFAULT '{}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'franchises' AND column_name = 'primary_color') THEN
    ALTER TABLE franchises ADD COLUMN primary_color VARCHAR(20);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'franchises' AND column_name = 'secondary_color') THEN
    ALTER TABLE franchises ADD COLUMN secondary_color VARCHAR(20);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'franchises' AND column_name = 'logo_url') THEN
    ALTER TABLE franchises ADD COLUMN logo_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'franchises' AND column_name = 'logo_dark_url') THEN
    ALTER TABLE franchises ADD COLUMN logo_dark_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'franchises' AND column_name = 'facility_area_m2') THEN
    ALTER TABLE franchises ADD COLUMN facility_area_m2 INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'franchises' AND column_name = 'capacity') THEN
    ALTER TABLE franchises ADD COLUMN capacity INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'franchises' AND column_name = 'amenities') THEN
    ALTER TABLE franchises ADD COLUMN amenities JSONB DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'franchises' AND column_name = 'google_place_id') THEN
    ALTER TABLE franchises ADD COLUMN google_place_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'franchises' AND column_name = 'google_rating') THEN
    ALTER TABLE franchises ADD COLUMN google_rating DECIMAL(3,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'franchises' AND column_name = 'gallery_urls') THEN
    ALTER TABLE franchises ADD COLUMN gallery_urls TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 3. COO DEPO — Kalite puanı (COO Mağazası listeleme / öne çıkan)
-- ═══════════════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coo_depo_approved' AND column_name = 'quality_score') THEN
    ALTER TABLE coo_depo_approved ADD COLUMN quality_score INTEGER CHECK (quality_score IS NULL OR (quality_score >= 0 AND quality_score <= 100));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coo_depo_approved' AND column_name = 'quality_tier') THEN
    ALTER TABLE coo_depo_approved ADD COLUMN quality_tier TEXT CHECK (quality_tier IS NULL OR quality_tier IN ('premium', 'standard', 'basic'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coo_depo_published' AND column_name = 'quality_score') THEN
    ALTER TABLE coo_depo_published ADD COLUMN quality_score INTEGER CHECK (quality_score IS NULL OR (quality_score >= 0 AND quality_score <= 100));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coo_depo_published' AND column_name = 'quality_tier') THEN
    ALTER TABLE coo_depo_published ADD COLUMN quality_tier TEXT CHECK (quality_tier IS NULL OR quality_tier IN ('premium', 'standard', 'basic'));
  END IF;
END $$;

-- İndeksler (filtreleme için)
CREATE INDEX IF NOT EXISTS idx_franchises_google_rating ON franchises(google_rating) WHERE google_rating IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_coo_depo_approved_quality ON coo_depo_approved(quality_tier) WHERE quality_tier IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_coo_depo_published_quality ON coo_depo_published(quality_tier) WHERE quality_tier IS NOT NULL;
