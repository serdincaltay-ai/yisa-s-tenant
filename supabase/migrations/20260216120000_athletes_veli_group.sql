-- Veli bilgileri ve grup alanları (Görev 9-10 spec)

ALTER TABLE athletes ADD COLUMN IF NOT EXISTS parent_name TEXT;
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS parent_phone TEXT;
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS "group" TEXT;
