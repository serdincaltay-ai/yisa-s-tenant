/**
 * Antrenör yoklama: derse göre sporcular, kaydet
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'
import { yoklamaGelmediSMS } from '@/lib/sms/triggers'
import { isSmsConfigured } from '@/lib/sms/provider'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ sporcular: [] })

    const scheduleId = req.nextUrl.searchParams.get('scheduleId')
    if (!scheduleId) return NextResponse.json({ sporcular: [] })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ sporcular: [] })

    const service = createServiceClient(url, key)
    const { data: schedule } = await service.from('tenant_schedule').select('gun, brans').eq('id', scheduleId).eq('tenant_id', tenantId).single()
    if (!schedule) return NextResponse.json({ sporcular: [] })

    const { data: sporcular } = await service
      .from('athletes')
      .select('id, name, surname, level, "group"')
      .eq('tenant_id', tenantId)
      .eq('coach_user_id', user.id)
      .order('name')

    const bugun = new Date().toISOString().slice(0, 10)
    const { data: mevcutYoklama } = await service
      .from('attendance')
      .select('athlete_id, status')
      .eq('tenant_id', tenantId)
      .eq('lesson_date', bugun)

    const yoklamaMap = new Map((mevcutYoklama ?? []).map((r: { athlete_id: string; status: string }) => [r.athlete_id, r.status]))

    const items = (sporcular ?? []).map((s: { id: string; name: string; surname?: string }) => ({
      ...s,
      mevcutDurum: yoklamaMap.get(s.id) ?? null,
    }))

    return NextResponse.json({ sporcular: items })
  } catch (e) {
    console.error('[antrenor/yoklama GET]', e)
    return NextResponse.json({ sporcular: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' }, { status: 403 })

    const body = await req.json()
    const records = body.records as Array<{ athlete_id: string; durum: string }>
    if (!Array.isArray(records) || records.length === 0) return NextResponse.json({ error: 'records gerekli' }, { status: 400 })

    const bugun = new Date().toISOString().slice(0, 10)
    const durumMap: Record<string, string> = { geldi: 'present', gelmedi: 'absent', izinli: 'excused' }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)
    const rows = records
      .filter((r) => r.athlete_id)
      .map((r) => ({
        tenant_id: tenantId,
        athlete_id: r.athlete_id,
        lesson_date: bugun,
        status: durumMap[r.durum] ?? 'present',
        marked_by: user.id,
      }))

    const athleteIds = [...new Set(rows.map((r) => r.athlete_id))]
    const { data: mevcut } = await service.from('attendance').select('athlete_id, status').eq('tenant_id', tenantId).eq('lesson_date', bugun).in('athlete_id', athleteIds)
    const oncekiPresent = new Set((mevcut ?? []).filter((m: { status: string }) => m.status === 'present').map((m: { athlete_id: string }) => m.athlete_id))

    const { error } = await service
      .from('attendance')
      .upsert(rows, { onConflict: 'tenant_id,athlete_id,lesson_date' })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    for (const r of rows) {
      if (r.status === 'present' && !oncekiPresent.has(r.athlete_id)) {
        const { data: a } = await service.from('athletes').select('ders_kredisi').eq('id', r.athlete_id).single()
        const kredi = Math.max(0, (Number(a?.ders_kredisi) ?? 0) - 1)
        await service.from('athletes').update({ ders_kredisi: kredi }).eq('id', r.athlete_id)
      }
    }

    // Gelmedi olan sporcuların velisine otomatik SMS tetikle (arka planda)
    if (isSmsConfigured()) {
      const absentRows = rows.filter((r) => r.status === 'absent')
      if (absentRows.length > 0) {
        const absentIds = absentRows.map((r) => r.athlete_id)
        const { data: athletes } = await service
          .from('athletes')
          .select('id, name, surname, parent_phone')
          .in('id', absentIds)

        // Daha önce absent işaretlenmemiş olanlar için SMS gönder (tekrar SMS'i engelle)
        const oncekiAbsent = new Set(
          (mevcut ?? [])
            .filter((m: { status: string }) => m.status === 'absent')
            .map((m: { athlete_id: string }) => m.athlete_id)
        )

        const smsPromises: Promise<unknown>[] = []
        for (const athlete of (athletes ?? []) as Array<{ id: string; name: string; surname?: string; parent_phone?: string }>) {
          if (athlete.parent_phone && !oncekiAbsent.has(athlete.id)) {
            const cocukAdi = [athlete.name, athlete.surname].filter(Boolean).join(' ')
            smsPromises.push(
              yoklamaGelmediSMS(athlete.parent_phone, cocukAdi, bugun, {
                tenant_id: tenantId,
                athlete_id: athlete.id,
              })
            )
          }
        }
        if (smsPromises.length > 0) {
          await Promise.allSettled(smsPromises)
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[antrenor/yoklama POST]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
