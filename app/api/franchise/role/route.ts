/**
 * Mevcut kullanıcının franchise panelindeki rolü
 * owner: tam erişim
 * coach: yoklama, program, öğrenciler (readonly)
 * parent: sadece /veli
 *
 * rawRole: user_tenants tablosundaki ham rol değeri (franchise layout'ta granüler erişim için)
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { canonicalizeRole } from '@/lib/auth/role-canonical'

export const dynamic = 'force-dynamic'

export type PanelRole = 'owner' | 'coach' | 'parent'

function panelRoleFromCanonicalRole(role: string): PanelRole {
  if (['coach', 'assistant_coach'].includes(role)) return 'coach'
  if (['parent', 'athlete'].includes(role)) return 'parent'
  return 'owner'
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ role: null }, { status: 401 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ role: 'owner', canAccessKasa: true, rawRole: 'owner' })

    const service = createServiceClient(url, key)

    // tenants.owner_id → owner
    const { data: t } = await service
      .from('tenants')
      .select('id')
      .eq('owner_id', user.id)
      .limit(1)
      .maybeSingle()
    if (t) return NextResponse.json({ role: 'owner' as PanelRole, canAccessKasa: true, rawRole: 'tenant_owner', canonicalRole: 'tenant_owner' })

    // user_tenants.role → owner/admin/manager = owner, trainer = coach, kasa/tesis_muduru = kasa erişimi
    const { data: ut } = await service
      .from('user_tenants')
      .select('role')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()
    if (ut?.role) {
      const r = String(ut.role).toLowerCase()
      const canonicalRole = canonicalizeRole(r) ?? 'tenant_owner'
      const panelRole = panelRoleFromCanonicalRole(canonicalRole)
      const canAccessKasa = ['tenant_owner', 'owner', 'admin', 'manager', 'kasa', 'tesis_muduru'].includes(r)
      return NextResponse.json({ role: panelRole, canAccessKasa, rawRole: r, canonicalRole })
    }

    // app_metadata veya user_metadata
    const metaRole = (user.app_metadata?.role ?? user.user_metadata?.role) as string | undefined
    if (metaRole) {
      const r = String(metaRole).toLowerCase()
      const canonicalRole = canonicalizeRole(r) ?? 'tenant_owner'
      return NextResponse.json({
        role: panelRoleFromCanonicalRole(canonicalRole),
        canAccessKasa: ['tenant_owner', 'branch_manager', 'cashier'].includes(canonicalRole),
        rawRole: r,
        canonicalRole,
      })
    }

    return NextResponse.json({ role: 'owner', canAccessKasa: true, rawRole: 'owner', canonicalRole: 'tenant_owner' })
  } catch {
    return NextResponse.json({ role: 'owner', rawRole: 'owner', canonicalRole: 'tenant_owner' })
  }
}
