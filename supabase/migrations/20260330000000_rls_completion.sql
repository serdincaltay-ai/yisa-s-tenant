-- ============================================================================
-- RLS Tamamlama Migrasyonu
-- 30 tablo icin eksik Row Level Security politikalarini ekler.
-- Tarih: 30 Mart 2026
-- Amac: RLS aktif olmayan tablolara uygun politikalar eklemek.
--
-- Politika stratejisi:
--   A) Tenant-scoped: tenant_id kolonu olan tablolar -> user_tenants uzerinden izolasyon
--   B) System/backend-only: Sadece service_role erisir -> USING (false) ile client engellenir
--   C) Reference/global: Herkes okuyabilir, yazma sadece service_role -> SELECT USING (true) + deny writes
--
-- service_role RLS i otomatik bypass eder, ek policy gerekmez.
-- ============================================================================


-- =============================================================================
-- A) TENANT-SCOPED TABLES -- tenant_id kolonu var -> user_tenants uzerinden izolasyon
-- =============================================================================

-- tenant_schedule
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='tenant_schedule') THEN
    ALTER TABLE public.tenant_schedule ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "tenant_schedule_tenant_select" ON public.tenant_schedule;
    DROP POLICY IF EXISTS "tenant_schedule_tenant_all" ON public.tenant_schedule;
    DROP POLICY IF EXISTS "tenant_schedule_service" ON public.tenant_schedule;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tenant_schedule' AND column_name='tenant_id') THEN
      CREATE POLICY "tenant_schedule_tenant_select" ON public.tenant_schedule FOR SELECT TO authenticated
        USING (tenant_id IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()));
      CREATE POLICY "tenant_schedule_tenant_all" ON public.tenant_schedule FOR ALL TO authenticated
        USING (tenant_id IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()))
        WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()));
    ELSE
      CREATE POLICY "tenant_schedule_deny_all" ON public.tenant_schedule FOR ALL TO authenticated USING (false);
    END IF;
  END IF;
END $$;

-- franchise_subdomains
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='franchise_subdomains') THEN
    ALTER TABLE public.franchise_subdomains ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "franchise_subdomains_tenant_select" ON public.franchise_subdomains;
    DROP POLICY IF EXISTS "franchise_subdomains_tenant_all" ON public.franchise_subdomains;
    DROP POLICY IF EXISTS "franchise_subdomains_service" ON public.franchise_subdomains;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='franchise_subdomains' AND column_name='tenant_id') THEN
      CREATE POLICY "franchise_subdomains_tenant_select" ON public.franchise_subdomains FOR SELECT TO authenticated
        USING (tenant_id IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()));
      CREATE POLICY "franchise_subdomains_tenant_all" ON public.franchise_subdomains FOR ALL TO authenticated
        USING (tenant_id IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()))
        WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()));
    ELSE
      CREATE POLICY "franchise_subdomains_deny_all" ON public.franchise_subdomains FOR ALL TO authenticated USING (false);
    END IF;
  END IF;
END $$;

-- advance_requests
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='advance_requests') THEN
    ALTER TABLE public.advance_requests ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "advance_requests_tenant_select" ON public.advance_requests;
    DROP POLICY IF EXISTS "advance_requests_tenant_all" ON public.advance_requests;
    DROP POLICY IF EXISTS "advance_requests_service" ON public.advance_requests;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='advance_requests' AND column_name='tenant_id') THEN
      CREATE POLICY "advance_requests_tenant_select" ON public.advance_requests FOR SELECT TO authenticated
        USING (tenant_id IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()));
      CREATE POLICY "advance_requests_tenant_all" ON public.advance_requests FOR ALL TO authenticated
        USING (tenant_id IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()))
        WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()));
    ELSE
      CREATE POLICY "advance_requests_deny_all" ON public.advance_requests FOR ALL TO authenticated USING (false);
    END IF;
  END IF;
END $$;

-- leave_requests
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='leave_requests') THEN
    ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "leave_requests_tenant_select" ON public.leave_requests;
    DROP POLICY IF EXISTS "leave_requests_tenant_all" ON public.leave_requests;
    DROP POLICY IF EXISTS "leave_requests_service" ON public.leave_requests;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leave_requests' AND column_name='tenant_id') THEN
      CREATE POLICY "leave_requests_tenant_select" ON public.leave_requests FOR SELECT TO authenticated
        USING (tenant_id IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()));
      CREATE POLICY "leave_requests_tenant_all" ON public.leave_requests FOR ALL TO authenticated
        USING (tenant_id IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()))
        WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()));
    ELSE
      CREATE POLICY "leave_requests_deny_all" ON public.leave_requests FOR ALL TO authenticated USING (false);
    END IF;
  END IF;
END $$;


-- =============================================================================
-- B) SYSTEM / BACKEND-ONLY TABLES -- client erisimi tamamen engellenir
--    service_role RLS i otomatik bypass eder, ekstra policy gerekmez.
-- =============================================================================

-- franchise_payments (finansal veri)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='franchise_payments') THEN
    ALTER TABLE public.franchise_payments ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "franchise_payments_deny_client" ON public.franchise_payments;
    DROP POLICY IF EXISTS "franchise_payments_service" ON public.franchise_payments;
    CREATE POLICY "franchise_payments_deny_client" ON public.franchise_payments FOR ALL USING (false);
  END IF;
END $$;

-- franchises
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='franchises') THEN
    ALTER TABLE public.franchises ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "franchises_deny_client" ON public.franchises;
    DROP POLICY IF EXISTS "franchises_service" ON public.franchises;
    CREATE POLICY "franchises_deny_client" ON public.franchises FOR ALL USING (false);
  END IF;
END $$;

-- class_schedules
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='class_schedules') THEN
    ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "class_schedules_deny_client" ON public.class_schedules;
    DROP POLICY IF EXISTS "class_schedules_service" ON public.class_schedules;
    CREATE POLICY "class_schedules_deny_client" ON public.class_schedules FOR ALL USING (false);
  END IF;
END $$;

-- schedule_approvals
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='schedule_approvals') THEN
    ALTER TABLE public.schedule_approvals ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "schedule_approvals_deny_client" ON public.schedule_approvals;
    DROP POLICY IF EXISTS "schedule_approvals_service" ON public.schedule_approvals;
    CREATE POLICY "schedule_approvals_deny_client" ON public.schedule_approvals FOR ALL USING (false);
  END IF;
END $$;

-- training_plans
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='training_plans') THEN
    ALTER TABLE public.training_plans ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "training_plans_deny_client" ON public.training_plans;
    DROP POLICY IF EXISTS "training_plans_service" ON public.training_plans;
    CREATE POLICY "training_plans_deny_client" ON public.training_plans FOR ALL USING (false);
  END IF;
END $$;

-- athlete_health (saglik verisi)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='athlete_health') THEN
    ALTER TABLE public.athlete_health ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "athlete_health_deny_client" ON public.athlete_health;
    DROP POLICY IF EXISTS "athlete_health_service" ON public.athlete_health;
    CREATE POLICY "athlete_health_deny_client" ON public.athlete_health FOR ALL USING (false);
  END IF;
END $$;

-- athlete_health_records (saglik verisi)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='athlete_health_records') THEN
    ALTER TABLE public.athlete_health_records ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "athlete_health_records_deny_client" ON public.athlete_health_records;
    DROP POLICY IF EXISTS "athlete_health_records_service" ON public.athlete_health_records;
    CREATE POLICY "athlete_health_records_deny_client" ON public.athlete_health_records FOR ALL USING (false);
  END IF;
END $$;

-- gelisim_olcum
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gelisim_olcum') THEN
    ALTER TABLE public.gelisim_olcum ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "gelisim_olcum_deny_client" ON public.gelisim_olcum;
    DROP POLICY IF EXISTS "gelisim_olcum_service" ON public.gelisim_olcum;
    CREATE POLICY "gelisim_olcum_deny_client" ON public.gelisim_olcum FOR ALL USING (false);
  END IF;
END $$;

-- gelisim_olcumleri
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gelisim_olcumleri') THEN
    ALTER TABLE public.gelisim_olcumleri ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "gelisim_olcumleri_deny_client" ON public.gelisim_olcumleri;
    DROP POLICY IF EXISTS "gelisim_olcumleri_service" ON public.gelisim_olcumleri;
    CREATE POLICY "gelisim_olcumleri_deny_client" ON public.gelisim_olcumleri FOR ALL USING (false);
  END IF;
END $$;

-- phv_measurements
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='phv_measurements') THEN
    ALTER TABLE public.phv_measurements ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "phv_measurements_deny_client" ON public.phv_measurements;
    DROP POLICY IF EXISTS "phv_measurements_service" ON public.phv_measurements;
    CREATE POLICY "phv_measurements_deny_client" ON public.phv_measurements FOR ALL USING (false);
  END IF;
END $$;

-- evaluation_900_areas
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='evaluation_900_areas') THEN
    ALTER TABLE public.evaluation_900_areas ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "evaluation_900_areas_deny_client" ON public.evaluation_900_areas;
    DROP POLICY IF EXISTS "evaluation_900_areas_service" ON public.evaluation_900_areas;
    CREATE POLICY "evaluation_900_areas_deny_client" ON public.evaluation_900_areas FOR ALL USING (false);
  END IF;
END $$;

-- celf_tasks (sistem tablosu)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='celf_tasks') THEN
    ALTER TABLE public.celf_tasks ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "celf_tasks_deny_client" ON public.celf_tasks;
    DROP POLICY IF EXISTS "celf_tasks_service" ON public.celf_tasks;
    CREATE POLICY "celf_tasks_deny_client" ON public.celf_tasks FOR ALL USING (false);
  END IF;
END $$;

-- celf_epics (sistem tablosu)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='celf_epics') THEN
    ALTER TABLE public.celf_epics ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "celf_epics_deny_client" ON public.celf_epics;
    DROP POLICY IF EXISTS "celf_epics_service" ON public.celf_epics;
    CREATE POLICY "celf_epics_deny_client" ON public.celf_epics FOR ALL USING (false);
  END IF;
END $$;

-- ceo_templates (sistem tablosu)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='ceo_templates') THEN
    ALTER TABLE public.ceo_templates ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "ceo_templates_deny_client" ON public.ceo_templates;
    DROP POLICY IF EXISTS "ceo_templates_service" ON public.ceo_templates;
    CREATE POLICY "ceo_templates_deny_client" ON public.ceo_templates FOR ALL USING (false);
  END IF;
END $$;

-- routine_tasks (sistem tablosu)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='routine_tasks') THEN
    ALTER TABLE public.routine_tasks ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "routine_tasks_deny_client" ON public.routine_tasks;
    DROP POLICY IF EXISTS "routine_tasks_service" ON public.routine_tasks;
    CREATE POLICY "routine_tasks_deny_client" ON public.routine_tasks FOR ALL USING (false);
  END IF;
END $$;

-- agent_states (sistem tablosu)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='agent_states') THEN
    ALTER TABLE public.agent_states ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "agent_states_deny_client" ON public.agent_states;
    DROP POLICY IF EXISTS "agent_states_service" ON public.agent_states;
    CREATE POLICY "agent_states_deny_client" ON public.agent_states FOR ALL USING (false);
  END IF;
END $$;

-- ai_insights (sistem tablosu)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='ai_insights') THEN
    ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "ai_insights_deny_client" ON public.ai_insights;
    DROP POLICY IF EXISTS "ai_insights_service" ON public.ai_insights;
    CREATE POLICY "ai_insights_deny_client" ON public.ai_insights FOR ALL USING (false);
  END IF;
END $$;

-- ai_usage_log (sistem tablosu)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='ai_usage_log') THEN
    ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "ai_usage_log_deny_client" ON public.ai_usage_log;
    DROP POLICY IF EXISTS "ai_usage_log_service" ON public.ai_usage_log;
    CREATE POLICY "ai_usage_log_deny_client" ON public.ai_usage_log FOR ALL USING (false);
  END IF;
END $$;

-- security_logs (guvenlik denetim tablosu)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='security_logs') THEN
    ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "security_logs_deny_client" ON public.security_logs;
    DROP POLICY IF EXISTS "security_logs_service" ON public.security_logs;
    CREATE POLICY "security_logs_deny_client" ON public.security_logs FOR ALL USING (false);
  END IF;
END $$;

-- push_subscriptions (bildirim endpointleri)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='push_subscriptions') THEN
    ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "push_subscriptions_deny_client" ON public.push_subscriptions;
    DROP POLICY IF EXISTS "push_subscriptions_service" ON public.push_subscriptions;
    CREATE POLICY "push_subscriptions_deny_client" ON public.push_subscriptions FOR ALL USING (false);
  END IF;
END $$;

-- notification_preferences (kisisel tercihler)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='notification_preferences') THEN
    ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "notification_preferences_deny_client" ON public.notification_preferences;
    DROP POLICY IF EXISTS "notification_preferences_service" ON public.notification_preferences;
    CREATE POLICY "notification_preferences_deny_client" ON public.notification_preferences FOR ALL USING (false);
  END IF;
END $$;


-- =============================================================================
-- C) REFERENCE / GLOBAL TABLES -- Herkes okuyabilir, yazma engellenir
--    service_role RLS i bypass ederek yazabilir.
-- =============================================================================

-- sports_branches (global referans)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='sports_branches') THEN
    ALTER TABLE public.sports_branches ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "sports_branches_read" ON public.sports_branches;
    DROP POLICY IF EXISTS "sports_branches_deny_insert" ON public.sports_branches;
    DROP POLICY IF EXISTS "sports_branches_deny_update" ON public.sports_branches;
    DROP POLICY IF EXISTS "sports_branches_deny_delete" ON public.sports_branches;
    DROP POLICY IF EXISTS "sports_branches_service" ON public.sports_branches;
    CREATE POLICY "sports_branches_read" ON public.sports_branches FOR SELECT USING (true);
    CREATE POLICY "sports_branches_deny_insert" ON public.sports_branches FOR INSERT WITH CHECK (false);
    CREATE POLICY "sports_branches_deny_update" ON public.sports_branches FOR UPDATE USING (false);
    CREATE POLICY "sports_branches_deny_delete" ON public.sports_branches FOR DELETE USING (false);
  END IF;
END $$;

-- referans_degerler (referans veri)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='referans_degerler') THEN
    ALTER TABLE public.referans_degerler ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "referans_degerler_read" ON public.referans_degerler;
    DROP POLICY IF EXISTS "referans_degerler_deny_insert" ON public.referans_degerler;
    DROP POLICY IF EXISTS "referans_degerler_deny_update" ON public.referans_degerler;
    DROP POLICY IF EXISTS "referans_degerler_deny_delete" ON public.referans_degerler;
    DROP POLICY IF EXISTS "referans_degerler_service" ON public.referans_degerler;
    CREATE POLICY "referans_degerler_read" ON public.referans_degerler FOR SELECT USING (true);
    CREATE POLICY "referans_degerler_deny_insert" ON public.referans_degerler FOR INSERT WITH CHECK (false);
    CREATE POLICY "referans_degerler_deny_update" ON public.referans_degerler FOR UPDATE USING (false);
    CREATE POLICY "referans_degerler_deny_delete" ON public.referans_degerler FOR DELETE USING (false);
  END IF;
END $$;

-- reference_values (referans veri)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='reference_values') THEN
    ALTER TABLE public.reference_values ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "reference_values_read" ON public.reference_values;
    DROP POLICY IF EXISTS "reference_values_deny_insert" ON public.reference_values;
    DROP POLICY IF EXISTS "reference_values_deny_update" ON public.reference_values;
    DROP POLICY IF EXISTS "reference_values_deny_delete" ON public.reference_values;
    DROP POLICY IF EXISTS "reference_values_service" ON public.reference_values;
    CREATE POLICY "reference_values_read" ON public.reference_values FOR SELECT USING (true);
    CREATE POLICY "reference_values_deny_insert" ON public.reference_values FOR INSERT WITH CHECK (false);
    CREATE POLICY "reference_values_deny_update" ON public.reference_values FOR UPDATE USING (false);
    CREATE POLICY "reference_values_deny_delete" ON public.reference_values FOR DELETE USING (false);
  END IF;
END $$;

-- vitrin_slots (herkese acik icerik)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='vitrin_slots') THEN
    ALTER TABLE public.vitrin_slots ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "vitrin_slots_read" ON public.vitrin_slots;
    DROP POLICY IF EXISTS "vitrin_slots_deny_insert" ON public.vitrin_slots;
    DROP POLICY IF EXISTS "vitrin_slots_deny_update" ON public.vitrin_slots;
    DROP POLICY IF EXISTS "vitrin_slots_deny_delete" ON public.vitrin_slots;
    DROP POLICY IF EXISTS "vitrin_slots_service" ON public.vitrin_slots;
    CREATE POLICY "vitrin_slots_read" ON public.vitrin_slots FOR SELECT USING (true);
    CREATE POLICY "vitrin_slots_deny_insert" ON public.vitrin_slots FOR INSERT WITH CHECK (false);
    CREATE POLICY "vitrin_slots_deny_update" ON public.vitrin_slots FOR UPDATE USING (false);
    CREATE POLICY "vitrin_slots_deny_delete" ON public.vitrin_slots FOR DELETE USING (false);
  END IF;
END $$;

-- pages (herkese acik icerik)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='pages') THEN
    ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "pages_read" ON public.pages;
    DROP POLICY IF EXISTS "pages_deny_insert" ON public.pages;
    DROP POLICY IF EXISTS "pages_deny_update" ON public.pages;
    DROP POLICY IF EXISTS "pages_deny_delete" ON public.pages;
    DROP POLICY IF EXISTS "pages_service" ON public.pages;
    CREATE POLICY "pages_read" ON public.pages FOR SELECT USING (true);
    CREATE POLICY "pages_deny_insert" ON public.pages FOR INSERT WITH CHECK (false);
    CREATE POLICY "pages_deny_update" ON public.pages FOR UPDATE USING (false);
    CREATE POLICY "pages_deny_delete" ON public.pages FOR DELETE USING (false);
  END IF;
END $$;


-- VIEW (RLS uygulanamaz)
-- tenant_personnel_view: Bu bir VIEW, RLS uygulanamaz.
-- Alttaki staff ve tenants tablolari zaten RLS li.

-- ============================================================================
-- SONUC: 30 tablo icin RLS etkinlestirildi.
-- Politika stratejisi:
--   4 tablo: Tenant izolasyonu (user_tenants uzerinden, ogrenciler_rls.sql deseni)
--   21 tablo: Client erisimi engellendi (USING false), sadece service_role
--   5 tablo: Herkese acik okuma, yazma engellendi (deny insert/update/delete)
-- ============================================================================
