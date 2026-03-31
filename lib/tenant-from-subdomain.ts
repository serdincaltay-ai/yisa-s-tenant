/**
 * Subdomain'den tenant_id çözümleme
 * bjk-tuzla.yisa-s.com → "bjk-tuzla" veya "bjktuzlacimnastik" → tenant UUID
 */

import { createClient } from '@supabase/supabase-js'

export async function getTenantIdFromSubdomain(subdomain: string): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null

  const slug = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '')
  if (!slug || slug.length < 2) return null

  const service = createClient(url, key)

  // 1) franchise_subdomains üzerinden (subdomain → tenant_id)
  const { data: fs } = await service
    .from('franchise_subdomains')
    .select('tenant_id')
    .eq('subdomain', slug)
    .not('tenant_id', 'is', null)
    .maybeSingle()
  if (fs?.tenant_id) return fs.tenant_id

  // 2) tenants tablosundan (slug)
  const { data: t } = await service
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  if (t?.id) return t.id

  return null
}
