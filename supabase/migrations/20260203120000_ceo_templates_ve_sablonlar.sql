-- ceo_templates: 66 direktörlük şablonu için tablo (ad, kategori, icerik, durum, olusturan)
-- Mevcut tablo farklı sütunlara sahipse yeni sütunlar eklenir.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ceo_templates') THEN
    CREATE TABLE ceo_templates (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      ad TEXT NOT NULL,
      kategori TEXT NOT NULL,
      icerik JSONB NOT NULL DEFAULT '{}',
      durum TEXT DEFAULT 'aktif',
      olusturan TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  ELSE
    ALTER TABLE ceo_templates ADD COLUMN IF NOT EXISTS ad TEXT;
    ALTER TABLE ceo_templates ADD COLUMN IF NOT EXISTS kategori TEXT;
    ALTER TABLE ceo_templates ADD COLUMN IF NOT EXISTS icerik JSONB DEFAULT '{}';
    ALTER TABLE ceo_templates ADD COLUMN IF NOT EXISTS durum TEXT DEFAULT 'aktif';
    ALTER TABLE ceo_templates ADD COLUMN IF NOT EXISTS olusturan TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ceo_templates_kategori ON ceo_templates(kategori);
CREATE INDEX IF NOT EXISTS idx_ceo_templates_olusturan ON ceo_templates(olusturan);

-- Önceki seed kayıtlarını temizle (tekrar çalıştırmada duplicate olmasın)
DELETE FROM ceo_templates WHERE olusturan IN ('CFO','CLO','CHRO','CMO','CTO','CSO','CSPO','COO','CMDO','CCO','CDO','CISO');
