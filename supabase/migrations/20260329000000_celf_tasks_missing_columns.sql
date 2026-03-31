-- celf_tasks tablosuna eksik kolonları ekle
-- Bu kolonlar app-yisa-s kodunda kullanılıyor ama DB'de mevcut değildi:
--   apply_status  — apply endpoint'te okunur/yazılır (duplicate guard, durum takibi)
--   applied_at    — apply endpoint'te uygulanma zamanı
--   task_description — görev açıklaması (distribute-tasks, tasks route, apply endpoint)
--   ai_provider   — AI sağlayıcı adı (distribute-tasks, brain-team/status)
--   token_cost    — tahmini token maliyeti (distribute-tasks)

-- 1) apply_status: görevin uygulama durumu
ALTER TABLE public.celf_tasks
  ADD COLUMN IF NOT EXISTS apply_status TEXT;

COMMENT ON COLUMN public.celf_tasks.apply_status IS 'Görev uygulama durumu: pending | applied | failed';

-- 2) applied_at: uygulanma zamanı
ALTER TABLE public.celf_tasks
  ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ;

COMMENT ON COLUMN public.celf_tasks.applied_at IS 'Görevin sisteme uygulandığı zaman';

-- 3) task_description: görev açıklaması (kod task_description kullanıyor, DB'de description var)
ALTER TABLE public.celf_tasks
  ADD COLUMN IF NOT EXISTS task_description TEXT;

COMMENT ON COLUMN public.celf_tasks.task_description IS 'Görev açıklaması — kod tarafından kullanılır';

-- 4) ai_provider: AI sağlayıcı (kod ai_provider kullanıyor, DB'de provider var)
ALTER TABLE public.celf_tasks
  ADD COLUMN IF NOT EXISTS ai_provider TEXT;

COMMENT ON COLUMN public.celf_tasks.ai_provider IS 'AI sağlayıcı adı (claude, gpt, gemini, together vb.)';

-- 5) token_cost: tahmini token maliyeti (USD)
ALTER TABLE public.celf_tasks
  ADD COLUMN IF NOT EXISTS token_cost NUMERIC;

COMMENT ON COLUMN public.celf_tasks.token_cost IS 'Tahmini token maliyeti (USD)';
