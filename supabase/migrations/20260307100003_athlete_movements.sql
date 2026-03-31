-- Hareket havuzu: sporcu-hareket bağlantı tablosu
CREATE TABLE IF NOT EXISTS athlete_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  movement_name TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  marked_by UUID NOT NULL REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Eski/minimal tabloda (20260308 vb.) marked_by/tenant_id yoksa ekle
ALTER TABLE athlete_movements ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE athlete_movements ADD COLUMN IF NOT EXISTS movement_name TEXT;
ALTER TABLE athlete_movements ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE athlete_movements ADD COLUMN IF NOT EXISTS marked_by UUID REFERENCES auth.users(id);
ALTER TABLE athlete_movements ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE athlete_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS athlete_movements_coach_select ON athlete_movements;
CREATE POLICY athlete_movements_coach_select ON athlete_movements
  FOR SELECT USING (marked_by = auth.uid());

DROP POLICY IF EXISTS athlete_movements_coach_insert ON athlete_movements;
CREATE POLICY athlete_movements_coach_insert ON athlete_movements
  FOR INSERT WITH CHECK (marked_by = auth.uid());

DROP POLICY IF EXISTS athlete_movements_parent_select ON athlete_movements;
CREATE POLICY athlete_movements_parent_select ON athlete_movements
  FOR SELECT USING (
    athlete_id IN (SELECT id FROM athletes WHERE parent_user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_athlete_movements_athlete ON athlete_movements(athlete_id);
CREATE INDEX IF NOT EXISTS idx_athlete_movements_tenant ON athlete_movements(tenant_id);
