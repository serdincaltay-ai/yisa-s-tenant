-- federation_info tablosuna eksik kolonları ekle
-- temsilci_bransi: temsilcinin branş bilgisi (federasyon branch'inden bağımsız)
-- updated_at: PATCH işlemlerinde güncelleme zamanı takibi

ALTER TABLE federation_info ADD COLUMN IF NOT EXISTS temsilci_bransi TEXT;
ALTER TABLE federation_info ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
