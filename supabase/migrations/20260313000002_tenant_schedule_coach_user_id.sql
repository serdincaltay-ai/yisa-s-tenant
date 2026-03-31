-- tenant_schedule: antrenörü auth user ile eşleştirmek için coach_user_id
ALTER TABLE tenant_schedule ADD COLUMN IF NOT EXISTS coach_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
