-- demo_requests: source'a 'manychat' ekle (ManyChat webhook'tan gelen lead'ler)
ALTER TABLE demo_requests DROP CONSTRAINT IF EXISTS demo_requests_source_check;
ALTER TABLE demo_requests ADD CONSTRAINT demo_requests_source_check
  CHECK (source IN ('www', 'demo', 'fiyatlar', 'vitrin', 'manychat'));
