-- YİSA-S — Her işe ticket numarası (10'a Çıkart havuzu)
-- Format: YYMMDD-XXXX (örn. 260205-0001)

-- patron_commands
ALTER TABLE patron_commands ADD COLUMN IF NOT EXISTS ticket_no TEXT;

-- ceo_tasks (varsa)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ceo_tasks') THEN
    ALTER TABLE ceo_tasks ADD COLUMN IF NOT EXISTS ticket_no TEXT;
  END IF;
END $$;

-- Mevcut kayıtlar için retrospektif ticket_no üret (patron_commands)
WITH numbered AS (
  SELECT id, '26' || TO_CHAR(created_at AT TIME ZONE 'UTC', 'MMDD') || '-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::text, 4, '0') AS tn
  FROM patron_commands
  WHERE ticket_no IS NULL
)
UPDATE patron_commands p
SET ticket_no = n.tn
FROM numbered n
WHERE p.id = n.id;
