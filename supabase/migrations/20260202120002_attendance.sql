-- Yoklama/Devamsızlık tablosu — AŞAMA 7

CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  lesson_date DATE NOT NULL,
  lesson_time TIME,
  status TEXT DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'excused')),
  notes TEXT,
  marked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_tenant ON attendance(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attendance_athlete ON attendance(athlete_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(lesson_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_unique ON attendance(tenant_id, athlete_id, lesson_date);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant users manage attendance" ON attendance;
CREATE POLICY "Tenant users manage attendance" ON attendance FOR ALL USING (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
) WITH CHECK (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Parent view attendance" ON attendance;
CREATE POLICY "Parent view attendance" ON attendance FOR SELECT USING (
  athlete_id IN (SELECT id FROM athletes WHERE parent_user_id = auth.uid())
);

DROP POLICY IF EXISTS "Service can manage attendance" ON attendance;
CREATE POLICY "Service can manage attendance" ON attendance FOR ALL USING (true) WITH CHECK (true);
