-- Anket sistemi: questions JSONB kolonu + survey_responses tablosu
-- Tarih: 6 Mart 2026 (version 20260306230003 — çakışma önleme)

-- tenant_surveys tablosuna questions JSONB kolonu ekle
ALTER TABLE tenant_surveys ADD COLUMN IF NOT EXISTS questions JSONB DEFAULT '[]'::jsonb;

-- Anket yanıtları tablosu
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES tenant_surveys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(survey_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_survey_responses_survey ON survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_user ON survey_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_tenant ON survey_responses(tenant_id);

ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Survey responses tenant access" ON survey_responses;
CREATE POLICY "Survey responses tenant access" ON survey_responses FOR ALL USING (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  OR user_id = auth.uid()
) WITH CHECK (
  user_id = auth.uid()
);
