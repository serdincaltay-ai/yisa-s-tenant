/**
 * POST /api/franchise/ders-detay/[scheduleId]/demo-katilimci
 * Body: { ad: string, soyad: string, telefon: string, email?: string }
 * Demo sporcu oluşturur (athletes) ve bugünkü derse yoklama ekler (attendance, is_demo=true).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

export async function POST(
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

    const body = await req.json() as { ad?: string; soyad?: string; telefon?: string; email?: string }
    const ad = typeof body.ad === 'string' ? body.ad.trim() : ''
    const soyad = typeof body.soyad === 'string' ? body.soyad.trim() : ''
    const telefon = typeof body.telefon === 'string' ? body.telefon.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim() || null : null

    if (!ad || !telefon) return NextResponse.json({ error: 'Ad ve telefon zorunludur' }, { status: 400 })

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

    const today = new Date().toISOString().slice(0, 10)
    const scheduleSaat = (schedule.saat as string) ?? '09:00'

    const { data: athlete, error: aErr } = await service
      .from('athletes')
      .insert({
        tenant_id: tenantId,
        name: ad,
        surname: soyad || null,
        parent_phone: telefon,
        parent_email: email,
        status: 'active',
      })
      .select('id')
      .single()

    if (aErr || !athlete) return NextResponse.json({ error: 'Sporcu oluşturulamadı' }, { status: 500 })

    const { error: attErr } = await service
      .from('attendance')
      .insert({
        tenant_id: tenantId,
        athlete_id: athlete.id as string,
        lesson_date: today,
        lesson_time: scheduleSaat,
        status: 'present',
        is_demo: true,
        marked_by: user.id,
      })

    if (attErr) {
      await service.from('athletes').delete().eq('id', athlete.id).eq('tenant_id', tenantId)
      return NextResponse.json({ error: 'Yoklama eklenemedi' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[franchise/demo-katilimci]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
