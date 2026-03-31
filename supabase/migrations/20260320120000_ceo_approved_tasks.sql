-- ceo_approved_tasks: Patron tarafından onaylanan görevlerin arşiv tablosu
-- Kaynak: celf-audit-and-ceo-central.sql (manuel SQL) — migration olarak eklendi

CREATE TABLE IF NOT EXISTS ceo_approved_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL,
  task_type TEXT NOT NULL,
  director_key TEXT NOT NULL,
  original_command TEXT NOT NULL,
  final_result JSONB,
  data_used TEXT[] DEFAULT '{}',
  data_changed TEXT[] DEFAULT '{}',
  approved_by UUID,
  approved_at TIMESTAMPTZ DEFAULT NOW(),
  can_become_routine BOOLEAN DEFAULT true,
  became_routine_id UUID
);

CREATE INDEX IF NOT EXISTS idx_ceo_approved_tasks_task_id ON ceo_approved_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_ceo_approved_tasks_approved_at ON ceo_approved_tasks(approved_at DESC);

ALTER TABLE ceo_approved_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service can manage ceo_approved_tasks" ON ceo_approved_tasks;
CREATE POLICY "Service can manage ceo_approved_tasks" ON ceo_approved_tasks
  FOR ALL USING (true) WITH CHECK (true);
