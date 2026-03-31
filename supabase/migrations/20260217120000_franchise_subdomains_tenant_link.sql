-- franchise_subdomains.tenant_id'yi tenants.slug ile eşleştir
-- Böylece subdomain'den tenant_id çözümü çalışır

UPDATE franchise_subdomains fs
SET tenant_id = t.id
FROM tenants t
WHERE t.slug = fs.subdomain
  AND fs.tenant_id IS NULL;
