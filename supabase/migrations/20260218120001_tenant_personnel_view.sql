-- user_tenants role genişletmesi (patron, antrenor, kasa, veli vb.)
-- Önce mevcut constraint'i kaldır ki UPDATE çalışabilsin
ALTER TABLE user_tenants DROP CONSTRAINT IF EXISTS user_tenants_role_check;
-- Bilinmeyen rolleri yeni listedeki 'viewer' yap
UPDATE user_tenants
SET role = 'viewer'
WHERE role IS NOT NULL
  AND role NOT IN ('patron','admin','manager','antrenor','trainer','kasa','sekreter','temizlik','guvenlik','veli','staff','viewer','owner','tesis_muduru','sportif_direktor','yardimci_antrenor','pasif','receptionist','other');
ALTER TABLE user_tenants ADD CONSTRAINT user_tenants_role_check
  CHECK (role IN ('patron','admin','manager','antrenor','trainer','kasa','sekreter','temizlik','guvenlik','veli','staff','viewer','owner','tesis_muduru','sportif_direktor','yardimci_antrenor','pasif','receptionist','other'));

-- Tenant personel görünümü: user_tenants + auth.users (email)
CREATE OR REPLACE VIEW tenant_personnel_view AS
SELECT
  ut.id,
  ut.user_id,
  ut.tenant_id,
  ut.role,
  ut.created_at,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', '') as full_name
FROM user_tenants ut
LEFT JOIN auth.users u ON u.id = ut.user_id;
