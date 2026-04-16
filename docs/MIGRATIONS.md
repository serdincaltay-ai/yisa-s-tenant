# Migration Yönetimi (Tek Kaynak Kuralı)

Bu repoda şema değişikliği için tek kaynak:

- `supabase/migrations/**`

## Kural

- Uygulama içinden ad-hoc SQL migration çalıştırılmaz.
- API route ile migration tetiklenmez.
- Tüm DDL değişiklikleri migration dosyası olarak commit edilir.

## Uygulama

Yeni migration ekledikten sonra:

```bash
npm run db:push
```

Bu komut `supabase db push` çalıştırır ve migration geçmişini Supabase'e uygular.

## Neden

- Drift riskini azaltır
- Ortamlar arası tutarlılık sağlar
- İnceleme ve rollback süreçlerini kolaylaştırır
