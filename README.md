# yisa-s-tenant

YİSA-S tenant paneli, `*.yisa-s.com` alanında tesis içi operasyonları çalıştıran çok kiracılı (multi-tenant) uygulamadır.

## Ne yapar?

- Veli deneyimi: giriş, profil, ödeme, gelişim, ölçüm, randevu
- Antrenör deneyimi: sporcular, yoklama, ders akışı, ölçüm
- Franchise/tesis operasyonu: personel, şube, kasa, rapor, rutin dersler
- Kayıt operasyonu: öğrenci kaydı, lead/trial süreçleri
- Onboarding: tenant oluşturma, subdomain, slot/publish hazırlığı

## Rol bazlı modüller

- `tenant_owner` / `branch_manager`: franchise ve operasyon ekranları
- `coach`: antrenör paneli
- `assistant_coach`: yardımcı antrenör paneli (`/assistant-coach`)
- `registration_staff`: kayıt paneli (`/kayit`)
- `cleaning_staff`: temizlik paneli (`/temizlik`)
- `security_staff`: güvenlik paneli (`/guvenlik`)
- `parent`: veli paneli (`/veli`)

## Teknoloji

- Next.js 15 (App Router)
- React 19 + TypeScript
- Supabase (Auth + veritabanı)
- Tailwind CSS + shadcn/ui

## Kurulum

1) Bağımlılıklar:

```bash
npm install
```

2) Ortam değişkenleri:

```bash
cp .env.example .env.local
```

3) Geliştirme:

```bash
PORT=3002 npm run dev
```

4) Test/Lint/Build:

```bash
npm run test
npm run lint
npm run build
```

## SSOT ve kurallar

Sistem kuralları tek kaynak:

- `docs/SYSTEM_RULES_SSOT.md`

Repo sınırları, rol terminolojisi, migration tek-kaynak ilkesi bu dosyaya göre yürütülür.

Ek dokümanlar:

- `docs/MIGRATIONS.md` (migration tek kaynak)
- `docs/MIGRATION_TO_PATRON.md` (tenant dışı CELF/Patron uçlarının taşınması)

## Deploy (Vercel)

Deploy ve domain adımları:

- `docs/DEPLOY.md`

Özet:

- Tenant projesi wildcard domain ile çalışır: `*.yisa-s.com`
- Gerekli env değişkenleri Vercel Project Settings > Environment Variables altında tanımlanır
- Şema değişiklikleri yalnızca `supabase/migrations` üzerinden yönetilir
