import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'
import { checkTesisRole } from '@/lib/auth/tesis-role'

export const dynamic = 'force-dynamic'

const GUNLER = ['Pazartesi', 'Sali', 'Carsamba', 'Persembe', 'Cuma', 'Cumartesi', 'Pazar'] as const

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giris gerekli' }, { status: 401 })

    // Rol dogrulama
    const roleCheck = await checkTesisRole(user.id)
    if (!roleCheck.allowed) return NextResponse.json({ error: 'Yetkiniz yok' }, { status: 403 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ items: [] })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ items: [] })

    const service = createServiceClient(url, key)
    const { data, error } = await service
      .from('tenant_schedule')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('gun')
      .order('saat')

    if (error) return NextResponse.json({ items: [] })
    return NextResponse.json({ items: data ?? [], gunler: GUNLER })
  } catch {
    return NextResponse.json({ items: [] })
  }
}
