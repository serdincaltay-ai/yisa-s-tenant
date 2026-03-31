-- P0: ogrenciler tablosu — RLS aktifleştir
-- Tablo varsa RLS aç + tenant isolation policy ekle
-- Tablo yoksa hata vermez (DO block)
-- Security Advisor: policy_exists_rls_disabled, rls_disabled_in_public

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ogrenciler') THEN
    ALTER TABLE public.ogrenciler ENABLE ROW LEVEL SECURITY;

    -- Mevcut policy'leri temizle
    DROP POLICY IF EXISTS "ogrenciler_tenant_select" ON public.ogrenciler;
    DROP POLICY IF EXISTS "ogrenciler_tenant_all" ON public.ogrenciler;
    DROP POLICY IF EXISTS "ogrenciler_service" ON public.ogrenciler;
    DROP POLICY IF EXISTS "Authenticated users can view ogrenciler" ON public.ogrenciler;

    -- Tenant isolation: user_tenants üzerinden
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ogrenciler' AND column_name = 'tenant_id') THEN
      CREATE POLICY "ogrenciler_tenant_select" ON public.ogrenciler FOR SELECT TO authenticated
        USING (tenant_id IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()));
      CREATE POLICY "ogrenciler_tenant_all" ON public.ogrenciler FOR ALL TO authenticated
        USING (tenant_id IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()))
        WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()));
    ELSE
      -- tenant_id yoksa tüm authenticated erişimi kapat, sadece service_role
      CREATE POLICY "ogrenciler_deny_all" ON public.ogrenciler FOR ALL TO authenticated USING (false);
    END IF;
  END IF;
END $$;
