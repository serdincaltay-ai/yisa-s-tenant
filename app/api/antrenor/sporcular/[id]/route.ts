/**
 * Antrenör: sporcu detay, not güncelleme, yoklama geçmişi
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' }, { status: 403 })
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'Sporcu id gerekli' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' })

    const service = createServiceClient(url, key)
    const { data: athlete, error: errA } = await service
      .from('athletes')
      .select('id, name, surname, branch, level, "group", status, notes, birth_date')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .eq('coach_user_id', user.id)
      .single()

    if (errA || !athlete) return NextResponse.json({ error: 'Sporcu bulunamadı' }, { status: 404 })

    const { data: yoklamalar } = await service
      .from('attendance')
      .select('id, lesson_date, status')
      .eq('tenant_id', tenantId)
      .eq('athlete_id', id)
      .order('lesson_date', { ascending: false })
      .limit(50)

    return NextResponse.json({
      athlete,
      yoklamalar: (yoklamalar ?? []).map((r: { id: string; lesson_date: string; status: string }) => ({
        id: r.id,
        tarih: r.lesson_date,
        durum: r.status === 'present' ? 'geldi' : r.status === 'excused' ? 'izinli' : r.status === 'late' ? 'gec' : 'gelmedi',
      })),
    })
  } catch (e) {
    console.error('[antrenor/sporcular/id]', e)
    return NextResponse.json({ error: 'Sunucu hatası' })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' }, { status: 403 })
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'Sporcu id gerekli' }, { status: 400 })

    const body = await req.json()
    const notes = typeof body.notes === 'string' ? body.notes.trim() : null

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' })

    const service = createServiceClient(url, key)
    const { error } = await service
      .from('athletes')
      .update({ notes })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .eq('coach_user_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[antrenor/sporcular/id PATCH]', e)
    return NextResponse.json({ error: 'Sunucu hatası' })
  }
}
