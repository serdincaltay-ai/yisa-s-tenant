-- athletes: antrenör ataması için coach_user_id
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS coach_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_athletes_coach_user ON athletes(coach_user_id) WHERE coach_user_id IS NOT NULL;
