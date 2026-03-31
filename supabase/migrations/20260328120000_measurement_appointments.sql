-- ═══════════════════════════════════════════════════════════════════════════════
-- MEASUREMENT_APPOINTMENTS — Veli kayıt akışı için ek kolonlar
-- Tarih: 28 Mart 2026
--
-- NOT: measurement_appointments tablosu 20260328000000_ilk_olcum_zorunlu_referans.sql
-- tarafından zaten oluşturulmuştur. Bu migration eksik kolonları ekler ve
-- public kayıt akışı için gerekli düzenlemeleri yapar.
-- ═══════════════════════════════════════════════════════════════════════════════

-- Yeni kolonlar ekle (public veli kayıt akışı için gerekli)
ALTER TABLE measurement_appointments ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE measurement_appointments ADD COLUMN IF NOT EXISTS duration_minutes INTEGER NOT NULL DEFAULT 30;
ALTER TABLE measurement_appointments ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE measurement_appointments ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE measurement_appointments ADD COLUMN IF NOT EXISTS parent_name TEXT;
ALTER TABLE measurement_appointments ADD COLUMN IF NOT EXISTS parent_phone TEXT;

-- athlete_id nullable yap (veli henüz giriş yapmamış, sporcu kaydı sonradan bağlanabilir)
ALTER TABLE measurement_appointments ALTER COLUMN athlete_id DROP NOT NULL;

-- status kolonu için CHECK constraint (mevcut durum constraint'inden bağımsız)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'measurement_appointments_status_check'
  ) THEN
    ALTER TABLE measurement_appointments
      ADD CONSTRAINT measurement_appointments_status_check
      CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled'));
  END IF;
END $$;

-- Yeni indeksler
CREATE INDEX IF NOT EXISTS idx_meas_appt_scheduled ON measurement_appointments(tenant_id, scheduled_at)
  WHERE scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_meas_appt_status ON measurement_appointments(status);

-- RLS zaten aktif (önceki migration'dan); ek policy'ler ekle
-- Tenant kullanıcıları kendi tenant randevularını görebilir (user_tenants üzerinden)
DROP POLICY IF EXISTS "Users see own tenant measurement_appointments" ON measurement_appointments;
CREATE POLICY "Users see own tenant measurement_appointments" ON measurement_appointments FOR SELECT USING (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
);

-- Tenant kullanıcıları kendi tenant randevularını yönetebilir
DROP POLICY IF EXISTS "Users manage own tenant measurement_appointments" ON measurement_appointments;
CREATE POLICY "Users manage own tenant measurement_appointments" ON measurement_appointments FOR ALL USING (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
) WITH CHECK (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
);

-- Service role zaten RLS'yi atlar; public INSERT policy gereksiz.
-- API rotaları service role key kullanır, anon key ile doğrudan erişim engellenir.
DROP POLICY IF EXISTS "Service can manage measurement_appointments" ON measurement_appointments;
DROP POLICY IF EXISTS "Public can insert measurement_appointments" ON measurement_appointments;
