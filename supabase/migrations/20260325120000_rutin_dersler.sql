-- Rutin dersler: haftalık tekrarlayan program şablonu (tenant_schedule ile uyumlu alanlar)
-- Idempotent: tablo 20260320000000 ile varsa IF NOT EXISTS ile atlanır; eksik kolonlar eklenir.

-- lesson_groups önce (routine_lessons.grup_id referansı için)
CREATE TABLE IF NOT EXISTS lesson_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  grup_adi TEXT NOT NULL,
  yas_araligi TEXT,
  kategori TEXT,
  max_kontenjan INTEGER DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS routine_lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  gun TEXT NOT NULL,
  saat TEXT NOT NULL,
  bitis_saat TEXT,
  ders_adi TEXT NOT NULL,
  brans TEXT,
  seviye TEXT,
  coach_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  kontenjan INTEGER DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Eksik kolonlar (önceki migration'da olanlar; yoksa ekle)
ALTER TABLE routine_lessons ADD COLUMN IF NOT EXISTS oda TEXT;
ALTER TABLE routine_lessons ADD COLUMN IF NOT EXISTS grup_id UUID REFERENCES lesson_groups(id) ON DELETE SET NULL;
ALTER TABLE routine_lessons ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE routine_lessons ADD COLUMN IF NOT EXISTS son_uretim_tarihi DATE;

CREATE TABLE IF NOT EXISTS routine_lesson_students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  routine_lesson_id UUID NOT NULL REFERENCES routine_lessons(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(routine_lesson_id, athlete_id)
);

CREATE INDEX IF NOT EXISTS idx_routine_lessons_tenant ON routine_lessons(tenant_id);
CREATE INDEX IF NOT EXISTS idx_routine_lessons_gun ON routine_lessons(tenant_id, gun);
CREATE INDEX IF NOT EXISTS idx_lesson_groups_tenant ON lesson_groups(tenant_id);
CREATE INDEX IF NOT EXISTS idx_routine_lesson_students_lesson ON routine_lesson_students(routine_lesson_id);

-- UNIQUE(tenant_id, gun, saat) — sadece yoksa ekle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'routine_lessons' AND c.contype = 'u'
  ) THEN
    ALTER TABLE routine_lessons ADD CONSTRAINT routine_lessons_tenant_id_gun_saat_key UNIQUE (tenant_id, gun, saat);
  END IF;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- RLS
ALTER TABLE lesson_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_lesson_students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lesson_groups_tenant" ON lesson_groups;
CREATE POLICY "lesson_groups_tenant" ON lesson_groups FOR ALL USING (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
) WITH CHECK (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
);

DROP POLICY IF EXISTS "routine_lessons_tenant" ON routine_lessons;
CREATE POLICY "routine_lessons_tenant" ON routine_lessons FOR ALL USING (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
) WITH CHECK (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
);

DROP POLICY IF EXISTS "routine_lesson_students_tenant" ON routine_lesson_students;
CREATE POLICY "routine_lesson_students_tenant" ON routine_lesson_students FOR ALL USING (
  routine_lesson_id IN (
    SELECT id FROM routine_lessons WHERE tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
      UNION
      SELECT id FROM tenants WHERE owner_id = auth.uid()
    )
  )
) WITH CHECK (
  routine_lesson_id IN (
    SELECT id FROM routine_lessons WHERE tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
      UNION
      SELECT id FROM tenants WHERE owner_id = auth.uid()
    )
  )
);
