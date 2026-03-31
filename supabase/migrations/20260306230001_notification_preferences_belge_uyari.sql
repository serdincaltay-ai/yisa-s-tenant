-- YiSA-S: notification_preferences tablosuna belge_uyari kolonu ekle
-- Belge gecerlilik uyari sistemi icin bildirim tercihi
-- Tarih: 6 Mart 2026

ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS belge_uyari BOOLEAN DEFAULT true;

COMMENT ON COLUMN notification_preferences.belge_uyari
  IS 'Belge gecerlilik uyari bildirimi tercihi — true ise kullanici belge uyarisi alir';
