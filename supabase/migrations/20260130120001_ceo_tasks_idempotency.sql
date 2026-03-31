-- YİSA-S: CEO task idempotency — kopya kayıt engeli
-- 1) Kopya temizliği (aynı user_id + task_description, en eski tutulur)
-- 2) idempotency_key kolonu (client UUID; retry'da aynı key gönderilir)
-- 3) UNIQUE (user_id, idempotency_key) WHERE idempotency_key IS NOT NULL
-- Çalıştırma: Supabase SQL Editor'da sırayla veya tek seferde Run.

-- ─── 1. Temizlik: Aynı user + aynı task_description için en eski kaydı tut, diğerlerini sil ───
WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY user_id, task_description
      ORDER BY created_at ASC
    ) AS rn
  FROM ceo_tasks
)
DELETE FROM ceo_tasks
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- ─── 2. Idempotency key kolonu ───
ALTER TABLE ceo_tasks
ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- ─── 3. Unique index (aynı istek tekrar gelirse insert çakışır; kod mevcut kaydı döndürür) ───
CREATE UNIQUE INDEX IF NOT EXISTS ceo_tasks_user_idempotency_unique
ON ceo_tasks (user_id, idempotency_key)
WHERE idempotency_key IS NOT NULL;
