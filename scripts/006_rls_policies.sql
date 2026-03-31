-- ═══════════════════════════════════════════════════════════════════════════════
-- YİSA-S — scripts/006_rls_policies.sql
-- Sprint 2 P0 Görev 2: Kapsamlı RLS Politikaları
--
-- Roller ve Erişim Seviyeleri:
--   patron              → TÜM veriye erişim (cross-tenant)
--   owner/admin/manager  → Kendi tenant'ı (full CRUD)
--   antrenor/trainer     → Kendi branşındaki sporcular + yoklama
--   veli                 → Sadece kendi çocuğunun verisi (SELECT only)
--
-- NOT: service_role key RLS'i tamamen bypass eder.
--      Bu politikalar sadece authenticated client erişimini kontrol eder.
--
-- Tarih: 25 Şubat 2026
-- ═══════════════════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════════════════════
-- BÖLÜM 0: Yardımcı Fonksiyonlar (SECURITY DEFINER — RLS recursion önler)
-- ═══════════════════════════════════════════════════════════════════════════════

-- 0.1 Patron kontrolü
CREATE OR REPLACE FUNCTION public.rls_is_patron()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_tenants WHERE user_id = auth.uid() AND role = 'patron'
  );
$$;

-- 0.2 Veli'nin sporcu ID'leri (parent_user_id eşleşmesi)
CREATE OR REPLACE FUNCTION public.rls_parent_athlete_ids()
RETURNS SETOF UUID
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT id FROM athletes WHERE parent_user_id = auth.uid();
$$;

-- 0.3 Antrenörün görebildiği sporcu ID'leri
--     Aynı branş veya branş atanmamışsa tenant'taki tümü
CREATE OR REPLACE FUNCTION public.rls_trainer_athlete_ids()
RETURNS SETOF UUID
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT a.id
  FROM athletes a
  JOIN staff s ON s.tenant_id = a.tenant_id
  WHERE s.user_id = auth.uid()
    AND s.role = 'trainer'
    AND s.is_active = true
    AND (
      s.branch IS NULL
      OR a.branch IS NULL
      OR a.branch = s.branch
    );
$$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- BÖLÜM 1: TENANTS — Patron tümünü görür, üyeler kendi tenant'larını
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own or assigned tenants" ON tenants;
DROP POLICY IF EXISTS "Service can manage tenants" ON tenants;
DROP POLICY IF EXISTS "rls_tenants_patron" ON tenants;
DROP POLICY IF EXISTS "rls_tenants_member_select" ON tenants;
DROP POLICY IF EXISTS "rls_tenants_owner_manage" ON tenants;

-- Patron: tüm tenant'lar
CREATE POLICY "rls_tenants_patron" ON tenants FOR ALL
  USING (rls_is_patron()) WITH CHECK (rls_is_patron());

-- Üye: kendi tenant'larını görebilir (SELECT)
CREATE POLICY "rls_tenants_member_select" ON tenants FOR SELECT
  USING (
    id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
    OR owner_id = auth.uid()
  );

-- Owner: kendi tenant'ını güncelleyebilir
CREATE POLICY "rls_tenants_owner_manage" ON tenants FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());


-- ═══════════════════════════════════════════════════════════════════════════════
-- BÖLÜM 2: USER_TENANTS — Kullanıcı kendi kayıtlarını görür
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE user_tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own user_tenants" ON user_tenants;
DROP POLICY IF EXISTS "Service can manage user_tenants" ON user_tenants;
DROP POLICY IF EXISTS "rls_user_tenants_patron" ON user_tenants;
DROP POLICY IF EXISTS "rls_user_tenants_own" ON user_tenants;
DROP POLICY IF EXISTS "rls_user_tenants_staff_select" ON user_tenants;

-- Patron: tüm kayıtlar
CREATE POLICY "rls_user_tenants_patron" ON user_tenants FOR ALL
  USING (rls_is_patron()) WITH CHECK (rls_is_patron());

-- Kullanıcı: kendi kayıtları
CREATE POLICY "rls_user_tenants_own" ON user_tenants FOR SELECT
  USING (user_id = auth.uid());

-- Staff: aynı tenant'taki diğer üyeleri görebilir
CREATE POLICY "rls_user_tenants_staff_select" ON user_tenants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_tenants ut
      WHERE ut.user_id = auth.uid()
      AND ut.tenant_id = user_tenants.tenant_id
      AND ut.role NOT IN ('veli', 'pasif')
    )
  );


-- ═══════════════════════════════════════════════════════════════════════════════
-- BÖLÜM 3: ATHLETES — Rol bazlı erişim (en karmaşık tablo)
--
-- patron   → tüm sporcular
-- staff    → kendi tenant'ındaki tüm sporcular (CRUD)
-- antrenör → kendi branşındaki sporcular (SELECT + UPDATE)
-- veli     → sadece kendi çocuğu (SELECT only)
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları temizle
DROP POLICY IF EXISTS "Users see own tenant athletes" ON athletes;
DROP POLICY IF EXISTS "Users manage own tenant athletes" ON athletes;
DROP POLICY IF EXISTS "Service can manage athletes" ON athletes;
DROP POLICY IF EXISTS "athletes_select" ON athletes;
DROP POLICY IF EXISTS "athletes_insert" ON athletes;
DROP POLICY IF EXISTS "athletes_update" ON athletes;
DROP POLICY IF EXISTS "athletes_delete" ON athletes;
DROP POLICY IF EXISTS "rls_athletes_patron" ON athletes;
DROP POLICY IF EXISTS "rls_athletes_parent_select" ON athletes;
DROP POLICY IF EXISTS "rls_athletes_trainer_select" ON athletes;
DROP POLICY IF EXISTS "rls_athletes_trainer_update" ON athletes;
DROP POLICY IF EXISTS "rls_athletes_staff" ON athletes;

-- 3.1 Patron: tüm sporcular (CRUD)
CREATE POLICY "rls_athletes_patron" ON athletes FOR ALL
  USING (rls_is_patron()) WITH CHECK (rls_is_patron());

-- 3.2 Veli: sadece kendi çocuğu (SELECT only)
CREATE POLICY "rls_athletes_parent_select" ON athletes FOR SELECT
  USING (parent_user_id = auth.uid());

-- 3.3 Antrenör: kendi branşındaki sporcular (SELECT)
CREATE POLICY "rls_athletes_trainer_select" ON athletes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_tenants ut
      WHERE ut.user_id = auth.uid()
      AND ut.tenant_id = athletes.tenant_id
      AND ut.role IN ('antrenor', 'trainer')
    )
    AND id IN (SELECT rls_trainer_athlete_ids())
  );

-- 3.4 Antrenör: kendi branşındaki sporcuları güncelleyebilir
CREATE POLICY "rls_athletes_trainer_update" ON athletes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_tenants ut
      WHERE ut.user_id = auth.uid()
      AND ut.tenant_id = athletes.tenant_id
      AND ut.role IN ('antrenor', 'trainer')
    )
    AND id IN (SELECT rls_trainer_athlete_ids())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_tenants ut
      WHERE ut.user_id = auth.uid()
      AND ut.tenant_id = athletes.tenant_id
      AND ut.role IN ('antrenor', 'trainer')
    )
    AND id IN (SELECT rls_trainer_athlete_ids())
  );

-- 3.5 Staff (admin, owner, manager vb): tenant'taki tüm sporcular (CRUD)
CREATE POLICY "rls_athletes_staff" ON athletes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_tenants ut
      WHERE ut.user_id = auth.uid()
      AND ut.tenant_id = athletes.tenant_id
      AND ut.role NOT IN ('veli', 'antrenor', 'trainer', 'pasif')
    )
    OR EXISTS (
      SELECT 1 FROM tenants t WHERE t.id = athletes.tenant_id AND t.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_tenants ut
      WHERE ut.user_id = auth.uid()
      AND ut.tenant_id = athletes.tenant_id
      AND ut.role NOT IN ('veli', 'antrenor', 'trainer', 'pasif')
    )
    OR EXISTS (
      SELECT 1 FROM tenants t WHERE t.id = athletes.tenant_id AND t.owner_id = auth.uid()
    )
  );


-- ═══════════════════════════════════════════════════════════════════════════════
-- BÖLÜM 4: ATTENDANCE — Yoklama
--
-- patron   → tümü
-- staff    → tenant CRUD
-- antrenör → kendi branşının yoklaması (CRUD)
-- veli     → kendi çocuğunun yoklaması (SELECT only)
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant users manage attendance" ON attendance;
DROP POLICY IF EXISTS "Parent view attendance" ON attendance;
DROP POLICY IF EXISTS "Service can manage attendance" ON attendance;
DROP POLICY IF EXISTS "attendance_select" ON attendance;
DROP POLICY IF EXISTS "attendance_insert" ON attendance;
DROP POLICY IF EXISTS "attendance_update" ON attendance;
DROP POLICY IF EXISTS "attendance_delete" ON attendance;
DROP POLICY IF EXISTS "rls_attendance_patron" ON attendance;
DROP POLICY IF EXISTS "rls_attendance_parent_select" ON attendance;
DROP POLICY IF EXISTS "rls_attendance_trainer" ON attendance;
DROP POLICY IF EXISTS "rls_attendance_staff" ON attendance;

-- 4.1 Patron
CREATE POLICY "rls_attendance_patron" ON attendance FOR ALL
  USING (rls_is_patron()) WITH CHECK (rls_is_patron());

-- 4.2 Veli: kendi çocuğunun yoklaması (SELECT)
CREATE POLICY "rls_attendance_parent_select" ON attendance FOR SELECT
  USING (athlete_id IN (SELECT rls_parent_athlete_ids()));

-- 4.3 Antrenör: kendi branşının yoklaması (CRUD)
CREATE POLICY "rls_attendance_trainer" ON attendance FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_tenants ut
      WHERE ut.user_id = auth.uid()
      AND ut.tenant_id = attendance.tenant_id
      AND ut.role IN ('antrenor', 'trainer')
    )
    AND athlete_id IN (SELECT rls_trainer_athlete_ids())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_tenants ut
      WHERE ut.user_id = auth.uid()
      AND ut.tenant_id = attendance.tenant_id
      AND ut.role IN ('antrenor', 'trainer')
    )
    AND athlete_id IN (SELECT rls_trainer_athlete_ids())
  );

-- 4.4 Staff: tenant CRUD
CREATE POLICY "rls_attendance_staff" ON attendance FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_tenants ut
      WHERE ut.user_id = auth.uid()
      AND ut.tenant_id = attendance.tenant_id
      AND ut.role NOT IN ('veli', 'antrenor', 'trainer', 'pasif')
    )
    OR EXISTS (
      SELECT 1 FROM tenants t WHERE t.id = attendance.tenant_id AND t.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_tenants ut
      WHERE ut.user_id = auth.uid()
      AND ut.tenant_id = attendance.tenant_id
      AND ut.role NOT IN ('veli', 'antrenor', 'trainer', 'pasif')
    )
    OR EXISTS (
      SELECT 1 FROM tenants t WHERE t.id = attendance.tenant_id AND t.owner_id = auth.uid()
    )
  );


-- ═══════════════════════════════════════════════════════════════════════════════
-- BÖLÜM 5: PAYMENTS — Aidat/Ödeme
--
-- patron   → tümü
-- staff    → tenant CRUD
-- veli     → kendi çocuğunun ödemeleri (SELECT only)
-- antrenör → erişim yok
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant users manage payments" ON payments;
DROP POLICY IF EXISTS "Parent view payments" ON payments;
DROP POLICY IF EXISTS "Service can manage payments" ON payments;
DROP POLICY IF EXISTS "payments_select" ON payments;
DROP POLICY IF EXISTS "payments_insert" ON payments;
DROP POLICY IF EXISTS "payments_update" ON payments;
DROP POLICY IF EXISTS "payments_delete" ON payments;
DROP POLICY IF EXISTS "rls_payments_patron" ON payments;
DROP POLICY IF EXISTS "rls_payments_parent_select" ON payments;
DROP POLICY IF EXISTS "rls_payments_staff" ON payments;

-- 5.1 Patron
CREATE POLICY "rls_payments_patron" ON payments FOR ALL
  USING (rls_is_patron()) WITH CHECK (rls_is_patron());

-- 5.2 Veli: kendi çocuğunun ödemeleri (SELECT)
CREATE POLICY "rls_payments_parent_select" ON payments FOR SELECT
  USING (athlete_id IN (SELECT rls_parent_athlete_ids()));

-- 5.3 Staff: tenant CRUD
CREATE POLICY "rls_payments_staff" ON payments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_tenants ut
      WHERE ut.user_id = auth.uid()
      AND ut.tenant_id = payments.tenant_id
      AND ut.role NOT IN ('veli', 'antrenor', 'trainer', 'pasif')
    )
    OR EXISTS (
      SELECT 1 FROM tenants t WHERE t.id = payments.tenant_id AND t.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_tenants ut
      WHERE ut.user_id = auth.uid()
      AND ut.tenant_id = payments.tenant_id
      AND ut.role NOT IN ('veli', 'antrenor', 'trainer', 'pasif')
    )
    OR EXISTS (
      SELECT 1 FROM tenants t WHERE t.id = payments.tenant_id AND t.owner_id = auth.uid()
    )
  );


-- ═══════════════════════════════════════════════════════════════════════════════
-- BÖLÜM 6: STAFF — Personel
--
-- patron   → tümü
-- staff    → tenant CRUD
-- antrenör/veli → kendi tenant'ındaki personeli görebilir (SELECT)
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own tenant staff" ON staff;
DROP POLICY IF EXISTS "Users manage own tenant staff" ON staff;
DROP POLICY IF EXISTS "Service can manage staff" ON staff;
DROP POLICY IF EXISTS "rls_staff_patron" ON staff;
DROP POLICY IF EXISTS "rls_staff_member_select" ON staff;
DROP POLICY IF EXISTS "rls_staff_admin_manage" ON staff;

-- 6.1 Patron
CREATE POLICY "rls_staff_patron" ON staff FOR ALL
  USING (rls_is_patron()) WITH CHECK (rls_is_patron());

-- 6.2 Tenant üyesi: personel listesini görebilir (SELECT)
CREATE POLICY "rls_staff_member_select" ON staff FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_tenants ut
      WHERE ut.user_id = auth.uid()
      AND ut.tenant_id = staff.tenant_id
    )
    OR EXISTS (
      SELECT 1 FROM tenants t WHERE t.id = staff.tenant_id AND t.owner_id = auth.uid()
    )
  );

-- 6.3 Admin/Manager: personel CRUD
CREATE POLICY "rls_staff_admin_manage" ON staff FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_tenants ut
      WHERE ut.user_id = auth.uid()
      AND ut.tenant_id = staff.tenant_id
      AND ut.role IN ('owner', 'admin', 'manager', 'tesis_muduru', 'sportif_direktor')
    )
    OR EXISTS (
      SELECT 1 FROM tenants t WHERE t.id = staff.tenant_id AND t.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_tenants ut
      WHERE ut.user_id = auth.uid()
      AND ut.tenant_id = staff.tenant_id
      AND ut.role IN ('owner', 'admin', 'manager', 'tesis_muduru', 'sportif_direktor')
    )
    OR EXISTS (
      SELECT 1 FROM tenants t WHERE t.id = staff.tenant_id AND t.owner_id = auth.uid()
    )
  );


-- ═══════════════════════════════════════════════════════════════════════════════
-- BÖLÜM 7: STUDENTS — Öğrenci
--
-- patron   → tümü
-- staff    → tenant CRUD
-- antrenör → SELECT
-- veli     → erişim yok (veli athletes tablosundan takip eder)
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='students') THEN
  ALTER TABLE students ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Users see own tenant students" ON students;
  DROP POLICY IF EXISTS "Users manage own tenant students" ON students;
  DROP POLICY IF EXISTS "Service can manage students" ON students;
  DROP POLICY IF EXISTS "rls_students_patron" ON students;
  DROP POLICY IF EXISTS "rls_students_trainer_select" ON students;
  DROP POLICY IF EXISTS "rls_students_staff" ON students;

  CREATE POLICY "rls_students_patron" ON students FOR ALL
    USING (rls_is_patron()) WITH CHECK (rls_is_patron());

  CREATE POLICY "rls_students_trainer_select" ON students FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM user_tenants ut
        WHERE ut.user_id = auth.uid()
        AND ut.tenant_id = students.tenant_id
        AND ut.role IN ('antrenor', 'trainer')
      )
    );

  CREATE POLICY "rls_students_staff" ON students FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM user_tenants ut
        WHERE ut.user_id = auth.uid()
        AND ut.tenant_id = students.tenant_id
        AND ut.role NOT IN ('veli', 'antrenor', 'trainer', 'pasif')
      )
      OR EXISTS (
        SELECT 1 FROM tenants t WHERE t.id = students.tenant_id AND t.owner_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM user_tenants ut
        WHERE ut.user_id = auth.uid()
        AND ut.tenant_id = students.tenant_id
        AND ut.role NOT IN ('veli', 'antrenor', 'trainer', 'pasif')
      )
      OR EXISTS (
        SELECT 1 FROM tenants t WHERE t.id = students.tenant_id AND t.owner_id = auth.uid()
      )
    );
END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- BÖLÜM 8: STUDENT_ATTENDANCE — Öğrenci yoklama
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='student_attendance') THEN
  ALTER TABLE student_attendance ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Tenant users manage student_attendance" ON student_attendance;
  DROP POLICY IF EXISTS "Service can manage student_attendance" ON student_attendance;
  DROP POLICY IF EXISTS "rls_student_attendance_patron" ON student_attendance;
  DROP POLICY IF EXISTS "rls_student_attendance_trainer" ON student_attendance;
  DROP POLICY IF EXISTS "rls_student_attendance_staff" ON student_attendance;

  CREATE POLICY "rls_student_attendance_patron" ON student_attendance FOR ALL
    USING (rls_is_patron()) WITH CHECK (rls_is_patron());

  CREATE POLICY "rls_student_attendance_trainer" ON student_attendance FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM user_tenants ut
        WHERE ut.user_id = auth.uid()
        AND ut.tenant_id = student_attendance.tenant_id
        AND ut.role IN ('antrenor', 'trainer')
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM user_tenants ut
        WHERE ut.user_id = auth.uid()
        AND ut.tenant_id = student_attendance.tenant_id
        AND ut.role IN ('antrenor', 'trainer')
      )
    );

  CREATE POLICY "rls_student_attendance_staff" ON student_attendance FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM user_tenants ut
        WHERE ut.user_id = auth.uid()
        AND ut.tenant_id = student_attendance.tenant_id
        AND ut.role NOT IN ('veli', 'antrenor', 'trainer', 'pasif')
      )
      OR EXISTS (
        SELECT 1 FROM tenants t WHERE t.id = student_attendance.tenant_id AND t.owner_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM user_tenants ut
        WHERE ut.user_id = auth.uid()
        AND ut.tenant_id = student_attendance.tenant_id
        AND ut.role NOT IN ('veli', 'antrenor', 'trainer', 'pasif')
      )
      OR EXISTS (
        SELECT 1 FROM tenants t WHERE t.id = student_attendance.tenant_id AND t.owner_id = auth.uid()
      )
    );
END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- BÖLÜM 9: SEANS_PACKAGES, STUDENT_PACKAGES, PACKAGE_PAYMENTS
-- Staff CRUD, antrenör SELECT, veli kendi çocuğunun ödemeleri
-- ═══════════════════════════════════════════════════════════════════════════════

-- 9.1 seans_packages
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='seans_packages') THEN
  ALTER TABLE seans_packages ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Tenant users manage seans_packages" ON seans_packages;
  DROP POLICY IF EXISTS "Service can manage seans_packages" ON seans_packages;
  DROP POLICY IF EXISTS "rls_seans_packages_patron" ON seans_packages;
  DROP POLICY IF EXISTS "rls_seans_packages_member_select" ON seans_packages;
  DROP POLICY IF EXISTS "rls_seans_packages_staff" ON seans_packages;

  CREATE POLICY "rls_seans_packages_patron" ON seans_packages FOR ALL
    USING (rls_is_patron()) WITH CHECK (rls_is_patron());

  -- Tüm tenant üyeleri paket listesini görebilir
  CREATE POLICY "rls_seans_packages_member_select" ON seans_packages FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM user_tenants ut
        WHERE ut.user_id = auth.uid()
        AND ut.tenant_id = seans_packages.tenant_id
      )
      OR EXISTS (
        SELECT 1 FROM tenants t WHERE t.id = seans_packages.tenant_id AND t.owner_id = auth.uid()
      )
    );

  CREATE POLICY "rls_seans_packages_staff" ON seans_packages FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM user_tenants ut
        WHERE ut.user_id = auth.uid()
        AND ut.tenant_id = seans_packages.tenant_id
        AND ut.role NOT IN ('veli', 'antrenor', 'trainer', 'pasif')
      )
      OR EXISTS (
        SELECT 1 FROM tenants t WHERE t.id = seans_packages.tenant_id AND t.owner_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM user_tenants ut
        WHERE ut.user_id = auth.uid()
        AND ut.tenant_id = seans_packages.tenant_id
        AND ut.role NOT IN ('veli', 'antrenor', 'trainer', 'pasif')
      )
      OR EXISTS (
        SELECT 1 FROM tenants t WHERE t.id = seans_packages.tenant_id AND t.owner_id = auth.uid()
      )
    );
END IF;
END $$;

-- 9.2 student_packages
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='student_packages') THEN
  ALTER TABLE student_packages ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Tenant users manage student_packages" ON student_packages;
  DROP POLICY IF EXISTS "Service can manage student_packages" ON student_packages;
  DROP POLICY IF EXISTS "rls_student_packages_patron" ON student_packages;
  DROP POLICY IF EXISTS "rls_student_packages_parent_select" ON student_packages;
  DROP POLICY IF EXISTS "rls_student_packages_staff" ON student_packages;

  CREATE POLICY "rls_student_packages_patron" ON student_packages FOR ALL
    USING (rls_is_patron()) WITH CHECK (rls_is_patron());

  -- Veli: kendi çocuğunun paket bilgileri
  CREATE POLICY "rls_student_packages_parent_select" ON student_packages FOR SELECT
    USING (
      athlete_id IN (SELECT rls_parent_athlete_ids())
    );

  CREATE POLICY "rls_student_packages_staff" ON student_packages FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM user_tenants ut
        WHERE ut.user_id = auth.uid()
        AND ut.tenant_id = student_packages.tenant_id
        AND ut.role NOT IN ('veli', 'pasif')
      )
      OR EXISTS (
        SELECT 1 FROM tenants t WHERE t.id = student_packages.tenant_id AND t.owner_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM user_tenants ut
        WHERE ut.user_id = auth.uid()
        AND ut.tenant_id = student_packages.tenant_id
        AND ut.role NOT IN ('veli', 'pasif')
      )
      OR EXISTS (
        SELECT 1 FROM tenants t WHERE t.id = student_packages.tenant_id AND t.owner_id = auth.uid()
      )
    );
END IF;
END $$;

-- 9.3 package_payments
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='package_payments') THEN
  ALTER TABLE package_payments ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Tenant users manage package_payments" ON package_payments;
  DROP POLICY IF EXISTS "Service can manage package_payments" ON package_payments;
  DROP POLICY IF EXISTS "rls_package_payments_patron" ON package_payments;
  DROP POLICY IF EXISTS "rls_package_payments_parent_select" ON package_payments;
  DROP POLICY IF EXISTS "rls_package_payments_staff" ON package_payments;

  CREATE POLICY "rls_package_payments_patron" ON package_payments FOR ALL
    USING (rls_is_patron()) WITH CHECK (rls_is_patron());

  -- Veli: kendi çocuğunun ödeme bilgileri
  CREATE POLICY "rls_package_payments_parent_select" ON package_payments FOR SELECT
    USING (
      athlete_id IN (SELECT rls_parent_athlete_ids())
    );

  CREATE POLICY "rls_package_payments_staff" ON package_payments FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM user_tenants ut
        WHERE ut.user_id = auth.uid()
        AND ut.tenant_id = package_payments.tenant_id
        AND ut.role NOT IN ('veli', 'pasif')
      )
      OR EXISTS (
        SELECT 1 FROM tenants t WHERE t.id = package_payments.tenant_id AND t.owner_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM user_tenants ut
        WHERE ut.user_id = auth.uid()
        AND ut.tenant_id = package_payments.tenant_id
        AND ut.role NOT IN ('veli', 'pasif')
      )
      OR EXISTS (
        SELECT 1 FROM tenants t WHERE t.id = package_payments.tenant_id AND t.owner_id = auth.uid()
      )
    );
END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- BÖLÜM 10: CASH_REGISTER — Kasa defteri (sadece staff)
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='cash_register') THEN
  ALTER TABLE cash_register ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Tenant users manage cash_register" ON cash_register;
  DROP POLICY IF EXISTS "cash_register_select" ON cash_register;
  DROP POLICY IF EXISTS "cash_register_insert" ON cash_register;
  DROP POLICY IF EXISTS "cash_register_update" ON cash_register;
  DROP POLICY IF EXISTS "cash_register_delete" ON cash_register;
  DROP POLICY IF EXISTS "Service can manage cash_register" ON cash_register;
  DROP POLICY IF EXISTS "rls_cash_register_patron" ON cash_register;
  DROP POLICY IF EXISTS "rls_cash_register_staff" ON cash_register;

  CREATE POLICY "rls_cash_register_patron" ON cash_register FOR ALL
    USING (rls_is_patron()) WITH CHECK (rls_is_patron());

  CREATE POLICY "rls_cash_register_staff" ON cash_register FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM user_tenants ut
        WHERE ut.user_id = auth.uid()
        AND ut.tenant_id = cash_register.tenant_id
        AND ut.role NOT IN ('veli', 'antrenor', 'trainer', 'pasif')
      )
      OR EXISTS (
        SELECT 1 FROM tenants t WHERE t.id = cash_register.tenant_id AND t.owner_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM user_tenants ut
        WHERE ut.user_id = auth.uid()
        AND ut.tenant_id = cash_register.tenant_id
        AND ut.role NOT IN ('veli', 'antrenor', 'trainer', 'pasif')
      )
      OR EXISTS (
        SELECT 1 FROM tenants t WHERE t.id = cash_register.tenant_id AND t.owner_id = auth.uid()
      )
    );
END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- BÖLÜM 11: TENANT_SCHEDULE — Ders programı
-- Tüm tenant üyeleri görebilir, staff yazabilir
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='tenant_schedule') THEN
  ALTER TABLE tenant_schedule ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "rls_tenant_schedule_patron" ON tenant_schedule;
  DROP POLICY IF EXISTS "rls_tenant_schedule_member_select" ON tenant_schedule;
  DROP POLICY IF EXISTS "rls_tenant_schedule_staff" ON tenant_schedule;

  CREATE POLICY "rls_tenant_schedule_patron" ON tenant_schedule FOR ALL
    USING (rls_is_patron()) WITH CHECK (rls_is_patron());

  -- Tüm tenant üyeleri ders programını görebilir (veli dahil)
  CREATE POLICY "rls_tenant_schedule_member_select" ON tenant_schedule FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM user_tenants ut
        WHERE ut.user_id = auth.uid()
        AND ut.tenant_id = tenant_schedule.tenant_id
      )
      OR EXISTS (
        SELECT 1 FROM tenants t WHERE t.id = tenant_schedule.tenant_id AND t.owner_id = auth.uid()
      )
    );

  -- Staff: CRUD
  CREATE POLICY "rls_tenant_schedule_staff" ON tenant_schedule FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM user_tenants ut
        WHERE ut.user_id = auth.uid()
        AND ut.tenant_id = tenant_schedule.tenant_id
        AND ut.role NOT IN ('veli', 'pasif')
      )
      OR EXISTS (
        SELECT 1 FROM tenants t WHERE t.id = tenant_schedule.tenant_id AND t.owner_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM user_tenants ut
        WHERE ut.user_id = auth.uid()
        AND ut.tenant_id = tenant_schedule.tenant_id
        AND ut.role NOT IN ('veli', 'pasif')
      )
      OR EXISTS (
        SELECT 1 FROM tenants t WHERE t.id = tenant_schedule.tenant_id AND t.owner_id = auth.uid()
      )
    );
END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- BÖLÜM 12: TENANT_ANNOUNCEMENTS + TENANT_SURVEYS
-- Tüm tenant üyeleri görebilir, staff yazabilir
-- ═══════════════════════════════════════════════════════════════════════════════

-- 12.1 tenant_announcements
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='tenant_announcements') THEN
  ALTER TABLE tenant_announcements ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Tenant announcements" ON tenant_announcements;
  DROP POLICY IF EXISTS "rls_tenant_announcements_patron" ON tenant_announcements;
  DROP POLICY IF EXISTS "rls_tenant_announcements_member_select" ON tenant_announcements;
  DROP POLICY IF EXISTS "rls_tenant_announcements_staff" ON tenant_announcements;

  CREATE POLICY "rls_tenant_announcements_patron" ON tenant_announcements FOR ALL
    USING (rls_is_patron()) WITH CHECK (rls_is_patron());

  CREATE POLICY "rls_tenant_announcements_member_select" ON tenant_announcements FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM user_tenants ut
        WHERE ut.user_id = auth.uid()
        AND ut.tenant_id = tenant_announcements.tenant_id
      )
      OR EXISTS (
        SELECT 1 FROM tenants t WHERE t.id = tenant_announcements.tenant_id AND t.owner_id = auth.uid()
      )
    );

  CREATE POLICY "rls_tenant_announcements_staff" ON tenant_announcements FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM user_tenants ut
        WHERE ut.user_id = auth.uid()
        AND ut.tenant_id = tenant_announcements.tenant_id
        AND ut.role NOT IN ('veli', 'pasif')
      )
      OR EXISTS (
        SELECT 1 FROM tenants t WHERE t.id = tenant_announcements.tenant_id AND t.owner_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM user_tenants ut
        WHERE ut.user_id = auth.uid()
        AND ut.tenant_id = tenant_announcements.tenant_id
        AND ut.role NOT IN ('veli', 'pasif')
      )
      OR EXISTS (
        SELECT 1 FROM tenants t WHERE t.id = tenant_announcements.tenant_id AND t.owner_id = auth.uid()
      )
    );
END IF;
END $$;

-- 12.2 tenant_surveys
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='tenant_surveys') THEN
  ALTER TABLE tenant_surveys ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Tenant surveys" ON tenant_surveys;
  DROP POLICY IF EXISTS "rls_tenant_surveys_patron" ON tenant_surveys;
  DROP POLICY IF EXISTS "rls_tenant_surveys_member_select" ON tenant_surveys;
  DROP POLICY IF EXISTS "rls_tenant_surveys_staff" ON tenant_surveys;

  CREATE POLICY "rls_tenant_surveys_patron" ON tenant_surveys FOR ALL
    USING (rls_is_patron()) WITH CHECK (rls_is_patron());

  CREATE POLICY "rls_tenant_surveys_member_select" ON tenant_surveys FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM user_tenants ut
        WHERE ut.user_id = auth.uid()
        AND ut.tenant_id = tenant_surveys.tenant_id
      )
      OR EXISTS (
        SELECT 1 FROM tenants t WHERE t.id = tenant_surveys.tenant_id AND t.owner_id = auth.uid()
      )
    );

  CREATE POLICY "rls_tenant_surveys_staff" ON tenant_surveys FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM user_tenants ut
        WHERE ut.user_id = auth.uid()
        AND ut.tenant_id = tenant_surveys.tenant_id
        AND ut.role NOT IN ('veli', 'pasif')
      )
      OR EXISTS (
        SELECT 1 FROM tenants t WHERE t.id = tenant_surveys.tenant_id AND t.owner_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM user_tenants ut
        WHERE ut.user_id = auth.uid()
        AND ut.tenant_id = tenant_surveys.tenant_id
        AND ut.role NOT IN ('veli', 'pasif')
      )
      OR EXISTS (
        SELECT 1 FROM tenants t WHERE t.id = tenant_surveys.tenant_id AND t.owner_id = auth.uid()
      )
    );
END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- BÖLÜM 13: ATHLETE_MEASUREMENTS — Gelişim ölçümü
-- Veli kendi çocuğunu, antrenör kendi branşını, staff tüm tenant'ı
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='athlete_measurements') THEN
  ALTER TABLE athlete_measurements ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "athlete_measurements_select" ON athlete_measurements;
  DROP POLICY IF EXISTS "athlete_measurements_insert" ON athlete_measurements;
  DROP POLICY IF EXISTS "Service can manage athlete_measurements" ON athlete_measurements;
  DROP POLICY IF EXISTS "rls_athlete_measurements_patron" ON athlete_measurements;
  DROP POLICY IF EXISTS "rls_athlete_measurements_parent_select" ON athlete_measurements;
  DROP POLICY IF EXISTS "rls_athlete_measurements_trainer" ON athlete_measurements;
  DROP POLICY IF EXISTS "rls_athlete_measurements_staff" ON athlete_measurements;

  CREATE POLICY "rls_athlete_measurements_patron" ON athlete_measurements FOR ALL
    USING (rls_is_patron()) WITH CHECK (rls_is_patron());

  CREATE POLICY "rls_athlete_measurements_parent_select" ON athlete_measurements FOR SELECT
    USING (athlete_id IN (SELECT rls_parent_athlete_ids()));

  -- Antrenör: kendi branşının ölçümlerini görebilir ve ekleyebilir
  CREATE POLICY "rls_athlete_measurements_trainer" ON athlete_measurements FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM user_tenants ut
        WHERE ut.user_id = auth.uid()
        AND ut.tenant_id = athlete_measurements.tenant_id
        AND ut.role IN ('antrenor', 'trainer')
      )
      AND athlete_id IN (SELECT rls_trainer_athlete_ids())
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM user_tenants ut
        WHERE ut.user_id = auth.uid()
        AND ut.tenant_id = athlete_measurements.tenant_id
        AND ut.role IN ('antrenor', 'trainer')
      )
      AND athlete_id IN (SELECT rls_trainer_athlete_ids())
    );

  CREATE POLICY "rls_athlete_measurements_staff" ON athlete_measurements FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM user_tenants ut
        WHERE ut.user_id = auth.uid()
        AND ut.tenant_id = athlete_measurements.tenant_id
        AND ut.role NOT IN ('veli', 'antrenor', 'trainer', 'pasif')
      )
      OR EXISTS (
        SELECT 1 FROM tenants t WHERE t.id = athlete_measurements.tenant_id AND t.owner_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM user_tenants ut
        WHERE ut.user_id = auth.uid()
        AND ut.tenant_id = athlete_measurements.tenant_id
        AND ut.role NOT IN ('veli', 'antrenor', 'trainer', 'pasif')
      )
      OR EXISTS (
        SELECT 1 FROM tenants t WHERE t.id = athlete_measurements.tenant_id AND t.owner_id = auth.uid()
      )
    );
END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- BÖLÜM 14: ATHLETE_HEALTH_RECORDS — Sağlık geçmişi
-- tenant_id yok; athlete_id üzerinden erişim
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='athlete_health_records') THEN
  ALTER TABLE athlete_health_records ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "rls_athlete_health_patron" ON athlete_health_records;
  DROP POLICY IF EXISTS "rls_athlete_health_parent_select" ON athlete_health_records;
  DROP POLICY IF EXISTS "rls_athlete_health_trainer_select" ON athlete_health_records;
  DROP POLICY IF EXISTS "rls_athlete_health_staff" ON athlete_health_records;

  -- Patron: tümü
  CREATE POLICY "rls_athlete_health_patron" ON athlete_health_records FOR ALL
    USING (rls_is_patron()) WITH CHECK (rls_is_patron());

  -- Veli: kendi çocuğunun sağlık kaydı
  CREATE POLICY "rls_athlete_health_parent_select" ON athlete_health_records FOR SELECT
    USING (athlete_id IN (SELECT rls_parent_athlete_ids()));

  -- Antrenör: kendi branşındaki sporcuların sağlık kaydı (SELECT only)
  CREATE POLICY "rls_athlete_health_trainer_select" ON athlete_health_records FOR SELECT
    USING (athlete_id IN (SELECT rls_trainer_athlete_ids()));

  -- Staff: athlete'in tenant'ına erişimi olan herkes
  CREATE POLICY "rls_athlete_health_staff" ON athlete_health_records FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM athletes a
        JOIN user_tenants ut ON ut.tenant_id = a.tenant_id
        WHERE a.id = athlete_health_records.athlete_id
        AND ut.user_id = auth.uid()
        AND ut.role NOT IN ('veli', 'antrenor', 'trainer', 'pasif')
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM athletes a
        JOIN user_tenants ut ON ut.tenant_id = a.tenant_id
        WHERE a.id = athlete_health_records.athlete_id
        AND ut.user_id = auth.uid()
        AND ut.role NOT IN ('veli', 'antrenor', 'trainer', 'pasif')
      )
    );
END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- BÖLÜM 15: TENANT_PURCHASES — Satın alımlar
-- Patron: tümü, tenant üyesi: kendi tenant'ının (SELECT only)
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='tenant_purchases') THEN
  ALTER TABLE tenant_purchases ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "tenant_purchases_select_own" ON tenant_purchases;
  DROP POLICY IF EXISTS "tenant_purchases_deny_write" ON tenant_purchases;
  DROP POLICY IF EXISTS "tenant_purchases_deny_update" ON tenant_purchases;
  DROP POLICY IF EXISTS "tenant_purchases_deny_delete" ON tenant_purchases;
  DROP POLICY IF EXISTS "tenant_purchases_deny_all" ON tenant_purchases;
  DROP POLICY IF EXISTS "rls_tenant_purchases_patron" ON tenant_purchases;
  DROP POLICY IF EXISTS "rls_tenant_purchases_member_select" ON tenant_purchases;

  CREATE POLICY "rls_tenant_purchases_patron" ON tenant_purchases FOR ALL
    USING (rls_is_patron()) WITH CHECK (rls_is_patron());

  CREATE POLICY "rls_tenant_purchases_member_select" ON tenant_purchases FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM user_tenants ut
        WHERE ut.user_id = auth.uid()
        AND ut.tenant_id = tenant_purchases.tenant_id
      )
      OR EXISTS (
        SELECT 1 FROM tenants t WHERE t.id = tenant_purchases.tenant_id AND t.owner_id = auth.uid()
      )
    );
END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- BÖLÜM 16: TENANT_TEMPLATES — Şablon kullanımı (sadece patron + backend)
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='tenant_templates') THEN
  ALTER TABLE tenant_templates ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Service can manage tenant_templates" ON tenant_templates;
  DROP POLICY IF EXISTS "rls_tenant_templates_patron" ON tenant_templates;
  DROP POLICY IF EXISTS "rls_tenant_templates_member_select" ON tenant_templates;

  CREATE POLICY "rls_tenant_templates_patron" ON tenant_templates FOR ALL
    USING (rls_is_patron()) WITH CHECK (rls_is_patron());

  CREATE POLICY "rls_tenant_templates_member_select" ON tenant_templates FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM user_tenants ut
        WHERE ut.user_id = auth.uid()
        AND ut.tenant_id = tenant_templates.tenant_id
      )
    );
END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- BÖLÜM 17: FRANCHISE_SUBDOMAINS — Subdomain yönetimi
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='franchise_subdomains') THEN
  ALTER TABLE franchise_subdomains ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "rls_franchise_subdomains_patron" ON franchise_subdomains;
  DROP POLICY IF EXISTS "rls_franchise_subdomains_public_select" ON franchise_subdomains;

  -- Patron: full CRUD
  CREATE POLICY "rls_franchise_subdomains_patron" ON franchise_subdomains FOR ALL
    USING (rls_is_patron()) WITH CHECK (rls_is_patron());

  -- Authenticated: subdomain listesi gerekli (middleware routing için)
  -- subdomain ve franchise_name alanları hassas değil
  CREATE POLICY "rls_franchise_subdomains_public_select" ON franchise_subdomains FOR SELECT
    USING (auth.role() = 'authenticated');
END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- BÖLÜM 18: FRANCHISES — İşletme bilgileri
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='franchises') THEN
  ALTER TABLE franchises ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "rls_franchises_patron" ON franchises;
  DROP POLICY IF EXISTS "rls_franchises_member_select" ON franchises;
  DROP POLICY IF EXISTS "rls_franchises_staff" ON franchises;

  CREATE POLICY "rls_franchises_patron" ON franchises FOR ALL
    USING (rls_is_patron()) WITH CHECK (rls_is_patron());

  -- Tenant üyeleri franchise bilgilerini görebilir
  CREATE POLICY "rls_franchises_member_select" ON franchises FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM user_tenants ut
        WHERE ut.user_id = auth.uid()
        AND ut.tenant_id = franchises.tenant_id
      )
      OR EXISTS (
        SELECT 1 FROM tenants t WHERE t.id = franchises.tenant_id AND t.owner_id = auth.uid()
      )
    );

  -- Staff: franchise bilgilerini düzenleyebilir
  CREATE POLICY "rls_franchises_staff" ON franchises FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM user_tenants ut
        WHERE ut.user_id = auth.uid()
        AND ut.tenant_id = franchises.tenant_id
        AND ut.role NOT IN ('veli', 'antrenor', 'trainer', 'pasif')
      )
      OR EXISTS (
        SELECT 1 FROM tenants t WHERE t.id = franchises.tenant_id AND t.owner_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM user_tenants ut
        WHERE ut.user_id = auth.uid()
        AND ut.tenant_id = franchises.tenant_id
        AND ut.role NOT IN ('veli', 'antrenor', 'trainer', 'pasif')
      )
      OR EXISTS (
        SELECT 1 FROM tenants t WHERE t.id = franchises.tenant_id AND t.owner_id = auth.uid()
      )
    );
END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- BÖLÜM 19: SOZLESME_ONAYLARI — Kendi onayları
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='sozlesme_onaylari') THEN
  ALTER TABLE sozlesme_onaylari ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Kendi onaylarini gorebilir" ON sozlesme_onaylari;
  DROP POLICY IF EXISTS "Kendi onayini verebilir" ON sozlesme_onaylari;
  DROP POLICY IF EXISTS "Service can manage sozlesme_onaylari" ON sozlesme_onaylari;
  DROP POLICY IF EXISTS "rls_sozlesme_patron" ON sozlesme_onaylari;
  DROP POLICY IF EXISTS "rls_sozlesme_own_select" ON sozlesme_onaylari;
  DROP POLICY IF EXISTS "rls_sozlesme_own_insert" ON sozlesme_onaylari;

  CREATE POLICY "rls_sozlesme_patron" ON sozlesme_onaylari FOR ALL
    USING (rls_is_patron()) WITH CHECK (rls_is_patron());

  CREATE POLICY "rls_sozlesme_own_select" ON sozlesme_onaylari FOR SELECT
    USING (user_id = auth.uid());

  CREATE POLICY "rls_sozlesme_own_insert" ON sozlesme_onaylari FOR INSERT
    WITH CHECK (user_id = auth.uid());
END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- BÖLÜM 20: CELF_KASA — Merkez kasa (patron + backend only)
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='celf_kasa') THEN
  ALTER TABLE celf_kasa ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "celf_kasa_deny_client" ON celf_kasa;
  DROP POLICY IF EXISTS "rls_celf_kasa_patron" ON celf_kasa;
  DROP POLICY IF EXISTS "rls_celf_kasa_deny" ON celf_kasa;

  -- Patron: görebilir (SELECT)
  CREATE POLICY "rls_celf_kasa_patron" ON celf_kasa FOR ALL
    USING (rls_is_patron()) WITH CHECK (rls_is_patron());

  -- Diğer herkes: erişim yok (backend service_role kullanır)
  -- NOT: Bu policy olmasa da RLS enabled iken default deny geçerli
END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- BÖLÜM 21: DEMO_REQUESTS — Demo talepleri
-- Anon INSERT, patron SELECT
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='demo_requests') THEN
  ALTER TABLE demo_requests ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Anyone can submit demo request" ON demo_requests;
  DROP POLICY IF EXISTS "rls_demo_requests_anon_insert" ON demo_requests;
  DROP POLICY IF EXISTS "rls_demo_requests_patron" ON demo_requests;

  -- Herkes demo talebi gönderebilir (anon dahil)
  CREATE POLICY "rls_demo_requests_anon_insert" ON demo_requests FOR INSERT
    WITH CHECK (true);

  -- Patron: tüm talepleri görebilir ve yönetebilir
  CREATE POLICY "rls_demo_requests_patron" ON demo_requests FOR ALL
    USING (rls_is_patron()) WITH CHECK (rls_is_patron());
END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- BÖLÜM 22: SİSTEM / ROBOT TABLOLARI — Backend only (client erişim yok)
-- service_role RLS bypass eder. Client'tan erişim engellenir.
-- ═══════════════════════════════════════════════════════════════════════════════

-- 22.1 robots
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='robots') THEN
  ALTER TABLE robots ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Service can manage robots" ON robots;
  DROP POLICY IF EXISTS "rls_robots_patron_select" ON robots;
  DROP POLICY IF EXISTS "rls_robots_deny" ON robots;

  CREATE POLICY "rls_robots_patron_select" ON robots FOR SELECT
    USING (rls_is_patron());
END IF;
END $$;

-- 22.2 celf_directorates
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='celf_directorates') THEN
  ALTER TABLE celf_directorates ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Service can manage celf_directorates" ON celf_directorates;
  DROP POLICY IF EXISTS "rls_celf_directorates_patron_select" ON celf_directorates;

  CREATE POLICY "rls_celf_directorates_patron_select" ON celf_directorates FOR SELECT
    USING (rls_is_patron());
END IF;
END $$;

-- 22.3 role_permissions
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='role_permissions') THEN
  ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Service can manage role_permissions" ON role_permissions;
  DROP POLICY IF EXISTS "rls_role_permissions_read" ON role_permissions;

  -- Referans tablosu: authenticated kullanıcılar okuyabilir
  CREATE POLICY "rls_role_permissions_read" ON role_permissions FOR SELECT
    USING (auth.role() = 'authenticated');
END IF;
END $$;

-- 22.4 core_rules
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='core_rules') THEN
  ALTER TABLE core_rules ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Service can manage core_rules" ON core_rules;
  DROP POLICY IF EXISTS "rls_core_rules_read" ON core_rules;

  CREATE POLICY "rls_core_rules_read" ON core_rules FOR SELECT
    USING (auth.role() = 'authenticated');
END IF;
END $$;

-- 22.5 ceo_tasks
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='ceo_tasks') THEN
  ALTER TABLE ceo_tasks ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Users can read own ceo_tasks" ON ceo_tasks;
  DROP POLICY IF EXISTS "Service can manage ceo_tasks" ON ceo_tasks;
  DROP POLICY IF EXISTS "rls_ceo_tasks_patron" ON ceo_tasks;
  DROP POLICY IF EXISTS "rls_ceo_tasks_own" ON ceo_tasks;

  CREATE POLICY "rls_ceo_tasks_patron" ON ceo_tasks FOR ALL
    USING (rls_is_patron()) WITH CHECK (rls_is_patron());

  CREATE POLICY "rls_ceo_tasks_own" ON ceo_tasks FOR SELECT
    USING (user_id = auth.uid());
END IF;
END $$;

-- 22.6 ceo_templates
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='ceo_templates') THEN
  ALTER TABLE ceo_templates ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "rls_ceo_templates_patron" ON ceo_templates;

  CREATE POLICY "rls_ceo_templates_patron" ON ceo_templates FOR ALL
    USING (rls_is_patron()) WITH CHECK (rls_is_patron());
END IF;
END $$;

-- 22.7 cio_analysis_logs
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='cio_analysis_logs') THEN
  ALTER TABLE cio_analysis_logs ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "cio_analysis_logs_service" ON cio_analysis_logs;
  DROP POLICY IF EXISTS "rls_cio_analysis_patron" ON cio_analysis_logs;

  CREATE POLICY "rls_cio_analysis_patron" ON cio_analysis_logs FOR SELECT
    USING (rls_is_patron());
END IF;
END $$;

-- 22.8 patron_commands
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='patron_commands') THEN
  ALTER TABLE patron_commands ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "patron_commands_deny_client" ON patron_commands;
  DROP POLICY IF EXISTS "Users can read own patron_commands" ON patron_commands;
  DROP POLICY IF EXISTS "Service can insert update patron_commands" ON patron_commands;
  DROP POLICY IF EXISTS "rls_patron_commands_patron" ON patron_commands;
  DROP POLICY IF EXISTS "rls_patron_commands_own" ON patron_commands;

  CREATE POLICY "rls_patron_commands_patron" ON patron_commands FOR ALL
    USING (rls_is_patron()) WITH CHECK (rls_is_patron());

  CREATE POLICY "rls_patron_commands_own" ON patron_commands FOR SELECT
    USING (user_id = auth.uid());
END IF;
END $$;

-- 22.9 celf_logs
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='celf_logs') THEN
  ALTER TABLE celf_logs ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Service can manage celf_logs" ON celf_logs;
  DROP POLICY IF EXISTS "rls_celf_logs_patron" ON celf_logs;

  CREATE POLICY "rls_celf_logs_patron" ON celf_logs FOR SELECT
    USING (rls_is_patron());
END IF;
END $$;

-- 22.10 audit_log
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='audit_log') THEN
  ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Service can insert audit_log" ON audit_log;
  DROP POLICY IF EXISTS "Users can read own audit_log" ON audit_log;
  DROP POLICY IF EXISTS "rls_audit_log_patron" ON audit_log;
  DROP POLICY IF EXISTS "rls_audit_log_own" ON audit_log;

  CREATE POLICY "rls_audit_log_patron" ON audit_log FOR SELECT
    USING (rls_is_patron());

  CREATE POLICY "rls_audit_log_own" ON audit_log FOR SELECT
    USING (user_id = auth.uid());
END IF;
END $$;

-- 22.11 chat_messages
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='chat_messages') THEN
  ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Users can read own chat_messages" ON chat_messages;
  DROP POLICY IF EXISTS "Service can insert chat_messages" ON chat_messages;
  DROP POLICY IF EXISTS "rls_chat_messages_patron" ON chat_messages;
  DROP POLICY IF EXISTS "rls_chat_messages_own" ON chat_messages;

  CREATE POLICY "rls_chat_messages_patron" ON chat_messages FOR ALL
    USING (rls_is_patron()) WITH CHECK (rls_is_patron());

  CREATE POLICY "rls_chat_messages_own" ON chat_messages FOR SELECT
    USING (user_id = auth.uid());
END IF;
END $$;

-- 22.12 routine_tasks, task_results, security_logs, system_backups
-- Sadece backend erişir (service_role bypass). Client'tan erişim yok.
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='routine_tasks') THEN
  ALTER TABLE routine_tasks ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Service can manage routine_tasks" ON routine_tasks;
  DROP POLICY IF EXISTS "rls_routine_tasks_patron" ON routine_tasks;
  CREATE POLICY "rls_routine_tasks_patron" ON routine_tasks FOR SELECT
    USING (rls_is_patron());
END IF;
END $$;

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='task_results') THEN
  ALTER TABLE task_results ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Service can manage task_results" ON task_results;
  DROP POLICY IF EXISTS "rls_task_results_patron" ON task_results;
  CREATE POLICY "rls_task_results_patron" ON task_results FOR SELECT
    USING (rls_is_patron());
END IF;
END $$;

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='security_logs') THEN
  ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Service can manage security_logs" ON security_logs;
  DROP POLICY IF EXISTS "rls_security_logs_patron" ON security_logs;
  CREATE POLICY "rls_security_logs_patron" ON security_logs FOR SELECT
    USING (rls_is_patron());
END IF;
END $$;

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='system_backups') THEN
  ALTER TABLE system_backups ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Service can manage system_backups" ON system_backups;
  DROP POLICY IF EXISTS "rls_system_backups_patron" ON system_backups;
  CREATE POLICY "rls_system_backups_patron" ON system_backups FOR SELECT
    USING (rls_is_patron());
END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- BÖLÜM 23: COO DEPO TABLOLARI
-- ═══════════════════════════════════════════════════════════════════════════════

-- coo_depo_drafts: sadece patron (+ backend)
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='coo_depo_drafts') THEN
  ALTER TABLE coo_depo_drafts ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "coo_depo_drafts_service_only" ON coo_depo_drafts;
  DROP POLICY IF EXISTS "rls_coo_depo_drafts_patron" ON coo_depo_drafts;

  CREATE POLICY "rls_coo_depo_drafts_patron" ON coo_depo_drafts FOR ALL
    USING (rls_is_patron()) WITH CHECK (rls_is_patron());
END IF;
END $$;

-- coo_depo_approved: sadece patron
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='coo_depo_approved') THEN
  ALTER TABLE coo_depo_approved ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "coo_depo_approved_service_only" ON coo_depo_approved;
  DROP POLICY IF EXISTS "rls_coo_depo_approved_patron" ON coo_depo_approved;

  CREATE POLICY "rls_coo_depo_approved_patron" ON coo_depo_approved FOR ALL
    USING (rls_is_patron()) WITH CHECK (rls_is_patron());
END IF;
END $$;

-- coo_depo_published: authenticated kullanıcılar okuyabilir
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='coo_depo_published') THEN
  ALTER TABLE coo_depo_published ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "coo_depo_published_read" ON coo_depo_published;
  DROP POLICY IF EXISTS "rls_coo_depo_published_read" ON coo_depo_published;
  DROP POLICY IF EXISTS "rls_coo_depo_published_patron" ON coo_depo_published;

  CREATE POLICY "rls_coo_depo_published_read" ON coo_depo_published FOR SELECT
    USING (auth.role() = 'authenticated');

  CREATE POLICY "rls_coo_depo_published_patron" ON coo_depo_published FOR ALL
    USING (rls_is_patron()) WITH CHECK (rls_is_patron());
END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- BÖLÜM 24: REFERANS TABLOLARI — Genel okuma
-- ═══════════════════════════════════════════════════════════════════════════════

-- roles (referans)
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='roles') THEN
  ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "rls_roles_read" ON roles;

  CREATE POLICY "rls_roles_read" ON roles FOR SELECT
    USING (auth.role() = 'authenticated');
END IF;
END $$;

-- packages (referans)
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='packages') THEN
  ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "rls_packages_read" ON packages;

  CREATE POLICY "rls_packages_read" ON packages FOR SELECT
    USING (auth.role() = 'authenticated');
END IF;
END $$;

-- reference_values (referans)
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='reference_values') THEN
  ALTER TABLE reference_values ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "rls_reference_values_read" ON reference_values;

  CREATE POLICY "rls_reference_values_read" ON reference_values FOR SELECT
    USING (auth.role() = 'authenticated');
END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- BÖLÜM 25: PERFORMANS İNDEKSLERİ
-- RLS sorgularını hızlandırmak için ek indeksler
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_user_tenants_uid_role ON user_tenants(user_id, role);
CREATE INDEX IF NOT EXISTS idx_user_tenants_uid_tid_role ON user_tenants(user_id, tenant_id, role);
CREATE INDEX IF NOT EXISTS idx_staff_uid_role_active ON staff(user_id, role) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_athletes_parent_uid ON athletes(parent_user_id) WHERE parent_user_id IS NOT NULL;


-- ═══════════════════════════════════════════════════════════════════════════════
-- ÖZET
-- ═══════════════════════════════════════════════════════════════════════════════
-- 3 yardımcı fonksiyon (rls_is_patron, rls_parent_athlete_ids, rls_trainer_athlete_ids)
-- 25 bölüm, ~30 tablo kapsandı
-- Rol matrisi:
--   patron   → FOR ALL tüm tablolarda
--   staff    → FOR ALL kendi tenant'ında (role NOT IN veli/antrenor/pasif)
--   antrenör → SELECT/UPDATE kendi branşı (athletes, attendance, measurements)
--   veli     → SELECT sadece kendi çocuğu (athletes, attendance, payments, measurements)
-- Eski "USING (true)" politikaları kaldırıldı (güvenlik açığı)
-- service_role RLS'i tamamen bypass eder → backend etkilenmez
-- ═══════════════════════════════════════════════════════════════════════════════
