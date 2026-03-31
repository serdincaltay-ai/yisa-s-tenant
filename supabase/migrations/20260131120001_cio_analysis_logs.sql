-- =====================================================
-- YİSA-S CIO Analiz Logları Tablosu
-- CIO strateji analizi ve önceliklendirme kayıtları
-- Tarih: 31 Ocak 2026
-- =====================================================

-- CIO analiz logları tablosu
CREATE TABLE IF NOT EXISTS cio_analysis_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ceo_task_id UUID REFERENCES ceo_tasks(id) ON DELETE SET NULL,
    command TEXT NOT NULL,
    task_type VARCHAR(50),
    classification VARCHAR(20) CHECK (classification IN ('company', 'private', 'unclear')),
    primary_director VARCHAR(20),
    target_directors JSONB DEFAULT '[]'::jsonb,
    priority VARCHAR(20) CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    is_routine BOOLEAN DEFAULT FALSE,
    estimated_token_cost INTEGER DEFAULT 0,
    strategy_notes JSONB DEFAULT '[]'::jsonb,
    conflict_warnings JSONB DEFAULT '[]'::jsonb,
    work_order_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_cio_analysis_ceo_task ON cio_analysis_logs(ceo_task_id);
CREATE INDEX IF NOT EXISTS idx_cio_analysis_priority ON cio_analysis_logs(priority);
CREATE INDEX IF NOT EXISTS idx_cio_analysis_created ON cio_analysis_logs(created_at);

-- RLS
ALTER TABLE cio_analysis_logs ENABLE ROW LEVEL SECURITY;

-- Service role tüm işlemler
DROP POLICY IF EXISTS "cio_analysis_logs_service" ON cio_analysis_logs;
CREATE POLICY "cio_analysis_logs_service" ON cio_analysis_logs
  FOR ALL USING (true);

COMMENT ON TABLE cio_analysis_logs IS 'CIO strateji analizi ve önceliklendirme kayıtları';
