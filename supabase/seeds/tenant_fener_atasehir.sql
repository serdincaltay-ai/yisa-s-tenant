-- Fener Ataşehir tenant kaydı oluştur ve franchise_subdomains ile bağla
-- Bu migration fenerbahceatasehir.yisa-s.com ve feneratasehir.yisa-s.com için tenant kaydı oluşturur

-- 1. Tenant kaydı oluştur (yoksa)
INSERT INTO tenants (ad, name, slug, durum, package_type)
VALUES (
  'Fenerbahçe Ataşehir Spor Okulu',
  'Fener Ataşehir',
  'feneratasehir',
  'aktif',
  'starter'
)
ON CONFLICT (slug) DO NOTHING;

-- 2. feneratasehir subdomain kaydı oluştur ve tenant'a bağla
INSERT INTO franchise_subdomains (subdomain, franchise_name)
VALUES ('feneratasehir', 'Fenerbahçe Ataşehir Spor Okulu')
ON CONFLICT (subdomain) DO NOTHING;

UPDATE franchise_subdomains fs
SET tenant_id = t.id
FROM tenants t
WHERE t.slug = 'feneratasehir'
  AND fs.subdomain = 'feneratasehir'
  AND fs.tenant_id IS NULL;

-- 3. fenerbahceatasehir subdomain'ini de aynı tenant'a bağla
INSERT INTO franchise_subdomains (subdomain, franchise_name)
VALUES ('fenerbahceatasehir', 'Fenerbahçe Ataşehir Spor Okulu')
ON CONFLICT (subdomain) DO UPDATE SET franchise_name = EXCLUDED.franchise_name;

UPDATE franchise_subdomains fs
SET tenant_id = t.id
FROM tenants t
WHERE t.slug = 'feneratasehir'
  AND fs.subdomain = 'fenerbahceatasehir'
  AND fs.tenant_id IS NULL;

-- 4. Varsayılan çalışma saatleri ve ayarlar
UPDATE tenants
SET
  working_hours = '{
    "Pazartesi": {"open": "09:00", "close": "21:00"},
    "Sali": {"open": "09:00", "close": "21:00"},
    "Carsamba": {"open": "09:00", "close": "21:00"},
    "Persembe": {"open": "09:00", "close": "21:00"},
    "Cuma": {"open": "09:00", "close": "21:00"},
    "Cumartesi": {"open": "09:00", "close": "18:00"},
    "Pazar": {"open": null, "close": null}
  }'::jsonb,
  aidat_tiers = '{"25": 500, "45": 700, "60": 900}'::jsonb,
  primary_color = '#FFD700'
WHERE slug = 'feneratasehir'
  AND (working_hours IS NULL OR working_hours = '{}'::jsonb);
