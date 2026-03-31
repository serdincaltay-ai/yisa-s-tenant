/**
 * GET/POST /api/franchise/rutin-dersler
 * GET: routine_lessons list (tenant), JOIN staff for coach name
 * POST: Yeni rutin ders ekle
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

const GUNLER = ['Pazartesi', 'Sali', 'Carsamba', 'Persembe', 'Cuma', 'Cumartesi', 'Pazar'] as const

export type RoutineLessonRow = {
  id: string
  tenant_id: string
  gun: string
  saat: string
  bitis_saat: string | null
  ders_adi: string
  brans: string | null
  seviye: string | null
  coach_user_id: string | null
  kontenjan: number
  oda: string | null
  grup_id: string | null
  is_active: boolean
  son_uretim_tarihi: string | null
  created_at: string
}

export type RoutineLessonItem = RoutineLessonRow & {
  coach_name: string | null
  student_count: number
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ items: [], toplam: 0 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ items: [], toplam: 0 })

    const service = createServiceClient(url, key)

    const { data: rows, error } = await service
      .from('routine_lessons')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('gun')
      .order('saat')

    if (error) return NextResponse.json({ items: [], toplam: 0 })

    const list = (rows ?? []) as RoutineLessonRow[]
    const coachUserIds = [...new Set(list.map((r) => r.coach_user_id).filter(Boolean))] as string[]
    const staffMap: Record<string, string> = {}
    if (coachUserIds.length > 0) {
      const { data: staffRows } = await service
        .from('staff')
        .select('user_id, name, surname')
        .eq('tenant_id', tenantId)
        .in('user_id', coachUserIds)
      for (const s of staffRows ?? []) {
        const uid = (s as { user_id: string | null }).user_id
        if (uid) staffMap[uid] = [s.name, s.surname].filter(Boolean).join(' ').trim()
      }
    }

    const lessonIds = list.map((r) => r.id)
    const countMap: Record<string, number> = {}
    if (lessonIds.length > 0) {
      const { data: studentRows } = await service
        .from('routine_lesson_students')
        .select('routine_lesson_id')
        .in('routine_lesson_id', lessonIds)
      for (const r of studentRows ?? []) {
        const lid = (r as { routine_lesson_id: string }).routine_lesson_id
        countMap[lid] = (countMap[lid] ?? 0) + 1
      }
    }

    const items: RoutineLessonItem[] = list.map((r) => ({
      ...r,
      coach_name: r.coach_user_id ? (staffMap[r.coach_user_id] ?? null) : null,
      student_count: countMap[r.id] ?? 0,
    }))

    return NextResponse.json({ items, toplam: items.length })
  } catch (e) {
    console.error('[franchise/rutin-dersler GET]', e)
    return NextResponse.json({ items: [], toplam: 0 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' }, { status: 403 })

    const body = await req.json() as Record<string, unknown>
    const gun = GUNLER.includes((body.gun as string) as (typeof GUNLER)[number]) ? (body.gun as string) : 'Pazartesi'
    const saat = typeof body.saat === 'string' ? body.saat.trim().slice(0, 5) || '09:00' : '09:00'
    const bitis_saat = typeof body.bitis_saat === 'string' ? body.bitis_saat.trim().slice(0, 5) || null : null
    const ders_adi = typeof body.ders_adi === 'string' ? body.ders_adi.trim() || 'Ders' : 'Ders'
    const brans = typeof body.brans === 'string' ? body.brans.trim() || null : null
    const seviye = typeof body.seviye === 'string' ? body.seviye.trim() || null : null
    const coach_user_id = typeof body.coach_user_id === 'string' ? body.coach_user_id.trim() || null : null
    const kontenjan = typeof body.kontenjan === 'number' && body.kontenjan >= 1 && body.kontenjan <= 999 ? Math.floor(body.kontenjan) : 20
    const oda = typeof body.oda === 'string' ? body.oda.trim() || null : null
    const grup_id = typeof body.grup_id === 'string' ? body.grup_id.trim() || null : null
    const is_active = body.is_active !== false

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)

    const { data, error } = await service
      .from('routine_lessons')
      .insert({
        tenant_id: tenantId,
        gun,
        saat,
        bitis_saat: bitis_saat ?? null,
        ders_adi,
        brans,
        seviye,
        coach_user_id,
        kontenjan,
        oda,
        grup_id,
        is_active,
      })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, id: data?.id })
  } catch (e) {
    console.error('[franchise/rutin-dersler POST]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
