-- Fotoğraf/Video Galeri Sistemi
-- Supabase Storage ile entegre medya yönetimi.
-- (version 20260307000004 — 20260307000002 çakışması nedeniyle taşındı)

CREATE TABLE IF NOT EXISTS tenant_gallery (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  baslik TEXT NOT NULL,
  aciklama TEXT,
  dosya_url TEXT NOT NULL,
  dosya_tipi TEXT NOT NULL CHECK (dosya_tipi IN ('image', 'video')),
  dosya_boyutu INTEGER DEFAULT 0,
  siralama INTEGER DEFAULT 0,
  aktif BOOLEAN DEFAULT true,
  etiketler TEXT[] DEFAULT '{}',
  yukleyen_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_tenant_gallery_tenant ON tenant_gallery(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_gallery_tip ON tenant_gallery(tenant_id, dosya_tipi);
CREATE INDEX IF NOT EXISTS idx_tenant_gallery_aktif ON tenant_gallery(tenant_id, aktif);

-- RLS
ALTER TABLE tenant_gallery ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant kendi galerisini görebilir" ON tenant_gallery;
CREATE POLICY "Tenant kendi galerisini görebilir"
  ON tenant_gallery FOR SELECT
  USING (tenant_id IN (
    SELECT ut.tenant_id FROM user_tenants ut WHERE ut.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Franchise owner/admin galeri yönetebilir" ON tenant_gallery;
CREATE POLICY "Franchise owner/admin galeri yönetebilir"
  ON tenant_gallery FOR ALL
  USING (tenant_id IN (
    SELECT ut.tenant_id FROM user_tenants ut WHERE ut.user_id = auth.uid() AND ut.role IN ('owner', 'admin')
  ));

DROP POLICY IF EXISTS "Service role tam erişim tenant_gallery" ON tenant_gallery;
CREATE POLICY "Service role tam erişim tenant_gallery"
  ON tenant_gallery FOR ALL
  USING (auth.role() = 'service_role');
