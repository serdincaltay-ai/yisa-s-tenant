import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'
import { checkTesisRole } from '@/lib/auth/tesis-role'

export const dynamic = 'force-dynamic'

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

    const { data: tenantAthletes } = await service
      .from('athletes')
      .select('id')
      .eq('tenant_id', tenantId)

    const athleteIds = (tenantAthletes ?? []).map((a: { id: string }) => a.id)
    if (athleteIds.length === 0) return NextResponse.json({ items: [] })

    const { data: records, error } = await service
      .from('athlete_health_records')
      .select('id, athlete_id, record_type, notes, recorded_at, created_at, athletes(name, surname)')
      .in('athlete_id', athleteIds)
      .order('recorded_at', { ascending: false })
      .limit(500)

    if (error) return NextResponse.json({ items: [], error: error.message })

    const items = (records ?? []).map((r: Record<string, unknown>) => {
      const a = r.athletes as { name?: string; surname?: string } | null
      return {
        id: r.id,
        athlete_id: r.athlete_id,
        athlete_name: a ? `${a.name ?? ''} ${a.surname ?? ''}`.trim() : '—',
        record_type: r.record_type,
        notes: r.notes,
        recorded_at: r.recorded_at,
        created_at: r.created_at,
      }
    })

    return NextResponse.json({ items })
  } catch (e) {
    console.error('[tesis/saglik GET]', e)
    return NextResponse.json({ items: [] })
  }
}
