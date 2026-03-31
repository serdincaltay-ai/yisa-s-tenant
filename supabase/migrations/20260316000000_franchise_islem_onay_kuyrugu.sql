-- Franchise işlem onay kuyruğu (GymTekno yetkili onayları)
-- İşlem tipleri: paket_ekleme, yeni_uye, indirim, iade
-- RLS: tenant_id bazlı; franchise/müdür tümünü okuyabilir; personel sadece kendi taleplerini görebilir.

CREATE TABLE IF NOT EXISTS franchise_islem_onay_kuyrugu (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  islem_tipi TEXT NOT NULL CHECK (islem_tipi IN ('paket_ekleme', 'yeni_uye', 'indirim', 'iade')),
  talep_eden_staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  talep_eden_ad TEXT,
  musteri_id UUID,
  musteri_ad TEXT,
  islem_detay JSONB DEFAULT '{}'::jsonb,
  mesaj TEXT,
  durum TEXT DEFAULT 'bekliyor' CHECK (durum IN ('bekliyor', 'onaylandi', 'reddedildi')),
  onaylayan_staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  onay_tarihi TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_franchise_islem_onay_tenant ON franchise_islem_onay_kuyrugu(tenant_id);
CREATE INDEX IF NOT EXISTS idx_franchise_islem_onay_durum ON franchise_islem_onay_kuyrugu(durum);
CREATE INDEX IF NOT EXISTS idx_franchise_islem_onay_tipi ON franchise_islem_onay_kuyrugu(islem_tipi);
CREATE INDEX IF NOT EXISTS idx_franchise_islem_onay_created ON franchise_islem_onay_kuyrugu(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_franchise_islem_onay_talep_eden ON franchise_islem_onay_kuyrugu(talep_eden_staff_id);

ALTER TABLE franchise_islem_onay_kuyrugu ENABLE ROW LEVEL SECURITY;

-- Yetkili (franchise/müdür): tenant'taki tüm kayıtları okuyup güncelleyebilir
DROP POLICY IF EXISTS "franchise_islem_onay_yetkili_all" ON franchise_islem_onay_kuyrugu;
CREATE POLICY "franchise_islem_onay_yetkili_all" ON franchise_islem_onay_kuyrugu
  FOR ALL USING (
    tenant_id IN (
      SELECT ut.tenant_id FROM user_tenants ut
      WHERE ut.user_id = auth.uid()
      AND ut.role IN ('owner', 'admin', 'manager', 'tesis_muduru', 'kasa', 'franchise', 'isletme_muduru')
    )
    OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  );

-- Personel: sadece kendi taleplerini görebilir ve yeni talep ekleyebilir (INSERT kendi tenant_id + kendi staff_id)
DROP POLICY IF EXISTS "franchise_islem_onay_personel_select_own" ON franchise_islem_onay_kuyrugu;
CREATE POLICY "franchise_islem_onay_personel_select_own" ON franchise_islem_onay_kuyrugu
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
    AND talep_eden_staff_id IN (SELECT id FROM staff WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "franchise_islem_onay_personel_insert" ON franchise_islem_onay_kuyrugu;
CREATE POLICY "franchise_islem_onay_personel_insert" ON franchise_islem_onay_kuyrugu
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
    OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  );

