-- ceo_routines örnek rutin seed (Veri Arşivleme anayasa uyumu)
-- COO run-due bu rutinleri çalıştırır; sonuçlar task_results'a yazılır

INSERT INTO ceo_routines (
  routine_name,
  routine_type,
  director_key,
  command_template,
  data_sources,
  schedule,
  schedule_time,
  is_active,
  next_run,
  approved_at
)
SELECT
  'Günlük CFO Özeti',
  'rapor',
  'CFO',
  'Günlük finansal durum özeti ver. Gelir, gider, tahsilat durumunu kısaca özetle.',
  ARRAY['payments', 'expenses']::TEXT[],
  'daily',
  '02:00',
  true,
  (CURRENT_DATE + INTERVAL '1 day')::TIMESTAMPTZ + INTERVAL '2 hours',
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM ceo_routines WHERE routine_name = 'Günlük CFO Özeti' LIMIT 1);
