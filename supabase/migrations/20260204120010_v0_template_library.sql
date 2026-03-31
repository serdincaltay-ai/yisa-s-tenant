-- V0 şablon kütüphanesi — YİSA-ESKİ KODLAR\v0 şablonlarından ücretsiz profesyonel tasarımlar
-- Referans: YİSA-ESKİ KODLAR\v0 şablonları (Vercel v0.dev ücretsiz şablonları)
-- CELF/CPO bu tablodan veri alarak şablon üretebilir veya franchise'lara ücretsiz sunabilir

CREATE TABLE IF NOT EXISTS v0_template_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  ad TEXT NOT NULL,
  aciklama TEXT,
  kategori TEXT NOT NULL,
  director_key TEXT,
  source_path TEXT NOT NULL,
  is_free BOOLEAN DEFAULT true,
  quality_tier TEXT DEFAULT 'standard' CHECK (quality_tier IN ('premium', 'standard', 'basic')),
  icerik_ozeti JSONB DEFAULT '{}',
  durum TEXT DEFAULT 'aktif' CHECK (durum IN ('aktif', 'askida', 'arsiv')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_v0_template_library_slug ON v0_template_library(slug);
CREATE INDEX IF NOT EXISTS idx_v0_template_library_kategori ON v0_template_library(kategori);
CREATE INDEX IF NOT EXISTS idx_v0_template_library_director ON v0_template_library(director_key);
CREATE INDEX IF NOT EXISTS idx_v0_template_library_is_free ON v0_template_library(is_free) WHERE is_free = true;

ALTER TABLE v0_template_library ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "v0_template_library_read" ON v0_template_library;
CREATE POLICY "v0_template_library_read" ON v0_template_library FOR SELECT USING (true);

-- tenant_templates: v0_template_library kaynağını destekle (ileride franchise kullanımı için)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenant_templates') THEN
    ALTER TABLE tenant_templates DROP CONSTRAINT IF EXISTS tenant_templates_template_source_check;
    ALTER TABLE tenant_templates ADD CONSTRAINT tenant_templates_template_source_check
      CHECK (template_source IN ('templates', 'ceo_templates', 'v0_template_library'));
  END IF;
END $$;

-- seed: En verimli ve donanımlı V0 şablonları (YİSA-S için uyarlanabilir)
-- source_path: YİSA-ESKİ KODLAR\v0 şablonları altındaki klasör adı
INSERT INTO v0_template_library (slug, ad, aciklama, kategori, director_key, source_path, is_free, quality_tier, icerik_ozeti) VALUES
('tutor-dashboard', 'Eğitim Yönetim Paneli', 'Kurs/antrenör dashboard: öğrenci, ders, ödeme, rapor sayfaları', 'dashboard', 'CSPO', 'tutor-dashboard', true, 'premium', '{"sayfalar":["courses","students","sessions","payments","reports","messages","meters","settings"],"uyum":["sporcu","antrenor","ders_programi"]}'::jsonb),
('yisa-s-dashboard', 'YİSA-S Dashboard', 'YİSA-S için özel dashboard tasarımı', 'dashboard', 'CPO', 'yisa-s-dashboard', true, 'premium', '{"uyum":["yisa_s_ana_panel"]}'::jsonb),
('extr-up-admin-panel', 'Admin Paneli', 'Kurumsal admin panel: sidebar, tablo, form bileşenleri', 'dashboard', 'CTO', 'extr-up-admin-panel', true, 'premium', '{"sayfalar":["admin","users","settings"],"uyum":["patron","tesis_muduru"]}'::jsonb),
('futuristic-dashboard', 'Fütüristik Dashboard', 'Modern dashboard tasarımı', 'dashboard', 'CPO', 'futuristic-dashboard', true, 'premium', '{"stil":"futuristik","uyum":["genel"]}'::jsonb),
('cal-com-clone', 'Randevu / Takvim', 'Randevu ve takvim sistemi (Cal.com benzeri)', 'takvim', 'COO', 'cal-com-clone', true, 'premium', '{"uyum":["ders_programi","randevu","demo_talebi"]}'::jsonb),
('minimalist-profile-cards', 'Profil Kartları', 'Minimalist profil kartı tasarımları', 'ui', 'CPO', 'minimalist-profile-cards', true, 'standard', '{"uyum":["antrenor","sporcu","profil"]}'::jsonb),
('product-launch-timer-landing', 'Landing / Lansman Sayfası', 'Ürün lansmanı ve geri sayım landing sayfası', 'vitrin', 'CMO', 'product-launch-timer-landing', true, 'premium', '{"uyum":["vitrin","kampanya","demo"]}'::jsonb),
('skill-diagram-builder', 'Beceri Diyagramı', 'Beceri ve ilerleme görselleştirme', 'grafik', 'CSPO', 'skill-diagram-builder', true, 'premium', '{"uyum":["sporcu_ilerleme","seviye","olcum"]}'::jsonb),
('neobrutalist-ui-design', 'Neobrutalist UI', 'Bold modern UI tasarım stili', 'ui', 'CPO', 'neobrutalist-ui-design', true, 'standard', '{"stil":"neobrutalist","uyum":["genel"]}'::jsonb),
('crowdfunding-community-platform', 'Topluluk Platformu', 'Topluluk ve crowdfunding sayfası', 'vitrin', 'CMO', 'crowdfunding-community-platform', true, 'standard', '{"uyum":["topluluk","kampanya"]}'::jsonb),
('integrations-page', 'Entegrasyon Sayfası', 'Entegrasyon ve API listesi sayfası', 'ui', 'CTO', 'integrations-page', true, 'standard', '{"uyum":["api","entegrasyon"]}'::jsonb),
('home-management-app', 'Yönetim Uygulaması', 'Ev/işletme yönetim uygulaması yapısı', 'dashboard', 'COO', 'home-management-app', true, 'standard', '{"uyum":["tesis","yönetim"]}'::jsonb),
('product-launch-timer', 'Lansman Zamanlayıcı', 'Ürün lansmanı geri sayım bileşeni', 'vitrin', 'CMO', 'product-launch-timer', true, 'standard', '{"uyum":["kampanya","vitrin"]}'::jsonb),
('3-d-card-animation', '3D Kart Animasyonu', '3D kart görsel efektleri', 'ui', 'CPO', '3-d-card-animation', true, 'standard', '{"uyum":["gorsel","premium"]}'::jsonb),
('automation-rule-setup', 'Otomasyon Kuralları', 'Otomasyon kural kurulum arayüzü', 'ui', 'CTO', 'automation-rule-setup', true, 'standard', '{"uyum":["rutin","kurallar"]}'::jsonb)
ON CONFLICT (slug) DO NOTHING;
