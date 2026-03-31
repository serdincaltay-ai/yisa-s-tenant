/**
 * PATCH /api/franchise/schedule/[id] — tek ders slot güncelleme (antrenör atama, kontenjan)
 * Body: { antrenor_user_id?: string | null, kontenjan?: number }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: scheduleId } = await params
    if (!scheduleId) return NextResponse.json({ error: 'id gerekli' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' }, { status: 403 })

    const body = await req.json() as { antrenor_user_id?: string | null; kontenjan?: number }
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)
    const updatePayload: Record<string, string | null | number> = {}

    if ('antrenor_user_id' in body) {
      const antrenorUserId = typeof body.antrenor_user_id === 'string' ? body.antrenor_user_id.trim() || null : null
      const { data: existing } = await service
        .from('tenant_schedule')
        .select('coach_user_id')
        .eq('id', scheduleId)
        .eq('tenant_id', tenantId)
        .maybeSingle()
      const oldCoachUserId = (existing as { coach_user_id?: string | null } | null)?.coach_user_id ?? null
      const coachChanged = oldCoachUserId !== (antrenorUserId ?? null)
      let antrenorId: string | null = null
      if (antrenorUserId) {
        const { data: staffRow } = await service
          .from('staff')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('user_id', antrenorUserId)
          .limit(1)
          .maybeSingle()
        antrenorId = staffRow?.id ?? null
      }
      updatePayload.coach_user_id = antrenorUserId
      updatePayload.antrenor_id = antrenorId
      if (coachChanged) {
        updatePayload.previous_coach_user_id = oldCoachUserId
        updatePayload.coach_changed_at = new Date().toISOString()
      }
    }

    if (typeof body.kontenjan === 'number' && body.kontenjan >= 1 && body.kontenjan <= 999) {
      updatePayload.kontenjan = Math.floor(body.kontenjan)
    }

    if (Object.keys(updatePayload).length === 0) return NextResponse.json({ ok: true })

    const { error } = await service
      .from('tenant_schedule')
      .update(updatePayload)
      .eq('id', scheduleId)
      .eq('tenant_id', tenantId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[franchise/schedule PATCH]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
