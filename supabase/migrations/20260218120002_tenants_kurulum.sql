-- Tenant kurulum sihirbazı kolonları
-- working_hours, primary_color bazı migration'larda olabilir; IF NOT EXISTS ile ekle

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS working_hours JSONB DEFAULT '{}'::jsonb;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#1a1a2e';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN DEFAULT false;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS selected_branches JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_tenants_setup_completed ON tenants(setup_completed) WHERE setup_completed = false;
