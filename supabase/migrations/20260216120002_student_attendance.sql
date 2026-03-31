-- Görev 10.1: Yoklama — students tablosu için
-- Mevcut attendance athletes içindir; students için student_attendance

CREATE TABLE IF NOT EXISTS student_attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'katilmadi' CHECK (status IN ('katildi', 'katilmadi', 'bildirimli_iptal')),
  noted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  note TEXT,
  seans_dustu BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_student_attendance_unique ON student_attendance(tenant_id, student_id, date);
CREATE INDEX IF NOT EXISTS idx_student_attendance_tenant ON student_attendance(tenant_id);
CREATE INDEX IF NOT EXISTS idx_student_attendance_student ON student_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_student_attendance_date ON student_attendance(date);

ALTER TABLE student_attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant users manage student_attendance" ON student_attendance;
CREATE POLICY "Tenant users manage student_attendance" ON student_attendance FOR ALL USING (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
) WITH CHECK (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Service can manage student_attendance" ON student_attendance;
CREATE POLICY "Service can manage student_attendance" ON student_attendance FOR ALL USING (true) WITH CHECK (true);
