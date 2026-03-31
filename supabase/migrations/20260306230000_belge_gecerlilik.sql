-- YiSA-S: Belge geçerlilik takibi — saglik_raporu_gecerlilik kolonu
-- Tarih: 6 Mart 2026

ALTER TABLE athlete_health_records
  ADD COLUMN IF NOT EXISTS saglik_raporu_gecerlilik DATE;

COMMENT ON COLUMN athlete_health_records.saglik_raporu_gecerlilik
  IS 'Sağlık raporunun son geçerlilik tarihi. NULL ise geçerlilik bilinmiyor.';

CREATE INDEX IF NOT EXISTS idx_athlete_health_gecerlilik
  ON athlete_health_records(saglik_raporu_gecerlilik);
