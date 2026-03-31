-- YİSA-S: cleaning_checklists — Temizlik personeli günlük checklist
-- Tarih: 6 Mart 2026 (version 20260306230002 — çakışma önleme)

CREATE TABLE IF NOT EXISTS cleaning_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tarih DATE NOT NULL DEFAULT CURRENT_DATE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, user_id, tarih)
);

CREATE INDEX IF NOT EXISTS idx_cleaning_checklists_tenant ON cleaning_checklists(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_checklists_tarih ON cleaning_checklists(tarih);
CREATE INDEX IF NOT EXISTS idx_cleaning_checklists_user ON cleaning_checklists(user_id);

-- RLS politikalari
ALTER TABLE cleaning_checklists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cleaning_checklists_select ON cleaning_checklists;
CREATE POLICY cleaning_checklists_select ON cleaning_checklists
  FOR SELECT USING (tenant_id IN (
    SELECT tenant_id FROM staff WHERE user_id = auth.uid()
    UNION
    SELECT id FROM tenants WHERE owner_id = auth.uid()
  ));

DROP POLICY IF EXISTS cleaning_checklists_insert ON cleaning_checklists;
CREATE POLICY cleaning_checklists_insert ON cleaning_checklists
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND tenant_id IN (
      SELECT tenant_id FROM staff WHERE user_id = auth.uid()
      UNION
      SELECT id FROM tenants WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS cleaning_checklists_update ON cleaning_checklists;
CREATE POLICY cleaning_checklists_update ON cleaning_checklists
  FOR UPDATE USING (
    user_id = auth.uid()
    AND tenant_id IN (
      SELECT tenant_id FROM staff WHERE user_id = auth.uid()
      UNION
      SELECT id FROM tenants WHERE owner_id = auth.uid()
    )
  );

COMMENT ON TABLE cleaning_checklists IS 'Temizlik personeli gunluk checklist kayitlari — tenant_id ile izole';
