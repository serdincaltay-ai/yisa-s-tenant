-- Migration: security_audit_log
-- Oturum 2: Guvenlik, ASK ekrani, CELF API
-- 1) security_logs tablosuna eksik kolonlar: device, success
-- 2) audit_log tablosuna eksik kolonlar: table_name, row_id, old_val, new_val (alignment)
-- 3) celf_tasks tablosuna rejection_reason kolonu

-- ============================================================
-- 1) security_logs — device ve success alanlari ekle
-- ============================================================
ALTER TABLE public.security_logs
  ADD COLUMN IF NOT EXISTS device TEXT,
  ADD COLUMN IF NOT EXISTS success BOOLEAN DEFAULT NULL;

COMMENT ON COLUMN public.security_logs.device IS 'Cihaz bilgisi (user-agent veya tablet/masaustu)';
COMMENT ON COLUMN public.security_logs.success IS 'Giris basarili mi? false = basarisiz deneme';

-- ============================================================
-- 2) audit_log — table_name, row_id, old_val, new_val ekle
--    (mevcut tablo: id, user_id, action, entity_table, entity_id,
--     actor_type, actor_id, actor_robot_code, payload, details,
--     previous_hash, current_hash, created_at, resource_type, resource_id, data, tenant_id)
--    Eksik: table_name (alias), row_id (alias), old_val JSONB, new_val JSONB
-- ============================================================
ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS table_name TEXT,
  ADD COLUMN IF NOT EXISTS row_id TEXT,
  ADD COLUMN IF NOT EXISTS old_val JSONB,
  ADD COLUMN IF NOT EXISTS new_val JSONB;

COMMENT ON COLUMN public.audit_log.table_name IS 'Etkilenen tablo adi (entity_table alias)';
COMMENT ON COLUMN public.audit_log.row_id IS 'Etkilenen satir id (entity_id alias)';
COMMENT ON COLUMN public.audit_log.old_val IS 'Degisiklik oncesi deger (JSONB)';
COMMENT ON COLUMN public.audit_log.new_val IS 'Degisiklik sonrasi deger (JSONB)';

-- ============================================================
-- 3) celf_tasks — rejection_reason kolonu ekle
-- ============================================================
ALTER TABLE public.celf_tasks
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

COMMENT ON COLUMN public.celf_tasks.rejection_reason IS 'Patron red sebebi — reddedilen gorevler icin';

-- ============================================================
-- 4) celf_tasks — output_result ve output_type kolonlari
--    (executeTask fonksiyonu bunlari kullaniyor ama tablo schemada olmayabilir)
-- ============================================================
ALTER TABLE public.celf_tasks
  ADD COLUMN IF NOT EXISTS output_result JSONB,
  ADD COLUMN IF NOT EXISTS output_type TEXT DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- ============================================================
-- 5) security_logs icin index (IP bazli sorgular icin)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_security_logs_ip_created
  ON public.security_logs (ip_address, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_logs_user_created
  ON public.security_logs (user_id, created_at DESC);
