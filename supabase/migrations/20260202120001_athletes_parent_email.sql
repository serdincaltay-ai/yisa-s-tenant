-- athletes tablosuna parent_email — AŞAMA 9 (Veli-Çocuk eşleştirme)

ALTER TABLE athletes ADD COLUMN IF NOT EXISTS parent_email TEXT;

CREATE INDEX IF NOT EXISTS idx_athletes_parent_email ON athletes(parent_email) WHERE parent_email IS NOT NULL;
