-- Dijital kredi: athletes'a kredi kolonları
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS ders_kredisi INTEGER DEFAULT 0;
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS toplam_kredi INTEGER DEFAULT 0;

-- tenants: kredi paketleri (JSONB)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS kredi_paketleri JSONB DEFAULT '[]'::jsonb;
-- Örnek: [{"isim":"Hafta 2","saat":8,"fiyat":2500},{"isim":"Hafta 3","saat":12,"fiyat":3500}]
