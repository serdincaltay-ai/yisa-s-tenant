/**
 * PATCH /api/franchise/islem-onay-kuyrugu/[id]
 * Onayla veya reddet. Sadece yetkili roller (patron, franchise, mudur).
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
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'Geçersiz talep id' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tenant atanmamış' }, { status: 403 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)

    const { data: roleCheck } = await service
      .from('user_tenants')
      .select('role')
      .eq('user_id', user.id)
      .eq('tenant_id', tenantId)
      .maybeSingle()
    if (!roleCheck || !['patron', 'franchise', 'mudur'].includes(roleCheck.role)) {
      return NextResponse.json({ error: 'Yetki yetersiz' }, { status: 403 })
    }

    const body = await req.json()
    const durum = typeof body.durum === 'string' && ['onaylandi', 'reddedildi'].includes(body.durum) ? body.durum : null
    if (!durum) return NextResponse.json({ error: 'durum zorunludur (onaylandi veya reddedildi)' }, { status: 400 })

    const { data: staffRow } = await service
      .from('staff')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    const onaylayan_staff_id = staffRow?.id ?? null
    const onay_tarihi = new Date().toISOString()

    const { data: existing } = await service
      .from('franchise_islem_onay_kuyrugu')
      .select('id, durum')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (!existing) return NextResponse.json({ error: 'Talep bulunamadı' }, { status: 404 })
    if (existing.durum !== 'bekliyor') return NextResponse.json({ error: 'Talep zaten işlenmiş' }, { status: 400 })

    const { error } = await service
      .from('franchise_islem_onay_kuyrugu')
      .update({ durum, onaylayan_staff_id, onay_tarihi })
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, durum })
  } catch (e) {
    console.error('[franchise/islem-onay-kuyrugu PATCH]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
