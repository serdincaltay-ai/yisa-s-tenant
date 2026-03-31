/**
 * POST /api/franchise/ders-onayla
 * Body: { scheduleId: string, tip: 'normal' | 'cezali', lesson_date?: string (YYYY-MM-DD) }
 * normal: sadece present olanların kredisini 1 düşer.
 * cezali: present + absent olanların kredisini 1 düşer.
 * tenant_schedule.ders_durumu = 'onaylandi' yapılır.
 * Response: { ok: true, krediDusenSporcu: number, toplamIslem: number }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

function timeStr(t: string | null | undefined): string {
  if (t == null) return ''
  return String(t).slice(0, 5)
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' }, { status: 403 })

    const body = await req.json() as { scheduleId?: string; tip?: string; lesson_date?: string }
    const scheduleId = typeof body.scheduleId === 'string' ? body.scheduleId.trim() : null
    const tip = body.tip === 'cezali' ? 'cezali' : 'normal'
    if (!scheduleId) return NextResponse.json({ error: 'scheduleId gerekli' }, { status: 400 })

    const lessonDate = typeof body.lesson_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.lesson_date.trim())
      ? body.lesson_date.trim()
      : new Date().toISOString().slice(0, 10)

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)

    const { data: schedule, error: sErr } = await service
      .from('tenant_schedule')
      .select('id, saat')
      .eq('id', scheduleId)
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (sErr || !schedule) return NextResponse.json({ error: 'Ders bulunamadı' }, { status: 404 })

    const scheduleSaat = timeStr(schedule.saat as string)

    const { data: attendanceRows } = await service
      .from('attendance')
      .select('id, athlete_id, lesson_time, status')
      .eq('tenant_id', tenantId)
      .eq('lesson_date', lessonDate)
      .order('created_at', { ascending: true })

    const toDeduct = (attendanceRows ?? []).filter((row) => {
      const rowTime = timeStr(row.lesson_time as string | null)
      if (scheduleSaat && rowTime && rowTime !== scheduleSaat) return false
      if (tip === 'normal') return row.status === 'present'
      return row.status === 'present' || row.status === 'absent'
    })

    const athleteIds = [...new Set(toDeduct.map((r) => r.athlete_id as string))]
    let krediDusenSporcu = 0

    for (const athleteId of athleteIds) {
      const { data: a } = await service
        .from('athletes')
        .select('ders_kredisi')
        .eq('id', athleteId)
        .eq('tenant_id', tenantId)
        .single()
      const kredi = Math.max(0, (Number((a as { ders_kredisi?: number } | null)?.ders_kredisi) ?? 0) - 1)
      const { error: uErr } = await service
        .from('athletes')
        .update({ ders_kredisi: kredi })
        .eq('id', athleteId)
        .eq('tenant_id', tenantId)
      if (!uErr) krediDusenSporcu++
    }

    const { error: updateErr } = await service
      .from('tenant_schedule')
      .update({ ders_durumu: 'onaylandi' })
      .eq('id', scheduleId)
      .eq('tenant_id', tenantId)

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

    return NextResponse.json({
      ok: true,
      krediDusenSporcu,
      toplamIslem: athleteIds.length,
    })
  } catch (e) {
    console.error('[franchise/ders-onayla]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
