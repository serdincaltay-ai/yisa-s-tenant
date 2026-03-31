-- Aidat/Ödeme tablosu — AŞAMA 6
-- YİSA-S Sistem Anayasası uyumu

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_type TEXT DEFAULT 'aidat' CHECK (payment_type IN ('aidat', 'kayit', 'ekstra')),
  period_month INTEGER CHECK (period_month IS NULL OR (period_month >= 1 AND period_month <= 12)),
  period_year INTEGER,
  due_date DATE,
  paid_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  payment_method TEXT CHECK (payment_method IS NULL OR payment_method IN ('nakit', 'kart', 'havale', 'eft')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_athlete ON payments(athlete_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_period ON payments(period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant users manage payments" ON payments;
CREATE POLICY "Tenant users manage payments" ON payments FOR ALL USING (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
) WITH CHECK (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  OR tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Parent view payments" ON payments;
CREATE POLICY "Parent view payments" ON payments FOR SELECT USING (
  athlete_id IN (SELECT id FROM athletes WHERE parent_user_id = auth.uid())
);

DROP POLICY IF EXISTS "Service can manage payments" ON payments;
CREATE POLICY "Service can manage payments" ON payments FOR ALL USING (true) WITH CHECK (true);
