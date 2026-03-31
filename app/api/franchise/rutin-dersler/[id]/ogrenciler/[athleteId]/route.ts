/**
 * DELETE /api/franchise/rutin-dersler/[id]/ogrenciler/[athleteId] — rutin dersten öğrenci çıkar
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; athleteId: string }> }
) {
  try {
    const { id: routineLessonId, athleteId } = await params
    if (!routineLessonId || !athleteId) return NextResponse.json({ error: 'id ve athleteId gerekli' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' }, { status: 403 })

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

    const { error } = await service
      .from('routine_lesson_students')
      .delete()
      .eq('routine_lesson_id', routineLessonId)
      .eq('athlete_id', athleteId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[franchise/rutin-dersler ogrenci DELETE]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
