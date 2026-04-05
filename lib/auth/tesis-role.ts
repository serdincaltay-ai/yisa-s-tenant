/**
 * Tesis Muduru paneli rol dogrulama
 * Yalnizca tesis_muduru, isletme_muduru, sportif_direktor, patron, owner, admin, manager erisebilir.
 */

import { createClient as createServiceClient } from '@supabase/supabase-js'

/** user_tenants.role degerleri — tesis paneline erisim izni olan roller */
const TESIS_ALLOWED_ROLES = [
  'tesis_muduru',
  'isletme_muduru',
  'sportif_direktor',
  'patron',
  'tenant_owner',
  'owner',
  'admin',
  'manager',
] as const

export type TesisAllowedRole = (typeof TESIS_ALLOWED_ROLES)[number]

export interface TesisRoleResult {
  allowed: boolean
  role: string | null
  tenantId: string | null
}

/**
 * Verilen userId icin tesis paneline erisim yetkisi kontrol eder.
 * user_tenants tablosundan rol sorgulayarak TESIS_ALLOWED_ROLES ile karsilastirir.
 */
export async function checkTesisRole(userId: string): Promise<TesisRoleResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return { allowed: false, role: null, tenantId: null }

  const service = createServiceClient(url, key)

  // 1) patron — tenants.owner_id
  const { data: t } = await service
    .from('tenants')
    .select('id')
    .eq('owner_id', userId)
    .limit(1)
    .maybeSingle()
  if (t) return { allowed: true, role: 'tenant_owner', tenantId: t.id }

  // 2) user_tenants.role
  const { data: ut } = await service
    .from('user_tenants')
    .select('role, tenant_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  if (!ut?.role) return { allowed: false, role: null, tenantId: null }

  const r = String(ut.role).toLowerCase()
  const allowed = TESIS_ALLOWED_ROLES.includes(r as TesisAllowedRole)
  return { allowed, role: r, tenantId: ut.tenant_id ?? null }
}
