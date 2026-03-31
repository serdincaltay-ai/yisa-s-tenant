-- ═══════════════════════════════════════════════════════════════════════════════
-- YİSA-S — RLS (Row Level Security) — celf_kasa, tenant_purchases, patron_commands
-- Backend (service_role) RLS'i bypass eder; API route'lar service role kullanır.
-- Client (anon key) ile doğrudan erişim kısıtlanır.
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. celf_kasa — Sadece backend erişir (client erişemez)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'celf_kasa') THEN
    ALTER TABLE celf_kasa ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "celf_kasa_deny_client" ON celf_kasa;
    CREATE POLICY "celf_kasa_deny_client" ON celf_kasa FOR ALL USING (false);
  END IF;
END $$;

-- 2. tenant_purchases — Franchise kendi tenant satın alımlarını SELECT edebilir
-- INSERT/UPDATE/DELETE sadece backend (sales, kasa/approve)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenant_purchases')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_tenants') THEN
    ALTER TABLE tenant_purchases ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "tenant_purchases_select_own" ON tenant_purchases;
    DROP POLICY IF EXISTS "tenant_purchases_deny_write" ON tenant_purchases;
    DROP POLICY IF EXISTS "tenant_purchases_deny_update" ON tenant_purchases;
    DROP POLICY IF EXISTS "tenant_purchases_deny_delete" ON tenant_purchases;
    CREATE POLICY "tenant_purchases_select_own" ON tenant_purchases
      FOR SELECT USING (
        tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
        OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
      );
    CREATE POLICY "tenant_purchases_deny_write" ON tenant_purchases
      FOR INSERT WITH CHECK (false);
    CREATE POLICY "tenant_purchases_deny_update" ON tenant_purchases FOR UPDATE USING (false);
    CREATE POLICY "tenant_purchases_deny_delete" ON tenant_purchases FOR DELETE USING (false);
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenant_purchases') THEN
    ALTER TABLE tenant_purchases ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "tenant_purchases_deny_all" ON tenant_purchases;
    CREATE POLICY "tenant_purchases_deny_all" ON tenant_purchases FOR ALL USING (false);
  END IF;
END $$;

-- 3. patron_commands — Sadece backend erişir
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'patron_commands') THEN
    ALTER TABLE patron_commands ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "patron_commands_deny_client" ON patron_commands;
    CREATE POLICY "patron_commands_deny_client" ON patron_commands FOR ALL USING (false);
  END IF;
END $$;
