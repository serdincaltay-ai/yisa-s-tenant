-- Franchise onay kuyruğu: tesis içi personel talepleri (izin, avans vb.) yetkili onayı
-- Komut 5 — Yetkili onayları (docs/GYMTEKNO-BOLUM1-2-BIRLESIK-DEV-ASK-KOMUTLARI.md)

CREATE TABLE IF NOT EXISTS franchise_approval_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Talep bilgisi
  talep_tipi VARCHAR(50) NOT NULL CHECK (talep_tipi IN (
    'personel_izin',   -- İzin talebi (staff_leave_requests)
    'personel_avans',  -- Avans talebi (staff_advance_requests)
    'diger'
  )),
  baslik VARCHAR(255) NOT NULL,
  aciklama TEXT,

  -- Talep eden
  talep_eden_staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  talep_eden_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Durum
  durum VARCHAR(20) DEFAULT 'bekliyor' CHECK (durum IN (
    'bekliyor',
    'onaylandi',
    'reddedildi'
  )),

  -- Karar (yetkili)
  karar_veren_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  karar_notu TEXT,
  karar_tarihi TIMESTAMPTZ,

  -- İlişkili kayıt (örn. staff_leave_requests.id)
  iliskili_tablo VARCHAR(100),
  iliskili_kayit_id UUID,
  payload JSONB DEFAULT '{}'::jsonb,

  olusturma_tarihi TIMESTAMPTZ DEFAULT NOW(),
  guncelleme_tarihi TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_franchise_approval_queue_tenant ON franchise_approval_queue(tenant_id);
CREATE INDEX IF NOT EXISTS idx_franchise_approval_queue_durum ON franchise_approval_queue(durum);
CREATE INDEX IF NOT EXISTS idx_franchise_approval_queue_talep_tipi ON franchise_approval_queue(talep_tipi);
CREATE INDEX IF NOT EXISTS idx_franchise_approval_queue_tarih ON franchise_approval_queue(olusturma_tarihi DESC);

ALTER TABLE franchise_approval_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "franchise_approval_queue_tenant_select" ON franchise_approval_queue;
CREATE POLICY "franchise_approval_queue_tenant_select" ON franchise_approval_queue
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
    OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "franchise_approval_queue_tenant_insert" ON franchise_approval_queue;
CREATE POLICY "franchise_approval_queue_tenant_insert" ON franchise_approval_queue
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
    OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "franchise_approval_queue_tenant_update" ON franchise_approval_queue;
CREATE POLICY "franchise_approval_queue_tenant_update" ON franchise_approval_queue
  FOR UPDATE USING (
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
    OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  );
