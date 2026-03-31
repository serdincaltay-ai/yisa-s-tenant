-- ============================================================
-- CELF Seed Data: Örnek epic, görevler ve olaylar
-- Her direktörlük için gerçek iş üreten örnek görev seti
-- ============================================================

-- 1) Örnek Epic oluştur
INSERT INTO public.celf_epics (id, title, raw_command, patron_command, status, parsed_directorates, total_tasks, completed_tasks)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Sistem kurulum ve test görevleri',
  'Her direktörlük kendi alanında bir test görevi üretsin',
  'Her direktörlük kendi alanında bir test görevi üretsin',
  'distributed',
  '["CTO","CFO","CMO","CSPO","CPO","CDO","CHRO","CLO","CSO","CISO","CCO","CRDO"]',
  12,
  0
) ON CONFLICT (id) DO NOTHING;

-- 2) Her direktörlük için örnek görev
-- target değerleri: website, template_pool, franchise_app, central_finance, patron_internal

-- CTO — Teknik (target: patron_internal — dahili sistem işleri)
INSERT INTO public.celf_tasks (id, epic_id, directorate, ai_provider, task_description, status, token_cost, output_type, title, target)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'CTO', 'claude',
  'Supabase tabloları için TypeScript tip tanımları oluştur. Tüm celf_tasks, celf_events, celf_epics tablolarının tiplerini çıkar.',
  'queued', 0.003, 'code',
  'TypeScript tip tanımları',
  'patron_internal'
) ON CONFLICT (id) DO NOTHING;

-- CFO — Muhasebe (target: central_finance — mali konular)
INSERT INTO public.celf_tasks (id, epic_id, directorate, ai_provider, task_description, status, token_cost, output_type, title, target)
VALUES (
  'b0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'CFO', 'gpt',
  'Aylık AI API maliyet raporu hazırla. Claude, GPT, Gemini, Together, Fal AI, V0, Cursor kullanım maliyetlerini analiz et.',
  'queued', 0.0025, 'json',
  'AI API maliyet raporu',
  'central_finance'
) ON CONFLICT (id) DO NOTHING;

-- CMO — Pazarlama (target: website — tanıtım içeriği)
INSERT INTO public.celf_tasks (id, epic_id, directorate, ai_provider, task_description, status, token_cost, output_type, title, target)
VALUES (
  'b0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000001',
  'CMO', 'gemini',
  'YİSA-S spor yönetim platformu için Instagram içerik takvimi oluştur. 1 haftalık gönderi planı hazırla.',
  'queued', 0.0001, 'template',
  'Instagram içerik takvimi',
  'website'
) ON CONFLICT (id) DO NOTHING;

-- CSPO — Sportif (target: franchise_app — sporcu/ders yönetimi)
INSERT INTO public.celf_tasks (id, epic_id, directorate, ai_provider, task_description, status, token_cost, output_type, title, target)
VALUES (
  'b0000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000001',
  'CSPO', 'claude',
  'Cimnastik branşı için 8 haftalık antrenman programı şablonu oluştur. Yaş gruplarına göre zorluk seviyeleri belirle.',
  'queued', 0.003, 'template',
  'Cimnastik antrenman programı',
  'franchise_app'
) ON CONFLICT (id) DO NOTHING;

-- CPO — Tasarım (target: patron_internal — UI tasarım)
INSERT INTO public.celf_tasks (id, epic_id, directorate, ai_provider, task_description, status, token_cost, output_type, title, target)
VALUES (
  'b0000000-0000-0000-0000-000000000005',
  'a0000000-0000-0000-0000-000000000001',
  'CPO', 'v0',
  'Sporcu gelişim takip dashboard bileşeni tasarla. Grafik, tablo ve özet kartları içeren React bileşeni.',
  'queued', 0.02, 'template',
  'Sporcu gelişim dashboard UI',
  'patron_internal'
) ON CONFLICT (id) DO NOTHING;

-- CDO — Veri (target: patron_internal — veri analizi)
INSERT INTO public.celf_tasks (id, epic_id, directorate, ai_provider, task_description, status, token_cost, output_type, title, target)
VALUES (
  'b0000000-0000-0000-0000-000000000006',
  'a0000000-0000-0000-0000-000000000001',
  'CDO', 'gemini',
  'Tenant bazlı sporcu istatistikleri raporu oluştur. Aktif sporcu sayısı, branş dağılımı, devam oranları.',
  'queued', 0.0001, 'json',
  'Sporcu istatistik raporu',
  'patron_internal'
) ON CONFLICT (id) DO NOTHING;

-- CHRO — İK (target: franchise_app — personel yönetimi)
INSERT INTO public.celf_tasks (id, epic_id, directorate, ai_provider, task_description, status, token_cost, output_type, title, target)
VALUES (
  'b0000000-0000-0000-0000-000000000007',
  'a0000000-0000-0000-0000-000000000001',
  'CHRO', 'gpt',
  'Antrenör performans değerlendirme formu oluştur. Aylık KPI metrikleri, sporcu geri bildirimi, devam oranı.',
  'queued', 0.0025, 'template',
  'Antrenör performans formu',
  'franchise_app'
) ON CONFLICT (id) DO NOTHING;

-- CLO — Hukuk (target: patron_internal — yasal metinler)
INSERT INTO public.celf_tasks (id, epic_id, directorate, ai_provider, task_description, status, token_cost, output_type, title, target)
VALUES (
  'b0000000-0000-0000-0000-000000000008',
  'a0000000-0000-0000-0000-000000000001',
  'CLO', 'claude',
  'KVKK uyumlu sporcu/veli bilgilendirme metni hazırla. Açık rıza formu ve aydınlatma metni şablonu.',
  'queued', 0.003, 'text',
  'KVKK bilgilendirme metni',
  'patron_internal'
) ON CONFLICT (id) DO NOTHING;

-- CSO — Strateji (target: franchise_app — franchise yönetimi)
INSERT INTO public.celf_tasks (id, epic_id, directorate, ai_provider, task_description, status, token_cost, output_type, title, target)
VALUES (
  'b0000000-0000-0000-0000-000000000009',
  'a0000000-0000-0000-0000-000000000001',
  'CSO', 'gpt',
  'Yeni franchise tenant onboarding akışı tasarla. 7 adımlı kurulum sihirbazı ve kontrol listesi.',
  'queued', 0.0025, 'json',
  'Franchise onboarding akışı',
  'franchise_app'
) ON CONFLICT (id) DO NOTHING;

-- CISO — Güvenlik (target: patron_internal — güvenlik denetimi)
INSERT INTO public.celf_tasks (id, epic_id, directorate, ai_provider, task_description, status, token_cost, output_type, title, target)
VALUES (
  'b0000000-0000-0000-0000-000000000010',
  'a0000000-0000-0000-0000-000000000001',
  'CISO', 'claude',
  'Supabase RLS politikalarını denetle. Tüm tabloların RLS durumunu kontrol et ve eksik politikaları listele.',
  'queued', 0.003, 'code',
  'RLS güvenlik denetimi',
  'patron_internal'
) ON CONFLICT (id) DO NOTHING;

-- CCO — Müşteri (target: template_pool — iletişim şablonları)
INSERT INTO public.celf_tasks (id, epic_id, directorate, ai_provider, task_description, status, token_cost, output_type, title, target)
VALUES (
  'b0000000-0000-0000-0000-000000000011',
  'a0000000-0000-0000-0000-000000000001',
  'CCO', 'gemini',
  'Veli iletişim şablonları oluştur: ödeme hatırlatma, ders değişikliği, gelişim raporu, doğum günü tebrik.',
  'queued', 0.0001, 'template',
  'Veli iletişim şablonları',
  'template_pool'
) ON CONFLICT (id) DO NOTHING;

-- CRDO — AR-GE (target: patron_internal — araştırma)
INSERT INTO public.celf_tasks (id, epic_id, directorate, ai_provider, task_description, status, token_cost, output_type, title, target)
VALUES (
  'b0000000-0000-0000-0000-000000000012',
  'a0000000-0000-0000-0000-000000000001',
  'CRDO', 'gemini',
  'Rakip spor yönetim platformlarını araştır. Özellik karşılaştırma tablosu ve fırsat analizi hazırla.',
  'queued', 0.0001, 'json',
  'Rakip analiz raporu',
  'patron_internal'
) ON CONFLICT (id) DO NOTHING;

-- 3) Her görev için CREATED olayı (celf_events: id, task_id, event_type, triggered_by, meta, created_at)
INSERT INTO public.celf_events (task_id, event_type, triggered_by, meta) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'CREATED', 'system', '{"directorate":"CTO","ai_provider":"claude"}'),
  ('b0000000-0000-0000-0000-000000000002', 'CREATED', 'system', '{"directorate":"CFO","ai_provider":"gpt"}'),
  ('b0000000-0000-0000-0000-000000000003', 'CREATED', 'system', '{"directorate":"CMO","ai_provider":"gemini"}'),
  ('b0000000-0000-0000-0000-000000000004', 'CREATED', 'system', '{"directorate":"CSPO","ai_provider":"claude"}'),
  ('b0000000-0000-0000-0000-000000000005', 'CREATED', 'system', '{"directorate":"CPO","ai_provider":"v0"}'),
  ('b0000000-0000-0000-0000-000000000006', 'CREATED', 'system', '{"directorate":"CDO","ai_provider":"gemini"}'),
  ('b0000000-0000-0000-0000-000000000007', 'CREATED', 'system', '{"directorate":"CHRO","ai_provider":"gpt"}'),
  ('b0000000-0000-0000-0000-000000000008', 'CREATED', 'system', '{"directorate":"CLO","ai_provider":"claude"}'),
  ('b0000000-0000-0000-0000-000000000009', 'CREATED', 'system', '{"directorate":"CSO","ai_provider":"gpt"}'),
  ('b0000000-0000-0000-0000-000000000010', 'CREATED', 'system', '{"directorate":"CISO","ai_provider":"claude"}'),
  ('b0000000-0000-0000-0000-000000000011', 'CREATED', 'system', '{"directorate":"CCO","ai_provider":"gemini"}'),
  ('b0000000-0000-0000-0000-000000000012', 'CREATED', 'system', '{"directorate":"CRDO","ai_provider":"gemini"}')
ON CONFLICT DO NOTHING;
