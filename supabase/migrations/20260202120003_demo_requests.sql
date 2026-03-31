-- Demo talepleri tablosu — Tanıtım sitesi formlarından gelen başvurular
-- AŞAMA 1: Tanıtım Sitesi

CREATE TABLE IF NOT EXISTS demo_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  facility_type TEXT,
  city TEXT,
  notes TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'rejected')),
  source TEXT DEFAULT 'www' CHECK (source IN ('www', 'demo', 'fiyatlar')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demo_requests_status ON demo_requests(status);
CREATE INDEX IF NOT EXISTS idx_demo_requests_created_at ON demo_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_demo_requests_email ON demo_requests(email);

ALTER TABLE demo_requests ENABLE ROW LEVEL SECURITY;

-- Herkes insert yapabilir (anon). SELECT: sadece service_role (RLS bypass) veya authenticated admin.
DROP POLICY IF EXISTS "Anyone can submit demo request" ON demo_requests;
CREATE POLICY "Anyone can submit demo request" ON demo_requests FOR INSERT WITH CHECK (true);

-- Patron paneli stats API service_role ile okur (RLS bypass). Anon/guest read yok.
