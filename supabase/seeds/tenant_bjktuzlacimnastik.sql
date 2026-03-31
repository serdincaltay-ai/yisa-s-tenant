-- bjktuzlacimnastik tenant kaydı oluştur ve franchise_subdomains ile bağla
-- Bu migration bjktuzlacimnastik.yisa-s.com "Franchise bulunamadı" hatasını çözer

-- 0. Uzak DB'de name kolonu yoksa ekle (asama2'den önce uygulanan DB'ler için)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS name TEXT;

-- 1. Tenant kaydı oluştur (yoksa)
INSERT INTO tenants (ad, name, slug, durum, package_type)
VALUES (
  'Tuzla Beşiktaş Cimnastik Okulu',
  'BJK Tuzla Cimnastik',
  'bjktuzlacimnastik',
  'aktif',
  'starter'
)
ON CONFLICT (slug) DO NOTHING;

-- 2. franchise_subdomains.tenant_id'yi bağla
UPDATE franchise_subdomains fs
SET tenant_id = t.id
FROM tenants t
WHERE t.slug = 'bjktuzlacimnastik'
  AND fs.subdomain = 'bjktuzlacimnastik'
  AND fs.tenant_id IS NULL;

-- 3. demo_requests source constraint güncelle — 'manychat' ekle
ALTER TABLE demo_requests DROP CONSTRAINT IF EXISTS demo_requests_source_check;
ALTER TABLE demo_requests ADD CONSTRAINT demo_requests_source_check
  CHECK (source IN ('www', 'demo', 'fiyatlar', 'vitrin', 'manychat'));

-- 4. Social media entegrasyon tablosu (opsiyonel)
CREATE TABLE IF NOT EXISTS social_media_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'whatsapp', 'google_business', 'facebook', 'youtube')),
  account_id TEXT,
  account_name TEXT,
  access_token TEXT,
  config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, platform)
);
CREATE INDEX IF NOT EXISTS idx_social_media_configs_tenant ON social_media_configs(tenant_id);
ALTER TABLE social_media_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service can manage social_media_configs" ON social_media_configs;
CREATE POLICY "Service can manage social_media_configs" ON social_media_configs FOR ALL USING (true) WITH CHECK (true);
