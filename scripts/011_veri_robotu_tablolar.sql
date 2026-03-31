-- ═══════════════════════════════════════════════════════════════════════════════
-- YİSA-S — scripts/011_veri_robotu_tablolar.sql
-- Faz 4: Veri Robotu — Şablon Havuzu + Gelişim Ölçümleri + Referans Değerler
--
-- 3 tablo:
--   1) sport_templates   — Antrenman/gelişim/beslenme/postür/mental şablonları
--   2) gelisim_olcumleri — Çocuk gelişim ölçüm kayıtları (şablon bazlı)
--   3) referans_degerler — Yaşa ve cinsiyete göre normatif değerler (WHO, TGF)
--
-- Tarih: 05 Mart 2026
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- 1) sport_templates — Şablon Kütüphanesi
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sport_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('antrenman', 'gelisim_olcum', 'beslenme', 'postur', 'mental')),
  title TEXT NOT NULL,
  description TEXT,
  content JSONB NOT NULL DEFAULT '{}',
  age_min INTEGER DEFAULT 0,
  age_max INTEGER DEFAULT 99,
  sport_type TEXT NOT NULL DEFAULT 'genel' CHECK (sport_type IN ('cimnastik', 'yuzme', 'genel', 'atletizm', 'jimnastik')),
  difficulty TEXT NOT NULL DEFAULT 'baslangic' CHECK (difficulty IN ('baslangic', 'orta', 'ileri')),
  created_by TEXT NOT NULL DEFAULT 'veri_robotu',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sport_templates_category ON sport_templates(category);
CREATE INDEX IF NOT EXISTS idx_sport_templates_sport ON sport_templates(sport_type);
CREATE INDEX IF NOT EXISTS idx_sport_templates_active ON sport_templates(is_active) WHERE is_active = true;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2) gelisim_olcumleri — Çocuk Gelişim Ölçümleri
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gelisim_olcumleri (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  template_id UUID REFERENCES sport_templates(id) ON DELETE SET NULL,
  olcum_tarihi DATE NOT NULL DEFAULT CURRENT_DATE,
  olcum_verileri JSONB NOT NULL DEFAULT '{}',
  antrenor_notu TEXT,
  olcen_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gelisim_olcumleri_tenant ON gelisim_olcumleri(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gelisim_olcumleri_athlete ON gelisim_olcumleri(athlete_id);
CREATE INDEX IF NOT EXISTS idx_gelisim_olcumleri_tarih ON gelisim_olcumleri(olcum_tarihi);
CREATE INDEX IF NOT EXISTS idx_gelisim_olcumleri_template ON gelisim_olcumleri(template_id);

ALTER TABLE gelisim_olcumleri ENABLE ROW LEVEL SECURITY;

-- Patron: tüm ölçümler
DROP POLICY IF EXISTS "rls_gelisim_olcumleri_patron" ON gelisim_olcumleri;
CREATE POLICY "rls_gelisim_olcumleri_patron" ON gelisim_olcumleri FOR ALL
  USING (rls_is_patron()) WITH CHECK (rls_is_patron());

-- Veli: kendi çocuğunun ölçümleri (SELECT)
DROP POLICY IF EXISTS "rls_gelisim_olcumleri_parent_select" ON gelisim_olcumleri;
CREATE POLICY "rls_gelisim_olcumleri_parent_select" ON gelisim_olcumleri FOR SELECT
  USING (athlete_id IN (SELECT rls_parent_athlete_ids()));

-- Antrenör: kendi branşındaki sporcuların ölçümleri (CRUD)
DROP POLICY IF EXISTS "rls_gelisim_olcumleri_trainer" ON gelisim_olcumleri;
CREATE POLICY "rls_gelisim_olcumleri_trainer" ON gelisim_olcumleri FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_tenants ut
      WHERE ut.user_id = auth.uid()
      AND ut.tenant_id = gelisim_olcumleri.tenant_id
      AND ut.role IN ('antrenor', 'trainer')
    )
    AND athlete_id IN (SELECT rls_trainer_athlete_ids())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_tenants ut
      WHERE ut.user_id = auth.uid()
      AND ut.tenant_id = gelisim_olcumleri.tenant_id
      AND ut.role IN ('antrenor', 'trainer')
    )
    AND athlete_id IN (SELECT rls_trainer_athlete_ids())
  );

-- Staff: tenant CRUD
DROP POLICY IF EXISTS "rls_gelisim_olcumleri_staff" ON gelisim_olcumleri;
CREATE POLICY "rls_gelisim_olcumleri_staff" ON gelisim_olcumleri FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_tenants ut
      WHERE ut.user_id = auth.uid()
      AND ut.tenant_id = gelisim_olcumleri.tenant_id
      AND ut.role NOT IN ('veli', 'antrenor', 'trainer', 'pasif')
    )
    OR EXISTS (
      SELECT 1 FROM tenants t WHERE t.id = gelisim_olcumleri.tenant_id AND t.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_tenants ut
      WHERE ut.user_id = auth.uid()
      AND ut.tenant_id = gelisim_olcumleri.tenant_id
      AND ut.role NOT IN ('veli', 'antrenor', 'trainer', 'pasif')
    )
    OR EXISTS (
      SELECT 1 FROM tenants t WHERE t.id = gelisim_olcumleri.tenant_id AND t.owner_id = auth.uid()
    )
  );

-- Service role RLS'i tamamen bypass eder; ayrı USING(true) policy gerekmiyor (bkz. 006_rls_policies.sql)
DROP POLICY IF EXISTS "Service can manage gelisim_olcumleri" ON gelisim_olcumleri;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3) referans_degerler — Yaşa Göre Normatif Değerler
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS referans_degerler (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  yas INTEGER NOT NULL CHECK (yas >= 0 AND yas <= 25),
  cinsiyet TEXT NOT NULL CHECK (cinsiyet IN ('E', 'K')),
  parametre TEXT NOT NULL CHECK (parametre IN ('boy', 'kilo', 'bmi', 'esneklik', 'surat', 'kuvvet', 'denge', 'koordinasyon', 'dayaniklilik', 'dikey_sicrama')),
  min_deger NUMERIC(8,2) NOT NULL,
  max_deger NUMERIC(8,2) NOT NULL,
  optimal_deger NUMERIC(8,2) NOT NULL,
  kaynak TEXT NOT NULL DEFAULT 'WHO',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_referans_degerler_unique ON referans_degerler(yas, cinsiyet, parametre);
CREATE INDEX IF NOT EXISTS idx_referans_degerler_yas ON referans_degerler(yas);
CREATE INDEX IF NOT EXISTS idx_referans_degerler_cinsiyet ON referans_degerler(cinsiyet);

-- referans_degerler herkes okuyabilir (global data, tenant-bağımsız)
ALTER TABLE referans_degerler ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rls_referans_degerler_read" ON referans_degerler;
CREATE POLICY "rls_referans_degerler_read" ON referans_degerler FOR SELECT
  USING (auth.role() = 'authenticated');

-- Patron ve service role yazabilir
DROP POLICY IF EXISTS "rls_referans_degerler_patron_write" ON referans_degerler;
CREATE POLICY "rls_referans_degerler_patron_write" ON referans_degerler FOR ALL
  USING (rls_is_patron()) WITH CHECK (rls_is_patron());

-- Service role RLS'i tamamen bypass eder; ayrı USING(true) policy gerekmiyor (bkz. 006_rls_policies.sql)
DROP POLICY IF EXISTS "Service can manage referans_degerler" ON referans_degerler;


-- sport_templates herkes okuyabilir (global data)
ALTER TABLE sport_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rls_sport_templates_read" ON sport_templates;
CREATE POLICY "rls_sport_templates_read" ON sport_templates FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "rls_sport_templates_patron_write" ON sport_templates;
CREATE POLICY "rls_sport_templates_patron_write" ON sport_templates FOR ALL
  USING (rls_is_patron()) WITH CHECK (rls_is_patron());

-- Service role RLS'i tamamen bypass eder; ayrı USING(true) policy gerekmiyor (bkz. 006_rls_policies.sql)
DROP POLICY IF EXISTS "Service can manage sport_templates" ON sport_templates;
