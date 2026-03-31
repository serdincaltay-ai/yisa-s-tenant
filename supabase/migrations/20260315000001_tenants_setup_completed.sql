-- Tenant kurulum durumu kolonu — idempotent
-- Zaten 20260218120002_tenants_kurulum.sql ile eklenmiş olabilir
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN DEFAULT false;
