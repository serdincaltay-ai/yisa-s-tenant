-- Franchise subdomain'leri — Asistan komutla eklenebilir
-- Patron "subdomain ekle: madamfavori" dediğinde sistem buraya yazar

CREATE TABLE IF NOT EXISTS franchise_subdomains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subdomain TEXT NOT NULL UNIQUE,
  franchise_name TEXT,
  tenant_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

CREATE INDEX IF NOT EXISTS idx_franchise_subdomains_subdomain ON franchise_subdomains(subdomain);

-- Mevcut subdomain'leri ekle
INSERT INTO franchise_subdomains (subdomain, franchise_name) VALUES
  ('bjktuzlacimnastik', 'Tuzla Cimnastik'),
  ('fenerbahceatasehir', 'Ataşehir, Ümraniye, Kurtköy'),
  ('kartalcimnastik', 'Kartal Cimnastik')
ON CONFLICT (subdomain) DO NOTHING;
