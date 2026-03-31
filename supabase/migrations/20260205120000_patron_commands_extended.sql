-- patron_commands: type, title, priority, source (CELF API uyumu)
-- Tarih: 5 Şubat 2026

ALTER TABLE patron_commands ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE patron_commands ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE patron_commands ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';
ALTER TABLE patron_commands ADD COLUMN IF NOT EXISTS source TEXT;
