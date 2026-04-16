-- GÖREV 8: onboarding adım logları ve idempotent izleme

CREATE TABLE IF NOT EXISTS onboarding_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES onboarding_sessions(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  step_key TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('already_done', 'completed', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 1,
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_steps_session ON onboarding_steps(session_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_steps_tenant ON onboarding_steps(tenant_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_steps_step_key ON onboarding_steps(step_key);

ALTER TABLE onboarding_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "onboarding_steps_service_all" ON onboarding_steps;
CREATE POLICY "onboarding_steps_service_all"
  ON onboarding_steps FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
