/**
 * POST /api/franchise/rutin-dersler/[id]/ogrenciler — rutin derse öğrenci ekle
 * Body: { athlete_id: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: routineLessonId } = await params
    if (!routineLessonId) return NextResponse.json({ error: 'id gerekli' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' }, { status: 403 })

    const body = await req.json() as { athlete_id?: string }
    const athlete_id = typeof body.athlete_id === 'string' ? body.athlete_id.trim() : null
    if (!athlete_id) return NextResponse.json({ error: 'athlete_id gerekli' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)

    const { data: lesson } = await service
      .from('routine_lessons')
      .select('id')
      .eq('id', routineLessonId)
      .eq('tenant_id', tenantId)
      .maybeSingle()
    if (!lesson) return NextResponse.json({ error: 'Rutin ders bulunamadı' }, { status: 404 })

    const { data: athlete } = await service
      .from('athletes')
      .select('id')
      .eq('id', athlete_id)
      .eq('tenant_id', tenantId)
      .maybeSingle()
    if (!athlete) return NextResponse.json({ error: 'Öğrenci bulunamadı' }, { status: 404 })

    const { error } = await service
      .from('routine_lesson_students')
      .insert({ routine_lesson_id: routineLessonId, athlete_id })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[franchise/rutin-dersler ogrenci POST]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
