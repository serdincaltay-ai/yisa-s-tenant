-- ═══════════════════════════════════════════════════════════════════════════════════════
-- AŞAMA 2: Veritabanı Şeması — Tenant, User-Tenant, Roles, Packages, Athletes
-- YİSA-S Sistem Anayasası uyumu
-- Tarih: 2 Şubat 2026
-- ═══════════════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────────────
-- 1. TENANTS — Genişletme (owner_id, package_type eklenecek)
-- Mevcut tenants varsa ALTER ile eklenir
-- ─────────────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'owner_id') THEN
    ALTER TABLE tenants ADD COLUMN owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'package_type') THEN
    ALTER TABLE tenants ADD COLUMN package_type TEXT DEFAULT 'starter' CHECK (package_type IN ('starter', 'pro', 'enterprise'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'name') THEN
    ALTER TABLE tenants ADD COLUMN name TEXT;
    UPDATE tenants SET name = ad WHERE ad IS NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tenants_owner_id ON tenants(owner_id) WHERE owner_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────────────
-- 2. USER_TENANTS — Kullanıcı-Tenant ilişkisi
-- ─────────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'trainer', 'staff', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_user_tenants_user_id ON user_tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant_id ON user_tenants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_role ON user_tenants(role);

ALTER TABLE user_tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own user_tenants" ON user_tenants;
CREATE POLICY "Users can read own user_tenants" ON user_tenants FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can manage user_tenants" ON user_tenants;
CREATE POLICY "Service can manage user_tenants" ON user_tenants FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────────────
-- 3. ROLES — Referans tablosu (roller varsa atla)
-- ─────────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  level INTEGER NOT NULL,
  description TEXT
);

-- Seed roller (idempotent)
INSERT INTO roles (name, level, description) VALUES
  ('Patron', 0, 'En üst yetki'),
  ('Franchise Sahibi', 1, 'Franchise/tenant sahibi'),
  ('Tesis Müdürü', 2, 'Tek tesis yönetimi'),
  ('Antrenör', 3, 'Ders ve sporcu yönetimi'),
  ('Kayıt Personeli', 4, 'Kayıt ve aidat'),
  ('Veli', 5, 'Çocuk takibi'),
  ('Sporcu', 6, 'Üye')
ON CONFLICT (name) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────────────
-- 4. PACKAGES — Paket tanımları
-- ─────────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS packages (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'TRY',
  features JSONB DEFAULT '[]'::jsonb,
  robot_quota INTEGER DEFAULT 1000,
  max_members INTEGER DEFAULT 50,
  max_branches INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Eski migration'dan gelen packages'ta eksik kolonlar (uzak DB: kod, isim, name, slug vb.)
ALTER TABLE packages ADD COLUMN IF NOT EXISTS kod TEXT;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS isim TEXT;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS aylik_ucret DECIMAL(10,2);
ALTER TABLE packages ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);
ALTER TABLE packages ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS robot_quota INTEGER DEFAULT 1000;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS max_members INTEGER DEFAULT 50;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS max_branches INTEGER DEFAULT 1;

-- ON CONFLICT (slug) için unique index gerekli
CREATE UNIQUE INDEX IF NOT EXISTS idx_packages_slug ON packages(slug);

-- Seed paketler (uzak packages: kod, isim, aylik_ucret NOT NULL)
INSERT INTO packages (kod, isim, aylik_ucret, name, slug, price, features, robot_quota, max_members, max_branches) VALUES
  ('starter', 'Starter', 499, 'Starter', 'starter', 499, '["50 üye","1 şube","Temel robotlar","Veli paneli"]'::jsonb, 500, 50, 1),
  ('pro', 'Pro', 999, 'Pro', 'pro', 999, '["200 üye","3 şube","Tüm robotlar","WhatsApp","Öncelikli destek"]'::jsonb, 2000, 200, 3),
  ('enterprise', 'Enterprise', 0, 'Enterprise', 'enterprise', 0, '["Sınırsız","Çoklu şube","Özelleştirme","API erişimi"]'::jsonb, 10000, 9999, 99)
ON CONFLICT (slug) DO UPDATE SET
  kod = EXCLUDED.kod,
  isim = EXCLUDED.isim,
  aylik_ucret = EXCLUDED.aylik_ucret,
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  features = EXCLUDED.features,
  robot_quota = EXCLUDED.robot_quota,
  max_members = EXCLUDED.max_members,
  max_branches = EXCLUDED.max_branches;

-- ─────────────────────────────────────────────────────────────────────────────────────
-- 5. ATHLETES — Sporcular / Üyeler (tenant bazlı)
-- ─────────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS athletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  parent_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  surname TEXT,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('E', 'K', 'diger')),
  branch TEXT,
  level TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'trial')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_athletes_tenant_id ON athletes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_athletes_parent_user ON athletes(parent_user_id) WHERE parent_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_athletes_status ON athletes(status);
CREATE INDEX IF NOT EXISTS idx_athletes_name ON athletes(tenant_id, name);

ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;

-- RLS: Kullanıcı sadece kendi tenant'ındaki sporcuları görsün
DROP POLICY IF EXISTS "Users see own tenant athletes" ON athletes;
CREATE POLICY "Users see own tenant athletes" ON athletes FOR SELECT USING (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users manage own tenant athletes" ON athletes;
CREATE POLICY "Users manage own tenant athletes" ON athletes FOR ALL USING (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
) WITH CHECK (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Service can manage athletes" ON athletes;
CREATE POLICY "Service can manage athletes" ON athletes FOR ALL USING (true) WITH CHECK (true);

-- Trigger: updated_at
CREATE OR REPLACE FUNCTION update_athletes_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_athletes_updated ON athletes;
CREATE TRIGGER trg_athletes_updated BEFORE UPDATE ON athletes FOR EACH ROW EXECUTE PROCEDURE update_athletes_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────────────
-- 6. STAFF — Personel (antrenör, müdür) — tenant bazlı
-- ─────────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  surname TEXT,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'trainer', 'receptionist', 'other')),
  branch TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_tenant_id ON staff(tenant_id);
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id) WHERE user_id IS NOT NULL;

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own tenant staff" ON staff;
CREATE POLICY "Users see own tenant staff" ON staff FOR SELECT USING (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users manage own tenant staff" ON staff;
CREATE POLICY "Users manage own tenant staff" ON staff FOR ALL USING (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
) WITH CHECK (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Service can manage staff" ON staff;
CREATE POLICY "Service can manage staff" ON staff FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────────────
-- 7. TENANTS RLS — tenant_id bazlı izolasyon
-- ─────────────────────────────────────────────────────────────────────────────────────

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own or assigned tenants" ON tenants;
CREATE POLICY "Users see own or assigned tenants" ON tenants FOR SELECT USING (
  owner_id = auth.uid() OR id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Service can manage tenants" ON tenants;
CREATE POLICY "Service can manage tenants" ON tenants FOR ALL USING (true) WITH CHECK (true);
