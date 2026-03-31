-- Franchise onay kuyruğu: red_nedeni kolonu ve islem_tipi genişletmesi (franchise_islem_onay_kuyrugu kullanılır)
-- Mevcut tablo: franchise_islem_onay_kuyrugu (20260316000000). Bu migration kolon/constraint ekler.

ALTER TABLE franchise_islem_onay_kuyrugu ADD COLUMN IF NOT EXISTS red_nedeni TEXT;

ALTER TABLE franchise_islem_onay_kuyrugu DROP CONSTRAINT IF EXISTS franchise_islem_onay_kuyrugu_islem_tipi_check;
ALTER TABLE franchise_islem_onay_kuyrugu ADD CONSTRAINT franchise_islem_onay_kuyrugu_islem_tipi_check
  CHECK (islem_tipi IN ('paket_ekleme', 'yeni_uye', 'indirim', 'iade', 'izin_talebi', 'avans_talebi', 'diger'));
