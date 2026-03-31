/**
 * Franchise: ders detay — tenant_schedule + bugünkü yoklama (attendance)
 * scheduleId = tenant_schedule.id
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

const GUN_TR: Record<number, string> = { 0: 'Pazar', 1: 'Pazartesi', 2: 'Sali', 3: 'Carsamba', 4: 'Persembe', 5: 'Cuma', 6: 'Cumartesi' }

function todayDayName(): string {
  const d = new Date()
  return GUN_TR[d.getDay()] ?? 'Pazar'
}

function timeStr(t: string | null | undefined): string {
  if (t == null) return ''
  const s = String(t)
  return s.slice(0, 5)
}

export type DersDetayParticipant = {
  id: string
  athlete_id: string
  athlete_name: string
  status: string
}

export type DersDetayResponse = {
  ders: {
    id: string
    ders_adi: string
    brans: string | null
    saat: string
    gun: string
    kontenjan: number
    antrenor_id: string | null
    coach_user_id: string | null
    coach_changed_at: string | null
    previous_coach_user_id: string | null
    ders_durumu: string | null
  }
  participants: DersDetayParticipant[]
  katilimciSayisi: number
  kontenjan: number
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  try {
    const { scheduleId } = await params
    if (!scheduleId) return NextResponse.json({ error: 'scheduleId gerekli' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' }, { status: 403 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)

    const { data: schedule, error: sErr } = await service
      .from('tenant_schedule')
      .select('id, ders_adi, brans, saat, gun, antrenor_id, coach_user_id, kontenjan, coach_changed_at, previous_coach_user_id, ders_durumu')
      .eq('id', scheduleId)
      .eq('tenant_id', tenantId)
      .single()

    if (sErr || !schedule) return NextResponse.json({ error: 'Ders bulunamadı' }, { status: 404 })

    const today = new Date().toISOString().slice(0, 10)
    const scheduleGun = (schedule.gun as string) ?? ''
    const kontenjan = Number((schedule as { kontenjan?: number }).kontenjan) || 20

    const { data: attendanceRows } = await service
      .from('attendance')
      .select('id, athlete_id, lesson_date, lesson_time, status, athletes(name, surname)')
      .eq('tenant_id', tenantId)
      .eq('lesson_date', today)
      .order('created_at', { ascending: true })

    const scheduleSaat = timeStr(schedule.saat as string)
    const participants: DersDetayParticipant[] = []
    for (const row of attendanceRows ?? []) {
      const rowTime = timeStr(row.lesson_time as string | null)
      const matchesTime = !scheduleSaat || !rowTime || rowTime === scheduleSaat
      if (!matchesTime) continue
      const raw = row.athletes as { name: string | null; surname: string | null } | { name: string | null; surname: string | null }[] | null
      const a = Array.isArray(raw) ? raw[0] ?? null : raw
      const athlete_name = [a?.name ?? '', a?.surname ?? ''].filter(Boolean).join(' ').trim() || '—'
      participants.push({
        id: row.id,
        athlete_id: row.athlete_id,
        athlete_name,
        status: (row.status as string) ?? 'present',
      })
    }

    const s = schedule as {
      coach_changed_at?: string | null
      previous_coach_user_id?: string | null
      ders_durumu?: string | null
    }
    const ders = {
      id: schedule.id as string,
      ders_adi: (schedule.ders_adi as string) ?? 'Ders',
      brans: (schedule.brans as string | null) ?? null,
      saat: (schedule.saat as string) ?? '09:00',
      gun: scheduleGun,
      kontenjan,
      antrenor_id: (schedule.antrenor_id as string | null) ?? null,
      coach_user_id: (schedule.coach_user_id as string | null) ?? null,
      coach_changed_at: s.coach_changed_at ?? null,
      previous_coach_user_id: s.previous_coach_user_id ?? null,
      ders_durumu: s.ders_durumu ?? null,
    }

    return NextResponse.json({
      ders,
      participants,
      katilimciSayisi: participants.length,
      kontenjan,
    } satisfies DersDetayResponse)
  } catch (e) {
    console.error('[franchise/ders-detay]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
