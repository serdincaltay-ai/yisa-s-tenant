/**
 * GET/PUT/DELETE /api/franchise/rutin-dersler/[id]
 * GET: Rutin ders detay + öğrenci listesi
 * PUT: Güncelle
 * DELETE: Sil
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

const GUNLER = ['Pazartesi', 'Sali', 'Carsamba', 'Persembe', 'Cuma', 'Cumartesi', 'Pazar'] as const

export type RoutineLessonDers = {
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
  coach_name: string | null
}

export type RoutineLessonOgrenci = { id: string; name: string; surname: string | null }

export type RoutineLessonDetail = {
  ders: RoutineLessonDers
  ogrenciler: RoutineLessonOgrenci[]
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' }, { status: 403 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)

    const { data: lesson, error: lErr } = await service
      .from('routine_lessons')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (lErr || !lesson) return NextResponse.json({ error: 'Rutin ders bulunamadı' }, { status: 404 })

    const r = lesson as Record<string, unknown>
    let coach_name: string | null = null
    if (r.coach_user_id) {
      const { data: staffRow } = await service
        .from('staff')
        .select('name, surname')
        .eq('tenant_id', tenantId)
        .eq('user_id', r.coach_user_id)
        .maybeSingle()
      if (staffRow) coach_name = [staffRow.name, staffRow.surname].filter(Boolean).join(' ').trim()
    }

    const { data: linkRows } = await service
      .from('routine_lesson_students')
      .select('id, athlete_id')
      .eq('routine_lesson_id', id)

    const athleteIds = (linkRows ?? []).map((row: { athlete_id: string }) => row.athlete_id)
    const ogrenciler: Array<{ id: string; name: string; surname: string | null }> = []
    if (athleteIds.length > 0) {
      const { data: athletes } = await service
        .from('athletes')
        .select('id, name, surname')
        .in('id', athleteIds)
      const athleteMap = new Map((athletes ?? []).map((a: { id: string; name: string; surname: string | null }) => [a.id, a]))
      for (const aid of athleteIds) {
        const a = athleteMap.get(aid) as { id: string; name: string; surname: string | null } | undefined
        ogrenciler.push({
          id: aid,
          name: a?.name ?? '—',
          surname: a?.surname ?? null,
        })
      }
    }

    const ders: RoutineLessonDers = {
      id: r.id as string,
      tenant_id: r.tenant_id as string,
      gun: r.gun as string,
      saat: r.saat as string,
      bitis_saat: (r.bitis_saat as string | null) ?? null,
      ders_adi: r.ders_adi as string,
      brans: (r.brans as string | null) ?? null,
      seviye: (r.seviye as string | null) ?? null,
      coach_user_id: (r.coach_user_id as string | null) ?? null,
      kontenjan: (r.kontenjan as number) ?? 20,
      oda: (r.oda as string | null) ?? null,
      grup_id: (r.grup_id as string | null) ?? null,
      is_active: (r.is_active as boolean) ?? true,
      son_uretim_tarihi: (r.son_uretim_tarihi as string | null) ?? null,
      created_at: r.created_at as string,
      coach_name,
    }

    return NextResponse.json({ ders, ogrenciler })
  } catch (e) {
    console.error('[franchise/rutin-dersler GET id]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' }, { status: 403 })

    const body = await req.json() as Record<string, unknown>
    const updates: Record<string, unknown> = {}
    if (typeof body.gun === 'string' && GUNLER.includes(body.gun as (typeof GUNLER)[number])) updates.gun = body.gun
    if (typeof body.saat === 'string') updates.saat = body.saat.trim().slice(0, 5)
    if (body.bitis_saat !== undefined) updates.bitis_saat = typeof body.bitis_saat === 'string' ? body.bitis_saat.trim().slice(0, 5) || null : null
    if (typeof body.ders_adi === 'string') updates.ders_adi = body.ders_adi.trim() || 'Ders'
    if (body.brans !== undefined) updates.brans = typeof body.brans === 'string' ? body.brans.trim() || null : null
    if (body.seviye !== undefined) updates.seviye = typeof body.seviye === 'string' ? body.seviye.trim() || null : null
    if (body.coach_user_id !== undefined) updates.coach_user_id = typeof body.coach_user_id === 'string' ? body.coach_user_id.trim() || null : null
    if (typeof body.kontenjan === 'number' && body.kontenjan >= 1 && body.kontenjan <= 999) updates.kontenjan = Math.floor(body.kontenjan)
    if (body.oda !== undefined) updates.oda = typeof body.oda === 'string' ? body.oda.trim() || null : null
    if (body.grup_id !== undefined) updates.grup_id = typeof body.grup_id === 'string' ? body.grup_id.trim() || null : null
    if (typeof body.is_active === 'boolean') updates.is_active = body.is_active

    if (Object.keys(updates).length === 0) return NextResponse.json({ ok: true })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)
    const { error } = await service
      .from('routine_lessons')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[franchise/rutin-dersler PUT]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' }, { status: 403 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)
    const { error } = await service
      .from('routine_lessons')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[franchise/rutin-dersler DELETE]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
