/**
 * POST /api/franchise/rutin-dersler/uret
 * Body: { hafta_baslangic?: string } (YYYY-MM-DD, varsayılan: bu hafta Pazartesi)
 * - Aktif rutinleri çek, tenant_schedule'a yoksa INSERT (gun+saat).
 * - routine_lesson_students'dan öğrencileri attendance'a status=bekliyor ekle (o haftanın günlerine).
 * - son_uretim_tarihi güncelle.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

const GUN_ORDER = ['Pazartesi', 'Sali', 'Carsamba', 'Persembe', 'Cuma', 'Cumartesi', 'Pazar'] as const

function getMondayOfWeek(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function dateToYMD(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function gunToDate(monday: Date, gun: string): string | null {
  const i = GUN_ORDER.indexOf(gun as (typeof GUN_ORDER)[number])
  if (i < 0) return null
  const d = new Date(monday)
  d.setDate(d.getDate() + i)
  return dateToYMD(d)
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' }, { status: 403 })

    const body = await req.json() as { hafta_baslangic?: string }
    let monday: Date
    if (typeof body.hafta_baslangic === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.hafta_baslangic)) {
      monday = new Date(body.hafta_baslangic + 'T00:00:00')
      const day = monday.getDay()
      const diff = day === 0 ? -6 : 1 - day
      monday.setDate(monday.getDate() + diff)
    } else {
      monday = getMondayOfWeek(new Date())
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)

    const { data: routines } = await service
      .from('routine_lessons')
      .select('id, gun, saat, ders_adi, brans, seviye, coach_user_id, kontenjan')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)

    if (!routines?.length) {
      return NextResponse.json({ ok: true, uretilenDers: 0, uretilenYoklama: 0 })
    }

    const { data: existingSchedule } = await service
      .from('tenant_schedule')
      .select('gun, saat')
      .eq('tenant_id', tenantId)
    const existingKeys = new Set((existingSchedule ?? []).map((r: { gun: string; saat: string }) => `${r.gun}|${r.saat}`))

    let uretilenDers = 0
    for (const r of routines as Array<{ id: string; gun: string; saat: string; ders_adi: string; brans: string | null; seviye: string | null; coach_user_id: string | null; kontenjan: number }>) {
      const key = `${r.gun}|${r.saat}`
      if (existingKeys.has(key)) continue
      let antrenorId: string | null = null
      if (r.coach_user_id) {
        const { data: staffRow } = await service
          .from('staff')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('user_id', r.coach_user_id)
          .maybeSingle()
        antrenorId = staffRow?.id ?? null
      }
      const { error: insErr } = await service
        .from('tenant_schedule')
        .insert({
          tenant_id: tenantId,
          gun: r.gun,
          saat: r.saat,
          ders_adi: r.ders_adi,
          brans: r.brans ?? null,
          seviye: r.seviye ?? null,
          antrenor_id: antrenorId,
          kontenjan: r.kontenjan ?? 20,
        })
      if (!insErr) {
        uretilenDers++
        existingKeys.add(key)
      }
    }

    let uretilenYoklama = 0
    const weekDates = GUN_ORDER.map((g) => gunToDate(monday, g)).filter(Boolean) as string[]

    for (const r of routines as Array<{ id: string; gun: string; saat: string }>) {
      const lessonDate = gunToDate(monday, r.gun)
      if (!lessonDate) continue

      const { data: students } = await service
        .from('routine_lesson_students')
        .select('athlete_id')
        .eq('routine_lesson_id', r.id)

      for (const row of students ?? []) {
        const athleteId = (row as { athlete_id: string }).athlete_id
        const { error: attErr } = await service
          .from('attendance')
          .upsert(
            {
              tenant_id: tenantId,
              athlete_id: athleteId,
              lesson_date: lessonDate,
              lesson_time: r.saat,
              status: 'pending',
              marked_by: user.id,
            },
            { onConflict: 'tenant_id,athlete_id,lesson_date' }
          )
        if (!attErr) uretilenYoklama++
      }

      const { error: _upErr } = await service
        .from('routine_lessons')
        .update({ son_uretim_tarihi: lessonDate })
        .eq('id', r.id)
        .eq('tenant_id', tenantId)
    }

    return NextResponse.json({ ok: true, uretilenDers, uretilenYoklama })
  } catch (e) {
    console.error('[franchise/rutin-dersler/uret]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
