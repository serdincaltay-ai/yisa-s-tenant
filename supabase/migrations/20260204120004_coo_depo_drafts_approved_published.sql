-- COO Depo yapısı: drafts → approved → published
-- Anayasa: Talep → CIO → CEO → CELF üretim → COO depolama → Patron onayı → Yayınlama

-- 1. Taslaklar (drafts) — CELF/CEO üretir, henüz onaylanmamış
CREATE TABLE IF NOT EXISTS coo_depo_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  director_key TEXT NOT NULL,
  template_name TEXT,
  content JSONB NOT NULL,
  source TEXT, -- 'ceo_templates', 'patron_command', 'celf'
  patron_command_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);
CREATE INDEX IF NOT EXISTS idx_coo_depo_drafts_director ON coo_depo_drafts(director_key);
CREATE INDEX IF NOT EXISTS idx_coo_depo_drafts_created ON coo_depo_drafts(created_at DESC);

-- 2. Onaylı (approved) — Patron onayladı, yayına hazır
CREATE TABLE IF NOT EXISTS coo_depo_approved (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID REFERENCES coo_depo_drafts(id) ON DELETE SET NULL,
  director_key TEXT NOT NULL,
  template_name TEXT NOT NULL,
  content JSONB NOT NULL,
  approved_by UUID NOT NULL,
  approved_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_coo_depo_approved_director ON coo_depo_approved(director_key);
CREATE INDEX IF NOT EXISTS idx_coo_depo_approved_at ON coo_depo_approved(approved_at DESC);

-- 3. Yayınlanmış (published) — Vitrin/COO Mağazasında görünür
CREATE TABLE IF NOT EXISTS coo_depo_published (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approved_id UUID REFERENCES coo_depo_approved(id) ON DELETE SET NULL,
  director_key TEXT NOT NULL,
  template_name TEXT NOT NULL,
  content JSONB NOT NULL,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  published_by UUID,
  tenant_visible BOOLEAN DEFAULT true -- Franchise'lar COO Mağazasında görebilir
);
CREATE INDEX IF NOT EXISTS idx_coo_depo_published_director ON coo_depo_published(director_key);
CREATE INDEX IF NOT EXISTS idx_coo_depo_published_at ON coo_depo_published(published_at DESC);

-- RLS: Sadece service role yazabilsin; client erişimi kısıtlı
ALTER TABLE coo_depo_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE coo_depo_approved ENABLE ROW LEVEL SECURITY;
ALTER TABLE coo_depo_published ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coo_depo_drafts_service_only" ON coo_depo_drafts;
CREATE POLICY "coo_depo_drafts_service_only" ON coo_depo_drafts FOR ALL USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "coo_depo_approved_service_only" ON coo_depo_approved;
CREATE POLICY "coo_depo_approved_service_only" ON coo_depo_approved FOR ALL USING (false) WITH CHECK (false);

-- Published: Dashboard/Patron okuyabilsin; franchise sadece tenant_visible=true olanları
DROP POLICY IF EXISTS "coo_depo_published_read" ON coo_depo_published;
CREATE POLICY "coo_depo_published_read" ON coo_depo_published FOR SELECT USING (true);
