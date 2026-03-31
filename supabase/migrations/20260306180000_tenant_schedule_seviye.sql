-- tenant_schedule: seviye kolonu ekleme (ders seviyesi / yaş grubu)
ALTER TABLE tenant_schedule ADD COLUMN IF NOT EXISTS seviye TEXT;
