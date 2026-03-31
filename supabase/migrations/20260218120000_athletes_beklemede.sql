-- athletes: veli kaydı için beklemede/pending durumu
ALTER TABLE athletes DROP CONSTRAINT IF EXISTS athletes_status_check;
ALTER TABLE athletes ADD CONSTRAINT athletes_status_check
  CHECK (status IN ('active', 'inactive', 'trial', 'pending', 'beklemede'));
