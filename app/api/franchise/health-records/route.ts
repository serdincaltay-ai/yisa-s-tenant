import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

const VALID_DAYS = 365

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ items: [], warnings: [] })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ items: [], warnings: [] })

    const service = createServiceClient(url, key)
    const { data: tenantAthletes } = await service.from('athletes').select('id').eq('tenant_id', tenantId)
    const athleteIds = (tenantAthletes ?? []).map((a: { id: string }) => a.id)
    if (athleteIds.length === 0) return NextResponse.json({ items: [], warnings: [] })

    const { data: records, error } = await service
      .from('athlete_health_records')
      .select('id, athlete_id, record_type, notes, recorded_at, created_at, saglik_raporu_gecerlilik, athletes(name, surname)')
      .in('athlete_id', athleteIds)
      .order('recorded_at', { ascending: false })
      .limit(500)

    if (error) return NextResponse.json({ items: [], warnings: [], error: error.message })

    const filtered = records ?? []
    const items = filtered.map((r: Record<string, unknown>) => {
      const a = r.athletes as { name?: string; surname?: string } | null
      return {
        id: r.id,
        athlete_id: r.athlete_id,
        athlete_name: a ? `${a.name ?? ''} ${a.surname ?? ''}`.trim() : '—',
        record_type: r.record_type,
        notes: r.notes,
        recorded_at: r.recorded_at,
        created_at: r.created_at,
        saglik_raporu_gecerlilik: r.saglik_raporu_gecerlilik ?? null,
      }
    })

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - VALID_DAYS)
    const warnings = items.filter((r) => {
      const ra = r.recorded_at as string | null
      const d = ra ? new Date(ra) : null
      return !d || d < cutoff
    }).map((r) => ({
      athlete_id: r.athlete_id,
      athlete_name: r.athlete_name,
      recorded_at: r.recorded_at,
      message: r.recorded_at ? 'Sağlık kaydı 1 yıldan eski — yenileme önerilir' : 'Sağlık kaydı yok',
    }))

    return NextResponse.json({ items, warnings })
  } catch (e) {
    console.error('[franchise/health-records GET]', e)
    return NextResponse.json({ items: [], warnings: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tenant atanmamış' }, { status: 403 })

    const body = await req.json()
    const athlete_id = body.athlete_id as string | undefined
    const record_type = (body.record_type as string) || 'genel'
    const notes = typeof body.notes === 'string' ? body.notes.trim() : null
    const saglik_raporu_gecerlilik = typeof body.saglik_raporu_gecerlilik === 'string' && body.saglik_raporu_gecerlilik.trim() ? body.saglik_raporu_gecerlilik.trim() : null
    if (!athlete_id) return NextResponse.json({ error: 'athlete_id zorunludur' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)
    const { data: athlete } = await service.from('athletes').select('id').eq('id', athlete_id).eq('tenant_id', tenantId).maybeSingle()
    if (!athlete) return NextResponse.json({ error: 'Öğrenci bulunamadı' }, { status: 404 })

    const { data, error } = await service
      .from('athlete_health_records')
      .insert({ athlete_id, record_type, notes, recorded_at: new Date().toISOString(), recorded_by: user.id, saglik_raporu_gecerlilik })
      .select('id, athlete_id, record_type, recorded_at, saglik_raporu_gecerlilik')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, item: data })
  } catch (e) {
    console.error('[franchise/health-records POST]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
