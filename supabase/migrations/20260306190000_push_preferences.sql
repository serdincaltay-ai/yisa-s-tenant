-- push_preferences: Veli bildirim tercihleri
CREATE TABLE IF NOT EXISTS push_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  yoklama_notify BOOLEAN NOT NULL DEFAULT TRUE,
  odeme_notify BOOLEAN NOT NULL DEFAULT TRUE,
  duyuru_notify BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT push_preferences_user_id_key UNIQUE (user_id)
);

-- RLS
ALTER TABLE push_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own push_preferences" ON push_preferences;
CREATE POLICY "Users can read own push_preferences"
  ON push_preferences FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own push_preferences" ON push_preferences;
CREATE POLICY "Users can insert own push_preferences"
  ON push_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own push_preferences" ON push_preferences;
CREATE POLICY "Users can update own push_preferences"
  ON push_preferences FOR UPDATE
  USING (auth.uid() = user_id);
