# Tenant → Patron Taşıma Notu (SSOT Uyumlu)

Bu doküman, `yisa-s-tenant` içinde artık kapsam dışı olan Patron/CELF modüllerinin neden devre dışı bırakıldığını açıklar.

## Kural Kaynağı

- `docs/SYSTEM_RULES_SSOT.md`

SSOT'a göre:

- `app.yisa-s.com` (yisa-s-patron) → Patron komuta merkezi + CELF
- `*.yisa-s.com` (yisa-s-tenant) → Tesis içi operasyonlar

## Tenant'ta Deprecate Edilen Alanlar

- `app/api/celf/**`
- `app/api/patron/**`
- `app/dashboard/celf/**`

Bu uçlar/sayfalar tenant repo içinde 410 (Gone) döndürür ve Patron uygulamasını işaret eder.

## Hedef Kullanım

- Patron/CELF işlemleri için: `https://app.yisa-s.com`
- Tenant işlemleri için: `https://<tesis>.yisa-s.com`
