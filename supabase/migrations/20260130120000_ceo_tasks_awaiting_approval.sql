-- Onay tek kaynak: ceo_tasks.status için awaiting_approval değeri
-- CELF bittikten sonra Patron onayı beklerken status = awaiting_approval
-- Patron onaylayınca completed, reddedince cancelled (api/approvals route günceller)
-- Çalıştırma: Supabase SQL Editor'da bu dosyayı çalıştırın.

ALTER TABLE ceo_tasks DROP CONSTRAINT IF EXISTS ceo_tasks_status_check;
ALTER TABLE ceo_tasks ADD CONSTRAINT ceo_tasks_status_check
  CHECK (status IN ('pending', 'assigned', 'celf_running', 'awaiting_approval', 'completed', 'failed', 'cancelled'));
