-- Haftalık rapor bildirim tercihi kolonu ekle
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS haftalik_rapor BOOLEAN DEFAULT true;

COMMENT ON COLUMN notification_preferences.haftalik_rapor
  IS 'Haftalık rapor bildirimi tercihi — true ise kullanıcı haftalık rapor alır';
