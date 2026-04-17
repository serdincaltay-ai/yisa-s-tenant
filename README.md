# _pending_tenant

Bu klasör **yisa-s-tenant** Repl'i açıldığında oraya kopyalanacak 12 dosyayı içerir. Yapı, tenant reposunun kök dizinine birebir eşlenir.

## Kopyalama

Tenant Repl'inde:
```bash
# Patron Repl'inden _pending_tenant/ klasörünü download → tenant köküne extract
cp -r _pending_tenant/. ./
rm -rf _pending_tenant
git add public/tenants/bjktuzlacimnastik app/antrenor
git commit -m "assets: BJK Tuzla görselleri/videoları + antrenör UI mockup eklendi"
```

> ⚠️ `app/antrenor/page.tsx` mevcut dosyanın üzerine yazar. Önce mevcut sürümle diff alıp merge yapın, body'yi körü körüne overwrite etmeyin.

## İçerik (12 dosya)

- `public/tenants/bjktuzlacimnastik/` — 9 görsel + 2 video (BJK Tuzla)
- `app/antrenor/page.tsx` — antrenör paneli mobil UI mockup'ı (Serdinç onayı: BJK Tuzla varsayılan; tenant'a özel değil, tüm tenant'larda kullanılan antrenör route'u)
