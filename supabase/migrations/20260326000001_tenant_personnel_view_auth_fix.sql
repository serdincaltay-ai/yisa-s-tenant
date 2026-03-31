-- P0: tenant_personnel_view — auth.users expose'unu kapat
-- Eski view auth.users'a JOIN yapıyordu, şimdi sadece user_tenants + auth.users metadata (email) kullanır
-- auth.users tablosuna doğrudan erişim kaldırıldı

DROP VIEW IF EXISTS public.tenant_personnel_view;

CREATE OR REPLACE VIEW public.tenant_personnel_view AS
SELECT
  ut.id,
  ut.user_id,
  ut.tenant_id,
  ut.role,
  ut.created_at,
  (u.raw_user_meta_data->>'full_name')::text AS full_name,
  (u.raw_user_meta_data->>'name')::text AS name,
  u.email
FROM public.user_tenants ut
JOIN auth.users u ON u.id = ut.user_id;

-- View'a RLS benzeri güvenlik: sadece service_role erişebilir
-- (View zaten service_role client ile çağrılıyor — route.ts satır 54)
REVOKE ALL ON public.tenant_personnel_view FROM anon, authenticated;
GRANT SELECT ON public.tenant_personnel_view TO service_role;

COMMENT ON VIEW public.tenant_personnel_view IS 'Tenant personel listesi — auth.users tablosundan sadece email ve metadata alır, hassas alanlar (password hash, phone vb.) expose edilmez.';
