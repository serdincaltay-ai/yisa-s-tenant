-- Genisletilmis olcum alanlari: postur, beighton, asimetri, duz taban, oturma yuksekligi
ALTER TABLE athlete_measurements
  ADD COLUMN IF NOT EXISTS postur_omuz INTEGER,
  ADD COLUMN IF NOT EXISTS postur_sirt INTEGER,
  ADD COLUMN IF NOT EXISTS postur_kalca INTEGER,
  ADD COLUMN IF NOT EXISTS postur_diz INTEGER,
  ADD COLUMN IF NOT EXISTS postur_ayak INTEGER,
  ADD COLUMN IF NOT EXISTS postur_bas INTEGER,
  ADD COLUMN IF NOT EXISTS beighton_skoru INTEGER,
  ADD COLUMN IF NOT EXISTS asimetri_skoru DECIMAL(6,2),
  ADD COLUMN IF NOT EXISTS baskin_taraf TEXT,
  ADD COLUMN IF NOT EXISTS duz_taban_derecesi INTEGER,
  ADD COLUMN IF NOT EXISTS oturma_yuksekligi DECIMAL(6,2);
