-- YİSA-S: athlete_health_records — Sağlık geçmişi (CSPO readOnly erişir)
-- Tarih: 4 Şubat 2026

CREATE TABLE IF NOT EXISTS athlete_health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL DEFAULT 'genel',
  notes TEXT,
  recorded_at TIMESTAMPTZ DEFAULT now(),
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_athlete_health_athlete ON athlete_health_records(athlete_id);
CREATE INDEX IF NOT EXISTS idx_athlete_health_recorded_at ON athlete_health_records(recorded_at);

COMMENT ON TABLE athlete_health_records IS 'Sporcu sağlık geçmişi — CSPO readOnly, antrenman programı hazırlarken kullanır';
