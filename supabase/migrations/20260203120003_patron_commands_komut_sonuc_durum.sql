-- patron_commands: komut, sonuc, durum, completed_at kolonları
-- Tarih: 3 Şubat 2026
-- FIX: Trigger'lar DROP edildikten SONRA UPDATE yapılır

-- 1) Önce tüm user trigger'larını kaldır (guncelleme_tarihi hatasını önlemek için)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT tgname FROM pg_trigger WHERE tgrelid = 'public.patron_commands'::regclass AND NOT tgisinternal
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON patron_commands', r.tgname);
  END LOOP;
END $$;

-- 2) Kolonlar (idempotent)
ALTER TABLE patron_commands ADD COLUMN IF NOT EXISTS komut TEXT;
ALTER TABLE patron_commands ADD COLUMN IF NOT EXISTS sonuc JSONB;
ALTER TABLE patron_commands ADD COLUMN IF NOT EXISTS durum TEXT;
ALTER TABLE patron_commands ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- 3) Mevcut kayıtları güncelle (trigger'lar artık yok, güvenle çalışır)
UPDATE patron_commands SET komut = command WHERE komut IS NULL AND command IS NOT NULL;
UPDATE patron_commands SET durum = 'tamamlandi', completed_at = COALESCE(updated_at, created_at) WHERE status = 'approved' AND (durum IS NULL OR durum = '');
UPDATE patron_commands SET durum = 'beklemede' WHERE status = 'pending' AND (durum IS NULL OR durum = '');

-- 4) Doğru updated_at trigger'ını kur
CREATE OR REPLACE FUNCTION update_patron_commands_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_patron_commands_updated ON patron_commands;
CREATE TRIGGER trg_patron_commands_updated
  BEFORE UPDATE ON patron_commands
  FOR EACH ROW EXECUTE PROCEDURE update_patron_commands_updated_at();
