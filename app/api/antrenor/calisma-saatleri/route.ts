/**
 * Antrenör: Çalışma saatleri onayı — haftalık program + onay
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' })

    const service = createServiceClient(url, key)

    const { data: schedules } = await service
      .from('tenant_schedule')
      .select('id, gun, saat, ders_adi, brans')
      .eq('tenant_id', tenantId)
      .order('gun')
      .order('saat')

    return NextResponse.json({ items: schedules ?? [] })
  } catch (e) {
    console.error('[antrenor/calisma-saatleri GET]', e)
    return NextResponse.json({ error: 'Sunucu hatası' })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' }, { status: 403 })

    const body = await req.json()
    const hafta = body.hafta ?? new Date().toISOString().slice(0, 10)

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' })

    const service = createServiceClient(url, key)

    // Onay kaydı — schedule_approvals tablosu yoksa hata vermez, soft insert
    const { error } = await service
      .from('schedule_approvals')
      .upsert({
        tenant_id: tenantId,
        user_id: user.id,
        hafta,
        onaylandi: true,
        onay_tarihi: new Date().toISOString(),
      }, { onConflict: 'tenant_id,user_id,hafta' })

    if (error) {
      console.error('[calisma-saatleri onay]', error)
      return NextResponse.json({ ok: false, error: 'Onay kaydedilemedi' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, message: 'Çalışma saatleri onaylandı' })
  } catch (e) {
    console.error('[antrenor/calisma-saatleri POST]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
