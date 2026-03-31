-- tenant_schedule: antrenör geçmişi + kontenjan + ders_durumu (idempotent)
ALTER TABLE tenant_schedule ADD COLUMN IF NOT EXISTS coach_changed_at TIMESTAMPTZ;
ALTER TABLE tenant_schedule ADD COLUMN IF NOT EXISTS previous_coach_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE tenant_schedule ADD COLUMN IF NOT EXISTS kontenjan INTEGER DEFAULT 20;
ALTER TABLE tenant_schedule ADD COLUMN IF NOT EXISTS ders_durumu TEXT DEFAULT 'acik';
