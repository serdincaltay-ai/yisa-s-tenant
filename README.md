# yisa-s-tenant

YİSA-S çok kiracılı (multi-tenant) tenant uygulaması.  
Bu repo, `*.yisa-s.com` altındaki tesis içi operasyonları yönetir.

## Kapsam

- Veli paneli
- Sporcu/öğrenci süreçleri
- Antrenör paneli
- Franchise/tesis operasyonları
- Kayıt ve onboarding akışları
- Tenant bazlı içerik slotları ve yayın kontrolü

## Mimari ve teknoloji

- Next.js 15 (App Router)
- React 19 + TypeScript
- Supabase (Auth + veritabanı)
- Tailwind CSS + shadcn/ui

## Hızlı başlangıç

1. Bağımlılıkları kurun:

```bash
npm install
```

2. Ortam değişkenlerini hazırlayın:

```bash
cp .env.example .env.local
```

3. Geliştirme sunucusunu başlatın:

```bash
PORT=3002 npm run dev
```

4. Uygulamayı açın:

- http://localhost:3002

## Komutlar

- `npm run dev` — geliştirme sunucusu
- `npm run lint` — ESLint kontrolü
- `npm run build` — production build
- `npm run test` — Vitest birim testleri

## Kritik kurallar

Sistem kuralları tek kaynak dosyası:

- `docs/SYSTEM_RULES_SSOT.md`

Bu dosya repo sınırlarını (tenant/patron/vitrin), rol terminolojisini ve migration kaynak kuralını belirler.

## Dağıtım

Canlıya alma adımları:

- `docs/DEPLOY.md`

## Notlar

- Root domain ve subdomain routing middleware ile yönetilir.
- Tenant kapsamı dışındaki patron/CELF uçları bu repoda bilinçli olarak devre dışıdır.
- Şema değişiklikleri için tek kaynak `supabase/migrations` klasörüdür.
