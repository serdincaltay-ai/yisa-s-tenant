-- ============================================================================
-- Ask Mutfak Tablolari
-- Tarih: 30 Mart 2026
-- Amac: Mutfak panelindeki AI sohbet, senaryo ve agent cagri kayitlari
-- RLS: Sadece patron (tenant sahibi) erisebilsin
-- ============================================================================

-- 1) ask_conversations: AI sohbet mesajlari
CREATE TABLE IF NOT EXISTS public.ask_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patron_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  robot_type TEXT NOT NULL,
  message TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  cost_estimate NUMERIC(10,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.ask_conversations IS 'Mutfak AI sohbet mesajlari';
COMMENT ON COLUMN public.ask_conversations.robot_type IS 'Hangi AI robotu ile konusuluyor (ceo, coo, cmo, vb.)';
COMMENT ON COLUMN public.ask_conversations.role IS 'Mesaj rolu: user veya assistant';
COMMENT ON COLUMN public.ask_conversations.cost_estimate IS 'Tahmini maliyet (USD)';

-- Indeksler
CREATE INDEX IF NOT EXISTS idx_ask_conversations_patron_id ON public.ask_conversations(patron_id);
CREATE INDEX IF NOT EXISTS idx_ask_conversations_robot_type ON public.ask_conversations(robot_type);
CREATE INDEX IF NOT EXISTS idx_ask_conversations_created_at ON public.ask_conversations(created_at DESC);

-- 2) ask_scenarios: Coklu agent senaryolari
CREATE TABLE IF NOT EXISTS public.ask_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patron_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  agents_involved TEXT[] DEFAULT '{}',
  total_cost NUMERIC(10,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.ask_scenarios IS 'Coklu agent senaryolari — patron birden fazla AI agenti koordine eder';
COMMENT ON COLUMN public.ask_scenarios.status IS 'Senaryo durumu: pending, running, completed, failed';
COMMENT ON COLUMN public.ask_scenarios.agents_involved IS 'Katilan agent tipleri dizisi';
COMMENT ON COLUMN public.ask_scenarios.total_cost IS 'Toplam maliyet (USD)';

-- Indeksler
CREATE INDEX IF NOT EXISTS idx_ask_scenarios_patron_id ON public.ask_scenarios(patron_id);
CREATE INDEX IF NOT EXISTS idx_ask_scenarios_status ON public.ask_scenarios(status);
CREATE INDEX IF NOT EXISTS idx_ask_scenarios_created_at ON public.ask_scenarios(created_at DESC);

-- 3) agent_calls: Her senaryo icindeki agent cagrilari
CREATE TABLE IF NOT EXISTS public.agent_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES public.ask_scenarios(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL,
  prompt TEXT NOT NULL,
  response TEXT,
  cost NUMERIC(10,4) DEFAULT 0,
  duration_ms INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.agent_calls IS 'Senaryo icindeki bireysel agent cagrilari';
COMMENT ON COLUMN public.agent_calls.agent_type IS 'Agent tipi: ceo, coo, cmo, cto, vb.';
COMMENT ON COLUMN public.agent_calls.cost IS 'Bu cagri icin maliyet (USD)';
COMMENT ON COLUMN public.agent_calls.duration_ms IS 'Cagri suresi (milisaniye)';

-- Indeksler
CREATE INDEX IF NOT EXISTS idx_agent_calls_scenario_id ON public.agent_calls(scenario_id);
CREATE INDEX IF NOT EXISTS idx_agent_calls_agent_type ON public.agent_calls(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_calls_created_at ON public.agent_calls(created_at DESC);

-- ============================================================================
-- RLS Politikalari — Sadece patron (sahip) erisebilir
-- service_role RLS'i otomatik bypass eder
-- ============================================================================

-- ask_conversations RLS
ALTER TABLE public.ask_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ask_conversations_select_patron"
  ON public.ask_conversations FOR SELECT TO authenticated
  USING (patron_id = auth.uid());

CREATE POLICY "ask_conversations_insert_patron"
  ON public.ask_conversations FOR INSERT TO authenticated
  WITH CHECK (patron_id = auth.uid());

CREATE POLICY "ask_conversations_delete_patron"
  ON public.ask_conversations FOR DELETE TO authenticated
  USING (patron_id = auth.uid());

-- ask_scenarios RLS
ALTER TABLE public.ask_scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ask_scenarios_select_patron"
  ON public.ask_scenarios FOR SELECT TO authenticated
  USING (patron_id = auth.uid());

CREATE POLICY "ask_scenarios_insert_patron"
  ON public.ask_scenarios FOR INSERT TO authenticated
  WITH CHECK (patron_id = auth.uid());

CREATE POLICY "ask_scenarios_update_patron"
  ON public.ask_scenarios FOR UPDATE TO authenticated
  USING (patron_id = auth.uid())
  WITH CHECK (patron_id = auth.uid());

CREATE POLICY "ask_scenarios_delete_patron"
  ON public.ask_scenarios FOR DELETE TO authenticated
  USING (patron_id = auth.uid());

-- agent_calls RLS — patron senaryonun sahibi ise erisebilir
ALTER TABLE public.agent_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_calls_select_patron"
  ON public.agent_calls FOR SELECT TO authenticated
  USING (
    scenario_id IN (
      SELECT id FROM public.ask_scenarios WHERE patron_id = auth.uid()
    )
  );

CREATE POLICY "agent_calls_insert_patron"
  ON public.agent_calls FOR INSERT TO authenticated
  WITH CHECK (
    scenario_id IN (
      SELECT id FROM public.ask_scenarios WHERE patron_id = auth.uid()
    )
  );
